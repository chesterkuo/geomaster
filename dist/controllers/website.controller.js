"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteController = void 0;
const models_1 = require("../models");
const error_middleware_1 = require("../middlewares/error.middleware");
const sequelize_1 = require("sequelize");
class WebsiteController {
    constructor() {
        this.getWebsites = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, search, isActive } = req.query;
            const organizationId = req.organization.id;
            const whereCondition = {
                organizationId
            };
            if (search) {
                whereCondition[sequelize_1.Op.or] = [
                    { name: { [sequelize_1.Op.like]: `%${search}%` } },
                    { url: { [sequelize_1.Op.like]: `%${search}%` } },
                    { domain: { [sequelize_1.Op.like]: `%${search}%` } }
                ];
            }
            if (isActive !== undefined) {
                whereCondition.isActive = isActive === 'true';
            }
            const offset = (Number(page) - 1) * Number(limit);
            const { count, rows: websites } = await models_1.Website.findAndCountAll({
                where: whereCondition,
                limit: Number(limit),
                offset,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: models_1.Content,
                        as: 'contents',
                        attributes: ['id'],
                        required: false
                    },
                    {
                        model: models_1.Scan,
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
        this.getWebsite = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const website = await models_1.Website.findOne({
                where: { id, organizationId },
                include: [
                    {
                        model: models_1.Content,
                        as: 'contents',
                        attributes: ['id', 'url', 'title', 'geoScore', 'optimizationStatus'],
                        limit: 10,
                        order: [['geoScore', 'DESC']]
                    },
                    {
                        model: models_1.Scan,
                        as: 'scans',
                        attributes: ['id', 'status', 'progress', 'completedAt', 'scanType'],
                        limit: 5,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });
            if (!website) {
                throw new error_middleware_1.AppError('Website not found', 404);
            }
            // Calculate metrics
            const contents = website.get('contents');
            const scans = website.get('scans');
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
        this.createWebsite = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { url, name, description, scanFrequency } = req.body;
            const organizationId = req.organization.id;
            // Check if organization can add more websites
            const websiteCount = await models_1.Website.count({
                where: { organizationId, isActive: true }
            });
            if (req.organization.maxWebsites !== -1 && websiteCount >= req.organization.maxWebsites) {
                throw new error_middleware_1.AppError('Maximum websites limit reached for your plan', 403);
            }
            // Check if website already exists for this organization
            const existingWebsite = await models_1.Website.findOne({
                where: { url, organizationId }
            });
            if (existingWebsite) {
                throw new error_middleware_1.AppError('Website already exists in this organization', 409);
            }
            // Extract domain from URL
            const urlObj = new URL(url);
            const domain = urlObj.hostname;
            const website = await models_1.Website.create({
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
        this.updateWebsite = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { name, description, scanFrequency, isActive } = req.body;
            const organizationId = req.organization.id;
            const website = await models_1.Website.findOne({
                where: { id, organizationId }
            });
            if (!website) {
                throw new error_middleware_1.AppError('Website not found', 404);
            }
            if (name !== undefined)
                website.name = name;
            if (description !== undefined)
                website.description = description;
            if (scanFrequency !== undefined)
                website.scanFrequency = scanFrequency;
            if (isActive !== undefined)
                website.isActive = isActive;
            await website.save();
            res.json({
                success: true,
                data: {
                    website: website.toJSON()
                }
            });
        });
        this.deleteWebsite = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const organizationId = req.organization.id;
            const website = await models_1.Website.findOne({
                where: { id, organizationId }
            });
            if (!website) {
                throw new error_middleware_1.AppError('Website not found', 404);
            }
            await website.destroy();
            res.json({
                success: true,
                message: 'Website deleted successfully'
            });
        });
        this.getWebsiteContent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { page = 1, limit = 10, search, optimizationStatus } = req.query;
            const organizationId = req.organization.id;
            // Verify website belongs to organization
            const website = await models_1.Website.findOne({
                where: { id, organizationId }
            });
            if (!website) {
                throw new error_middleware_1.AppError('Website not found', 404);
            }
            const whereCondition = {
                websiteId: id
            };
            if (search) {
                whereCondition[sequelize_1.Op.or] = [
                    { title: { [sequelize_1.Op.like]: `%${search}%` } },
                    { url: { [sequelize_1.Op.like]: `%${search}%` } }
                ];
            }
            if (optimizationStatus) {
                whereCondition.optimizationStatus = optimizationStatus;
            }
            const offset = (Number(page) - 1) * Number(limit);
            const { count, rows: contents } = await models_1.Content.findAndCountAll({
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
        this.getWebsiteAnalytics = (0, error_middleware_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const organizationId = req.organization.id;
            // Verify website belongs to organization
            const website = await models_1.Website.findOne({
                where: { id, organizationId }
            });
            if (!website) {
                throw new error_middleware_1.AppError('Website not found', 404);
            }
            // Get content analytics
            const contentStats = await models_1.Content.findAll({
                where: { websiteId: id },
                attributes: [
                    [models_1.Website.sequelize.fn('COUNT', '*'), 'totalContent'],
                    [models_1.Website.sequelize.fn('AVG', models_1.Website.sequelize.col('geo_score')), 'avgGeoScore'],
                    [models_1.Website.sequelize.fn('SUM', models_1.Website.sequelize.literal("CASE WHEN optimization_status = 'optimized' THEN 1 ELSE 0 END")), 'optimizedContent'],
                    [models_1.Website.sequelize.fn('AVG', models_1.Website.sequelize.col('word_count')), 'avgWordCount']
                ],
                raw: true
            });
            // Get scan history
            const scanStats = await models_1.Scan.findAll({
                where: { websiteId: id },
                attributes: [
                    [models_1.Website.sequelize.fn('COUNT', '*'), 'totalScans'],
                    [models_1.Website.sequelize.fn('COUNT', models_1.Website.sequelize.literal("CASE WHEN status = 'completed' THEN 1 END")), 'completedScans'],
                    [models_1.Website.sequelize.fn('COUNT', models_1.Website.sequelize.literal("CASE WHEN status = 'failed' THEN 1 END")), 'failedScans']
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
}
exports.WebsiteController = WebsiteController;
//# sourceMappingURL=website.controller.js.map