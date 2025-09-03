import axios from 'axios';
import cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import { URL } from 'url';

export interface CrawlResult {
  url: string;
  title?: string;
  metaDescription?: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  content: string;
  wordCount: number;
  images: {
    src: string;
    alt?: string;
    title?: string;
  }[];
  links: {
    href: string;
    text: string;
    type: 'internal' | 'external';
  }[];
  schema: any[];
  robotsTxt?: {
    content: string;
    allowsAIBots: boolean;
    blocked: string[];
    allowed: string[];
  };
  performance?: {
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  };
  technical: {
    hasSchemaMarkup: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    responsiveDesign: boolean;
    httpsEnabled: boolean;
  };
}

export class CrawlerService {
  private browser?: Browser;
  private readonly userAgent = process.env.CRAWLER_USER_AGENT || 'GEO-Platform-Bot/1.0';
  private readonly timeout = parseInt(process.env.CRAWLER_TIMEOUT || '30000');
  private readonly rateLimit = parseInt(process.env.CRAWLER_RATE_LIMIT || '10');

  constructor() {
    this.initializeBrowser();
  }

  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    } catch (error) {
      console.error('Failed to initialize browser:', error);
    }
  }

  async crawlWebsite(websiteUrl: string, scanType: 'quick' | 'standard' | 'deep' = 'standard'): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    
    try {
      const baseUrl = new URL(websiteUrl);
      
      // First, get robots.txt
      const robotsTxt = await this.fetchRobotsTxt(baseUrl.origin);
      
      // Crawl homepage
      const homepageResult = await this.crawlPage(websiteUrl, robotsTxt);
      results.push(homepageResult);

      // For deeper scans, crawl additional pages
      if (scanType === 'standard' || scanType === 'deep') {
        const additionalPages = await this.discoverPages(websiteUrl, scanType === 'deep' ? 50 : 10);
        
        for (const pageUrl of additionalPages) {
          try {
            const pageResult = await this.crawlPage(pageUrl, robotsTxt);
            results.push(pageResult);
            
            // Rate limiting
            await this.delay(1000 / this.rateLimit);
          } catch (error) {
            console.error(`Error crawling page ${pageUrl}:`, error);
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Website crawling failed:', error);
      throw new Error(`Failed to crawl website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async crawlPage(url: string, robotsTxt?: any): Promise<CrawlResult> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const page = await this.browser!.newPage();
    
    try {
      // Set user agent and viewport
      await page.setUserAgent(this.userAgent);
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to page with performance metrics
      const startTime = Date.now();
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeout
      });

      if (!response || !response.ok()) {
        throw new Error(`HTTP ${response?.status()}: Failed to load page`);
      }

      // Get performance metrics
      const performanceMetrics = await page.evaluate(() => {
        // Simplified performance metrics for compatibility
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        
        return {
          loadTime: Date.now() - performance.timeOrigin || 0, // Fallback timing
          domContentLoaded: Date.now() - performance.timeOrigin || 0, // Fallback timing
          firstContentfulPaint: fcpEntry?.startTime || 0
        };
      });

      // Get page content
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract basic information
      const title = $('title').text().trim();
      const metaDescription = $('meta[name="description"]').attr('content') || '';

      // Extract headings
      const headings = {
        h1: $('h1').map((_, el) => $(el).text().trim()).get(),
        h2: $('h2').map((_, el) => $(el).text().trim()).get(),
        h3: $('h3').map((_, el) => $(el).text().trim()).get()
      };

      // Extract text content (remove scripts, styles, etc.)
      $('script, style, nav, header, footer').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      const wordCount = textContent.split(/\s+/).length;

      // Extract images
      const images = $('img').map((_, el) => ({
        src: $(el).attr('src') || '',
        alt: $(el).attr('alt') || '',
        title: $(el).attr('title') || ''
      })).get();

      // Extract links
      const baseUrl = new URL(url);
      const links = $('a[href]').map((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        
        try {
          const linkUrl = new URL(href, url);
          return {
            href: linkUrl.href,
            text,
            type: (linkUrl.hostname === baseUrl.hostname ? 'internal' : 'external') as 'internal' | 'external'
          };
        } catch {
          return { href, text, type: 'internal' as 'internal' | 'external' };
        }
      }).get();

      // Extract schema markup
      const schema = $('script[type="application/ld+json"]').map((_, el) => {
        try {
          return JSON.parse($(el).text());
        } catch {
          return null;
        }
      }).get().filter(Boolean);

      // Technical analysis
      const technical = {
        hasSchemaMarkup: schema.length > 0,
        hasOpenGraph: $('meta[property^="og:"]').length > 0,
        hasTwitterCard: $('meta[name^="twitter:"]').length > 0,
        responsiveDesign: $('meta[name="viewport"]').length > 0,
        httpsEnabled: url.startsWith('https')
      };

      return {
        url,
        title,
        metaDescription,
        headings,
        content: textContent,
        wordCount,
        images,
        links,
        schema,
        robotsTxt,
        performance: performanceMetrics,
        technical
      };

    } finally {
      await page.close();
    }
  }

  private async fetchRobotsTxt(origin: string): Promise<any> {
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const response = await axios.get(robotsUrl, {
        timeout: this.timeout,
        headers: { 'User-Agent': this.userAgent }
      });

      const content = response.data;
      const lines = content.split('\n').map((line: string) => line.trim());
      
      const allowed: string[] = [];
      const blocked: string[] = [];
      let allowsAIBots = false;

      // Parse robots.txt
      lines.forEach((line: string) => {
        if (line.toLowerCase().includes('user-agent:')) {
          const userAgent = line.split(':')[1]?.trim().toLowerCase() || '';
          if (['gptbot', 'chatgpt-user', 'perplexitybot', 'claudebot', '*'].some(bot => userAgent.includes(bot))) {
            allowsAIBots = true;
          }
        } else if (line.toLowerCase().startsWith('allow:')) {
          allowed.push(line.split(':')[1]?.trim() || '');
        } else if (line.toLowerCase().startsWith('disallow:')) {
          blocked.push(line.split(':')[1]?.trim() || '');
        }
      });

      return {
        content,
        allowsAIBots,
        blocked,
        allowed
      };
    } catch (error) {
      return {
        content: '',
        allowsAIBots: false,
        blocked: [],
        allowed: []
      };
    }
  }

  private async discoverPages(baseUrl: string, maxPages: number): Promise<string[]> {
    const discoveredPages: Set<string> = new Set();
    const toVisit: string[] = [baseUrl];
    const visited: Set<string> = new Set();
    const baseHost = new URL(baseUrl).hostname;

    while (toVisit.length > 0 && discoveredPages.size < maxPages) {
      const currentUrl = toVisit.shift()!;
      
      if (visited.has(currentUrl)) continue;
      visited.add(currentUrl);

      try {
        const response = await axios.get(currentUrl, {
          timeout: this.timeout,
          headers: { 'User-Agent': this.userAgent }
        });

        const $ = cheerio.load(response.data);
        
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (!href) return;

          try {
            const fullUrl = new URL(href, currentUrl);
            
            // Only include pages from the same domain
            if (fullUrl.hostname === baseHost && 
                !visited.has(fullUrl.href) && 
                discoveredPages.size < maxPages) {
              discoveredPages.add(fullUrl.href);
              toVisit.push(fullUrl.href);
            }
          } catch (error) {
            // Invalid URL, skip
          }
        });
      } catch (error) {
        console.error(`Error discovering pages from ${currentUrl}:`, error);
      }
    }

    return Array.from(discoveredPages);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }
}