export interface SentimentAnalysis {
  score: number; // -1 to 1
  magnitude: number; // 0 to 1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
}

export class SentimentAnalyzer {
  private positiveWords = [
    'excellent', 'outstanding', 'amazing', 'fantastic', 'wonderful', 'great', 'good', 'awesome',
    'impressive', 'superior', 'best', 'top', 'leading', 'innovative', 'reliable', 'trusted',
    'recommended', 'preferred', 'love', 'like', 'enjoy', 'satisfied', 'pleased', 'happy',
    'effective', 'efficient', 'powerful', 'useful', 'helpful', 'valuable', 'quality',
    'perfect', 'ideal', 'remarkable', 'exceptional', 'brilliant', 'superb', 'incredible'
  ];

  private negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'worst', 'disappointing', 'frustrated',
    'annoying', 'useless', 'worthless', 'broken', 'failed', 'failure', 'problem', 'issue',
    'error', 'bug', 'slow', 'confusing', 'difficult', 'complicated', 'expensive', 'overpriced',
    'unreliable', 'unstable', 'outdated', 'limited', 'lacking', 'insufficient', 'inadequate',
    'hate', 'dislike', 'avoid', 'regret', 'unsatisfied', 'disappointed', 'angry', 'upset'
  ];

  private intensifiers = [
    'very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally', 'really',
    'quite', 'fairly', 'rather', 'somewhat', 'highly', 'tremendously', 'exceptionally'
  ];

  private negations = [
    'not', 'no', 'never', 'none', 'nothing', 'nobody', 'nowhere', 'neither', 'nor',
    'without', 'lack', 'lacking', 'absent', 'missing', 'fail', 'failed', 'unable',
    'cannot', 'can\'t', 'won\'t', 'wouldn\'t', 'shouldn\'t', 'don\'t', 'doesn\'t', 'didn\'t'
  ];

  analyzeSentiment(text: string): SentimentAnalysis {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      };
    }

    const words = this.tokenize(text);
    const sentimentScores = this.calculateSentimentScores(words);
    
    const totalScore = sentimentScores.reduce((sum, score) => sum + score, 0);
    const magnitude = Math.abs(totalScore) / words.length;
    const normalizedScore = this.normalizeScore(totalScore, words.length);
    
    const label = this.determineSentimentLabel(normalizedScore);
    const confidence = this.calculateConfidence(sentimentScores, words.length);

    return {
      score: normalizedScore,
      magnitude: Math.min(magnitude, 1),
      label,
      confidence
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private calculateSentimentScores(words: string[]): number[] {
    const scores: number[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let score = this.getWordSentiment(word);
      
      // Check for intensifiers in the previous word
      if (i > 0) {
        const prevWord = words[i - 1];
        if (this.intensifiers.includes(prevWord)) {
          score *= 1.5; // Amplify sentiment
        }
      }
      
      // Check for negations in the previous 1-2 words
      if (i > 0 && this.negations.includes(words[i - 1])) {
        score *= -1; // Flip sentiment
      } else if (i > 1 && this.negations.includes(words[i - 2])) {
        score *= -0.8; // Partial negation
      }
      
      scores.push(score);
    }
    
    return scores;
  }

  private getWordSentiment(word: string): number {
    if (this.positiveWords.includes(word)) {
      return 1;
    } else if (this.negativeWords.includes(word)) {
      return -1;
    }
    
    // Check for word variations/suffixes
    if (word.endsWith('ing') || word.endsWith('ed')) {
      const baseWord = word.replace(/(ing|ed)$/, '');
      if (this.positiveWords.includes(baseWord)) return 0.8;
      if (this.negativeWords.includes(baseWord)) return -0.8;
    }
    
    if (word.endsWith('ly')) {
      const baseWord = word.replace(/ly$/, '');
      if (this.positiveWords.includes(baseWord)) return 0.7;
      if (this.negativeWords.includes(baseWord)) return -0.7;
    }
    
    return 0;
  }

  private normalizeScore(totalScore: number, wordCount: number): number {
    if (wordCount === 0) return 0;
    
    const averageScore = totalScore / wordCount;
    
    // Apply sigmoid normalization to bound between -1 and 1
    return Math.tanh(averageScore);
  }

  private determineSentimentLabel(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private calculateConfidence(scores: number[], wordCount: number): number {
    if (wordCount === 0) return 0;
    
    const nonZeroScores = scores.filter(score => score !== 0);
    const sentimentWordCount = nonZeroScores.length;
    
    // Base confidence on the proportion of sentiment-bearing words
    const sentimentDensity = sentimentWordCount / wordCount;
    
    // Adjust confidence based on score consistency
    const avgScore = nonZeroScores.reduce((sum, score) => sum + score, 0) / sentimentWordCount;
    const variance = nonZeroScores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / sentimentWordCount;
    const consistency = 1 / (1 + variance); // Higher consistency = lower variance
    
    return Math.min(sentimentDensity * consistency, 1);
  }

  // Analyze sentiment of mentions specifically
  analyzeMentionSentiment(content: string, mentionContext: string): SentimentAnalysis {
    // Focus on the context around the mention
    const contextWords = this.tokenize(mentionContext);
    
    // Weight words closer to the mention more heavily
    const weightedScores: number[] = [];
    const centerIndex = Math.floor(contextWords.length / 2);
    
    for (let i = 0; i < contextWords.length; i++) {
      const word = contextWords[i];
      const score = this.getWordSentiment(word);
      
      // Distance-based weighting
      const distance = Math.abs(i - centerIndex);
      const weight = 1 / (1 + distance * 0.1);
      
      weightedScores.push(score * weight);
    }
    
    const totalScore = weightedScores.reduce((sum, score) => sum + score, 0);
    const magnitude = Math.abs(totalScore) / contextWords.length;
    const normalizedScore = this.normalizeScore(totalScore, contextWords.length);
    
    return {
      score: normalizedScore,
      magnitude: Math.min(magnitude, 1),
      label: this.determineSentimentLabel(normalizedScore),
      confidence: this.calculateConfidence(weightedScores, contextWords.length)
    };
  }

  // Batch analyze multiple texts
  analyzeBatch(texts: string[]): SentimentAnalysis[] {
    return texts.map(text => this.analyzeSentiment(text));
  }

  // Get overall sentiment from multiple analyses
  aggregateSentiments(analyses: SentimentAnalysis[]): SentimentAnalysis {
    if (analyses.length === 0) {
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      };
    }

    // Weight by confidence
    const totalWeight = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0);
    
    if (totalWeight === 0) {
      return {
        score: 0,
        magnitude: 0,
        label: 'neutral',
        confidence: 0
      };
    }

    const weightedScore = analyses.reduce((sum, analysis) => {
      return sum + (analysis.score * analysis.confidence);
    }, 0) / totalWeight;

    const weightedMagnitude = analyses.reduce((sum, analysis) => {
      return sum + (analysis.magnitude * analysis.confidence);
    }, 0) / totalWeight;

    const avgConfidence = analyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / analyses.length;

    return {
      score: weightedScore,
      magnitude: weightedMagnitude,
      label: this.determineSentimentLabel(weightedScore),
      confidence: avgConfidence
    };
  }

  // Check if text contains emotional indicators
  hasEmotionalIndicators(text: string): boolean {
    const words = this.tokenize(text);
    const emotionalWords = [...this.positiveWords, ...this.negativeWords];
    
    return words.some(word => emotionalWords.includes(word));
  }

  // Get sentiment trend over time (for multiple time-series analyses)
  getTrendAnalysis(analyses: Array<{ timestamp: Date; analysis: SentimentAnalysis }>): {
    trend: 'improving' | 'declining' | 'stable';
    change: number;
    confidence: number;
  } {
    if (analyses.length < 2) {
      return { trend: 'stable', change: 0, confidence: 0 };
    }

    // Sort by timestamp
    const sorted = analyses.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Calculate trend using linear regression
    const scores = sorted.map(item => item.analysis.score);
    const trend = this.calculateTrend(scores);
    
    return {
      trend: trend > 0.05 ? 'improving' : trend < -0.05 ? 'declining' : 'stable',
      change: trend,
      confidence: sorted[sorted.length - 1].analysis.confidence
    };
  }

  private calculateTrend(scores: number[]): number {
    const n = scores.length;
    const xSum = n * (n - 1) / 2; // 0 + 1 + 2 + ... + (n-1)
    const ySum = scores.reduce((sum, score) => sum + score, 0);
    const xySum = scores.reduce((sum, score, index) => sum + (index * score), 0);
    const x2Sum = n * (n - 1) * (2 * n - 1) / 6; // 0² + 1² + 2² + ... + (n-1)²
    
    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    return slope;
  }
}