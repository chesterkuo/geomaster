import { Request, Response } from 'express';
import { Website, Organization, Content, Scan } from '../models';
import { AppError, asyncHandler } from '../middlewares/error.middleware';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class WebsiteController {
  public getWebsites = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const organizationId = req.organization.id;

    const whereCondition: any = {
      organizationId
    };

    if (search) {
      whereCondition[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { url: { [Op.like]: `%${search}%` } },
        { domain: { [Op.like]: `%${search}%` } }
      ];
    }

    if (isActive !== undefined) {
      whereCondition.isActive = isActive === 'true';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: websites } = await Website.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Content,
          as: 'contents',
          attributes: ['id'],
          required: false
        },
        {
          model: Scan,
          as: 'scans',
          attributes: ['id', 'status', 'completedAt'],
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false
        }
      ]
    });

    const websitesWithStats = websites.map(website => {
      const websiteData = website.toJSON();
      return {
        ...websiteData,
        contentCount: 0, // TODO: Add contents association after defining Sequelize associations
        lastScanStatus: null, // TODO: Add scans association after defining Sequelize associations
        lastScanDate: null // TODO: Add scans association after defining Sequelize associations
      };
    });

    res.json({
      success: true,
      data: {
        websites: websitesWithStats,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  public getWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId },
      include: [
        {
          model: Content,
          as: 'contents',
          attributes: ['id', 'url', 'title', 'geoScore', 'optimizationStatus'],
          limit: 10,
          order: [['geoScore', 'DESC']]
        },
        {
          model: Scan,
          as: 'scans',
          attributes: ['id', 'status', 'progress', 'completedAt', 'scanType'],
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    // Calculate metrics
    const contents = website.get('contents') as any[];
    const scans = website.get('scans') as any[];

    const metrics = {
      totalContent: contents.length,
      averageGeoScore: contents.length > 0 
        ? contents.reduce((sum, content) => sum + (content.geoScore || 0), 0) / contents.length
        : 0,
      optimizedContent: contents.filter(c => c.optimizationStatus === 'optimized').length,
      lastScanDate: scans[0]?.completedAt || null,
      totalScans: scans.length
    };

    res.json({
      success: true,
      data: {
        website: website.toJSON(),
        metrics
      }
    });
  });

  public createWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { url, name, description, scanFrequency } = req.body;
    const organizationId = req.organization.id;

    // Check if organization can add more websites
    const websiteCount = await Website.count({
      where: { organizationId, isActive: true }
    });

    if (req.organization.maxWebsites !== -1 && websiteCount >= req.organization.maxWebsites) {
      throw new AppError('Maximum websites limit reached for your plan', 403);
    }

    // Check if website already exists for this organization
    const existingWebsite = await Website.findOne({
      where: { url, organizationId }
    });

    if (existingWebsite) {
      throw new AppError('Website already exists in this organization', 409);
    }

    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const website = await Website.create({
      organizationId,
      url,
      domain,
      name,
      description,
      scanFrequency: scanFrequency || 'weekly'
    });

    res.status(201).json({
      success: true,
      data: {
        website: website.toJSON()
      }
    });
  });

  public updateWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { name, description, scanFrequency, isActive } = req.body;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    if (name !== undefined) website.name = name;
    if (description !== undefined) website.description = description;
    if (scanFrequency !== undefined) website.scanFrequency = scanFrequency;
    if (isActive !== undefined) website.isActive = isActive;

    await website.save();

    res.json({
      success: true,
      data: {
        website: website.toJSON()
      }
    });
  });

  public deleteWebsite = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    await website.destroy();

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });
  });

  public getWebsiteContent = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { page = 1, limit = 10, search, optimizationStatus } = req.query;
    const organizationId = req.organization.id;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    const whereCondition: any = {
      websiteId: id
    };

    if (search) {
      whereCondition[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { url: { [Op.like]: `%${search}%` } }
      ];
    }

    if (optimizationStatus) {
      whereCondition.optimizationStatus = optimizationStatus;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: contents } = await Content.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset,
      order: [['geoScore', 'DESC']],
      attributes: [
        'id', 'url', 'title', 'metaDescription', 'contentType',
        'geoScore', 'wordCount', 'readingTime', 'hasSchema',
        'optimizationStatus', 'lastUpdated', 'createdAt'
      ]
    });

    res.json({
      success: true,
      data: {
        contents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  public getWebsiteAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const organizationId = req.organization.id;

    // Verify website belongs to organization
    const website = await Website.findOne({
      where: { id, organizationId }
    });

    if (!website) {
      throw new AppError('Website not found', 404);
    }

    // Get content analytics
    const contentStats = await Content.findAll({
      where: { websiteId: id },
      attributes: [
        [Website.sequelize!.fn('COUNT', '*'), 'totalContent'],
        [Website.sequelize!.fn('AVG', Website.sequelize!.col('geo_score')), 'avgGeoScore'],
        [Website.sequelize!.fn('SUM', Website.sequelize!.literal("CASE WHEN optimization_status = 'optimized' THEN 1 ELSE 0 END")), 'optimizedContent'],
        [Website.sequelize!.fn('AVG', Website.sequelize!.col('word_count')), 'avgWordCount']
      ],
      raw: true
    });

    // Get scan history
    const scanStats = await Scan.findAll({
      where: { websiteId: id },
      attributes: [
        [Website.sequelize!.fn('COUNT', '*'), 'totalScans'],
        [Website.sequelize!.fn('COUNT', Website.sequelize!.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedScans'],
        [Website.sequelize!.fn('COUNT', Website.sequelize!.literal("CASE WHEN status = 'failed' THEN 1 END")), 'failedScans']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        website: website.toJSON(),
        analytics: {
          content: contentStats[0],
          scans: scanStats[0]
        }
      }
    });
  });
}