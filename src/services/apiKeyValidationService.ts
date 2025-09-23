import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  providerInfo?: {
    name?: string;
    model?: string;
    quotaUsed?: number;
    quotaLimit?: number;
  };
}

export class ApiKeyValidationService {
  /**
   * Validate OpenAI API key
   */
  async validateOpenAI(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const openai = new OpenAI({ apiKey });
      
      // Test with a simple model list request
      const models = await openai.models.list();
      
      if (models.data && models.data.length > 0) {
        return {
          isValid: true,
          providerInfo: {
            name: 'OpenAI',
            model: models.data[0]?.id || 'gpt-3.5-turbo'
          }
        };
      }
      
      return {
        isValid: false,
        error: 'Invalid API key or no accessible models'
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: this.extractErrorMessage(error, 'OpenAI')
      };
    }
  }

  /**
   * Validate Google Gemini API key
   */
  async validateGemini(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // Test with a simple generation request
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      });
      
      if (result.response) {
        return {
          isValid: true,
          providerInfo: {
            name: 'Google Gemini',
            model: 'gemini-1.5-flash'
          }
        };
      }
      
      return {
        isValid: false,
        error: 'Invalid API key or failed to generate content'
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: this.extractErrorMessage(error, 'Gemini')
      };
    }
  }

  /**
   * Validate Claude API key (Anthropic)
   */
  async validateClaude(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data) {
        return {
          isValid: true,
          providerInfo: {
            name: 'Anthropic Claude',
            model: 'claude-3-haiku-20240307'
          }
        };
      }

      return {
        isValid: false,
        error: 'Invalid API key or failed to get response'
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: this.extractErrorMessage(error, 'Claude')
      };
    }
  }

  /**
   * Validate Perplexity API key
   */
  async validatePerplexity(apiKey: string): Promise<ApiKeyValidationResult> {
    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data) {
        return {
          isValid: true,
          providerInfo: {
            name: 'Perplexity AI',
            model: 'llama-3.1-sonar-small-128k-online'
          }
        };
      }

      return {
        isValid: false,
        error: 'Invalid API key or failed to get response'
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: this.extractErrorMessage(error, 'Perplexity')
      };
    }
  }

  /**
   * Validate API key based on platform
   */
  async validateApiKey(platform: string, apiKey: string): Promise<ApiKeyValidationResult> {
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        isValid: false,
        error: 'API key is required'
      };
    }

    switch (platform.toLowerCase()) {
      case 'chatgpt':
      case 'openai':
        return this.validateOpenAI(apiKey);
      
      case 'gemini':
      case 'google':
        return this.validateGemini(apiKey);
      
      case 'claude':
      case 'anthropic':
        return this.validateClaude(apiKey);
      
      case 'perplexity':
        return this.validatePerplexity(apiKey);
      
      default:
        return {
          isValid: false,
          error: `Unsupported platform: ${platform}`
        };
    }
  }

  /**
   * Extract meaningful error message from API errors
   */
  private extractErrorMessage(error: any, platform: string): string {
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return 'Invalid API key - authentication failed';
      } else if (status === 403) {
        return 'API key does not have required permissions';
      } else if (status === 429) {
        return 'Rate limit exceeded - please try again later';
      } else if (status === 402) {
        return 'Insufficient credits or billing issue';
      } else if (data?.error?.message) {
        return data.error.message;
      } else if (data?.message) {
        return data.message;
      }
    } else if (error.message) {
      // Network or other errors
      if (error.message.includes('timeout')) {
        return `${platform} API timeout - please try again`;
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return `Cannot connect to ${platform} API`;
      }
      return error.message;
    }
    
    return `Failed to validate ${platform} API key`;
  }

  /**
   * Get API key format requirements for each platform
   */
  getApiKeyRequirements(platform: string): {
    format: string;
    example: string;
    documentation: string;
  } {
    switch (platform.toLowerCase()) {
      case 'chatgpt':
      case 'openai':
        return {
          format: 'Starts with "sk-" followed by 48 characters',
          example: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          documentation: 'https://platform.openai.com/api-keys'
        };
      
      case 'gemini':
      case 'google':
        return {
          format: 'Starts with "AIza" followed by 35 characters',
          example: 'AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          documentation: 'https://ai.google.dev/gemini-api/docs/api-key'
        };
      
      case 'claude':
      case 'anthropic':
        return {
          format: 'Starts with "sk-ant-" followed by additional characters',
          example: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          documentation: 'https://docs.anthropic.com/claude/reference/getting-started'
        };
      
      case 'perplexity':
        return {
          format: 'Starts with "pplx-" followed by additional characters',
          example: 'pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          documentation: 'https://docs.perplexity.ai/reference/post_chat_completions'
        };
      
      default:
        return {
          format: 'Platform-specific format',
          example: 'Please refer to platform documentation',
          documentation: ''
        };
    }
  }
}