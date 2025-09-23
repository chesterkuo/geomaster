import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import PlatformSettings from '../models/PlatformSettings';
import { ApiKeyValidationService } from '../services/apiKeyValidationService';
import { logActivity } from '../utils/activityLogger';
import crypto from 'crypto';

export class PlatformSettingsController {
  private apiKeyValidationService = new ApiKeyValidationService();

  // GET /api/v1/platforms - Get all platform settings for organization
  getPlatformSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const platformSettings = await PlatformSettings.findAll({
        where: { organizationId },
        order: [['platform', 'ASC']],
        attributes: ['id', 'platform', 'enabled', 'settings', 'lastSync', 'createdAt', 'updatedAt', 'apiKey']
        // Note: We include apiKey to check its existence but remove it from the response for security
      });

      // Add API key status (whether it exists) without exposing the actual key
      const settingsWithKeyStatus = platformSettings.map((setting: any) => {
        const settingData = setting.toJSON();
        // Remove the actual apiKey from response for security
        delete settingData.apiKey;
        return {
          ...settingData,
          hasApiKey: setting.apiKey ? true : false,
          apiKeyMasked: setting.apiKey ? this.maskApiKey(setting.apiKey) : null
        };
      });

      res.json({
        success: true,
        data: settingsWithKeyStatus
      });
    } catch (error) {
      console.error('Error getting platform settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get platform settings'
      });
    }
  };

  // GET /api/v1/platforms/:platform/requirements - Get API key requirements for a platform
  getApiKeyRequirements = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { platform } = req.params;

      const requirements = this.apiKeyValidationService.getApiKeyRequirements(platform);

      res.json({
        success: true,
        data: {
          platform,
          ...requirements
        }
      });
    } catch (error) {
      console.error('Error getting API key requirements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get API key requirements'
      });
    }
  };

  // POST /api/v1/platforms/:platform/validate - Validate API key for a platform
  validateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { platform } = req.params;
      const { apiKey } = req.body;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      if (!apiKey || apiKey.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'API key is required'
        });
        return;
      }

      // Validate the API key
      const validationResult = await this.apiKeyValidationService.validateApiKey(platform, apiKey);

      await logActivity({
        userId: req.user!.id,
        organizationId,
        action: 'platform.api_key.validate',
        description: `API key validation for ${platform}: ${validationResult.isValid ? 'success' : 'failed'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          platform,
          valid: validationResult.isValid,
          error: validationResult.error
        }
      });

      res.json({
        success: true,
        data: validationResult
      });
    } catch (error) {
      console.error('Error validating API key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate API key'
      });
    }
  };

  // PUT /api/v1/platforms/:platform/api-key - Update API key for a platform
  updateApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { platform } = req.params;
      const { apiKey, enabled } = req.body;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      if (!apiKey || apiKey.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'API key is required'
        });
        return;
      }

      // Validate the API key before saving
      const validationResult = await this.apiKeyValidationService.validateApiKey(platform, apiKey);

      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: `Invalid API key: ${validationResult.error}`,
          data: validationResult
        });
        return;
      }

      // Encrypt the API key before storing
      const encryptedApiKey = this.encryptApiKey(apiKey);

      // Find or create platform setting
      const [platformSetting] = await PlatformSettings.findOrCreate({
        where: { organizationId, platform },
        defaults: {
          organizationId,
          platform: platform as 'chatgpt' | 'gemini' | 'perplexity' | 'claude',
          enabled: enabled !== undefined ? enabled : true,
          apiKey: encryptedApiKey,
          settings: {},
          lastSync: undefined
        }
      });

      // Update if it already exists
      if (platformSetting) {
        await platformSetting.update({
          apiKey: encryptedApiKey,
          enabled: enabled !== undefined ? enabled : platformSetting.enabled,
          lastSync: new Date()
        });
      }

      await logActivity({
        userId: req.user!.id,
        organizationId,
        action: 'platform.api_key.update',
        description: `Updated API key for ${platform}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          platform,
          enabled: enabled !== undefined ? enabled : platformSetting.enabled
        }
      });

      res.json({
        success: true,
        message: 'API key updated successfully',
        data: {
          platform,
          enabled: platformSetting.enabled,
          hasApiKey: true,
          apiKeyMasked: this.maskApiKey(apiKey),
          validationResult
        }
      });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update API key'
      });
    }
  };

  // DELETE /api/v1/platforms/:platform/api-key - Remove API key for a platform
  removeApiKey = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { platform } = req.params;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const platformSetting = await PlatformSettings.findOne({
        where: { organizationId, platform }
      });

      if (!platformSetting) {
        res.status(404).json({
          success: false,
          message: 'Platform setting not found'
        });
        return;
      }

      // Remove API key and disable platform
      await platformSetting.update({
        apiKey: undefined,
        enabled: false,
        lastSync: undefined
      });

      await logActivity({
        userId: req.user!.id,
        organizationId,
        action: 'platform.api_key.remove',
        description: `Removed API key for ${platform}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { platform }
      });

      res.json({
        success: true,
        message: 'API key removed successfully',
        data: {
          platform,
          enabled: false,
          hasApiKey: false
        }
      });
    } catch (error) {
      console.error('Error removing API key:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove API key'
      });
    }
  };

  // PUT /api/v1/platforms/:platform/toggle - Toggle platform enabled/disabled
  togglePlatform = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { platform } = req.params;
      const { enabled } = req.body;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      if (typeof enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Enabled field must be a boolean'
        });
        return;
      }

      const platformSetting = await PlatformSettings.findOne({
        where: { organizationId, platform }
      });

      if (!platformSetting) {
        res.status(404).json({
          success: false,
          message: 'Platform setting not found'
        });
        return;
      }

      // If enabling, check if API key exists
      if (enabled && !platformSetting.apiKey) {
        res.status(400).json({
          success: false,
          message: 'Cannot enable platform without API key'
        });
        return;
      }

      await platformSetting.update({ enabled });

      await logActivity({
        userId: req.user!.id,
        organizationId,
        action: 'platform.toggle',
        description: `${enabled ? 'Enabled' : 'Disabled'} platform ${platform}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { platform, enabled }
      });

      res.json({
        success: true,
        message: `Platform ${enabled ? 'enabled' : 'disabled'} successfully`,
        data: {
          platform,
          enabled,
          hasApiKey: platformSetting.apiKey ? true : false
        }
      });
    } catch (error) {
      console.error('Error toggling platform:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle platform'
      });
    }
  };

  /**
   * Encrypt API key for storage
   */
  private encryptApiKey(apiKey: string): string {
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.API_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('api-key'));
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt API key from storage
   */
  private decryptApiKey(encryptedApiKey: string): string {
    try {
      const algorithm = 'aes-256-gcm';
      const secretKey = process.env.API_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
      const key = crypto.scryptSync(secretKey, 'salt', 32);
      
      const [ivHex, authTagHex, encrypted] = encryptedApiKey.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from('api-key'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Mask API key for display purposes
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '***';
    }
    const start = apiKey.substring(0, 4);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(apiKey.length - 8, 4));
    return `${start}${middle}${end}`;
  }
}