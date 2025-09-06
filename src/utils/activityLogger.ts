import db from '../config/database';
import { QueryTypes } from 'sequelize';

interface ActivityLogData {
  userId?: string | number;
  organizationId: string | number;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    await db.query(
      `INSERT INTO activity_logs (
        userId, 
        organizationId, 
        action, 
        description, 
        ipAddress, 
        userAgent, 
        metadata, 
        createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      {
        replacements: [
          data.userId || null,
          data.organizationId,
          data.action,
          data.description,
          data.ipAddress || null,
          data.userAgent || null,
          data.metadata ? JSON.stringify(data.metadata) : null
        ],
        type: QueryTypes.INSERT
      }
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error - logging failures shouldn't break the main functionality
  }
}