import { Request, Response } from 'express';
import { Keyword, KeywordResearch, KeywordRanking, Website, Organization } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database';
import { PlatformType } from '../models/KeywordRanking';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
    plan: string;
  };
}

interface KeywordAnalytics {
  totalKeywords: number;
  researchedKeywords: number;
  rankedKeywords: number;
  averageSearchVolume: number;
  averageDifficulty: number;
  opportunityKeywords: number;
  topPerformingKeywords: KeywordPerformance[];
}

interface KeywordPerformance {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  opportunityScore: number;
  rankings: RankingPerformance[];
}

interface RankingPerformance {
  platform: PlatformType;
  position: number;
  visibilityScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface KeywordInsights {
  keyword: string;
  metrics: {
    searchVolume: number;
    difficulty: number;
    cpcEstimate: number;
    competitionLevel: 'low' | 'medium' | 'high';
  };
  performance: {
    opportunityScore: number;
    isLongTail: boolean;
    averageRanking: number;
    totalMentions: number;
  };
  trends: {
    positionChange: number;
    visibilityChange: number;
    direction: 'up' | 'down' | 'stable';
  };
  relatedKeywords: Array<{
    keyword: string;
    relevance: number;
    searchVolume?: number;
  }>;
}

interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  competition: 'low' | 'medium' | 'high';
  opportunityScore: number;
  potentialTraffic: number;
  recommendedAction: 'target' | 'research' | 'monitor';
}

export class KeywordController {
  // GET /api/v1/keywords - List all keywords with enhanced data
  async getKeywords(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { 
        type, 
        page = 1, 
        limit = 20, 
        search,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        includeResearch = 'false',
        includeRankings = 'false'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      // Build parallel queries for basic keywords and enhanced data
      const basicKeywordsPromise = this.getBasicKeywords(organizationId, {
        type: type as string,
        search: search as string,
        limit: Number(limit),
        offset,
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      });
      const researchPromise = includeResearch === 'true' ? this.getKeywordResearchData(organizationId) : Promise.resolve([]);
      const analyticsPromise = this.getKeywordAnalytics(organizationId);
      
      const [keywordResults, researchResults, analyticsData] = await Promise.all([
        basicKeywordsPromise,
        researchPromise,
        analyticsPromise
      ]);

      // Merge research data with basic keywords if requested
      let enhancedKeywords = keywordResults.rows;
      if (includeResearch === 'true') {
        enhancedKeywords = await this.mergeKeywordData(keywordResults.rows, researchResults, includeRankings === 'true');
      }

      return res.json({
        success: true,
        data: {
          keywords: enhancedKeywords,
          analytics: analyticsData,
          pagination: {
            total: keywordResults.count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(keywordResults.count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch keywords',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Helper method to get basic keywords
  private async getBasicKeywords(organizationId: string, options: {
    type?: string;
    search?: string;
    limit: number;
    offset: number;
    sortBy: string;
    sortOrder: string;
  }) {
    const whereClause: any = { organizationId };

    if (options.type) {
      whereClause.intent = options.type;
    }

    if (options.search) {
      whereClause.keyword = {
        [Op.like]: `%${options.search}%`
      };
    }

    const validSortFields = ['createdAt', 'updatedAt', 'keyword', 'searchVolume', 'difficulty'];
    const sortField = validSortFields.includes(options.sortBy) ? options.sortBy : 'createdAt';
    const sortDirection = options.sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    return Keyword.findAndCountAll({
      where: whereClause,
      limit: options.limit,
      offset: options.offset,
      order: [[sortField, sortDirection]]
    });
  }

  // Helper method to get keyword research data
  private async getKeywordResearchData(organizationId: string) {
    return KeywordResearch.findAll({
      where: { organizationId },
      include: [{
        model: KeywordRanking,
        as: 'rankings',
        required: false,
        include: [{
          model: Website,
          as: 'website',
          attributes: ['id', 'name', 'domain']
        }]
      }],
      order: [['searchVolume', 'DESC']]
    });
  }

  // Helper method to merge keyword data
  private async mergeKeywordData(basicKeywords: any[], researchData: any[], includeRankings: boolean) {
    const researchMap = new Map();
    researchData.forEach(research => {
      researchMap.set(research.keyword.toLowerCase(), research);
    });

    return basicKeywords.map(keyword => {
      const researchInfo = researchMap.get(keyword.keyword.toLowerCase());
      const result: any = {
        ...keyword.toJSON(),
        research: researchInfo ? {
          searchVolume: researchInfo.searchVolume,
          difficultyScore: researchInfo.difficultyScore,
          cpcEstimate: researchInfo.cpcEstimate,
          competitionLevel: researchInfo.competitionLevel,
          opportunityScore: researchInfo.getOpportunityScore(),
          isLongTail: researchInfo.isLongTailKeyword(),
          relatedKeywords: researchInfo.relatedKeywords || []
        } : null
      };

      if (includeRankings && researchInfo?.rankings) {
        result.rankings = researchInfo.rankings.map((ranking: any) => ({
          platform: ranking.platform,
          position: ranking.rankingPosition,
          visibility: ranking.visibilityScore,
          mentions: ranking.mentionsCount,
          website: ranking.website,
          trend: ranking.getRankingTier(),
          trackedAt: ranking.trackedAt
        }));
      }

      return result;
    });
  }

  // Helper method to get keyword analytics
  private async getKeywordAnalytics(organizationId: string): Promise<KeywordAnalytics> {
    try {
      const [
        totalKeywords,
        researchCount,
        rankedCount,
        volumeStats,
        difficultyStats,
        opportunityCount,
        topPerforming
      ] = await Promise.all([
        Keyword.count({ where: { organizationId } }),
        this.safeCount(KeywordResearch, { where: { organizationId } }),
        this.safeCount(KeywordRanking, { where: { organizationId } }),
        this.safeQuery(() => KeywordResearch.findAll({
          where: { organizationId },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('search_volume')), 'avgVolume']
          ],
          raw: true
        }), []),
        this.safeQuery(() => KeywordResearch.findAll({
          where: { organizationId },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('difficulty_score')), 'avgDifficulty']
          ],
          raw: true
        }), []),
        this.safeCount(KeywordResearch, {
          where: {
            organizationId,
            searchVolume: { [Op.gte]: 1000 },
            difficultyScore: { [Op.lte]: 40 }
          }
        }),
        this.safeQuery(() => this.getTopPerformingKeywords(organizationId, 5), [])
      ]);

      return {
        totalKeywords,
        researchedKeywords: researchCount,
        rankedKeywords: rankedCount,
        averageSearchVolume: Math.round(Number((volumeStats[0] as any)?.avgVolume) || 0),
        averageDifficulty: Math.round(Number((difficultyStats[0] as any)?.avgDifficulty) || 0),
        opportunityKeywords: opportunityCount,
        topPerformingKeywords: topPerforming
      };
    } catch (error) {
      console.error('Error in getKeywordAnalytics:', error);
      // Return default analytics when there's an error (e.g., table doesn't exist)
      return {
        totalKeywords: await Keyword.count({ where: { organizationId } }),
        researchedKeywords: 0,
        rankedKeywords: 0,
        averageSearchVolume: 0,
        averageDifficulty: 0,
        opportunityKeywords: 0,
        topPerformingKeywords: []
      };
    }
  }

  // Helper method to safely execute queries that might fail due to missing tables
  private async safeQuery<T>(queryFn: () => Promise<T>, defaultValue: T): Promise<T> {
    try {
      return await queryFn();
    } catch (error) {
      console.warn('Safe query failed, returning default:', (error as Error).message);
      return defaultValue;
    }
  }

  // Helper method to safely count records that might fail due to missing tables
  private async safeCount(model: any, options: any): Promise<number> {
    try {
      return await model.count(options);
    } catch (error) {
      console.warn('Safe count failed, returning 0:', (error as Error).message);
      return 0;
    }
  }

  // Helper method to get top performing keywords
  private async getTopPerformingKeywords(organizationId: string, limit: number): Promise<KeywordPerformance[]> {
    const topKeywords = await KeywordResearch.findAll({
      where: { organizationId },
      include: [{
        model: KeywordRanking,
        as: 'rankings',
        required: false,
        include: [{
          model: Website,
          as: 'website',
          attributes: ['name', 'domain']
        }]
      }],
      order: [
        [sequelize.literal('(`KeywordResearch`.`search_volume` / (`KeywordResearch`.`difficulty_score` + 1))'), 'DESC']
      ],
      limit
    });

    return topKeywords.map(keyword => ({
      keyword: keyword.keyword,
      searchVolume: keyword.searchVolume,
      difficulty: keyword.difficultyScore,
      opportunityScore: keyword.getOpportunityScore(),
      rankings: (keyword as any).rankings?.map((ranking: any) => ({
        platform: ranking.platform,
        position: ranking.rankingPosition,
        visibilityScore: ranking.visibilityScore,
        trend: 'stable' as const // Would need historical data for real trends
      })) || []
    }));
  }

  // POST /api/v1/keywords - Add new keyword with enhanced validation
  async createKeyword(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { 
        keyword, 
        searchVolume, 
        difficulty, 
        cpc, 
        intent,
        createResearch = false,
        researchData
      } = req.body;

      // Input validation
      if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
        return res.status(400).json({ error: 'Keyword is required and must be a non-empty string' });
      }

      const cleanKeyword = keyword.toLowerCase().trim();

      // Check if keyword already exists for this organization
      const existingKeyword = await Keyword.findOne({
        where: { organizationId, keyword: cleanKeyword }
      });

      if (existingKeyword) {
        return res.status(409).json({ error: 'Keyword already exists for this organization' });
      }

      // Create basic keyword and research data in parallel if requested
      const promises: Promise<any>[] = [
        Keyword.create({
          organizationId,
          keyword: cleanKeyword,
          searchVolume: searchVolume ? parseInt(searchVolume) : undefined,
          difficulty: difficulty ? parseFloat(difficulty) : undefined,
          cpc: cpc ? parseFloat(cpc) : undefined,
          intent
        })
      ];

      if (createResearch && researchData) {
        const existingResearch = await KeywordResearch.findOne({
          where: { organizationId, keyword: cleanKeyword }
        });

        if (!existingResearch) {
          promises.push(
            KeywordResearch.create({
              organizationId,
              keyword: cleanKeyword,
              searchVolume: researchData.searchVolume || 0,
              difficultyScore: researchData.difficulty || 0,
              cpcEstimate: researchData.cpc || 0,
              competitionLevel: researchData.competitionLevel || 'medium',
              relatedKeywords: researchData.relatedKeywords || [],
              researchDate: new Date(),
              dataSource: 'manual'
            })
          );
        }
      }

      const [newKeyword, researchResult] = await Promise.all(promises);

      return res.status(201).json({
        success: true,
        data: {
          id: newKeyword.id,
          keyword: newKeyword.keyword,
          searchVolume: newKeyword.searchVolume,
          difficulty: newKeyword.difficulty,
          cpc: newKeyword.cpc,
          intent: newKeyword.intent,
          organizationId: newKeyword.organizationId,
          createdAt: newKeyword.createdAt,
          updatedAt: newKeyword.updatedAt,
          research: researchResult || null,
          message: createResearch && researchResult 
            ? 'Keyword and research data created successfully'
            : 'Keyword created successfully'
        }
      });
    } catch (error) {
      console.error('Error creating keyword:', error);
      return res.status(500).json({ 
        error: 'Failed to create keyword',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // PUT /api/v1/keywords/:id - Update keyword
  async updateKeyword(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;
      const { keyword, searchVolume, difficulty, cpc, intent } = req.body;

      const existingKeyword = await Keyword.findOne({
        where: {
          id,
          organizationId
        }
      });

      if (!existingKeyword) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      // Check if updated keyword name conflicts with existing one
      if (keyword && keyword.toLowerCase().trim() !== existingKeyword.keyword) {
        const duplicateKeyword = await Keyword.findOne({
          where: {
            organizationId,
            keyword: keyword.toLowerCase().trim(),
            id: { [Op.ne]: id }
          }
        });

        if (duplicateKeyword) {
          return res.status(409).json({ error: 'Keyword already exists for this organization' });
        }
      }

      const updatedKeyword = await existingKeyword.update({
        keyword: keyword ? keyword.toLowerCase().trim() : existingKeyword.keyword,
        searchVolume: searchVolume ? parseInt(searchVolume) : existingKeyword.searchVolume,
        difficulty: difficulty ? parseFloat(difficulty) : existingKeyword.difficulty,
        cpc: cpc ? parseFloat(cpc) : existingKeyword.cpc,
        intent: intent || existingKeyword.intent
      });

      return res.json({
        success: true,
        data: updatedKeyword
      });
    } catch (error) {
      console.error('Error updating keyword:', error);
      return res.status(500).json({ error: 'Failed to update keyword' });
    }
  }

  // DELETE /api/v1/keywords/:id - Delete keyword
  async deleteKeyword(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;

      const keyword = await Keyword.findOne({
        where: {
          id,
          organizationId
        }
      });

      if (!keyword) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      await keyword.destroy();

      return res.json({
        success: true,
        message: 'Keyword deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting keyword:', error);
      return res.status(500).json({ error: 'Failed to delete keyword' });
    }
  }

  // GET /api/v1/keywords/types - Get keyword types (intent categories)
  async getKeywordTypes(req: AuthRequest, res: Response) {
    try {
      const types = [
        {
          value: 'informational',
          label: 'Informational',
          description: 'Keywords used to find information or answers'
        },
        {
          value: 'commercial',
          label: 'Commercial',
          description: 'Keywords with commercial intent, comparison shopping'
        },
        {
          value: 'transactional',
          label: 'Transactional',
          description: 'Keywords indicating purchase intent'
        },
        {
          value: 'navigational',
          label: 'Navigational',
          description: 'Keywords to find specific website or brand'
        }
      ];

      return res.json({
        success: true,
        data: types
      });
    } catch (error) {
      console.error('Error fetching keyword types:', error);
      return res.status(500).json({ error: 'Failed to fetch keyword types' });
    }
  }

  // GET /api/v1/keywords/analytics - Get comprehensive keyword analytics
  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const analytics = await this.getKeywordAnalytics(organizationId);

      return res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching keyword analytics:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch keyword analytics',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // GET /api/v1/keywords/opportunities - Get keyword opportunities
  async getOpportunities(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { 
        maxDifficulty = 50,
        minVolume = 1000,
        competitionLevel,
        limit = 20
      } = req.query;

      const whereClause: any = {
        organizationId,
        searchVolume: { [Op.gte]: Number(minVolume) },
        difficultyScore: { [Op.lte]: Number(maxDifficulty) }
      };

      if (competitionLevel && typeof competitionLevel === 'string') {
        whereClause.competitionLevel = competitionLevel;
      }

      const opportunities = await KeywordResearch.findAll({
        where: whereClause,
        order: [
          [sequelize.literal('(`KeywordResearch`.`search_volume` / (`KeywordResearch`.`difficulty_score` + 1))'), 'DESC']
        ],
        limit: Number(limit)
      });

      const formattedOpportunities: KeywordOpportunity[] = opportunities.map(keyword => {
        const opportunityScore = keyword.getOpportunityScore();
        const potentialTraffic = Math.round(keyword.searchVolume * 0.3 * (opportunityScore / 100));
        
        let recommendedAction: 'target' | 'research' | 'monitor';
        if (opportunityScore >= 70) {
          recommendedAction = 'target';
        } else if (opportunityScore >= 40) {
          recommendedAction = 'research';
        } else {
          recommendedAction = 'monitor';
        }

        return {
          keyword: keyword.keyword,
          searchVolume: keyword.searchVolume,
          difficulty: keyword.difficultyScore,
          competition: keyword.competitionLevel,
          opportunityScore,
          potentialTraffic,
          recommendedAction
        };
      });

      return res.json({
        success: true,
        data: {
          opportunities: formattedOpportunities,
          filters: {
            maxDifficulty: Number(maxDifficulty),
            minVolume: Number(minVolume),
            competitionLevel: competitionLevel || 'all'
          }
        }
      });
    } catch (error) {
      console.error('Error fetching keyword opportunities:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch keyword opportunities',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // GET /api/v1/keywords/:id/insights - Get detailed keyword insights
  async getKeywordInsights(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { id } = req.params;

      // First try to find the keyword in basic keywords table
      const basicKeyword = await Keyword.findOne({
        where: { id, organizationId }
      });

      if (!basicKeyword) {
        return res.status(404).json({ error: 'Keyword not found' });
      }

      // Find research data and rankings
      const [researchData, rankings] = await Promise.all([
        KeywordResearch.findOne({
          where: { 
            organizationId, 
            keyword: basicKeyword.keyword 
          }
        }),
        KeywordRanking.findAll({
          where: { organizationId },
          include: [{
            model: KeywordResearch,
            as: 'keyword',
            where: { keyword: basicKeyword.keyword },
            required: true
          }, {
            model: Website,
            as: 'website',
            attributes: ['id', 'name', 'domain']
          }],
          order: [['trackedAt', 'DESC']],
          limit: 10
        })
      ]);

      const insights: KeywordInsights = {
        keyword: basicKeyword.keyword,
        metrics: {
          searchVolume: researchData?.searchVolume || basicKeyword.searchVolume || 0,
          difficulty: researchData?.difficultyScore || basicKeyword.difficulty || 0,
          cpcEstimate: researchData?.cpcEstimate || basicKeyword.cpc || 0,
          competitionLevel: researchData?.competitionLevel || 'medium'
        },
        performance: {
          opportunityScore: researchData?.getOpportunityScore() || 0,
          isLongTail: researchData?.isLongTailKeyword() || basicKeyword.keyword.split(' ').length >= 3,
          averageRanking: rankings.length > 0 
            ? Math.round(rankings.reduce((sum, r) => sum + r.rankingPosition, 0) / rankings.length)
            : 0,
          totalMentions: rankings.reduce((sum, r) => sum + r.mentionsCount, 0)
        },
        trends: {
          positionChange: 0, // Would need historical data
          visibilityChange: 0, // Would need historical data
          direction: 'stable'
        },
        relatedKeywords: (researchData?.relatedKeywords || []).map((related: any) => ({
          keyword: related.keyword,
          relevance: related.relevance_score || 0,
          searchVolume: related.search_volume
        }))
      };

      return res.json({
        success: true,
        data: insights
      });
    } catch (error) {
      console.error('Error fetching keyword insights:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch keyword insights',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // GET /api/v1/keywords/rankings - Get ranking performance across platforms
  async getRankings(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { 
        websiteId,
        platform,
        keyword,
        page = 1,
        limit = 20,
        sortBy = 'visibilityScore',
        sortOrder = 'DESC'
      } = req.query;

      const whereClause: any = { organizationId };
      if (websiteId) whereClause.websiteId = websiteId;
      if (platform) whereClause.platform = platform;

      const includeConditions: any[] = [{
        model: Website,
        as: 'website',
        attributes: ['id', 'name', 'domain']
      }, {
        model: KeywordResearch,
        as: 'keyword',
        attributes: ['keyword', 'searchVolume', 'difficultyScore']
      }];

      if (keyword) {
        includeConditions[1].where = {
          keyword: { [Op.like]: `%${keyword}%` }
        };
      }

      const validSortFields = ['visibilityScore', 'rankingPosition', 'mentionsCount', 'trackedAt'];
      const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'visibilityScore';
      const sortDirection = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: rankings } = await KeywordRanking.findAndCountAll({
        where: whereClause,
        include: includeConditions,
        order: [[sortField, sortDirection]],
        limit: Number(limit),
        offset,
        distinct: true
      });

      const formattedRankings = rankings.map(ranking => ({
        id: ranking.id,
        platform: ranking.platform,
        position: ranking.rankingPosition,
        visibility: ranking.visibilityScore,
        mentions: ranking.mentionsCount,
        trackedAt: ranking.trackedAt,
        tier: ranking.getRankingTier(),
        website: (ranking as any).website,
        keyword: (ranking as any).keyword,
        metrics: ranking.getPerformanceMetrics()
      }));

      return res.json({
        success: true,
        data: {
          rankings: formattedRankings,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching keyword rankings:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch keyword rankings',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // POST /api/v1/keywords/research - Create or update keyword research data
  async createResearch(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const {
        keyword,
        searchVolume,
        difficultyScore,
        cpcEstimate,
        competitionLevel,
        relatedKeywords,
        dataSource = 'manual'
      } = req.body;

      // Input validation
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      const cleanKeyword = keyword.toLowerCase().trim();

      // Check if research already exists
      let research = await KeywordResearch.findOne({
        where: { organizationId, keyword: cleanKeyword }
      });

      if (research) {
        // Update existing research
        research = await research.update({
          searchVolume: searchVolume || research.searchVolume,
          difficultyScore: difficultyScore || research.difficultyScore,
          cpcEstimate: cpcEstimate || research.cpcEstimate,
          competitionLevel: competitionLevel || research.competitionLevel,
          relatedKeywords: relatedKeywords || research.relatedKeywords,
          researchDate: new Date(),
          dataSource
        });
      } else {
        // Create new research
        research = await KeywordResearch.create({
          organizationId,
          keyword: cleanKeyword,
          searchVolume: searchVolume || 0,
          difficultyScore: difficultyScore || 0,
          cpcEstimate: cpcEstimate || 0,
          competitionLevel: competitionLevel || 'medium',
          relatedKeywords: relatedKeywords || [],
          researchDate: new Date(),
          dataSource
        });
      }

      return res.status(201).json({
        success: true,
        data: {
          research,
          insights: research.getKeywordInsights(),
          exportData: research.formatForExport()
        }
      });
    } catch (error) {
      console.error('Error creating keyword research:', error);
      return res.status(500).json({ 
        error: 'Failed to create keyword research',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // GET /api/v1/keywords/export - Export keyword data
  async exportKeywords(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { format = 'json', includeResearch = 'true' } = req.query;

      let keywords;
      
      if (includeResearch === 'true') {
        keywords = await KeywordResearch.findAll({
          where: { organizationId },
          order: [['searchVolume', 'DESC']]
        });

        const exportData = keywords.map(keyword => keyword.formatForExport());

        if (format === 'csv') {
          // For CSV format, return structured data that frontend can convert
          return res.json({
            success: true,
            format: 'csv',
            data: exportData,
            filename: `keywords-research-${new Date().toISOString().split('T')[0]}.csv`
          });
        }

        return res.json({
          success: true,
          format: 'json',
          data: exportData,
          filename: `keywords-research-${new Date().toISOString().split('T')[0]}.json`
        });
      } else {
        keywords = await Keyword.findAll({
          where: { organizationId },
          order: [['createdAt', 'DESC']]
        });

        return res.json({
          success: true,
          format,
          data: keywords,
          filename: `keywords-${new Date().toISOString().split('T')[0]}.${format}`
        });
      }
    } catch (error) {
      console.error('Error exporting keywords:', error);
      return res.status(500).json({ 
        error: 'Failed to export keywords',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}