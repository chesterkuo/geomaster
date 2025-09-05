import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface WebsiteContent {
  url: string;
  title: string;
  description: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
  };
  content: string;
  wordCount: number;
  images: Array<{
    src: string;
    alt: string;
    hasAlt: boolean;
  }>;
  links: Array<{
    href: string;
    text: string;
    isInternal: boolean;
  }>;
  metaTags: {
    viewport: string | null;
    robots: string | null;
    canonical: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
  };
  structuredData: any[];
  robotsTxtExists: boolean;
  isHttps: boolean;
  responseTime: number;
}

export interface ContentAnalysisResult {
  technicalHealth: {
    score: number;
    details: {
      robotsTxt: { score: number; status: string; message: string };
      https: { score: number; status: string; message: string };
      viewport: { score: number; status: string; message: string };
      title: { score: number; status: string; message: string; length: number };
      description: { score: number; status: string; message: string; length: number };
    };
  };
  contentQuality: {
    score: number;
    details: {
      headingStructure: { score: number; status: string; message: string };
      contentLength: { score: number; status: string; message: string; wordCount: number };
      imageOptimization: { score: number; status: string; message: string; coverage: number };
    };
  };
  aiVisibility: {
    score: number;
    details: {
      structuredData: { score: number; status: string; message: string; count: number };
      faqContent: { score: number; status: string; message: string };
      readability: { score: number; status: string; message: string };
    };
  };
  overallScore: number;
  suggestions: Array<{
    type: 'technical' | 'content' | 'ai_visibility';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    implementation: string[];
  }>;
}

export class ContentAnalyzerService {
  private readonly timeout = 10000;
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'GEO Platform Bot/1.0 (+https://geoplatform.com/bot)'
  ];

  async scrapeWebsite(url: string): Promise<WebsiteContent> {
    const startTime = Date.now();
    
    try {
      // Validate and normalize URL
      const parsedUrl = new URL(url);
      const normalizedUrl = parsedUrl.href;

      // Try scraping with different user agents and retry logic
      const response = await this.scrapeWithRetry(normalizedUrl);
      
      const responseTime = Date.now() - startTime;
      const html = response.data;
      const $ = cheerio.load(html);

      // Check robots.txt
      const robotsTxtExists = await this.checkRobotsTxt(normalizedUrl);

      // Extract content
      const content = this.extractContent($, normalizedUrl, robotsTxtExists, responseTime);
      
      return content;

    } catch (error: any) {
      console.error('Web scraping failed:', error.message);
      
      // If scraping fails due to anti-bot protection, return fallback content
      if (error.response?.status === 403 || error.response?.status === 429 || error.message.includes('403') || error.message.includes('429')) {
        console.log(`Anti-bot protection detected for ${url}, returning fallback content`);
        return this.createFallbackContent(url);
      }
      
      throw new Error(`Failed to scrape website: ${error.message}`);
    }
  }

  private async scrapeWithRetry(url: string, maxRetries: number = 3): Promise<any> {
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const userAgent = this.userAgents[attempt % this.userAgents.length];
        
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Ch-Ua': '"Google Chrome";v="120", "Chromium";v="120", "Not_A Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'keep-alive'
          },
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
        
        return response;
      } catch (error: any) {
        lastError = error;
        console.log(`Scraping attempt ${attempt + 1} failed for ${url}:`, error.message);
        
        // If it's a 403/429, try with different user agent
        if (error.response?.status === 403 || error.response?.status === 429) {
          if (attempt < maxRetries - 1) {
            // Wait before retry with exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        // For other errors, don't retry
        if (error.response?.status !== 403 && error.response?.status !== 429) {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  private createFallbackContent(url: string): WebsiteContent {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    
    return {
      url,
      title: `Analysis unavailable for ${domain}`,
      description: 'This website blocks automated analysis. Manual review recommended.',
      headings: {
        h1: [`Content blocked for ${domain}`],
        h2: [],
        h3: [],
        h4: [],
        h5: [],
        h6: []
      },
      content: `This website (${domain}) has anti-bot protection that prevents automated analysis. The site may be using services like Cloudflare, Akamai, or other security measures to block scraping attempts. For a complete analysis, consider: 1) Manual review of the website, 2) Using browser developer tools, 3) Contacting the site owner for access.`,
      wordCount: 50,
      images: [],
      links: [],
      metaTags: {
        viewport: null,
        robots: null,
        canonical: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null
      },
      structuredData: [],
      robotsTxtExists: false,
      isHttps: parsedUrl.protocol === 'https:',
      responseTime: 0
    };
  }

  private extractContent($: cheerio.CheerioAPI, url: string, robotsTxtExists: boolean, responseTime: number): WebsiteContent {
    const parsedUrl = new URL(url);
    
    // Extract basic page info
    const title = $('title').first().text().trim() || '';
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract headings
    const headings = {
      h1: this.extractHeadings($, 'h1'),
      h2: this.extractHeadings($, 'h2'),
      h3: this.extractHeadings($, 'h3'),
      h4: this.extractHeadings($, 'h4'),
      h5: this.extractHeadings($, 'h5'),
      h6: this.extractHeadings($, 'h6')
    };

    // Extract main content
    const mainContent = this.extractMainContent($);
    const wordCount = this.countWords(mainContent);

    // Extract images
    const images = this.extractImages($, url);

    // Extract links
    const links = this.extractLinks($, url);

    // Extract meta tags
    const metaTags = {
      viewport: $('meta[name="viewport"]').attr('content') || null,
      robots: $('meta[name="robots"]').attr('content') || null,
      canonical: $('link[rel="canonical"]').attr('href') || null,
      ogTitle: $('meta[property="og:title"]').attr('content') || null,
      ogDescription: $('meta[property="og:description"]').attr('content') || null,
      ogImage: $('meta[property="og:image"]').attr('content') || null
    };

    // Extract structured data
    const structuredData = this.extractStructuredData($);

    return {
      url,
      title,
      description,
      headings,
      content: mainContent,
      wordCount,
      images,
      links,
      metaTags,
      structuredData,
      robotsTxtExists,
      isHttps: parsedUrl.protocol === 'https:',
      responseTime
    };
  }

  private extractHeadings($: cheerio.CheerioAPI, tag: string): string[] {
    const headings: string[] = [];
    $(tag).each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        headings.push(text);
      }
    });
    return headings;
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove script, style, and other non-content elements
    $('script, style, nav, header, footer, aside').remove();
    
    // Try to find main content area
    let content = '';
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      'article',
      '.post-content',
      '.entry-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body content if no main content found
    if (!content) {
      content = $('body').text().trim();
    }

    return this.cleanText(content);
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): Array<{ src: string; alt: string; hasAlt: boolean }> {
    const images: Array<{ src: string; alt: string; hasAlt: boolean }> = [];
    
    $('img').each((_, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt') || '';
      
      if (src) {
        images.push({
          src: this.resolveUrl(src, baseUrl),
          alt: alt.trim(),
          hasAlt: Boolean(alt.trim())
        });
      }
    });

    return images;
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): Array<{ href: string; text: string; isInternal: boolean }> {
    const links: Array<{ href: string; text: string; isInternal: boolean }> = [];
    const baseDomain = new URL(baseUrl).hostname;
    
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text) {
        const resolvedUrl = this.resolveUrl(href, baseUrl);
        let isInternal = false;
        
        try {
          const linkUrl = new URL(resolvedUrl);
          isInternal = linkUrl.hostname === baseDomain;
        } catch {
          // Invalid URL
        }
        
        links.push({
          href: resolvedUrl,
          text,
          isInternal
        });
      }
    });

    return links;
  }

  private extractStructuredData($: cheerio.CheerioAPI): any[] {
    const structuredData: any[] = [];
    
    // Extract JSON-LD
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const jsonData = $(elem).html();
        if (jsonData) {
          const data = JSON.parse(jsonData.trim());
          structuredData.push({
            type: 'json-ld',
            data
          });
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    });

    // Extract Microdata
    $('[itemscope]').each((_, elem) => {
      const itemType = $(elem).attr('itemtype');
      const properties: any = {};
      
      $(elem).find('[itemprop]').each((_, propElem) => {
        const propName = $(propElem).attr('itemprop');
        const propValue = $(propElem).attr('content') || $(propElem).text().trim();
        
        if (propName && propValue) {
          properties[propName] = propValue;
        }
      });

      if (Object.keys(properties).length > 0) {
        structuredData.push({
          type: 'microdata',
          itemType,
          properties
        });
      }
    });

    return structuredData;
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const baseUrl = new URL(url);
      const robotsUrl = `${baseUrl.protocol}//${baseUrl.host}/robots.txt`;
      
      await axios.get(robotsUrl, {
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GEO-Bot/1.0)'
        },
        validateStatus: (status) => status === 200
      });
      
      return true;
    } catch {
      return false;
    }
  }

  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  async analyzeContent(content: WebsiteContent): Promise<ContentAnalysisResult> {
    // Technical Health Analysis (40% weight)
    const technicalHealth = this.analyzeTechnicalHealth(content);
    
    // Content Quality Analysis (30% weight) 
    const contentQuality = this.analyzeContentQuality(content);
    
    // AI Visibility Analysis (30% weight)
    const aiVisibility = this.analyzeAIVisibility(content);
    
    // Calculate overall score
    const overallScore = Math.round(
      (technicalHealth.score * 0.4) +
      (contentQuality.score * 0.3) +
      (aiVisibility.score * 0.3)
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(technicalHealth, contentQuality, aiVisibility, content);

    return {
      technicalHealth,
      contentQuality,
      aiVisibility,
      overallScore,
      suggestions
    };
  }

  private analyzeTechnicalHealth(content: WebsiteContent) {
    const details = {
      robotsTxt: this.analyzeRobotsTxt(content),
      https: this.analyzeHttps(content),
      viewport: this.analyzeViewport(content),
      title: this.analyzeTitle(content),
      description: this.analyzeDescription(content)
    };

    // Calculate average score
    const scores = Object.values(details).map(d => d.score);
    const score = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    return { score, details };
  }

  private analyzeContentQuality(content: WebsiteContent) {
    const details = {
      headingStructure: this.analyzeHeadingStructure(content),
      contentLength: this.analyzeContentLength(content),
      imageOptimization: this.analyzeImageOptimization(content)
    };

    const scores = Object.values(details).map(d => d.score);
    const score = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    return { score, details };
  }

  private analyzeAIVisibility(content: WebsiteContent) {
    const details = {
      structuredData: this.analyzeStructuredData(content),
      faqContent: this.analyzeFAQContent(content),
      readability: this.analyzeReadability(content)
    };

    const scores = Object.values(details).map(d => d.score);
    const score = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);

    return { score, details };
  }

  // Technical Health Analysis Methods
  private analyzeRobotsTxt(content: WebsiteContent) {
    if (content.robotsTxtExists) {
      return {
        score: 100,
        status: 'good' as const,
        message: 'Robots.txt exists and accessible'
      };
    } else {
      return {
        score: 20,
        status: 'critical' as const,
        message: 'Robots.txt not found - may limit AI crawler access'
      };
    }
  }

  private analyzeHttps(content: WebsiteContent) {
    if (content.isHttps) {
      return {
        score: 100,
        status: 'good' as const,
        message: 'Site uses secure HTTPS connection'
      };
    } else {
      return {
        score: 20,
        status: 'critical' as const,
        message: 'Site uses insecure HTTP - upgrade to HTTPS required'
      };
    }
  }

  private analyzeViewport(content: WebsiteContent) {
    if (content.metaTags.viewport) {
      return {
        score: 100,
        status: 'good' as const,
        message: 'Viewport meta tag configured for mobile optimization'
      };
    } else {
      return {
        score: 50,
        status: 'warning' as const,
        message: 'Missing viewport meta tag - affects mobile experience'
      };
    }
  }

  private analyzeTitle(content: WebsiteContent) {
    const length = content.title.length;
    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (length >= 30 && length <= 60) {
      score = 100;
      status = 'good';
      message = 'Title length is optimal for search engines';
    } else if ((length >= 15 && length < 30) || (length > 60 && length <= 80)) {
      score = 80;
      status = 'warning';
      message = 'Title length could be improved';
    } else {
      score = 50;
      status = 'critical';
      message = 'Title length is not optimal';
    }

    return { score, status, message, length };
  }

  private analyzeDescription(content: WebsiteContent) {
    const length = content.description.length;
    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (length >= 120 && length <= 160) {
      score = 100;
      status = 'good';
      message = 'Meta description length is optimal';
    } else if ((length >= 80 && length < 120) || (length > 160 && length <= 200)) {
      score = 80;
      status = 'warning';
      message = 'Meta description length could be improved';
    } else {
      score = 50;
      status = 'critical';
      message = 'Meta description length is not optimal';
    }

    return { score, status, message, length };
  }

  // Content Quality Analysis Methods
  private analyzeHeadingStructure(content: WebsiteContent) {
    const { h1, h2, h3, h4, h5, h6 } = content.headings;
    
    // Check heading hierarchy
    const hasH1 = h1.length > 0;
    const hasMultipleH1 = h1.length > 1;
    const hasLogicalStructure = this.checkHeadingLogic(content.headings);

    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (hasH1 && !hasMultipleH1 && hasLogicalStructure) {
      score = 100;
      status = 'good';
      message = 'Heading structure is well-organized and logical';
    } else if (hasH1 && hasLogicalStructure) {
      score = 80;
      status = 'warning';
      message = 'Heading structure is mostly good but could be improved';
    } else {
      score = 50;
      status = 'critical';
      message = 'Heading structure needs improvement for better organization';
    }

    return { score, status, message };
  }

  private checkHeadingLogic(headings: WebsiteContent['headings']): boolean {
    // Simple logic: should have H1, and if H3 exists, H2 should exist
    const hasH1 = headings.h1.length > 0;
    const hasH2 = headings.h2.length > 0;
    const hasH3 = headings.h3.length > 0;
    
    if (!hasH1) return false;
    if (hasH3 && !hasH2) return false;
    
    return true;
  }

  private analyzeContentLength(content: WebsiteContent) {
    const wordCount = content.wordCount;
    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (wordCount > 1500) {
      score = 100;
      status = 'good';
      message = 'Content length is comprehensive and detailed';
    } else if (wordCount >= 800) {
      score = 80;
      status = 'warning';
      message = 'Content length is adequate but could be more detailed';
    } else {
      score = 70;
      status = 'warning';
      message = 'Content is relatively short - consider adding more detail';
    }

    return { score, status, message, wordCount };
  }

  private analyzeImageOptimization(content: WebsiteContent) {
    const totalImages = content.images.length;
    const imagesWithAlt = content.images.filter(img => img.hasAlt).length;
    const coverage = totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 100;

    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (coverage === 100) {
      score = 100;
      status = 'good';
      message = 'All images have alt text for accessibility';
    } else if (coverage >= 80) {
      score = 80;
      status = 'warning';
      message = 'Most images have alt text but some are missing';
    } else {
      score = 60;
      status = 'critical';
      message = 'Many images missing alt text - impacts accessibility';
    }

    return { score, status, message, coverage: Math.round(coverage) };
  }

  // AI Visibility Analysis Methods
  private analyzeStructuredData(content: WebsiteContent) {
    const count = content.structuredData.length;
    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (count >= 3) {
      score = 100;
      status = 'good';
      message = 'Rich structured data present for AI understanding';
    } else if (count >= 1) {
      score = 70;
      status = 'warning';
      message = 'Some structured data present but could be expanded';
    } else {
      score = 20;
      status = 'critical';
      message = 'No structured data found - limits AI comprehension';
    }

    return { score, status, message, count };
  }

  private analyzeFAQContent(content: WebsiteContent) {
    const faqKeywords = ['faq', 'frequently asked', 'questions', 'q&a', 'question', 'answer'];
    const contentLower = content.content.toLowerCase();
    const titleLower = content.title.toLowerCase();
    
    const hasFAQContent = faqKeywords.some(keyword => 
      contentLower.includes(keyword) || titleLower.includes(keyword)
    );

    // Check for FAQ structured data
    const hasFAQSchema = content.structuredData.some(data => 
      JSON.stringify(data).toLowerCase().includes('faqpage') ||
      JSON.stringify(data).toLowerCase().includes('question')
    );

    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    if (hasFAQContent && hasFAQSchema) {
      score = 100;
      status = 'good';
      message = 'FAQ content with proper structured data found';
    } else if (hasFAQContent || hasFAQSchema) {
      score = 70;
      status = 'warning';
      message = 'Some FAQ elements present but could be enhanced';
    } else {
      score = 50;
      status = 'warning';
      message = 'No FAQ content found - consider adding Q&A section';
    }

    return { score, status, message };
  }

  private analyzeReadability(content: WebsiteContent) {
    // Simple readability analysis
    const sentences = content.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.wordCount;
    const avgWordsPerSentence = sentences.length > 0 ? words / sentences.length : 0;
    
    // Check for good structure indicators
    const hasGoodStructure = content.headings.h1.length === 1 && 
                           content.headings.h2.length > 0;
    const hasReasonableLength = words >= 300;
    const hasGoodSentenceLength = avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25;

    let score: number;
    let status: 'good' | 'warning' | 'critical';
    let message: string;

    const goodFactors = [hasGoodStructure, hasReasonableLength, hasGoodSentenceLength].filter(Boolean).length;

    if (goodFactors >= 3) {
      score = 100;
      status = 'good';
      message = 'Content structure is clear and well-organized';
    } else if (goodFactors >= 2) {
      score = 70;
      status = 'warning';
      message = 'Content structure is adequate but could be improved';
    } else {
      score = 50;
      status = 'warning';
      message = 'Content structure could be clearer for better readability';
    }

    return { score, status, message };
  }

  private generateSuggestions(
    technicalHealth: any,
    contentQuality: any,
    aiVisibility: any,
    content: WebsiteContent
  ): Array<{
    type: 'technical' | 'content' | 'ai_visibility';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    implementation: string[];
  }> {
    const suggestions: any[] = [];

    // Technical suggestions
    if (technicalHealth.details.robotsTxt.score < 100) {
      suggestions.push({
        type: 'technical',
        priority: 'high',
        title: 'Create or Update Robots.txt',
        description: 'Add a robots.txt file to allow AI crawlers access to your content',
        implementation: [
          'Create /robots.txt file in your website root',
          'Add "User-agent: GPTBot" and "Allow: /" entries',
          'Include "User-agent: ChatGPT-User" and "Allow: /" entries',
          'Add "User-agent: CCBot" and "Allow: /" for Claude access'
        ]
      });
    }

    if (technicalHealth.details.https.score < 100) {
      suggestions.push({
        type: 'technical',
        priority: 'high',
        title: 'Upgrade to HTTPS',
        description: 'Secure your website with SSL certificate for better trustworthiness',
        implementation: [
          'Obtain SSL certificate from your hosting provider',
          'Configure server to use HTTPS',
          'Update all internal links to use HTTPS',
          'Set up HTTP to HTTPS redirects'
        ]
      });
    }

    if (technicalHealth.details.title.score < 80) {
      suggestions.push({
        type: 'technical',
        priority: 'medium',
        title: 'Optimize Page Title',
        description: `Current title length (${technicalHealth.details.title.length} chars) should be 30-60 characters`,
        implementation: [
          'Rewrite title to be 30-60 characters long',
          'Include primary keywords near the beginning',
          'Make it descriptive and compelling',
          'Avoid keyword stuffing'
        ]
      });
    }

    if (technicalHealth.details.description.score < 80) {
      suggestions.push({
        type: 'technical',
        priority: 'medium',
        title: 'Improve Meta Description',
        description: `Meta description length (${technicalHealth.details.description.length} chars) should be 120-160 characters`,
        implementation: [
          'Write compelling 120-160 character description',
          'Include relevant keywords naturally',
          'Add a clear call-to-action',
          'Make it unique and descriptive'
        ]
      });
    }

    // Content suggestions
    if (contentQuality.details.headingStructure.score < 80) {
      suggestions.push({
        type: 'content',
        priority: 'medium',
        title: 'Improve Heading Structure',
        description: 'Organize content with proper heading hierarchy for better readability',
        implementation: [
          'Use only one H1 tag per page',
          'Follow logical heading order (H1 → H2 → H3)',
          'Make headings descriptive and keyword-rich',
          'Ensure each section has a clear heading'
        ]
      });
    }

    if (contentQuality.details.contentLength.score < 80) {
      suggestions.push({
        type: 'content',
        priority: 'medium',
        title: 'Expand Content Depth',
        description: `Current content (${contentQuality.details.contentLength.wordCount} words) could be more comprehensive`,
        implementation: [
          'Add more detailed explanations',
          'Include relevant examples and use cases',
          'Answer common questions about the topic',
          'Add supporting data and statistics'
        ]
      });
    }

    if (contentQuality.details.imageOptimization.score < 80) {
      suggestions.push({
        type: 'content',
        priority: 'low',
        title: 'Add Alt Text to Images',
        description: `${100 - contentQuality.details.imageOptimization.coverage}% of images missing alt text`,
        implementation: [
          'Add descriptive alt text to all images',
          'Keep alt text under 125 characters',
          'Describe the image content and context',
          'Include relevant keywords naturally'
        ]
      });
    }

    // AI Visibility suggestions
    if (aiVisibility.details.structuredData.score < 80) {
      suggestions.push({
        type: 'ai_visibility',
        priority: 'high',
        title: 'Add Structured Data Markup',
        description: 'Implement Schema.org markup to help AI understand your content',
        implementation: [
          'Add JSON-LD structured data to page <head>',
          'Include Organization or Person schema',
          'Add Product, Article, or Service schema as relevant',
          'Use Google\'s Structured Data Testing Tool to validate'
        ]
      });
    }

    if (aiVisibility.details.faqContent.score < 80) {
      suggestions.push({
        type: 'ai_visibility',
        priority: 'medium',
        title: 'Create FAQ Section',
        description: 'Add frequently asked questions to improve AI discoverability',
        implementation: [
          'Research common questions in your industry',
          'Create a dedicated FAQ section',
          'Use question-and-answer format',
          'Add FAQPage structured data markup'
        ]
      });
    }

    return suggestions;
  }
}