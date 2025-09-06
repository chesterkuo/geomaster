import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';
import { AlertService } from './alertService';
import { MetricsSnapshot, AITrackingResult, Website } from '../models';
import { authenticateSocketToken } from '../middlewares/auth.middleware';

export interface MetricsUpdate {
  type: 'metric_update' | 'alert_trigger' | 'tracking_result' | 'website_status';
  data: any;
  timestamp: Date;
  organizationId: string;
  websiteId?: string;
}

export class RealTimeMetricsService {
  private io: SocketIOServer;
  private activeConnections = new Map<string, Set<string>>();
  private metricsCache = new Map<string, any>();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    this.setupSocketHandlers();
    this.startMetricsPolling();
    
    logger.info('Real-time metrics service initialized');
  }

  private setupSocketHandlers(): void {
    this.io.use(authenticateSocketToken);

    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      const organization = socket.data.organization;
      
      if (!user || !organization) {
        socket.disconnect();
        return;
      }

      const userId = user.id;
      const organizationId = organization.id;
      
      logger.info(`Client connected: ${userId} (org: ${organizationId})`);

      // Add to active connections
      if (!this.activeConnections.has(organizationId)) {
        this.activeConnections.set(organizationId, new Set());
      }
      this.activeConnections.get(organizationId)!.add(socket.id);

      // Join organization room
      socket.join(`org_${organizationId}`);

      // Send initial metrics data
      this.sendInitialMetrics(socket, organizationId);

      // Handle client subscription to specific websites
      socket.on('subscribe_website', (websiteId: string) => {
        if (websiteId) {
          socket.join(`website_${websiteId}`);
          this.sendWebsiteMetrics(socket, organizationId, websiteId);
        }
      });

      socket.on('unsubscribe_website', (websiteId: string) => {
        if (websiteId) {
          socket.leave(`website_${websiteId}`);
        }
      });

      // Handle client requesting metrics refresh
      socket.on('refresh_metrics', () => {
        this.sendInitialMetrics(socket, organizationId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${userId}`);
        const orgConnections = this.activeConnections.get(organizationId);
        if (orgConnections) {
          orgConnections.delete(socket.id);
          if (orgConnections.size === 0) {
            this.activeConnections.delete(organizationId);
          }
        }
      });
    });
  }

  private async sendInitialMetrics(socket: any, organizationId: string): Promise<void> {
    try {
      const [websites, recentMetrics, activeAlerts] = await Promise.all([
        Website.findAll({
          where: { organizationId: organizationId },
          attributes: ['id', 'name', 'url', 'domain']
        }),
        this.getRecentMetrics(organizationId),
        this.getActiveAlerts(organizationId)
      ]);

      socket.emit('initial_data', {
        websites,
        metrics: recentMetrics,
        alerts: activeAlerts,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error sending initial metrics:', error);
    }
  }

  private async sendWebsiteMetrics(socket: any, organizationId: string, websiteId: string): Promise<void> {
    try {
      const [metrics, alerts, trackingResults] = await Promise.all([
        MetricsSnapshot.findAll({
          where: { organizationId, websiteId },
          order: [['createdAt', 'DESC']],
          limit: 50
        }),
        this.getWebsiteAlerts(organizationId, websiteId),
        AITrackingResult.findAll({
          where: { websiteId: websiteId },
          order: [['trackedAt', 'DESC']],
          limit: 20
        })
      ]);

      socket.emit('website_data', {
        websiteId,
        metrics,
        alerts,
        trackingResults,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error(`Error sending website metrics for ${websiteId}:`, error);
    }
  }

  public broadcastMetricUpdate(update: MetricsUpdate): void {
    const { organizationId, websiteId, type } = update;

    // Broadcast to organization room
    this.io.to(`org_${organizationId}`).emit(type, update);

    // If website-specific, also broadcast to website room
    if (websiteId) {
      this.io.to(`website_${websiteId}`).emit(type, update);
    }

    // Update cache
    this.updateMetricsCache(organizationId, update);

    logger.debug(`Broadcasted ${type} to org ${organizationId}${websiteId ? ` and website ${websiteId}` : ''}`);
  }

  public broadcastAlertTrigger(organizationId: string, alert: any): void {
    const update: MetricsUpdate = {
      type: 'alert_trigger',
      data: {
        id: alert.id,
        name: alert.alertConfigId ? alert.alertConfiguration?.name : 'Unknown Alert',
        alertType: alert.alertType,
        websiteId: alert.websiteId,
        triggerData: alert.triggerData,
        triggeredAt: alert.triggeredAt
      },
      timestamp: new Date(),
      organizationId,
      websiteId: alert.websiteId
    };

    this.broadcastMetricUpdate(update);
  }

  public broadcastTrackingResult(organizationId: string, trackingResult: any): void {
    const update: MetricsUpdate = {
      type: 'tracking_result',
      data: {
        id: trackingResult.id,
        websiteId: trackingResult.website_id,
        platform: trackingResult.platform,
        query: trackingResult.query,
        hasMention: trackingResult.hasMention,
        position: trackingResult.position,
        sentiment: trackingResult.sentiment,
        trackedAt: trackingResult.trackedAt
      },
      timestamp: new Date(),
      organizationId,
      websiteId: trackingResult.website_id
    };

    this.broadcastMetricUpdate(update);
  }

  public broadcastWebsiteStatusChange(organizationId: string, websiteId: string, status: string): void {
    const update: MetricsUpdate = {
      type: 'website_status',
      data: {
        websiteId,
        status,
        changedAt: new Date()
      },
      timestamp: new Date(),
      organizationId,
      websiteId
    };

    this.broadcastMetricUpdate(update);
  }

  private async getRecentMetrics(organizationId: string): Promise<any[]> {
    try {
      return await MetricsSnapshot.findAll({
        where: { organizationId },
        order: [['createdAt', 'DESC']],
        limit: 100,
        include: [
          {
            model: Website,
            as: 'website',
            attributes: ['name', 'domain']
          }
        ]
      });
    } catch (error) {
      logger.error('Error fetching recent metrics:', error);
      return [];
    }
  }

  private async getActiveAlerts(organizationId: string): Promise<any[]> {
    try {
      const alertService = new AlertService({ organizationId });
      const result = await alertService.getAlerts({ isActive: true, limit: 50 });
      return result.alerts;
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      return [];
    }
  }

  private async getWebsiteAlerts(organizationId: string, websiteId: string): Promise<any[]> {
    try {
      const alertService = new AlertService({ organizationId });
      const result = await alertService.getAlerts({ websiteId, isActive: true });
      return result.alerts;
    } catch (error) {
      logger.error(`Error fetching alerts for website ${websiteId}:`, error);
      return [];
    }
  }

  private updateMetricsCache(organizationId: string, update: MetricsUpdate): void {
    const cacheKey = `${organizationId}_${update.type}`;
    
    if (!this.metricsCache.has(cacheKey)) {
      this.metricsCache.set(cacheKey, []);
    }
    
    const cache = this.metricsCache.get(cacheKey);
    cache.unshift(update);
    
    // Keep only last 100 updates per type
    if (cache.length > 100) {
      cache.splice(100);
    }
  }

  private startMetricsPolling(): void {
    // Poll for new metrics every 30 seconds
    setInterval(async () => {
      await this.pollForUpdates();
    }, 30000);

    // Poll for alerts every 60 seconds
    setInterval(async () => {
      await this.pollForAlerts();
    }, 60000);

    logger.info('Metrics polling started');
  }

  private async pollForUpdates(): Promise<void> {
    try {
      for (const organizationId of this.activeConnections.keys()) {
        // Check for new metrics snapshots
        const { Op } = require('sequelize');
        const recentMetrics = await MetricsSnapshot.findAll({
          where: { 
            organizationId,
            snapshotAt: {
              [Op.gte]: new Date(Date.now() - 60000) // Last minute
            }
          },
          include: [
            {
              model: Website,
              as: 'website',
              attributes: ['name', 'domain']
            }
          ]
        });

        for (const metric of recentMetrics) {
          const update: MetricsUpdate = {
            type: 'metric_update',
            data: metric,
            timestamp: new Date(),
            organizationId,
            websiteId: metric.websiteId
          };

          this.broadcastMetricUpdate(update);
        }

        // Check for new tracking results
        const recentTracking = await AITrackingResult.findAll({
          where: {
            trackedAt: {
              [Op.gte]: new Date(Date.now() - 60000) // Last minute
            }
          },
          include: [
            {
              model: Website,
              as: 'website',
              where: { organizationId },
              attributes: ['name', 'domain']
            }
          ]
        });

        for (const tracking of recentTracking) {
          this.broadcastTrackingResult(organizationId, tracking);
        }
      }
    } catch (error) {
      logger.error('Error polling for updates:', error);
    }
  }

  private async pollForAlerts(): Promise<void> {
    try {
      for (const organizationId of this.activeConnections.keys()) {
        const alertService = new AlertService({ organizationId });
        
        // Get websites for this organization
        const websites = await Website.findAll({
          where: { organizationId },
          attributes: ['id']
        });

        for (const website of websites) {
          const triggeredAlerts = await alertService.checkAlertsForWebsite(website.id);
          
          for (const alert of triggeredAlerts) {
            this.broadcastAlertTrigger(organizationId, alert);
          }
        }
      }
    } catch (error) {
      logger.error('Error polling for alerts:', error);
    }
  }

  public getActiveConnectionsCount(): number {
    let total = 0;
    for (const connections of this.activeConnections.values()) {
      total += connections.size;
    }
    return total;
  }

  public getOrganizationConnectionsCount(organizationId: string): number {
    return this.activeConnections.get(organizationId)?.size || 0;
  }

  public getMetricsCacheSize(): number {
    return this.metricsCache.size;
  }
}