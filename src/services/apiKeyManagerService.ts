import PlatformSettings from '../models/PlatformSettings';
import { PlatformSettingsController } from '../controllers/platformSettings.controller';

export interface ApiKeyConfig {
  apiKey: string;
  isUserProvided: boolean;
  source: 'env' | 'user';
}

export class ApiKeyManagerService {
  private platformSettingsController = new PlatformSettingsController();

  /**
   * Get API key for a platform with prioritization:
   * 1. User-provided API keys (from database) - highest priority
   * 2. .env API keys - fallback for free usage
   * 3. Special: GEMINI prefers .env key but allows user keys
   */
  async getApiKeyForPlatform(
    platform: string,
    organizationId: string,
    forceEnvKey: boolean = false
  ): Promise<ApiKeyConfig | null> {
    const platformName = platform.toLowerCase();

    // If forceEnvKey is true, use .env key directly (used for fallback)
    if (forceEnvKey) {
      const envApiKey = this.getEnvApiKey(platformName);
      if (envApiKey) {
        return {
          apiKey: envApiKey,
          isUserProvided: false,
          source: 'env'
        };
      }
      return null;
    }

    // Try to get user-provided API key first (for ALL platforms including Gemini)
    try {
      const platformSetting = await PlatformSettings.findOne({
        where: {
          organizationId,
          platform: platformName as 'chatgpt' | 'gemini' | 'perplexity' | 'claude'
        }
      });

      if (platformSetting?.apiKey) {
        // Decrypt user-provided API key
        const decryptedApiKey = this.platformSettingsController.decryptApiKey(platformSetting.apiKey);
        return {
          apiKey: decryptedApiKey,
          isUserProvided: true,
          source: 'user'
        };
      }
    } catch (error) {
      console.error(`Error retrieving user API key for ${platform}:`, error);
    }

    // Fallback to .env API key for free usage (for ALL platforms)
    const envApiKey = this.getEnvApiKey(platformName);
    if (envApiKey) {
      return {
        apiKey: envApiKey,
        isUserProvided: false,
        source: 'env'
      };
    }

    return null;
  }

  /**
   * Get fallback API key (always .env) for a platform
   */
  async getFallbackApiKey(platform: string): Promise<ApiKeyConfig | null> {
    return this.getApiKeyForPlatform(platform, '', true);
  }

  /**
   * Get environment API key for a platform
   */
  private getEnvApiKey(platform: string): string | null {
    switch (platform.toLowerCase()) {
      case 'chatgpt':
        return process.env.OPENAI_API_KEY || null;
      case 'claude':
        return process.env.ANTHROPIC_API_KEY || null;
      case 'gemini':
        return process.env.GOOGLE_GEMINI_API_KEY || null;
      case 'perplexity':
        return process.env.PERPLEXITY_API_KEY || null;
      default:
        return null;
    }
  }

  /**
   * Check if user has provided API key for a platform
   */
  async hasUserApiKey(platform: string, organizationId: string): Promise<boolean> {
    try {
      const platformSetting = await PlatformSettings.findOne({
        where: {
          organizationId,
          platform: platform.toLowerCase() as 'chatgpt' | 'gemini' | 'perplexity' | 'claude'
        }
      });

      return !!(platformSetting?.apiKey);
    } catch (error) {
      console.error(`Error checking user API key for ${platform}:`, error);
      return false;
    }
  }

  /**
   * Check if platform is available (has either user or env API key)
   * User API keys have priority, .env keys are fallback for free usage
   */
  async isPlatformAvailable(platform: string, organizationId: string): Promise<boolean> {
    const platformName = platform.toLowerCase();

    // Check user API key first (for ALL platforms including Gemini)
    const hasUserKey = await this.hasUserApiKey(platform, organizationId);
    if (hasUserKey) {
      return true;
    }

    // Fallback to .env API key for free usage
    const envApiKey = this.getEnvApiKey(platformName);
    return !!envApiKey;
  }

  /**
   * Get all available platforms for an organization with their API key sources
   */
  async getAvailablePlatforms(organizationId: string): Promise<Record<string, ApiKeyConfig | null>> {
    const platforms = ['chatgpt', 'claude', 'gemini', 'perplexity'];
    const result: Record<string, ApiKeyConfig | null> = {};

    for (const platform of platforms) {
      result[platform] = await this.getApiKeyForPlatform(platform, organizationId);
    }

    return result;
  }
}

export const apiKeyManager = new ApiKeyManagerService();