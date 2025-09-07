import { Request, Response } from 'express';
import TrackingSettings from '../models/TrackingSettings';
import PlatformSettings from '../models/PlatformSettings';
import Organization from '../models/Organization';
import Website from '../models/Website';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { AI_PLATFORMS, ORGANIZATION_PLANS, PLATFORM_CONFIGS, PLAN_LIMITATIONS } from '../config/constants';

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
    return '***' + apiKey.slice(-4);
  }

  // Helper method to validate organization access
  private validateOrganizationAccess(req: AuthRequest): { isValid: boolean; organizationId: string | null; error?: string } {
    if (!req.organization?.id) {
      return { isValid: false, organizationId: null, error: 'Organization not found' };
    }
    return { isValid: true, organizationId: req.organization.id };
  }

  // Helper method to get platform features based on organization plan
  private getPlatformFeaturesForPlan(platform: AvailablePlatform, organizationPlan: string): AvailablePlatform {
    const planKey = organizationPlan as keyof typeof PLAN_LIMITATIONS;
    const planLimits = PLAN_LIMITATIONS[planKey] || PLAN_LIMITATIONS[ORGANIZATION_PLANS.FREE];
    
    const maxRequestsForPlan = Math.floor((platform.maxRequestsPerDay || 100) * planLimits.requestMultiplier);
    
    return {
      ...platform,
      maxRequestsPerDay: maxRequestsForPlan,
      supported: organizationPlan === ORGANIZATION_PLANS.FREE ? !platform.pricing?.paidOnly : platform.supported
    };
  }
  // GET /api/v1/tracking/settings - Get tracking configuration
  async getTrackingSettings(req: AuthRequest, res: Response): Promise<Response<TrackingSettingsResponse>> {
    try {
      const validation = this.validateOrganizationAccess(req);
      if (!validation.isValid) {
        return res.status(401).json({ 
          success: false, 
          error: validation.error || 'Organization access denied' 
        });
      }

      const organizationId = validation.organizationId!;

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
          ? [AI_PLATFORMS.CHATGPT, AI_PLATFORMS.CLAUDE] // Free tier gets basic platforms
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
      const validation = this.validateOrganizationAccess(req);
      if (!validation.isValid) {
        return res.status(401).json({ 
          success: false, 
          error: validation.error || 'Organization access denied' 
        });
      }

      const organizationId = validation.organizationId!;
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
          ? [AI_PLATFORMS.CHATGPT, AI_PLATFORMS.CLAUDE] 
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
      const validation = this.validateOrganizationAccess(req);
      if (!validation.isValid) {
        return res.status(401).json({ 
          success: false, 
          error: validation.error || 'Organization access denied' 
        });
      }

      const organizationId = validation.organizationId!;
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

      // Check plan limitations for paid-only platforms
      if (availablePlatform.pricing?.paidOnly && organization.plan === ORGANIZATION_PLANS.FREE) {
        return res.status(403).json({
          success: false,
          error: `Platform '${platform}' is only available for paid plans. Please upgrade your account.`
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
        apiKey: this.maskApiKey(platformSettings.apiKey),
        platformInfo: availablePlatform
      };

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
      const validation = this.validateOrganizationAccess(req);
      if (!validation.isValid) {
        return res.status(401).json({ 
          success: false, 
          error: validation.error || 'Organization access denied' 
        });
      }

      const organizationId = validation.organizationId!;

      // Parallel fetch organization and platform settings
      const [organization, existingPlatformSettings, trackingSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        PlatformSettings.findAll({
          where: { organizationId },
          order: [['platform', 'ASC']]
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
      const availablePlatformsForPlan = this.AVAILABLE_PLATFORMS.filter(platform => 
        this.getPlatformFeaturesForPlan(platform, organization.plan).supported
      );
      
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
              maxRequestsPerDay: this.getPlatformFeaturesForPlan(platformConfig, organization.plan).maxRequestsPerDay
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
        const enhancedPlatformConfig = this.getPlatformFeaturesForPlan(platformConfig, organization.plan);
        
        return {
          ...settings.toJSON(),
          apiKey: this.maskApiKey(settings.apiKey),
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
      const validation = this.validateOrganizationAccess(req);
      if (!validation.isValid) {
        return res.status(401).json({ 
          success: false, 
          error: validation.error || 'Organization access denied' 
        });
      }

      const organizationId = validation.organizationId!;

      // Parallel fetch organization and current platform settings
      const [organization, currentPlatformSettings] = await Promise.all([
        Organization.findByPk(organizationId),
        PlatformSettings.findAll({ 
          where: { organizationId, enabled: true },
          attributes: ['platform']
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
        const enhancedPlatform = this.getPlatformFeaturesForPlan(platform, organization.plan);
        
        return {
          ...enhancedPlatform,
          status: {
            enabled: enabledPlatforms.includes(platform.id),
            availableInPlan: enhancedPlatform.supported,
            upgradeRequired: !enhancedPlatform.supported && organization.plan === 'free'
          },
          // Add plan-specific messaging
          planLimitations: organization.plan === ORGANIZATION_PLANS.FREE ? {
            message: enhancedPlatform.pricing?.paidOnly 
              ? 'Upgrade to access this platform'
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
}