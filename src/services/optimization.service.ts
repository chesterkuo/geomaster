import OpenAI from 'openai';
import { Content } from '../models';
import { logger } from '../utils/logger';
import { OPTIMIZATION_TYPES } from '../config/constants';

export interface OptimizationOptions {
  targetKeywords?: string[];
  contentType?: 'page' | 'post' | 'product' | 'faq';
  optimizationTypes?: string[];
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'friendly';
}

export interface OptimizationResult {
  optimizedContent: string;
  optimizedTitle?: string;
  optimizedMetaDescription?: string;
  generatedFAQ?: Array<{ question: string; answer: string }>;
  schemaMarkup?: any[];
  improvements: Array<{
    type: string;
    description: string;
    beforeValue?: string;
    afterValue?: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  geoScoreImprovement: number;
}

export class OptimizationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async optimizeContent(contentId: string, options: OptimizationOptions = {}): Promise<OptimizationResult> {
    try {
      const content = await Content.findByPk(contentId, {
        include: [{ model: require('../models').Website, as: 'website' }]
      });

      if (!content) {
        throw new Error('Content not found');
      }

      const originalContent = content.originalContent || '';
      const originalTitle = content.title || '';
      const originalMetaDescription = content.metaDescription || '';

      // Perform different optimization types
      const optimizations = await Promise.all([
        this.optimizeMainContent(originalContent, options),
        this.optimizeTitle(originalTitle, originalContent, options),
        this.optimizeMetaDescription(originalMetaDescription, originalContent, options),
        this.generateFAQ(originalContent, options),
        this.generateSchemaMarkup(content, options)
      ]);

      const [
        optimizedContent,
        optimizedTitle,
        optimizedMetaDescription,
        generatedFAQ,
        schemaMarkup
      ] = optimizations;

      // Calculate improvements
      const improvements = this.calculateImprovements(
        { content: originalContent, title: originalTitle, metaDescription: originalMetaDescription },
        { content: optimizedContent, title: optimizedTitle, metaDescription: optimizedMetaDescription }
      );

      // Estimate GEO score improvement
      const geoScoreImprovement = this.estimateScoreImprovement(improvements);

      // Save optimized content
      await this.saveOptimizedContent(contentId, {
        optimizedContent,
        optimizedTitle,
        optimizedMetaDescription,
        generatedFAQ,
        schemaMarkup
      });

      return {
        optimizedContent,
        optimizedTitle,
        optimizedMetaDescription,
        generatedFAQ,
        schemaMarkup,
        improvements,
        geoScoreImprovement
      };

    } catch (error) {
      logger.error('Content optimization failed:', error);
      throw new Error(`Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async optimizeMainContent(content: string, options: OptimizationOptions): Promise<string> {
    const keywords = options.targetKeywords?.join(', ') || 'relevant keywords';
    const contentType = options.contentType || 'page';
    const tone = options.tone || 'professional';

    const prompt = `
You are an expert content optimizer specializing in AI search engine optimization (GEO).

Original Content:
${content}

Instructions:
1. Optimize this ${contentType} content for AI search engines (ChatGPT, Gemini, Perplexity)
2. Target keywords: ${keywords}
3. Use a ${tone} tone
4. Ensure content is comprehensive, well-structured, and authoritative
5. Aim for 1500+ words if possible
6. Use clear headings (H2, H3) to organize content
7. Include relevant examples and explanations
8. Make it easily digestible for AI systems
9. Maintain factual accuracy and credibility

Requirements:
- Structure content with proper headings
- Include relevant statistics or data points
- Add citations where appropriate
- Ensure readability and flow
- Optimize for featured snippets and AI citations

Return only the optimized content without any explanation or meta-commentary.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.7
      });

      return response.choices[0].message.content || content;
    } catch (error) {
      logger.error('Failed to optimize main content:', error);
      return content; // Return original if optimization fails
    }
  }

  private async optimizeTitle(originalTitle: string, content: string, options: OptimizationOptions): Promise<string> {
    const keywords = options.targetKeywords?.join(', ') || 'relevant keywords';

    const prompt = `
Based on this content, create an optimized title that:
1. Includes target keywords: ${keywords}
2. Is 50-60 characters long
3. Is compelling and click-worthy
4. Optimized for AI search engines
5. Accurately represents the content

Content summary: ${content.substring(0, 500)}...
Original title: ${originalTitle}

Return only the optimized title, nothing else.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5
      });

      return response.choices[0].message.content?.trim() || originalTitle;
    } catch (error) {
      logger.error('Failed to optimize title:', error);
      return originalTitle;
    }
  }

  private async optimizeMetaDescription(originalDesc: string, content: string, options: OptimizationOptions): Promise<string> {
    const keywords = options.targetKeywords?.join(', ') || 'relevant keywords';

    const prompt = `
Create an optimized meta description that:
1. Is 150-160 characters long
2. Includes target keywords: ${keywords}
3. Accurately summarizes the content
4. Includes a compelling call-to-action
5. Optimized for AI search engines

Content summary: ${content.substring(0, 500)}...
Original meta description: ${originalDesc}

Return only the optimized meta description, nothing else.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5
      });

      return response.choices[0].message.content?.trim() || originalDesc;
    } catch (error) {
      logger.error('Failed to optimize meta description:', error);
      return originalDesc;
    }
  }

  private async generateFAQ(content: string, options: OptimizationOptions): Promise<Array<{ question: string; answer: string }>> {
    const keywords = options.targetKeywords?.join(', ') || 'relevant keywords';

    const prompt = `
Based on this content, generate 5-8 frequently asked questions and comprehensive answers that:
1. Address common user queries related to: ${keywords}
2. Are optimized for AI search engines
3. Provide valuable, actionable information
4. Use natural, conversational language
5. Cover different aspects of the topic

Content: ${content.substring(0, 1500)}...

Return the FAQ in this exact JSON format:
[
  {
    "question": "Question text here",
    "answer": "Comprehensive answer here"
  }
]

Return only valid JSON, no other text.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.6
      });

      const content_response = response.choices[0].message.content;
      if (!content_response) return [];

      return JSON.parse(content_response);
    } catch (error) {
      logger.error('Failed to generate FAQ:', error);
      return [];
    }
  }

  private async generateSchemaMarkup(content: any, options: OptimizationOptions): Promise<any[]> {
    const schemaTypes = [];

    try {
      // Generate FAQ schema if we have FAQ data
      if (options.contentType === 'faq' || content.title?.toLowerCase().includes('faq')) {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [] // Will be populated with actual FAQ data
        };
        schemaTypes.push(faqSchema);
      }

      // Generate Article schema
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": content.title,
        "description": content.metaDescription,
        "author": {
          "@type": "Organization",
          "name": content.website?.name || "GEO Platform"
        },
        "publisher": {
          "@type": "Organization",
          "name": content.website?.name || "GEO Platform"
        },
        "datePublished": content.createdAt,
        "dateModified": content.updatedAt
      };
      schemaTypes.push(articleSchema);

      // Generate Organization schema
      if (content.website) {
        const orgSchema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": content.website.name,
          "url": content.website.url,
          "description": content.website.description
        };
        schemaTypes.push(orgSchema);
      }

      return schemaTypes;
    } catch (error) {
      logger.error('Failed to generate schema markup:', error);
      return [];
    }
  }

  private calculateImprovements(original: any, optimized: any): Array<any> {
    const improvements = [];

    // Content length improvement
    const originalLength = original.content?.length || 0;
    const optimizedLength = optimized.content?.length || 0;
    if (optimizedLength > originalLength) {
      improvements.push({
        type: 'content_expansion',
        description: 'Expanded content for better AI comprehension',
        beforeValue: `${originalLength} characters`,
        afterValue: `${optimizedLength} characters`,
        impact: 'high' as const
      });
    }

    // Title optimization
    if (original.title !== optimized.title) {
      improvements.push({
        type: 'title_optimization',
        description: 'Optimized title for better AI search visibility',
        beforeValue: original.title,
        afterValue: optimized.title,
        impact: 'high' as const
      });
    }

    // Meta description optimization
    if (original.metaDescription !== optimized.metaDescription) {
      improvements.push({
        type: 'meta_description_optimization',
        description: 'Enhanced meta description for better search snippets',
        beforeValue: original.metaDescription,
        afterValue: optimized.metaDescription,
        impact: 'medium' as const
      });
    }

    // Structure improvement
    const originalHeaders = (original.content?.match(/<h[2-6][^>]*>/gi) || []).length;
    const optimizedHeaders = (optimized.content?.match(/<h[2-6][^>]*>/gi) || []).length;
    if (optimizedHeaders > originalHeaders) {
      improvements.push({
        type: 'structure_enhancement',
        description: 'Improved content structure with better headings',
        beforeValue: `${originalHeaders} headings`,
        afterValue: `${optimizedHeaders} headings`,
        impact: 'medium' as const
      });
    }

    return improvements;
  }

  private estimateScoreImprovement(improvements: any[]): number {
    let scoreImprovement = 0;

    improvements.forEach(improvement => {
      switch (improvement.type) {
        case 'content_expansion':
          scoreImprovement += improvement.impact === 'high' ? 15 : 8;
          break;
        case 'title_optimization':
          scoreImprovement += 10;
          break;
        case 'meta_description_optimization':
          scoreImprovement += 5;
          break;
        case 'structure_enhancement':
          scoreImprovement += 8;
          break;
        case 'faq_generation':
          scoreImprovement += 12;
          break;
        case 'schema_markup':
          scoreImprovement += 20;
          break;
        default:
          scoreImprovement += 3;
      }
    });

    return Math.min(50, scoreImprovement); // Cap at 50 points improvement
  }

  private async saveOptimizedContent(contentId: string, optimizationData: any): Promise<void> {
    try {
      await Content.update({
        optimizedContent: optimizationData.optimizedContent,
        title: optimizationData.optimizedTitle,
        metaDescription: optimizationData.optimizedMetaDescription,
        optimizationStatus: 'optimized',
        lastUpdated: new Date()
      }, {
        where: { id: contentId }
      });

      logger.info(`Saved optimized content for content ID: ${contentId}`);
    } catch (error) {
      logger.error('Failed to save optimized content:', error);
      throw error;
    }
  }

  async generateOneClickOptimization(websiteId: string, options: OptimizationOptions = {}): Promise<any> {
    try {
      // Get all content for the website that needs optimization
      const contents = await Content.findAll({
        where: {
          websiteId,
          optimizationStatus: ['pending', 'needs_update']
        },
        limit: 10 // Limit to prevent overwhelming the system
      });

      const optimizationResults = [];

      for (const content of contents) {
        try {
          const result = await this.optimizeContent(content.id, options);
          optimizationResults.push({
            contentId: content.id,
            url: content.url,
            ...result
          });
        } catch (error) {
          logger.error(`Failed to optimize content ${content.id}:`, error);
        }
      }

      return {
        totalOptimized: optimizationResults.length,
        results: optimizationResults,
        averageScoreImprovement: optimizationResults.reduce((sum, r) => sum + r.geoScoreImprovement, 0) / optimizationResults.length
      };

    } catch (error) {
      logger.error('One-click optimization failed:', error);
      throw error;
    }
  }

  async generateOptimizationDownloadPackage(websiteId: string, contentIds: string[]): Promise<any> {
    try {
      const optimizationPackage: {
        website_id: string;
        generated_at: Date;
        files: { [key: string]: string };
        instructions: string[];
      } = {
        website_id: websiteId,
        generated_at: new Date(),
        files: {},
        instructions: []
      };

      const contents = await Content.findAll({
        where: { id: contentIds }
      });

      for (const content of contents) {
        if (content.optimizedContent) {
          const filename = `optimized_${content.url?.split('/').pop() || content.id}.html`;
          optimizationPackage.files[filename] = content.optimizedContent;
        }

        // Generate schema files
        if (content.schemaTypes && content.schemaTypes.length > 0) {
          const schemaFilename = `schema_${content.id}.json`;
          optimizationPackage.files[schemaFilename] = JSON.stringify(content.schemaTypes, null, 2);
        }
      }

      // Add implementation instructions
      optimizationPackage.instructions = [
        "1. Replace the content of your existing pages with the optimized versions",
        "2. Add the schema markup to the <head> section of each page",
        "3. Update your robots.txt to allow AI bots",
        "4. Test the changes on a staging environment first",
        "5. Monitor your GEO scores after implementation"
      ];

      return optimizationPackage;

    } catch (error) {
      logger.error('Failed to generate download package:', error);
      throw error;
    }
  }

  async getOptimizationPreview(contentId: string, optimizationType: string): Promise<any> {
    try {
      const content = await Content.findByPk(contentId);
      if (!content) {
        throw new Error('Content not found');
      }

      let preview = {};

      switch (optimizationType) {
        case OPTIMIZATION_TYPES.CONTENT_OPTIMIZATION:
          preview = await this.generateContentPreview(content);
          break;
        case OPTIMIZATION_TYPES.SCHEMA_INJECTION:
          preview = await this.generateSchemaPreview(content);
          break;
        case OPTIMIZATION_TYPES.FAQ_GENERATION:
          preview = await this.generateFAQPreview(content);
          break;
        case OPTIMIZATION_TYPES.META_UPDATE:
          preview = await this.generateMetaPreview(content);
          break;
        default:
          throw new Error('Invalid optimization type');
      }

      return preview;

    } catch (error) {
      logger.error('Failed to generate optimization preview:', error);
      throw error;
    }
  }

  private async generateContentPreview(content: any): Promise<any> {
    const original = content.originalContent?.substring(0, 500) + '...';
    const optimized = await this.optimizeMainContent(content.originalContent || '', {});
    const optimizedPreview = optimized.substring(0, 500) + '...';

    return {
      type: 'content',
      before: original,
      after: optimizedPreview,
      improvements: ['Expanded content length', 'Better structure', 'Enhanced readability']
    };
  }

  private async generateSchemaPreview(content: any): Promise<any> {
    const schema = await this.generateSchemaMarkup(content, {});
    
    return {
      type: 'schema',
      before: 'No structured data',
      after: JSON.stringify(schema[0], null, 2),
      improvements: ['Added structured data', 'Better AI comprehension', 'Rich snippets eligible']
    };
  }

  private async generateFAQPreview(content: any): Promise<any> {
    const faq = await this.generateFAQ(content.originalContent || '', {});
    
    return {
      type: 'faq',
      before: 'No FAQ section',
      after: faq.slice(0, 3), // Show first 3 questions
      improvements: ['Added FAQ section', 'Better user engagement', 'Featured snippet potential']
    };
  }

  private async generateMetaPreview(content: any): Promise<any> {
    const optimizedTitle = await this.optimizeTitle(content.title || '', content.originalContent || '', {});
    const optimizedMeta = await this.optimizeMetaDescription(content.metaDescription || '', content.originalContent || '', {});

    return {
      type: 'meta',
      before: {
        title: content.title,
        description: content.metaDescription
      },
      after: {
        title: optimizedTitle,
        description: optimizedMeta
      },
      improvements: ['Optimized title', 'Enhanced meta description', 'Better search snippets']
    };
  }
}