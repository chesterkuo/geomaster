import { 
  AITrackingPlatform, 
  PlatformFactory, 
  PlatformConfig, 
  PlatformName,
  PlatformError 
} from './aiPlatformInterface';

// Import platform implementations (to be created)
import { ChatGPTService } from './chatgptService';
import { ClaudeService } from './claudeService';
import { GeminiService } from './geminiService';
import { PerplexityService } from './perplexityService';

export class AITrackingPlatformFactory implements PlatformFactory {
  private static instance: AITrackingPlatformFactory;
  private platformInstances: Map<string, AITrackingPlatform> = new Map();

  private constructor() {}

  public static getInstance(): AITrackingPlatformFactory {
    if (!AITrackingPlatformFactory.instance) {
      AITrackingPlatformFactory.instance = new AITrackingPlatformFactory();
    }
    return AITrackingPlatformFactory.instance;
  }

  createPlatform(platformName: string, config: PlatformConfig): AITrackingPlatform {
    const cacheKey = `${platformName}-${JSON.stringify(config)}`;
    
    // Return cached instance if available
    if (this.platformInstances.has(cacheKey)) {
      return this.platformInstances.get(cacheKey)!;
    }

    let platform: AITrackingPlatform;

    switch (platformName.toLowerCase() as PlatformName) {
      case 'chatgpt':
        platform = new ChatGPTService(config);
        break;
      
      case 'claude':
        platform = new ClaudeService(config);
        break;
      
      case 'gemini':
        platform = new GeminiService(config);
        break;
      
      case 'perplexity':
        platform = new PerplexityService(config);
        break;
      
      default:
        throw new PlatformError(
          platformName,
          'UNSUPPORTED_PLATFORM',
          `Platform ${platformName} is not supported`
        );
    }

    // Cache the instance
    this.platformInstances.set(cacheKey, platform);
    
    return platform;
  }

  getSupportedPlatforms(): string[] {
    return ['chatgpt', 'claude', 'gemini', 'perplexity'];
  }

  isPlatformSupported(platformName: string): boolean {
    return this.getSupportedPlatforms().includes(platformName.toLowerCase());
  }

  // Get platform with default configuration
  createPlatformWithDefaults(platformName: string): AITrackingPlatform {
    const defaultConfigs: Record<PlatformName, PlatformConfig> = {
      chatgpt: {
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4',
        maxTokens: 2000,
        temperature: 0.1,
        requestsPerMinute: 60,
        maxRetries: 3,
        timeout: 30000,
      },
      claude: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-sonnet-20240229',
        maxTokens: 2000,
        temperature: 0.1,
        requestsPerMinute: 50,
        maxRetries: 3,
        timeout: 30000,
      },
      gemini: {
        apiKey: process.env.GOOGLE_GEMINI_API_KEY,
        model: 'gemini-pro',
        maxTokens: 2000,
        temperature: 0.1,
        requestsPerMinute: 60,
        maxRetries: 3,
        timeout: 30000,
      },
      perplexity: {
        apiKey: process.env.PERPLEXITY_API_KEY,
        model: 'llama-3-sonar-large-32k-online',
        maxTokens: 2000,
        temperature: 0.1,
        requestsPerMinute: 20,
        maxRetries: 3,
        timeout: 30000,
      },
    };

    const config = defaultConfigs[platformName.toLowerCase() as PlatformName];
    if (!config) {
      throw new PlatformError(
        platformName,
        'UNSUPPORTED_PLATFORM',
        `No default configuration available for platform ${platformName}`
      );
    }

    return this.createPlatform(platformName, config);
  }

  // Batch create platforms
  createMultiplePlatforms(platformNames: string[]): Map<string, AITrackingPlatform> {
    const platforms = new Map<string, AITrackingPlatform>();
    
    for (const platformName of platformNames) {
      try {
        const platform = this.createPlatformWithDefaults(platformName);
        platforms.set(platformName, platform);
      } catch (error) {
        console.error(`Failed to create platform ${platformName}:`, error);
        // Continue with other platforms
      }
    }
    
    return platforms;
  }

  // Validate all platforms
  async validatePlatforms(platformNames: string[]): Promise<Record<string, boolean>> {
    const validationResults: Record<string, boolean> = {};
    
    const platforms = this.createMultiplePlatforms(platformNames);
    
    const validationPromises = Array.from(platforms.entries()).map(async ([name, platform]) => {
      try {
        const isValid = await platform.validateApiKey();
        validationResults[name] = isValid;
      } catch (error) {
        console.error(`Validation failed for ${name}:`, error);
        validationResults[name] = false;
      }
    });
    
    await Promise.all(validationPromises);
    
    return validationResults;
  }

  // Get platform availability status
  async getPlatformAvailability(platformNames: string[]): Promise<Record<string, boolean>> {
    const availabilityResults: Record<string, boolean> = {};
    
    const platforms = this.createMultiplePlatforms(platformNames);
    
    const availabilityPromises = Array.from(platforms.entries()).map(async ([name, platform]) => {
      try {
        const isAvailable = await platform.isAvailable();
        availabilityResults[name] = isAvailable;
      } catch (error) {
        console.error(`Availability check failed for ${name}:`, error);
        availabilityResults[name] = false;
      }
    });
    
    await Promise.all(availabilityPromises);
    
    return availabilityResults;
  }

  // Clear cache for a specific platform
  clearPlatformCache(platformName: string): void {
    const keysToRemove = Array.from(this.platformInstances.keys())
      .filter(key => key.startsWith(platformName));
    
    keysToRemove.forEach(key => {
      this.platformInstances.delete(key);
    });
  }

  // Clear all cached instances
  clearAllCache(): void {
    this.platformInstances.clear();
  }

  // Get platform health status
  async getPlatformHealth(): Promise<Record<string, any>> {
    const supportedPlatforms = this.getSupportedPlatforms();
    const health: Record<string, any> = {};

    for (const platformName of supportedPlatforms) {
      try {
        const platform = this.createPlatformWithDefaults(platformName);
        const [isAvailable, isValidKey, rateLimit] = await Promise.all([
          platform.isAvailable(),
          platform.validateApiKey(),
          platform.getRateLimit().catch(() => null),
        ]);

        health[platformName] = {
          available: isAvailable,
          validApiKey: isValidKey,
          rateLimit: rateLimit,
          status: isAvailable && isValidKey ? 'healthy' : 'unhealthy',
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        health[platformName] = {
          available: false,
          validApiKey: false,
          rateLimit: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date().toISOString(),
        };
      }
    }

    return health;
  }
}

// Export singleton instance
export const platformFactory = AITrackingPlatformFactory.getInstance();