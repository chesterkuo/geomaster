import { Request, Response } from 'express';
import TrackingSettings from '../models/TrackingSettings';
import PlatformSettings from '../models/PlatformSettings';
import Organization from '../models/Organization';
import Website from '../models/Website';
import Keyword from '../models/Keyword';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { AI_PLATFORMS, ORGANIZATION_PLANS, PLATFORM_CONFIGS, PLAN_LIMITATIONS } from '../config/constants';
import { queueManager } from '../services/queue/queueManager';
import { logger } from '../utils/logger';

// Enhanced TypeScript interfaces for better type safety
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
}

interface TrackingSettingsResponse {
  success: boolean;
  data: {
    id: string;
    organizationId: string;
    trackingEnabled: boolean;
    trackingFrequency: 'hourly' | 'daily' | 'weekly';
    platforms: string[];
    alertsEnabled: boolean;
    alertThreshold: number;
    alertEmails: string[];
    settings: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  };
}

interface PlatformSettingsResponse {
  success: boolean;
  data: {
    id: string;
    organizationId: string;
    platform: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
    enabled: boolean;
    settings: Record<string, any>;
    apiKey?: string;
    lastSync?: Date;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

interface AvailablePlatform {
  readonly id: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly supported: boolean;
  readonly requiresApiKey: boolean;
  readonly features: readonly string[];
  readonly maxRequestsPerDay?: number;
  readonly pricing: {
    readonly free: boolean;
    readonly paidOnly: boolean;
  };
}

interface AvailablePlatformsResponse {
  success: boolean;
  data: AvailablePlatform[];
  meta: {
    totalPlatforms: number;
    enabledPlatforms: number;
    organizationPlan: string;
  };
}

interface UpdateTrackingSettingsRequest {
  trackingEnabled?: boolean;
  trackingFrequency?: 'hourly' | 'daily' | 'weekly';
  platforms?: string[];
  alertsEnabled?: boolean;
  alertThreshold?: number;
  alertEmails?: string[];
  settings?: Record<string, any>;
}

interface ConfigurePlatformRequest {
  platform: 'chatgpt' | 'gemini' | 'perplexity' | 'claude';
  enabled?: boolean;
  settings?: Record<string, any>;
  apiKey?: string;
}

export class TrackingConfigController {
  // Use platform configurations from constants
  private readonly AVAILABLE_PLATFORMS: AvailablePlatform[] = Object.values(PLATFORM_CONFIGS);

  // Helper method to mask API keys securely
  private maskApiKey(apiKey: string | null | undefined): string | undefined {
    if (!apiKey || apiKey.length < 8) return undefined;
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    // Fixed length display: 4 start + 8 asterisks + 4 end = 16 characters total
    const middle = '*'.repeat(8);
    return `${start}${middle}${end}`;
  }

  // Helper method to validate organization access
  private validateOrganizationAccess(req: AuthRequest): { isValid: boolean; organizationId: string | null; error?: string } {
    if (!req.organization?.id) {
      return { isValid: false, organizationId: null, error: 'Organization not found' };
    }
    return { isValid: true, organizationId: req.organization.id };
  }

  // Helper method to get platform features based on organization plan and API key availability
  private getPlatformFeaturesForPlan(platform: AvailablePlatform, organizationPlan: string, hasApiKey: boolean = false): AvailablePlatform {
    const planKey = organizationPlan as keyof typeof PLAN_LIMITATIONS;
    const planLimits = PLAN_LIMITATIONS[planKey] || PLAN_LIMITATIONS[ORGANIZATION_PLANS.FREE];
    
    const maxRequestsForPlan = Math.floor((platform.maxRequestsPerDay || 100) * planLimits.requestMultiplier);
    
    // If user has their own API key, they can use any platform regardless of plan
    const canUseWithApiKey = hasApiKey && platform.requiresApiKey;
    const isSupportedInFreePlan = organizationPlan === ORGANIZATION_PLANS.FREE ? !platform.pricing?.paidOnly || canUseWithApiKey : platform.supported;
    
    return {
      ...platform,
      maxRequestsPerDay: maxRequestsForPlan,
      supported: isSupportedInFreePlan
    };
  }
  // GET /api/v1/tracking/settings - Get tracking configuration
  async getTrackingSettings(req: AuthRequest, res: Response): Promise<Response<TrackingSettingsResponse>> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Use parallel queries to fetch related data efficiently
      const [settings, organization, websiteCount] = await Promise.all([
        TrackingSettings.findOne({ where: { organizationId } }),
        Organization.findByPk(organizationId),
        Website.count({ where: { organizationId, isActive: true } })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Create default settings if none exist, considering organization plan
      if (!settings) {
        const planKey = organization.plan as keyof typeof PLAN_LIMITATIONS;
        const planLimits = PLAN_LIMITATIONS[planKey] || PLAN_LIMITATIONS[ORGANIZATION_PLANS.FREE];
        
        const defaultPlatforms = organization.plan === ORGANIZATION_PLANS.FREE 
          ? [AI_PLATFORMS.GEMINI] // Free tier gets only Gemini
          : Object.values(AI_PLATFORMS); // Paid tiers get all platforms

        const newSettings = await TrackingSettings.create({
          organizationId,
          trackingEnabled: true,
          trackingFrequency: planLimits.defaultFrequency,
          platforms: defaultPlatforms,
          alertsEnabled: planLimits.alertsEnabled,
          alertThreshold: organization.plan === ORGANIZATION_PLANS.ENTERPRISE ? 3 : 5,
          alertEmails: [],
          settings: {
            websiteCount,
            lastConfigUpdate: new Date(),
            planLimitations: {
              maxPlatforms: planLimits.maxPlatforms,
              maxAlertEmails: planLimits.maxAlertEmails
            }
          }
        });

        return res.json({
          success: true,
          data: newSettings.toJSON()
        });
      }

      // Update settings with current context
      await settings.update({
        settings: {
          ...settings.settings,
          websiteCount,
          lastAccessed: new Date()
        }
      });

      return res.json({
        success: true,
        data: settings.toJSON()
      });
    } catch (error) {
      console.error('Error fetching tracking settings:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch tracking settings',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }

  // PUT /api/v1/tracking/settings - Update tracking settings
  async updateTrackingSettings(req: AuthRequest, res: Response): Promise<Response<TrackingSettingsResponse>> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }
      const updateData: UpdateTrackingSettingsRequest = req.body;

      // Parallel fetch of organization and existing settings
      const [organization, existingSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        TrackingSettings.findOne({ where: { organizationId } })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Validate plan limitations
      const planKey = organization.plan as keyof typeof PLAN_LIMITATIONS;
      const planLimits = PLAN_LIMITATIONS[planKey] || PLAN_LIMITATIONS[ORGANIZATION_PLANS.FREE];
      
      if (updateData.platforms && planLimits.maxPlatforms !== -1 && updateData.platforms.length > planLimits.maxPlatforms) {
        return res.status(403).json({ 
          success: false, 
          error: `${organization.plan} plan allows maximum ${planLimits.maxPlatforms} platforms. Please upgrade to add more platforms.` 
        });
      }

      if (updateData.alertEmails && planLimits.maxAlertEmails !== -1 && updateData.alertEmails.length > planLimits.maxAlertEmails) {
        return res.status(403).json({ 
          success: false, 
          error: `${organization.plan} plan allows maximum ${planLimits.maxAlertEmails} alert emails. Please upgrade to add more recipients.` 
        });
      }

      // Validate platforms are supported
      if (updateData.platforms) {
        const supportedPlatformIds = Object.values(AI_PLATFORMS);
        const invalidPlatforms = updateData.platforms.filter(p => !supportedPlatformIds.includes(p as any));
        if (invalidPlatforms.length > 0) {
          return res.status(400).json({ 
            success: false, 
            error: `Invalid platforms: ${invalidPlatforms.join(', ')}` 
          });
        }
      }

      // Prepare update data with enhanced settings
      const enhancedSettings = {
        ...((existingSettings?.settings || {}) as Record<string, any>),
        ...(updateData.settings || {}),
        lastConfigUpdate: new Date(),
        updatedBy: req.user?.id
      };

      let trackingSettings: TrackingSettings;

      if (!existingSettings) {
        // Create new settings with plan-appropriate defaults
        const defaultPlatforms = organization.plan === ORGANIZATION_PLANS.FREE 
          ? [AI_PLATFORMS.GEMINI] 
          : Object.values(AI_PLATFORMS);
        
        trackingSettings = await TrackingSettings.create({
          organizationId,
          trackingEnabled: updateData.trackingEnabled ?? true,
          trackingFrequency: updateData.trackingFrequency ?? planLimits.defaultFrequency,
          platforms: updateData.platforms ?? defaultPlatforms,
          alertsEnabled: updateData.alertsEnabled ?? planLimits.alertsEnabled,
          alertThreshold: updateData.alertThreshold ?? (organization.plan === ORGANIZATION_PLANS.ENTERPRISE ? 3 : 5),
          alertEmails: updateData.alertEmails ?? [],
          settings: enhancedSettings
        });
      } else {
        // Update existing settings
        await existingSettings.update({
          ...(updateData.trackingEnabled !== undefined && { trackingEnabled: updateData.trackingEnabled }),
          ...(updateData.trackingFrequency && { trackingFrequency: updateData.trackingFrequency }),
          ...(updateData.platforms && { platforms: updateData.platforms }),
          ...(updateData.alertsEnabled !== undefined && { alertsEnabled: updateData.alertsEnabled }),
          ...(updateData.alertThreshold && { alertThreshold: updateData.alertThreshold }),
          ...(updateData.alertEmails && { alertEmails: updateData.alertEmails }),
          settings: enhancedSettings
        });
        trackingSettings = existingSettings;
      }

      // Update related platform settings if platforms changed
      if (updateData.platforms) {
        await this.syncPlatformSettings(organizationId, updateData.platforms);
      }

      return res.json({
        success: true,
        data: trackingSettings.toJSON()
      });
    } catch (error) {
      console.error('Error updating tracking settings:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update tracking settings',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }

  // Helper method to sync platform settings with tracking settings
  private async syncPlatformSettings(organizationId: string, enabledPlatforms: string[]): Promise<void> {
    try {
      // Get all existing platform settings
      const existingPlatformSettings = await PlatformSettings.findAll({
        where: { organizationId }
      });

      const existingPlatforms = existingPlatformSettings.map(ps => ps.platform);
      
      // Enable/disable platforms based on tracking settings
      const updatePromises = existingPlatformSettings.map(ps => {
        const shouldBeEnabled = enabledPlatforms.includes(ps.platform);
        if (ps.enabled !== shouldBeEnabled) {
          return ps.update({ enabled: shouldBeEnabled });
        }
        return Promise.resolve();
      });

      // Create missing platform settings for newly enabled platforms
      const missingPlatforms = enabledPlatforms.filter(p => !existingPlatforms.includes(p as any));
      const createPromises = missingPlatforms.map(platform => 
        PlatformSettings.create({
          organizationId,
          platform: platform as any,
          enabled: true,
          settings: {}
        })
      );

      await Promise.all([...updatePromises, ...createPromises]);
    } catch (error) {
      console.error('Error syncing platform settings:', error);
      // Don't throw here as this is a background sync operation
    }
  }

  // POST /api/v1/tracking/platforms - Configure platform monitoring
  async configurePlatform(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }
      const { platform, enabled, settings, apiKey }: ConfigurePlatformRequest = req.body;

      // Validate platform exists in available platforms
      const availablePlatform = this.AVAILABLE_PLATFORMS.find(p => p.id === platform);
      if (!availablePlatform) {
        return res.status(400).json({
          success: false,
          error: `Platform '${platform}' is not supported`
        });
      }

      // Parallel fetch of organization and platform settings
      const [organization, existingPlatformSettings, trackingSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        PlatformSettings.findOne({ where: { organizationId, platform } }),
        TrackingSettings.findOne({ where: { organizationId } })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Check if platform requires API key and validate it
      if (availablePlatform.requiresApiKey && enabled !== false && !apiKey && !existingPlatformSettings?.apiKey) {
        return res.status(400).json({
          success: false,
          error: `Platform '${platform}' requires an API key to be enabled`
        });
      }

      // Check plan limitations for paid-only platforms, but allow if user has their own API key
      if (availablePlatform.pricing?.paidOnly && organization.plan === ORGANIZATION_PLANS.FREE && !apiKey && !existingPlatformSettings?.apiKey) {
        return res.status(403).json({
          success: false,
          error: `Platform '${platform}' is only available for paid plans. However, you can use it by providing your own API key.`
        });
      }

      let platformSettings: PlatformSettings;
      const enhancedSettings = {
        ...((existingPlatformSettings?.settings || {}) as Record<string, any>),
        ...(settings || {}),
        lastConfigUpdate: new Date(),
        updatedBy: req.user?.id,
        organizationPlan: organization.plan
      };

      if (!existingPlatformSettings) {
        // Create new platform settings
        platformSettings = await PlatformSettings.create({
          organizationId,
          platform,
          enabled: enabled ?? true,
          settings: enhancedSettings,
          apiKey: apiKey || undefined
        });
      } else {
        // Update existing platform settings
        await existingPlatformSettings.update({
          ...(enabled !== undefined && { enabled }),
          settings: enhancedSettings,
          ...(apiKey && { apiKey }),
          lastSync: enabled ? new Date() : existingPlatformSettings.lastSync
        });
        platformSettings = existingPlatformSettings;
      }

      // Update tracking settings to include this platform if enabled
      if (enabled && trackingSettings) {
        const currentPlatforms = trackingSettings.platforms || [];
        if (!currentPlatforms.includes(platform)) {
          await trackingSettings.update({
            platforms: [...currentPlatforms, platform]
          });
        }
      } else if (enabled === false && trackingSettings) {
        const currentPlatforms = trackingSettings.platforms || [];
        if (currentPlatforms.includes(platform)) {
          await trackingSettings.update({
            platforms: currentPlatforms.filter(p => p !== platform)
          });
        }
      }

      // Prepare response with masked sensitive data
      const responseData = {
        ...platformSettings.toJSON(),
        apiKeyMasked: this.maskApiKey(platformSettings.apiKey),
        platformInfo: availablePlatform
      };
      // Remove the actual apiKey from response for security
      delete responseData.apiKey;

      return res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error configuring platform:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to configure platform',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }

  // GET /api/v1/tracking/platforms - List monitored platforms
  async getPlatforms(req: AuthRequest, res: Response): Promise<Response<PlatformSettingsResponse>> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Parallel fetch organization and platform settings
      const [organization, existingPlatformSettings, trackingSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        PlatformSettings.findAll({
          where: { organizationId },
          order: [['platform', 'ASC']],
          attributes: ['id', 'platform', 'enabled', 'settings', 'lastSync', 'createdAt', 'updatedAt', 'organizationId', 'apiKey']
        }),
        TrackingSettings.findOne({ where: { organizationId } })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      const allPlatformSettings: PlatformSettings[] = [...existingPlatformSettings];
      const existingPlatforms = existingPlatformSettings.map(p => p.platform);
      
      // Get platforms that should be available for this organization
      const availablePlatformsForPlan = this.AVAILABLE_PLATFORMS.filter(platform => {
        const hasApiKey = existingPlatformSettings.find(p => p.platform === platform.id)?.apiKey;
        return this.getPlatformFeaturesForPlan(platform, organization.plan, !!hasApiKey).supported;
      });
      
      const missingPlatforms = availablePlatformsForPlan
        .map(p => p.id)
        .filter(p => !existingPlatforms.includes(p));

      // Create missing platform settings with appropriate defaults
      if (missingPlatforms.length > 0) {
        const trackingPlatforms = trackingSettings?.platforms || [];
        
        const createPromises = missingPlatforms.map(async (platformId) => {
          const isEnabledInTracking = trackingPlatforms.includes(platformId);
          const platformConfig = this.AVAILABLE_PLATFORMS.find(p => p.id === platformId)!;
          
          return PlatformSettings.create({
            organizationId,
            platform: platformId as any,
            enabled: isEnabledInTracking,
            settings: {
              createdAutomatically: true,
              organizationPlan: organization.plan,
              maxRequestsPerDay: this.getPlatformFeaturesForPlan(platformConfig, organization.plan, false).maxRequestsPerDay
            }
          });
        });

        const newPlatformSettings = await Promise.all(createPromises);
        allPlatformSettings.push(...newPlatformSettings);
      }

      // Sort and prepare response data with enhanced information
      const sortedPlatforms = allPlatformSettings.sort((a, b) => a.platform.localeCompare(b.platform));
      
      const responseData = await Promise.all(sortedPlatforms.map(async (settings) => {
        const platformConfig = this.AVAILABLE_PLATFORMS.find(p => p.id === settings.platform)!;
        const enhancedPlatformConfig = this.getPlatformFeaturesForPlan(platformConfig, organization.plan, !!settings.apiKey);
        
        const settingData = settings.toJSON();
        // Remove the actual apiKey from response for security
        delete settingData.apiKey;
        return {
          ...settingData,
          apiKeyMasked: this.maskApiKey(settings.apiKey),
          hasApiKey: settings.apiKey ? true : false,
          platformInfo: enhancedPlatformConfig,
          status: {
            configured: settings.enabled && (settings.apiKey || !platformConfig.requiresApiKey),
            requiresSetup: platformConfig.requiresApiKey && !settings.apiKey,
            lastActivity: settings.lastSync
          }
        };
      }));

      return res.json({
        success: true,
        data: responseData,
        meta: {
          totalPlatforms: responseData.length,
          enabledPlatforms: responseData.filter(p => p.enabled).length,
          configuredPlatforms: responseData.filter(p => p.status.configured).length,
          organizationPlan: organization.plan
        }
      });
    } catch (error) {
      console.error('Error fetching platforms:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch platforms',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }

  // GET /api/v1/tracking/platforms/available - Get available platforms for monitoring
  async getAvailablePlatforms(req: AuthRequest, res: Response): Promise<Response<AvailablePlatformsResponse>> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Parallel fetch organization and current platform settings
      const [organization, currentPlatformSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        PlatformSettings.findAll({ 
          where: { organizationId },
          attributes: ['platform', 'enabled', 'apiKey']
        })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      const enabledPlatforms = currentPlatformSettings.map(ps => ps.platform);
      
      // Apply plan-specific limitations and enhancements
      const availablePlatformsForOrg = this.AVAILABLE_PLATFORMS.map(platform => {
        const hasApiKey = currentPlatformSettings.find(ps => ps.platform === platform.id)?.apiKey;
        const enhancedPlatform = this.getPlatformFeaturesForPlan(platform, organization.plan, !!hasApiKey);
        
        return {
          ...enhancedPlatform,
          status: {
            enabled: enabledPlatforms.includes(platform.id),
            availableInPlan: enhancedPlatform.supported,
            upgradeRequired: !enhancedPlatform.supported && organization.plan === 'free',
            hasApiKey: !!hasApiKey
          },
          // Add plan-specific messaging
          planLimitations: organization.plan === ORGANIZATION_PLANS.FREE ? {
            message: enhancedPlatform.pricing?.paidOnly && !hasApiKey
              ? 'Set up your API key or upgrade to access this platform'
              : hasApiKey 
                ? 'Using your own API key'
                : 'Limited features on free plan',
            upgradeUrl: `/billing/upgrade?platform=${platform.id}`
          } : null
        };
      });

      // Calculate statistics
      const totalPlatforms = availablePlatformsForOrg.length;
      const enabledCount = availablePlatformsForOrg.filter(p => p.status.enabled).length;

      return res.json({
        success: true,
        data: availablePlatformsForOrg,
        meta: {
          totalPlatforms,
          enabledPlatforms: enabledCount,
          organizationPlan: organization.plan,
          planLimits: {
            maxPlatforms: organization.plan === 'free' ? 2 : -1,
            paidOnlyAccess: organization.plan !== 'free'
          }
        }
      });
    } catch (error) {
      console.error('Error fetching available platforms:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch available platforms',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }

  // POST /api/v1/tracking/start - Start manual tracking
  async startTracking(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      // Optional body parameters for customizing the tracking job
      const { 
        websiteId, 
        keywords: customKeywords, 
        platforms: customPlatforms 
      }: {
        websiteId?: string;
        keywords?: string[];
        platforms?: string[];
      } = req.body || {};

      // Fetch organization, tracking settings, and websites
      const [organization, trackingSettings, websites] = await Promise.all([
        Organization.findByPk(organizationId),
        TrackingSettings.findOne({ where: { organizationId } }),
        websiteId 
          ? Website.findAll({ where: { id: websiteId, organizationId, isActive: true } })
          : Website.findAll({ where: { organizationId, isActive: true } })
      ]);

      if (!organization) {
        return res.status(404).json({ 
          success: false, 
          error: 'Organization not found' 
        });
      }

      if (websites.length === 0) {
        return res.status(400).json({
          success: false,
          error: websiteId ? 'Website not found or not active' : 'No active websites found for tracking'
        });
      }

      // Get or create default tracking settings
      let finalTrackingSettings = trackingSettings;
      if (!finalTrackingSettings) {
        finalTrackingSettings = await TrackingSettings.create({
          organizationId,
          trackingEnabled: true,
          trackingFrequency: 'daily',
          platforms: [AI_PLATFORMS.GEMINI],
          alertsEnabled: false,
          alertThreshold: 5,
          alertEmails: [],
          settings: {}
        });
      }

      // Use custom parameters if provided, otherwise use settings
      const platformsToUse = customPlatforms || finalTrackingSettings.platforms;
      
      let keywordsToUse: string[] = [];
      if (customKeywords && customKeywords.length > 0) {
        keywordsToUse = customKeywords;
      } else {
        // Fetch keywords from database
        const keywordRecords = await Keyword.findAll({
          where: { organizationId },
          attributes: ['keyword']
        });
        keywordsToUse = keywordRecords.map(k => k.keyword);
        
        // If no keywords in database, use default keywords
        if (keywordsToUse.length === 0) {
          keywordsToUse = ['business', 'services', 'solutions'];
        }
      }

      if (keywordsToUse.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No keywords available for tracking. Please add keywords first.'
        });
      }

      // Validate platforms
      const validPlatforms = platformsToUse.filter(p => Object.values(AI_PLATFORMS).includes(p as any));
      if (validPlatforms.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid platforms specified for tracking'
        });
      }

      // Queue tracking jobs for each website
      const queuedJobs: any[] = [];
      for (const website of websites) {
        try {
          const jobData = {
            websiteId: website.id,
            organizationId,
            keywords: keywordsToUse,
            platforms: validPlatforms,
            trackingSettings: {
              frequency: finalTrackingSettings.trackingFrequency,
              alertsEnabled: finalTrackingSettings.alertsEnabled,
              alertThreshold: finalTrackingSettings.alertThreshold,
              manuallyTriggered: true,
              triggeredBy: req.user?.id || 'manual'
            }
          };

          await queueManager.addTrackingJob(jobData);
          
          queuedJobs.push({
            websiteId: website.id,
            websiteDomain: website.domain,
            keywords: keywordsToUse,
            platforms: validPlatforms,
            status: 'queued'
          });

          logger.info(`Manual tracking job queued for website ${website.domain} (${website.id})`, {
            organizationId,
            websiteId: website.id,
            keywordCount: keywordsToUse.length,
            platformCount: validPlatforms.length,
            triggeredBy: req.user?.id
          });

        } catch (error) {
          logger.error(`Failed to queue tracking job for website ${website.domain}:`, error);
          queuedJobs.push({
            websiteId: website.id,
            websiteDomain: website.domain,
            status: 'failed',
            error: (error as Error).message
          });
        }
      }

      const successfulJobs = queuedJobs.filter(job => job.status === 'queued');
      const failedJobs = queuedJobs.filter(job => job.status === 'failed');

      return res.json({
        success: true,
        message: `Manual tracking started for ${successfulJobs.length} website(s)`,
        data: {
          summary: {
            totalWebsites: websites.length,
            successfulJobs: successfulJobs.length,
            failedJobs: failedJobs.length,
            keywords: keywordsToUse,
            platforms: validPlatforms
          },
          jobs: queuedJobs,
          estimatedProcessingTime: `${successfulJobs.length * 2}-${successfulJobs.length * 5} minutes`
        }
      });

    } catch (error) {
      logger.error('Error starting manual tracking:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to start tracking',
        ...(process.env.NODE_ENV === 'development' && { details: (error as Error).message })
      });
    }
  }
}