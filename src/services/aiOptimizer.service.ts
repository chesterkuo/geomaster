import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ContentAnalysisResult, WebsiteContent } from './contentAnalyzer.service';

export interface OptimizationSuggestion {
  type: 'meta_title' | 'meta_description' | 'heading' | 'content' | 'faq' | 'schema';
  current: string;
  suggested: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  implementation: string[];
}

export interface AIOptimizationResult {
  suggestions: OptimizationSuggestion[];
  geoScore: number;
  improvements: {
    current: number;
    potential: number;
  };
  executionPlan: {
    phase: string;
    duration: string;
    actions: string[];
    expectedResults: string;
  }[];
  provider?: string;
}

export type AIProvider = 'openai' | 'gemini';

export class AIOptimizerService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    if (process.env.GOOGLE_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
  }

  async generateOptimizations(
    websiteContent: WebsiteContent,
    analysisResult: ContentAnalysisResult,
    provider: AIProvider = 'openai'
  ): Promise<AIOptimizationResult> {
    try {
      const suggestions = await this.generateAISuggestions(websiteContent, analysisResult, provider);
      const geoScore = this.calculateGEOScore(analysisResult, suggestions);
      const improvements = this.calculateImprovementPotential(analysisResult, suggestions);
      const executionPlan = this.generateExecutionPlan(suggestions);

      return {
        suggestions,
        geoScore,
        improvements,
        executionPlan,
        provider
      };
    } catch (error) {
      console.error(`AI optimization with ${provider} failed, trying fallback:`, error);
      return await this.handleProviderFallback(websiteContent, analysisResult, provider, error as Error);
    }
  }

  private async generateAISuggestions(
    content: WebsiteContent,
    analysis: ContentAnalysisResult,
    provider: AIProvider = 'openai'
  ): Promise<OptimizationSuggestion[]> {
    const prompt = this.buildOptimizationPrompt(content, analysis);
    
    try {
      if (provider === 'openai') {
        return await this.generateOpenAISuggestions(prompt, content, analysis);
      } else if (provider === 'gemini') {
        return await this.generateGeminiSuggestions(prompt, content, analysis);
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`${provider} API error:`, error);
      throw error;
    }
  }

  private async generateOpenAISuggestions(
    prompt: string,
    content: WebsiteContent,
    analysis: ContentAnalysisResult
  ): Promise<OptimizationSuggestion[]> {
    if (!this.openai) {
      throw new Error('OpenAI is not configured. Please set OPENAI_API_KEY in environment variables.');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a GEO (Generative Engine Optimization) expert. Your goal is to optimize content for AI search engines like ChatGPT, Claude, Gemini, and Perplexity. 

          Focus on:
          1. Structured data and Schema markup
          2. FAQ-style content that answers common questions
          3. Clear, factual information that AI can cite
          4. Proper heading hierarchy
          5. Meta tags optimized for AI understanding

          Return suggestions in JSON format with the following structure:
          {
            "suggestions": [
              {
                "type": "meta_title|meta_description|heading|content|faq|schema",
                "current": "current content",
                "suggested": "improved content",
                "reason": "why this improves GEO",
                "priority": "high|medium|low",
                "implementation": ["step 1", "step 2", ...]
              }
            ]
          }`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (aiResponse) {
      const parsed = JSON.parse(aiResponse);
      return this.validateAndEnhanceSuggestions(parsed.suggestions, content, analysis);
    }

    throw new Error('No response received from OpenAI');
  }

  private async generateGeminiSuggestions(
    prompt: string,
    content: WebsiteContent,
    analysis: ContentAnalysisResult
  ): Promise<OptimizationSuggestion[]> {
    if (!this.gemini) {
      throw new Error('Google Gemini is not configured. Please set GOOGLE_API_KEY in environment variables.');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are a GEO (Generative Engine Optimization) expert. Your goal is to optimize content for AI search engines like ChatGPT, Claude, Gemini, and Perplexity.

Focus on:
1. Structured data and Schema markup
2. FAQ-style content that answers common questions
3. Clear, factual information that AI can cite
4. Proper heading hierarchy
5. Meta tags optimized for AI understanding

Return suggestions in JSON format with the following structure:
{
  "suggestions": [
    {
      "type": "meta_title|meta_description|heading|content|faq|schema",
      "current": "current content",
      "suggested": "improved content",
      "reason": "why this improves GEO",
      "priority": "high|medium|low",
      "implementation": ["step 1", "step 2", ...]
    }
  ]
}

User request: ${prompt}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const aiResponse = response.text();

    if (aiResponse) {
      try {
        // Clean the response to extract JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return this.validateAndEnhanceSuggestions(parsed.suggestions, content, analysis);
        } else {
          throw new Error('No JSON found in Gemini response');
        }
      } catch (parseError) {
        console.error('Failed to parse Gemini response as JSON:', parseError);
        throw new Error('Invalid JSON response from Gemini');
      }
    }

    throw new Error('No response received from Google Gemini');
  }

  private async handleProviderFallback(
    websiteContent: WebsiteContent,
    analysisResult: ContentAnalysisResult,
    primaryProvider: AIProvider,
    error: Error
  ): Promise<AIOptimizationResult> {
    console.log(`Primary provider ${primaryProvider} failed: ${error.message}`);
    
    // Try the other provider first
    const fallbackProvider: AIProvider = primaryProvider === 'openai' ? 'gemini' : 'openai';
    
    try {
      console.log(`Trying fallback provider: ${fallbackProvider}`);
      const suggestions = await this.generateAISuggestions(websiteContent, analysisResult, fallbackProvider);
      const geoScore = this.calculateGEOScore(analysisResult, suggestions);
      const improvements = this.calculateImprovementPotential(analysisResult, suggestions);
      const executionPlan = this.generateExecutionPlan(suggestions);

      return {
        suggestions,
        geoScore,
        improvements,
        executionPlan,
        provider: fallbackProvider
      };
    } catch (fallbackError) {
      console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
      console.log('Falling back to rule-based suggestions');
      
      // If both AI providers fail, use rule-based suggestions
      const ruleBasedResult = this.generateRuleBasedOptimizations(websiteContent, analysisResult);
      return {
        ...ruleBasedResult,
        provider: 'rule-based'
      };
    }
  }

  private buildOptimizationPrompt(content: WebsiteContent, analysis: ContentAnalysisResult): string {
    return `
Analyze this website for GEO (Generative Engine Optimization) improvements:

URL: ${content.url}
Current Title: "${content.title}" (${content.title.length} chars)
Current Meta Description: "${content.description}" (${content.description.length} chars)

Current Analysis Scores:
- Technical Health: ${analysis.technicalHealth.score}/100
- Content Quality: ${analysis.contentQuality.score}/100  
- AI Visibility: ${analysis.aiVisibility.score}/100
- Overall Score: ${analysis.overallScore}/100

Content Structure:
- H1 tags: ${content.headings.h1.length} (${content.headings.h1.join(', ')})
- H2 tags: ${content.headings.h2.length}
- Word count: ${content.wordCount}
- Images: ${content.images.length} (${content.images.filter(img => img.hasAlt).length} with alt text)
- Structured data: ${content.structuredData.length} schemas found

Key Issues Found:
${analysis.suggestions.map(s => `- ${s.title}: ${s.description}`).join('\n')}

Main Content Preview:
${content.content.substring(0, 500)}...

Please provide specific, actionable optimizations to improve this page's visibility in AI search engines. Focus on content that AI models would want to cite and reference.
    `;
  }

  private generateRuleBasedSuggestions(
    content: WebsiteContent,
    analysis: ContentAnalysisResult
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Title optimization
    if (analysis.technicalHealth.details.title.score < 90) {
      suggestions.push({
        type: 'meta_title',
        current: content.title,
        suggested: this.optimizeTitle(content.title, content),
        reason: 'Optimize title length and keyword placement for AI search engines',
        priority: 'high',
        implementation: [
          'Update the <title> tag in your HTML',
          'Ensure title is 30-60 characters long',
          'Include primary keywords near the beginning',
          'Make it descriptive and compelling'
        ]
      });
    }

    // Meta description optimization
    if (analysis.technicalHealth.details.description.score < 90) {
      suggestions.push({
        type: 'meta_description',
        current: content.description,
        suggested: this.optimizeMetaDescription(content.description, content),
        reason: 'Improve meta description to better summarize content for AI understanding',
        priority: 'high',
        implementation: [
          'Update meta description tag',
          'Keep between 120-160 characters',
          'Include relevant keywords naturally',
          'Add clear value proposition'
        ]
      });
    }

    // FAQ content suggestion
    if (analysis.aiVisibility.details.faqContent.score < 80) {
      suggestions.push({
        type: 'faq',
        current: 'No FAQ section found',
        suggested: this.generateFAQContent(content),
        reason: 'FAQ sections are highly valuable for AI search engines as they provide direct answers',
        priority: 'high',
        implementation: [
          'Add an FAQ section to your page',
          'Use question and answer format',
          'Include FAQPage structured data',
          'Answer common user questions about your topic'
        ]
      });
    }

    // Schema markup suggestion
    if (analysis.aiVisibility.details.structuredData.score < 80) {
      suggestions.push({
        type: 'schema',
        current: 'Limited structured data found',
        suggested: this.generateSchemaMarkup(content),
        reason: 'Structured data helps AI search engines understand and categorize your content',
        priority: 'medium',
        implementation: [
          'Add JSON-LD structured data to page head',
          'Include relevant Schema.org types',
          'Validate with Google Structured Data Testing Tool',
          'Update as content changes'
        ]
      });
    }

    // Heading optimization
    if (analysis.contentQuality.details.headingStructure.score < 80) {
      suggestions.push({
        type: 'heading',
        current: content.headings.h1.join(', ') || 'No clear heading structure',
        suggested: this.optimizeHeadings(content),
        reason: 'Proper heading structure helps AI understand content hierarchy and topics',
        priority: 'medium',
        implementation: [
          'Use single H1 tag for main topic',
          'Structure content with logical H2, H3 hierarchy',
          'Make headings descriptive and keyword-rich',
          'Ensure each section has clear headings'
        ]
      });
    }

    return suggestions;
  }

  private optimizeTitle(currentTitle: string, content: WebsiteContent): string {
    if (!currentTitle || currentTitle.length === 0) {
      return `${this.extractMainTopic(content)} | Professional Services`;
    }

    if (currentTitle.length < 30) {
      return `${currentTitle} | Expert Guide & Solutions`;
    }

    if (currentTitle.length > 60) {
      // Truncate and add essential keywords
      const words = currentTitle.split(' ');
      let optimized = '';
      for (const word of words) {
        if (optimized.length + word.length + 1 <= 55) {
          optimized += (optimized ? ' ' : '') + word;
        } else {
          break;
        }
      }
      return optimized;
    }

    return currentTitle;
  }

  private optimizeMetaDescription(currentDesc: string, content: WebsiteContent): string {
    if (!currentDesc || currentDesc.length < 80) {
      const topic = this.extractMainTopic(content);
      return `Comprehensive guide to ${topic.toLowerCase()}. Get expert insights, practical tips, and actionable solutions. Learn everything you need to know about ${topic.toLowerCase()}.`;
    }

    if (currentDesc.length > 160) {
      return currentDesc.substring(0, 157) + '...';
    }

    return currentDesc;
  }

  private generateFAQContent(content: WebsiteContent): string {
    const topic = this.extractMainTopic(content);
    
    return `
<div class="faq-section">
  <h2>Frequently Asked Questions</h2>
  
  <div class="faq-item">
    <h3>What is ${topic}?</h3>
    <p>[Answer based on your content explaining what ${topic} is and why it matters]</p>
  </div>
  
  <div class="faq-item">
    <h3>How does ${topic} work?</h3>
    <p>[Explain the process or mechanism of ${topic}]</p>
  </div>
  
  <div class="faq-item">
    <h3>What are the benefits of ${topic}?</h3>
    <p>[List key benefits and advantages]</p>
  </div>
  
  <div class="faq-item">
    <h3>How do I get started with ${topic}?</h3>
    <p>[Provide step-by-step guidance for beginners]</p>
  </div>
</div>`;
  }

  private generateSchemaMarkup(content: WebsiteContent): string {
    const topic = this.extractMainTopic(content);
    
    return `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${content.title}",
  "description": "${content.description}",
  "url": "${content.url}",
  "datePublished": "${new Date().toISOString()}",
  "dateModified": "${new Date().toISOString()}",
  "author": {
    "@type": "Organization",
    "name": "${this.extractOrganizationName(content)}"
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "${content.url}"
  }
}
</script>`;
  }

  private optimizeHeadings(content: WebsiteContent): string {
    const topic = this.extractMainTopic(content);
    
    return `
Suggested heading structure:
<h1>${topic} - Complete Guide</h1>
<h2>What is ${topic}?</h2>
<h2>How ${topic} Works</h2>
<h2>Benefits of ${topic}</h2>
<h3>Key Advantages</h3>
<h3>Use Cases</h3>
<h2>Getting Started with ${topic}</h2>
<h3>Step-by-Step Process</h3>
<h3>Best Practices</h3>
<h2>Frequently Asked Questions</h2>`;
  }

  private extractMainTopic(content: WebsiteContent): string {
    // Extract main topic from title or first H1
    if (content.title) {
      return content.title.split('|')[0].split('-')[0].trim();
    }
    
    if (content.headings.h1.length > 0) {
      return content.headings.h1[0];
    }
    
    return 'Our Service';
  }

  private extractOrganizationName(content: WebsiteContent): string {
    const url = new URL(content.url);
    return url.hostname.replace('www.', '').split('.')[0];
  }

  private validateAndEnhanceSuggestions(
    suggestions: any[],
    content: WebsiteContent,
    analysis: ContentAnalysisResult
  ): OptimizationSuggestion[] {
    return suggestions.filter(s => s.type && s.suggested && s.reason).map(suggestion => ({
      ...suggestion,
      implementation: suggestion.implementation || [
        'Update the relevant content section',
        'Test changes in staging environment',
        'Monitor performance after implementation'
      ]
    }));
  }

  private generateRuleBasedOptimizations(
    content: WebsiteContent,
    analysis: ContentAnalysisResult
  ): AIOptimizationResult {
    const suggestions = this.generateRuleBasedSuggestions(content, analysis);
    const geoScore = this.calculateGEOScore(analysis, suggestions);
    const improvements = this.calculateImprovementPotential(analysis, suggestions);
    const executionPlan = this.generateExecutionPlan(suggestions);

    return {
      suggestions,
      geoScore,
      improvements,
      executionPlan,
      provider: 'rule-based'
    };
  }

  private calculateGEOScore(analysis: ContentAnalysisResult, suggestions: OptimizationSuggestion[]): number {
    // GEO score focuses on AI-specific factors
    const structuredDataScore = analysis.aiVisibility.details.structuredData.score;
    const faqScore = analysis.aiVisibility.details.faqContent.score;
    const technicalScore = analysis.technicalHealth.score;
    const contentScore = analysis.contentQuality.score;

    // Weight AI visibility factors more heavily for GEO
    return Math.round(
      (structuredDataScore * 0.3) +
      (faqScore * 0.25) +
      (technicalScore * 0.25) +
      (contentScore * 0.2)
    );
  }

  private calculateImprovementPotential(
    analysis: ContentAnalysisResult,
    suggestions: OptimizationSuggestion[]
  ): { current: number; potential: number } {
    const current = analysis.overallScore;
    
    // Calculate potential improvement based on suggestions
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const mediumPriority = suggestions.filter(s => s.priority === 'medium').length;
    const lowPriority = suggestions.filter(s => s.priority === 'low').length;

    const potentialGain = (highPriority * 10) + (mediumPriority * 5) + (lowPriority * 2);
    const potential = Math.min(95, current + potentialGain);

    return { current, potential };
  }

  private generateExecutionPlan(suggestions: OptimizationSuggestion[]): Array<{
    phase: string;
    duration: string;
    actions: string[];
    expectedResults: string;
  }> {
    const highPriority = suggestions.filter(s => s.priority === 'high');
    const mediumPriority = suggestions.filter(s => s.priority === 'medium');
    const lowPriority = suggestions.filter(s => s.priority === 'low');

    const plan = [];

    if (highPriority.length > 0) {
      plan.push({
        phase: 'Phase 1: Critical Optimizations',
        duration: '1-2 weeks',
        actions: highPriority.map(s => s.type === 'meta_title' ? 'Optimize page title' : 
                                     s.type === 'meta_description' ? 'Improve meta description' :
                                     s.type === 'faq' ? 'Add FAQ section' :
                                     s.type === 'schema' ? 'Implement structured data' : 
                                     'Technical improvements'),
        expectedResults: 'Improved AI discoverability and search visibility'
      });
    }

    if (mediumPriority.length > 0) {
      plan.push({
        phase: 'Phase 2: Content Enhancement',
        duration: '2-3 weeks',
        actions: mediumPriority.map(s => s.type === 'content' ? 'Enhance content depth' :
                                        s.type === 'heading' ? 'Improve heading structure' :
                                        'Content quality improvements'),
        expectedResults: 'Better content organization and user experience'
      });
    }

    if (lowPriority.length > 0) {
      plan.push({
        phase: 'Phase 3: Fine-tuning',
        duration: '1-2 weeks',
        actions: lowPriority.map(s => 'Polish and optimize details'),
        expectedResults: 'Maximum optimization for AI search engines'
      });
    }

    return plan;
  }
}