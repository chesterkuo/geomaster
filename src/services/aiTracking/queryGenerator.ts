export interface QueryGenerationParams {
  website: string;
  websiteName: string;
  keywords: string[];
  competitors: string[];
  trackingSettings: any;
}

export interface GeneratedQuery {
  query: string;
  category: 'brand' | 'competitive' | 'feature' | 'comparison';
  template: string;
  context: string;
  priority: number;
}

export class QueryGenerator {
  private brandQueries = [
    "What do you know about {website}?",
    "Tell me about {websiteName}",
    "Is {websiteName} a good {category} tool?",
    "How does {websiteName} work?",
    "What are the features of {website}?",
    "Can you recommend {websiteName}?",
    "What are users saying about {websiteName}?",
    "Is {websiteName} reliable and trustworthy?"
  ];

  private competitiveQueries = [
    "What are the best {category} tools?",
    "Compare {category} platforms",
    "Top {category} solutions in 2024",
    "Best alternatives to {competitor}",
    "Which is better: {websiteName} or {competitor}?",
    "List of popular {category} services",
    "Most recommended {category} tools",
    "Enterprise {category} solutions comparison"
  ];

  private featureQueries = [
    "Tools for {keyword}",
    "How to {keyword}",
    "Best {keyword} solutions",
    "Software for {keyword}",
    "{keyword} platform comparison",
    "Free {keyword} tools",
    "Enterprise {keyword} solutions",
    "{keyword} automation tools"
  ];

  private comparisonQueries = [
    "{websiteName} vs {competitor}",
    "Compare {websiteName} and {competitor}",
    "Difference between {websiteName} and {competitor}",
    "Which is better {websiteName} or {competitor}?",
    "{websiteName} {competitor} comparison",
    "Pros and cons of {websiteName} vs {competitor}",
    "Should I choose {websiteName} or {competitor}?",
    "{websiteName} alternative to {competitor}"
  ];

  generateQueries(params: QueryGenerationParams): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    // Determine category based on website/keywords
    const category = this.inferCategory(params.websiteName, params.keywords);
    
    // Generate brand queries
    queries.push(...this.generateBrandQueries(params, category));
    
    // Generate competitive queries
    queries.push(...this.generateCompetitiveQueries(params, category));
    
    // Generate feature queries
    queries.push(...this.generateFeatureQueries(params));
    
    // Generate comparison queries
    queries.push(...this.generateComparisonQueries(params));
    
    // Sort by priority and limit
    return queries
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.getMaxQueries(params.trackingSettings));
  }

  private generateBrandQueries(params: QueryGenerationParams, category: string): GeneratedQuery[] {
    return this.brandQueries.map(template => ({
      query: this.replaceVariables(template, {
        website: params.website,
        websiteName: params.websiteName,
        category
      }),
      category: 'brand' as const,
      template,
      context: `Brand awareness query for ${params.websiteName}`,
      priority: 10
    }));
  }

  private generateCompetitiveQueries(params: QueryGenerationParams, category: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    this.competitiveQueries.forEach(template => {
      // Basic competitive query
      queries.push({
        query: this.replaceVariables(template, {
          category,
          websiteName: params.websiteName,
          competitor: params.competitors[0] || 'competitor'
        }),
        category: 'competitive',
        template,
        context: `Competitive analysis query in ${category} space`,
        priority: 8
      });
      
      // Queries with specific competitors
      params.competitors.slice(0, 2).forEach(competitor => {
        queries.push({
          query: this.replaceVariables(template, {
            category,
            websiteName: params.websiteName,
            competitor: this.extractDomainName(competitor)
          }),
          category: 'competitive',
          template,
          context: `Competitive query against ${competitor}`,
          priority: 9
        });
      });
    });
    
    return queries;
  }

  private generateFeatureQueries(params: QueryGenerationParams): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    params.keywords.slice(0, 3).forEach(keyword => {
      this.featureQueries.forEach(template => {
        queries.push({
          query: this.replaceVariables(template, { keyword }),
          category: 'feature',
          template,
          context: `Feature discovery query for ${keyword}`,
          priority: 7
        });
      });
    });
    
    return queries;
  }

  private generateComparisonQueries(params: QueryGenerationParams): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    params.competitors.slice(0, 3).forEach(competitor => {
      this.comparisonQueries.forEach(template => {
        queries.push({
          query: this.replaceVariables(template, {
            websiteName: params.websiteName,
            competitor: this.extractDomainName(competitor)
          }),
          category: 'comparison',
          template,
          context: `Direct comparison with ${competitor}`,
          priority: 9
        });
      });
    });
    
    return queries;
  }

  private replaceVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, value || '');
    });
    
    return result;
  }

  private extractDomainName(url: string): string {
    try {
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      return domain.split('.')[0];
    } catch {
      return url;
    }
  }

  private inferCategory(websiteName: string, keywords: string[]): string {
    const name = websiteName.toLowerCase();
    const keywordText = keywords.join(' ').toLowerCase();
    
    // Technology categories
    if (name.includes('api') || keywordText.includes('api') || keywordText.includes('developer')) {
      return 'API tool';
    }
    
    if (name.includes('seo') || keywordText.includes('seo') || keywordText.includes('search')) {
      return 'SEO tool';
    }
    
    if (keywordText.includes('marketing') || keywordText.includes('email') || keywordText.includes('campaign')) {
      return 'marketing tool';
    }
    
    if (keywordText.includes('analytics') || keywordText.includes('data') || keywordText.includes('tracking')) {
      return 'analytics tool';
    }
    
    if (keywordText.includes('design') || keywordText.includes('ui') || keywordText.includes('ux')) {
      return 'design tool';
    }
    
    if (keywordText.includes('project') || keywordText.includes('management') || keywordText.includes('team')) {
      return 'productivity tool';
    }
    
    if (keywordText.includes('ecommerce') || keywordText.includes('shop') || keywordText.includes('payment')) {
      return 'ecommerce platform';
    }
    
    if (keywordText.includes('crm') || keywordText.includes('sales') || keywordText.includes('customer')) {
      return 'CRM tool';
    }
    
    // Default categories
    if (keywordText.includes('software') || keywordText.includes('platform')) {
      return 'software platform';
    }
    
    return 'digital tool';
  }

  private getMaxQueries(trackingSettings: any): number {
    // Limit queries based on tracking frequency and plan
    const frequency = trackingSettings?.frequency || 'daily';
    
    switch (frequency) {
      case 'hourly':
        return 20; // More frequent = fewer queries per run
      case 'daily':
        return 50; // Standard tracking
      case 'weekly':
        return 100; // Less frequent = more comprehensive
      default:
        return 30;
    }
  }

  // Generate queries for specific scenarios
  generateBrandAwarenessQueries(websiteName: string): GeneratedQuery[] {
    const templates = [
      "What is {websiteName}?",
      "Tell me about {websiteName}",
      "How good is {websiteName}?",
      "Is {websiteName} worth it?",
      "What do people think about {websiteName}?"
    ];
    
    return templates.map(template => ({
      query: this.replaceVariables(template, { websiteName }),
      category: 'brand' as const,
      template,
      context: 'Brand awareness focused query',
      priority: 10
    }));
  }

  generateCompetitorTrackingQueries(websiteName: string, competitors: string[]): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    competitors.forEach(competitor => {
      const competitorName = this.extractDomainName(competitor);
      const templates = [
        "{websiteName} vs {competitor}",
        "Compare {websiteName} and {competitor}",
        "Which is better {websiteName} or {competitor}?"
      ];
      
      templates.forEach(template => {
        queries.push({
          query: this.replaceVariables(template, { websiteName, competitor: competitorName }),
          category: 'comparison',
          template,
          context: `Competitor tracking query for ${competitor}`,
          priority: 9
        });
      });
    });
    
    return queries;
  }

  generateKeywordTargetedQueries(keywords: string[], websiteName: string): GeneratedQuery[] {
    const queries: GeneratedQuery[] = [];
    
    keywords.forEach(keyword => {
      const templates = [
        "Best tools for {keyword}",
        "{keyword} software recommendations",
        "How to {keyword} with {websiteName}",
        "{websiteName} for {keyword}"
      ];
      
      templates.forEach(template => {
        queries.push({
          query: this.replaceVariables(template, { keyword, websiteName }),
          category: 'feature',
          template,
          context: `Keyword-targeted query for ${keyword}`,
          priority: 7
        });
      });
    });
    
    return queries;
  }
}