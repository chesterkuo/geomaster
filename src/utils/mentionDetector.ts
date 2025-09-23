export interface DetectedMention {
  text: string;
  position: number;
  context: string;
  confidence: number;
}

export class MentionDetector {
  private contextWindow = 100; // Characters before and after the mention

  detectMentions(content: string, targets: string[]): DetectedMention[] {
    const mentions: DetectedMention[] = [];
    const contentLower = content.toLowerCase();

    for (const target of targets) {
      const targetVariants = this.generateTargetVariants(target);
      
      for (const variant of targetVariants) {
        const variantLower = variant.toLowerCase();
        let position = 0;

        while (true) {
          position = contentLower.indexOf(variantLower, position);
          if (position === -1) break;

          const context = this.extractContext(content, position, variant.length);
          const confidence = this.calculateConfidence(variant, context, target);

          if (confidence > 0.5) { // Only include mentions with decent confidence
            mentions.push({
              text: variant,
              position,
              context,
              confidence
            });
          }

          position += variant.length;
        }
      }
    }

    // Remove duplicates and sort by position
    return this.deduplicateMentions(mentions);
  }

  private generateTargetVariants(target: string): string[] {
    const variants = new Set<string>();
    
    // Original target
    variants.add(target);

    // Clean domain name (remove protocol, www, etc.)
    const cleanDomain = target
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('.')[0];
    
    variants.add(cleanDomain);

    // Capitalized versions
    variants.add(this.capitalize(cleanDomain));
    variants.add(cleanDomain.toUpperCase());

    // With and without common extensions
    if (!target.includes('.')) {
      variants.add(`${cleanDomain}.com`);
      variants.add(`${cleanDomain}.org`);
      variants.add(`${cleanDomain}.net`);
    }

    // Handle common brand name patterns
    if (cleanDomain.length > 3) {
      // Remove common suffixes
      const withoutSuffixes = cleanDomain
        .replace(/(app|inc|corp|ltd|llc)$/i, '')
        .trim();
      
      if (withoutSuffixes.length > 2) {
        variants.add(withoutSuffixes);
        variants.add(this.capitalize(withoutSuffixes));
      }
    }

    return Array.from(variants).filter(v => v.length > 2);
  }

  private extractContext(content: string, position: number, mentionLength: number): string {
    const start = Math.max(0, position - this.contextWindow);
    const end = Math.min(content.length, position + mentionLength + this.contextWindow);
    
    return content.substring(start, end).trim();
  }

  private calculateConfidence(variant: string, context: string, originalTarget: string): number {
    let confidence = 0.5; // Base confidence

    // Exact match gets higher confidence
    if (variant === originalTarget) {
      confidence += 0.3;
    }

    // Context analysis
    const contextLower = context.toLowerCase();
    
    // Positive indicators
    const positiveIndicators = [
      'website', 'platform', 'service', 'company', 'tool', 'application',
      'solution', 'product', 'brand', 'site', 'domain'
    ];
    
    const negativeIndicators = [
      'example', 'sample', 'demo', 'test', 'fake', 'placeholder'
    ];

    // Check for positive context
    for (const indicator of positiveIndicators) {
      if (contextLower.includes(indicator)) {
        confidence += 0.1;
        break;
      }
    }

    // Check for negative context
    for (const indicator of negativeIndicators) {
      if (contextLower.includes(indicator)) {
        confidence -= 0.2;
        break;
      }
    }

    // Word boundary check
    const mentionPattern = new RegExp(`\\b${this.escapeRegex(variant)}\\b`, 'i');
    if (mentionPattern.test(context)) {
      confidence += 0.2;
    }

    // URL pattern check
    if (this.isLikelyUrl(variant) && context.includes('http')) {
      confidence += 0.2;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private deduplicateMentions(mentions: DetectedMention[]): DetectedMention[] {
    const unique = new Map<string, DetectedMention>();

    for (const mention of mentions) {
      const key = `${mention.position}-${mention.text.toLowerCase()}`;
      
      if (!unique.has(key) || unique.get(key)!.confidence < mention.confidence) {
        unique.set(key, mention);
      }
    }

    return Array.from(unique.values()).sort((a, b) => a.position - b.position);
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isLikelyUrl(str: string): boolean {
    return str.includes('.') && !str.includes(' ');
  }

  // Advanced mention detection with fuzzy matching
  detectFuzzyMentions(content: string, targets: string[], threshold: number = 0.8): DetectedMention[] {
    const mentions: DetectedMention[] = [];
    const words = content.split(/\s+/);

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w.-]/g, ''); // Clean punctuation
      
      for (const target of targets) {
        const targetVariants = this.generateTargetVariants(target);
        
        for (const variant of targetVariants) {
          const similarity = this.calculateSimilarity(word.toLowerCase(), variant.toLowerCase());
          
          if (similarity >= threshold) {
            const position = content.indexOf(words[i]);
            const context = this.extractContext(content, position, words[i].length);
            
            mentions.push({
              text: words[i],
              position,
              context,
              confidence: similarity
            });
          }
        }
      }
    }

    return this.deduplicateMentions(mentions);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}