import { Request, Response } from 'express';
import { Keyword } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export class KeywordController {
  // GET /api/v1/keywords - List all keywords by type
  async getKeywords(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { type, page = 1, limit = 20, search } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        organizationId
      };

      // Filter by intent type if provided
      if (type && typeof type === 'string') {
        whereClause.intent = type;
      }

      // Search functionality
      if (search && typeof search === 'string') {
        whereClause.keyword = {
          [Op.like]: `%${search}%`
        };
      }

      const { count, rows: keywords } = await Keyword.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.json({
        success: true,
        data: {
          keywords,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching keywords:', error);
      return res.status(500).json({ error: 'Failed to fetch keywords' });
    }
  }

  // POST /api/v1/keywords - Add new keyword
  async createKeyword(req: AuthRequest, res: Response) {
    try {
      const organizationId = req.organization?.id;
      if (!organizationId) {
        return res.status(401).json({ error: 'Organization not found' });
      }

      const { keyword, searchVolume, difficulty, cpc, intent } = req.body;

      // Check if keyword already exists for this organization
      const existingKeyword = await Keyword.findOne({
        where: {
          organizationId,
          keyword: keyword.toLowerCase().trim()
        }
      });

      if (existingKeyword) {
        return res.status(409).json({ error: 'Keyword already exists for this organization' });
      }

      const newKeyword = await Keyword.create({
        organizationId,
        keyword: keyword.toLowerCase().trim(),
        searchVolume: searchVolume ? parseInt(searchVolume) : undefined,
        difficulty: difficulty ? parseFloat(difficulty) : undefined,
        cpc: cpc ? parseFloat(cpc) : undefined,
        intent
      });

      return res.status(201).json({
        success: true,
        data: newKeyword
      });
    } catch (error) {
      console.error('Error creating keyword:', error);
      return res.status(500).json({ error: 'Failed to create keyword' });
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
}