import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User, Organization } from '../models';
import { logger } from '../utils/logger';

interface SocketUser {
  id: string;
  organizationId: string;
  email: string;
  role: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

// Real-time notification events
export interface AlertNotificationEvent {
  type: 'alert_triggered';
  data: {
    alertId: string;
    alertType: string;
    websiteName: string;
    message: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'error' | 'success';
    triggerData: any;
  };
}

export interface MetricsUpdateEvent {
  type: 'metrics_updated';
  data: {
    websiteId: string;
    metricType: string;
    currentValue: number;
    previousValue?: number;
    changePercentage?: number;
    timestamp: string;
  };
}

export interface SystemNotificationEvent {
  type: 'system_notification';
  data: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: string;
    persistent?: boolean;
  };
}

export type RealTimeEvent = AlertNotificationEvent | MetricsUpdateEvent | SystemNotificationEvent;

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private organizationRooms: Map<string, Set<string>> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL?.split(',') || [
          'http://localhost:3000',
          'http://localhost:5173',
          'https://api-geo.blitzgame.site'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('WebSocket service initialized');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        // Verify JWT token
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET!) as any;
        
        // Get user details
        const user = await User.findByPk(decoded.userId, {
          include: [{
            model: Organization,
            as: 'organizations',
            through: { attributes: ['role'] }
          }]
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        const userOrg = (user as any).organizations?.[0];
        if (!userOrg) {
          return next(new Error('User not associated with any organization'));
        }

        socket.user = {
          id: user.id,
          organizationId: userOrg.id,
          email: user.email,
          role: (userOrg as any).UserOrganization?.role || 'member'
        };

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.user) return;

      const { id: userId, organizationId, email } = socket.user;
      
      logger.info(`User connected via WebSocket:`, { userId, email, socketId: socket.id });

      // Add to connected users
      this.connectedUsers.set(socket.id, socket);

      // Join organization room for broadcasting
      const orgRoom = `org_${organizationId}`;
      socket.join(orgRoom);

      // Track organization room membership
      if (!this.organizationRooms.has(organizationId)) {
        this.organizationRooms.set(organizationId, new Set());
      }
      this.organizationRooms.get(organizationId)!.add(socket.id);

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to GEO Platform real-time service',
        timestamp: new Date().toISOString(),
        userId,
        organizationId
      });

      // Handle client-side events
      socket.on('subscribe_to_website', (websiteId: string) => {
        if (websiteId) {
          socket.join(`website_${websiteId}`);
          logger.debug(`User subscribed to website updates:`, { userId, websiteId });
        }
      });

      socket.on('unsubscribe_from_website', (websiteId: string) => {
        if (websiteId) {
          socket.leave(`website_${websiteId}`);
          logger.debug(`User unsubscribed from website updates:`, { userId, websiteId });
        }
      });

      socket.on('get_alert_status', async () => {
        try {
          // Send current alert status
          const alertStatus = await this.getAlertStatus(organizationId);
          socket.emit('alert_status_update', alertStatus);
        } catch (error) {
          logger.error('Error getting alert status:', error);
        }
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`User disconnected:`, { userId, email, reason, socketId: socket.id });
        
        // Remove from connected users
        this.connectedUsers.delete(socket.id);

        // Remove from organization room tracking
        const orgMembers = this.organizationRooms.get(organizationId);
        if (orgMembers) {
          orgMembers.delete(socket.id);
          if (orgMembers.size === 0) {
            this.organizationRooms.delete(organizationId);
          }
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });

    this.io.on('error', (error) => {
      logger.error('Socket.IO server error:', error);
    });
  }

  /**
   * Broadcast alert notification to organization members
   */
  public broadcastAlertToOrganization(organizationId: string, event: AlertNotificationEvent): void {
    const orgRoom = `org_${organizationId}`;
    this.io.to(orgRoom).emit('alert_notification', event);
    
    logger.info(`Alert broadcasted to organization ${organizationId}:`, { 
      alertType: event.data.alertType, 
      recipients: this.organizationRooms.get(organizationId)?.size || 0 
    });
  }

  /**
   * Broadcast metrics update to website subscribers
   */
  public broadcastMetricsUpdate(websiteId: string, event: MetricsUpdateEvent): void {
    const websiteRoom = `website_${websiteId}`;
    this.io.to(websiteRoom).emit('metrics_update', event);
    
    logger.debug(`Metrics update broadcasted to website ${websiteId}:`, { 
      metricType: event.data.metricType,
      value: event.data.currentValue
    });
  }

  /**
   * Send system notification to organization
   */
  public sendSystemNotification(organizationId: string, event: SystemNotificationEvent): void {
    const orgRoom = `org_${organizationId}`;
    this.io.to(orgRoom).emit('system_notification', event);
    
    logger.info(`System notification sent to organization ${organizationId}:`, { 
      title: event.data.title 
    });
  }

  /**
   * Send notification to specific user
   */
  public sendUserNotification(userId: string, event: RealTimeEvent): void {
    // Find user's socket connections
    const userSockets = Array.from(this.connectedUsers.values()).filter(
      socket => socket.user?.id === userId
    );

    userSockets.forEach(socket => {
      socket.emit(event.type, event);
    });

    logger.debug(`Notification sent to user ${userId}:`, { 
      type: event.type,
      connections: userSockets.length 
    });
  }

  /**
   * Get alert status for organization
   */
  private async getAlertStatus(organizationId: string): Promise<any> {
    try {
      const { AlertConfiguration, AlertHistory } = require('../models');
      
      const [totalAlerts, activeAlerts, recentTriggers] = await Promise.all([
        AlertConfiguration.count({ where: { organizationId } }),
        AlertConfiguration.count({ where: { organizationId, isActive: true } }),
        AlertHistory.count({
          where: {
            organizationId,
            triggeredAt: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return {
        totalAlerts,
        activeAlerts,
        recentTriggers,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting alert status:', error);
      return { error: 'Failed to get alert status' };
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    connectedUsers: number;
    organizationsWithUsers: number;
    totalRooms: number;
  } {
    return {
      connectedUsers: this.connectedUsers.size,
      organizationsWithUsers: this.organizationRooms.size,
      totalRooms: this.io.sockets.adapter.rooms.size
    };
  }

  /**
   * Broadcast connection stats update (for admin dashboard)
   */
  public broadcastConnectionStats(): void {
    const stats = this.getStats();
    this.io.emit('connection_stats', {
      type: 'connection_stats',
      data: stats,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if organization has connected users
   */
  public hasConnectedUsers(organizationId: string): boolean {
    const orgMembers = this.organizationRooms.get(organizationId);
    return orgMembers ? orgMembers.size > 0 : false;
  }

  /**
   * Get Socket.IO instance for external use
   */
  public getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service...');
    
    // Notify all connected clients
    this.io.emit('system_notification', {
      type: 'system_notification',
      data: {
        title: 'Service Maintenance',
        message: 'The service is being updated. Please refresh your page in a moment.',
        type: 'info',
        timestamp: new Date().toISOString(),
        persistent: true
      }
    });

    // Wait a bit for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close all connections
    this.io.close();
    
    logger.info('WebSocket service shutdown completed');
  }
}

// Export singleton instance
let websocketService: WebSocketService | null = null;

export function initializeWebSocketService(httpServer: HttpServer): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(httpServer);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService | null {
  return websocketService;
}

export default WebSocketService;