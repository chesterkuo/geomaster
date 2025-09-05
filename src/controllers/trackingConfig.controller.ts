import { Request, Response } from 'express';
import TrackingSettings from '../models/TrackingSettings';
import PlatformSettings from '../models/PlatformSettings';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class TrackingConfigController {
  // GET /api/v1/tracking/settings - Get tracking configuration
  async getTrackingSettings(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      let settings = await TrackingSettings.findOne({
        where: { organizationId }
      });

      // Create default settings if none exist
      if (!settings) {
        settings = await TrackingSettings.create({
          organizationId,
          trackingEnabled: true,
          trackingFrequency: 'daily',
          platforms: ['chatgpt', 'gemini', 'perplexity', 'claude'],
          alertsEnabled: false,
          alertThreshold: 5,
          alertEmails: [],
          settings: {}
        });
      }

      return res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error fetching tracking settings:', error);
      return res.status(500).json({ error: 'Failed to fetch tracking settings' });
    }
  }

  // PUT /api/v1/tracking/settings - Update tracking settings
  async updateTrackingSettings(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const {
        trackingEnabled,
        trackingFrequency,
        platforms,
        alertsEnabled,
        alertThreshold,
        alertEmails,
        settings
      } = req.body;

      let trackingSettings = await TrackingSettings.findOne({
        where: { organizationId }
      });

      if (!trackingSettings) {
        trackingSettings = await TrackingSettings.create({
          organizationId,
          trackingEnabled: trackingEnabled ?? true,
          trackingFrequency: trackingFrequency ?? 'daily',
          platforms: platforms ?? ['chatgpt', 'gemini', 'perplexity', 'claude'],
          alertsEnabled: alertsEnabled ?? false,
          alertThreshold: alertThreshold ?? 5,
          alertEmails: alertEmails ?? [],
          settings: settings ?? {}
        });
      } else {
        await trackingSettings.update({
          trackingEnabled: trackingEnabled ?? trackingSettings.trackingEnabled,
          trackingFrequency: trackingFrequency ?? trackingSettings.trackingFrequency,
          platforms: platforms ?? trackingSettings.platforms,
          alertsEnabled: alertsEnabled ?? trackingSettings.alertsEnabled,
          alertThreshold: alertThreshold ?? trackingSettings.alertThreshold,
          alertEmails: alertEmails ?? trackingSettings.alertEmails,
          settings: settings ?? trackingSettings.settings
        });
      }

      return res.json({
        success: true,
        data: trackingSettings
      });
    } catch (error) {
      console.error('Error updating tracking settings:', error);
      return res.status(500).json({ error: 'Failed to update tracking settings' });
    }
  }

  // POST /api/v1/tracking/platforms - Configure platform monitoring
  async configurePlatform(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { platform, enabled, settings, apiKey } = req.body;

      let platformSettings = await PlatformSettings.findOne({
        where: { organizationId, platform }
      });

      if (!platformSettings) {
        platformSettings = await PlatformSettings.create({
          organizationId,
          platform,
          enabled: enabled ?? true,
          settings: settings ?? {},
          apiKey: apiKey ?? null
        });
      } else {
        await platformSettings.update({
          enabled: enabled ?? platformSettings.enabled,
          settings: settings ?? platformSettings.settings,
          apiKey: apiKey ?? platformSettings.apiKey
        });
      }

      // Remove sensitive data from response
      const responseData = { ...platformSettings.toJSON() };
      if (responseData.apiKey) {
        responseData.apiKey = '***' + responseData.apiKey.slice(-4);
      }

      return res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error configuring platform:', error);
      return res.status(500).json({ error: 'Failed to configure platform' });
    }
  }

  // GET /api/v1/tracking/platforms - List monitored platforms
  async getPlatforms(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const platformSettings = await PlatformSettings.findAll({
        where: { organizationId },
        order: [['platform', 'ASC']]
      });

      // Create default platform settings if none exist
      const allPlatforms = ['chatgpt', 'gemini', 'perplexity', 'claude'];
      const existingPlatforms = platformSettings.map(p => p.platform);
      const missingPlatforms = allPlatforms.filter(p => !existingPlatforms.includes(p as any));

      // Create missing platform settings
      for (const platform of missingPlatforms) {
        const newPlatformSettings = await PlatformSettings.create({
          organizationId,
          platform: platform as any,
          enabled: true,
          settings: {}
        });
        platformSettings.push(newPlatformSettings);
      }

      // Remove sensitive data from response
      const responseData = platformSettings.map(settings => {
        const data = { ...settings.toJSON() };
        if (data.apiKey) {
          data.apiKey = '***' + data.apiKey.slice(-4);
        }
        return data;
      });

      return res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      console.error('Error fetching platforms:', error);
      return res.status(500).json({ error: 'Failed to fetch platforms' });
    }
  }

  // GET /api/v1/tracking/platforms/available - Get available platforms for monitoring
  async getAvailablePlatforms(req: AuthRequest, res: Response) {
    try {
      const platforms = [
        {
          id: 'chatgpt',
          name: 'ChatGPT',
          description: 'OpenAI ChatGPT platform tracking',
          icon: 'openai',
          supported: true
        },
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Google Gemini AI platform tracking',
          icon: 'google',
          supported: true
        },
        {
          id: 'perplexity',
          name: 'Perplexity AI',
          description: 'Perplexity AI search platform tracking',
          icon: 'perplexity',
          supported: true
        },
        {
          id: 'claude',
          name: 'Claude AI',
          description: 'Anthropic Claude AI platform tracking',
          icon: 'anthropic',
          supported: true
        }
      ];

      return res.json({
        success: true,
        data: platforms
      });
    } catch (error) {
      console.error('Error fetching available platforms:', error);
      return res.status(500).json({ error: 'Failed to fetch available platforms' });
    }
  }
}