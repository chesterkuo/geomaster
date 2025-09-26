import db from '../config/database';
import { QueryTypes } from 'sequelize';
import * as crypto from 'crypto';
import { sendEmail } from '../utils/emailService';

interface TeamMember {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string | null;
  avatar: string | null;
  joinedAt: string;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: string;
  message: string | null;
  token: string;
  organizationId?: string;
  organizationName?: string;
}

interface ActivityLog {
  id: number;
  userId: string | null;
  action: string;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: any;
  user?: {
    fullName: string;
    email: string;
  };
}

interface PaginationOptions {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
  userId?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export class TeamService {
  // Helper function to safely parse JSON
  private safeJSONParse(data: any): any {
    if (data === null || data === undefined) {
      return null;
    }
    if (typeof data === 'object') {
      return data; // Already parsed
    }
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return null;
  }

  // Role definitions with permissions
  private roleDefinitions = {
    owner: {
      displayName: 'Owner',
      description: 'Full system control, including billing and organization management',
      permissions: [
        'user.manage', 'user.invite', 'settings.manage', 'billing.manage',
        'content.edit', 'reports.view', 'reports.export', 'analytics.view', 'keywords.manage'
      ]
    },
    admin: {
      displayName: 'Administrator',
      description: 'Full system access, can manage all features and users',
      permissions: [
        'user.manage', 'user.invite', 'settings.manage',
        'content.edit', 'reports.view', 'reports.export', 'analytics.view', 'keywords.manage'
      ]
    },
    editor: {
      displayName: 'Editor',
      description: 'Can edit content and view reports, limited management permissions',
      permissions: ['content.edit', 'reports.view', 'reports.export', 'analytics.view', 'keywords.manage']
    },
    viewer: {
      displayName: 'Viewer',
      description: 'Can view reports and data, basic operation permissions',
      permissions: ['reports.view', 'analytics.view']
    },
    member: {
      displayName: 'Member',
      description: 'Can view reports and data, basic operation permissions',
      permissions: ['reports.view', 'analytics.view']
    }
  };

  // Get team members for an organization
  async getMembers(organizationId: string, options: PaginationOptions): Promise<{
    members: TeamMember[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, search, role } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE uo.organization_id = ?';
    const params: any[] = [organizationId];

    if (search) {
      whereClause += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role && role !== '') {
      whereClause += ' AND uo.role = ?';
      params.push(role);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total 
       FROM user_organizations uo 
       JOIN users u ON uo.user_id = u.id 
       ${whereClause}`,
      {
        replacements: params,
        type: QueryTypes.SELECT
      }
    ) as any[];
    const total = countResult[0].total;

    // Get members with pagination
    const rows = await db.query(
      `SELECT 
        u.id,
        u.full_name as name,
        u.email,
        uo.role,
        COALESCE(uo.status, 'active') as status,
        u.last_login_at as lastLogin,
        NULL as avatar,
        uo.joined_at as joinedAt
       FROM user_organizations uo
       JOIN users u ON uo.user_id = u.id
       ${whereClause}
       ORDER BY uo.joined_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...params, limit, offset],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const members: TeamMember[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      fullName: row.name, // Since we're aliasing u.fullName as name, we use it for both fields
      email: row.email,
      role: row.role,
      status: row.status,
      lastLogin: row.lastLogin,
      avatar: row.avatar,
      joinedAt: row.joinedAt
    }));

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update team member
  async updateMember(userId: string, organizationId: string, updates: { role?: string; status?: string }): Promise<TeamMember> {
    // Check if member exists in organization
    const memberCheck = await db.query(
      'SELECT * FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      {
        replacements: [userId, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (memberCheck.length === 0) {
      throw new Error('Member not found in organization');
    }

    // Prevent changing owner role
    if (memberCheck[0].role === 'owner' && updates.role && updates.role !== 'owner') {
      throw new Error('Cannot change owner role');
    }

    // Update member
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.role) {
      updateFields.push('role = ?');
      updateValues.push(updates.role);
    }

    if (updates.status) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updateFields.length > 0) {
      await db.query(
        `UPDATE user_organizations SET ${updateFields.join(', ')}, updated_at = NOW() 
         WHERE user_id = ? AND organization_id = ?`,
        {
          replacements: [...updateValues, userId, organizationId],
          type: QueryTypes.UPDATE
        }
      );
    }

    // Return updated member info
    const updatedMember = await db.query(
      `SELECT 
        u.id,
        u.full_name as name,
        u.full_name as fullName,
        u.email,
        uo.role,
        COALESCE(uo.status, 'active') as status,
        u.last_login_at as lastLogin,
        NULL as avatar,
        uo.joined_at as joinedAt
       FROM user_organizations uo
       JOIN users u ON uo.user_id = u.id
       WHERE uo.user_id = ? AND uo.organization_id = ?`,
      {
        replacements: [userId, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    return {
      id: updatedMember[0].id,
      name: updatedMember[0].name,
      fullName: updatedMember[0].fullName,
      email: updatedMember[0].email,
      role: updatedMember[0].role,
      status: updatedMember[0].status,
      lastLogin: updatedMember[0].lastLogin,
      avatar: updatedMember[0].avatar,
      joinedAt: updatedMember[0].joinedAt
    };
  }

  // Remove team member
  async removeMember(userId: string, organizationId: string): Promise<{ fullName: string }> {
    // Check if member exists and get info
    const memberInfo = await db.query(
      `SELECT u.full_name as fullName, uo.role 
       FROM user_organizations uo
       JOIN users u ON uo.user_id = u.id
       WHERE uo.user_id = ? AND uo.organization_id = ?`,
      {
        replacements: [userId, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (memberInfo.length === 0) {
      throw new Error('Member not found in organization');
    }

    if (memberInfo[0].role === 'owner') {
      throw new Error('Cannot remove organization owner');
    }

    // Remove from organization
    await db.query(
      'DELETE FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      {
        replacements: [userId, organizationId],
        type: QueryTypes.DELETE
      }
    );

    return { fullName: memberInfo[0].fullName };
  }

  // Get available roles
  getAvailableRoles() {
    return Object.entries(this.roleDefinitions).map(([name, config]) => ({
      name,
      displayName: config.displayName,
      description: config.description,
      permissions: config.permissions
    }));
  }

  // Check if user has specific permission
  async hasPermission(userId: string, organizationId: string, permission: string): Promise<boolean> {
    const userRole = await db.query(
      'SELECT role FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      {
        replacements: [userId, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (userRole.length === 0) {
      return false;
    }

    const role = userRole[0].role;
    const roleConfig = this.roleDefinitions[role as keyof typeof this.roleDefinitions];
    
    return roleConfig ? roleConfig.permissions.includes(permission) : false;
  }

  // Get invitations
  async getInvitations(organizationId: string, options: PaginationOptions): Promise<{
    invitations: Invitation[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, status } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.organizationId = ?';
    const params: any[] = [organizationId];

    if (status && status !== '') {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM invitations i ${whereClause}`,
      {
        replacements: params,
        type: QueryTypes.SELECT
      }
    ) as any[];
    const total = countResult[0].total;

    // Get invitations with pagination
    const rows = await db.query(
      `SELECT 
        i.id,
        i.email,
        i.role,
        i.status,
        i.createdAt as sentDate,
        i.expiresAt as expiresAt,
        i.message,
        u.full_name as invitedBy
       FROM invitations i
       JOIN users u ON i.invitedBy = u.id
       ${whereClause}
       ORDER BY i.createdAt DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...params, limit, offset],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const invitations: Invitation[] = rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.sentDate,
      expiresAt: row.expiresAt,
      invitedBy: row.invitedBy,
      message: row.message,
      token: '' // Don't expose token in list
    }));

    return {
      invitations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Send invitation
  async sendInvitation(data: {
    organizationId: string;
    email: string;
    role: string;
    message?: string;
    invitedBy: string;
  }): Promise<Invitation> {
    const { organizationId, email, role, message, invitedBy } = data;

    // Check if user already exists in organization
    const existingUser = await db.query(
      `SELECT uo.* FROM user_organizations uo
       JOIN users u ON uo.user_id = u.id
       WHERE u.email = ? AND uo.organization_id = ?`,
      {
        replacements: [email, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (existingUser.length > 0) {
      throw new Error('User is already a member of this organization');
    }

    // Check for pending invitation
    const pendingInvite = await db.query(
      'SELECT * FROM invitations WHERE email = ? AND organizationId = ? AND status = ?',
      {
        replacements: [email, organizationId, 'pending'],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (pendingInvite.length > 0) {
      throw new Error('Invitation already sent to this email');
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert invitation
    const result = await db.query(
      `INSERT INTO invitations (organizationId, email, role, token, expiresAt, invitedBy, message, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      {
        replacements: [organizationId, email, role, token, expiresAt, invitedBy, message || null],
        type: QueryTypes.INSERT
      }
    ) as any[];

    // Get organization info for email
    const orgInfo = await db.query(
      'SELECT name FROM organizations WHERE id = ?',
      {
        replacements: [organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: `Invitation to join ${orgInfo[0].name} on GEO Platform`,
        template: 'team-invitation',
        data: {
          organizationName: orgInfo[0].name,
          role: this.roleDefinitions[role as keyof typeof this.roleDefinitions]?.displayName || role,
          inviteUrl: `${process.env.FRONTEND_URL}/invite/${token}`,
          message: message || '',
          expiresAt: expiresAt.toLocaleDateString('zh-TW')
        }
      });
    } catch (emailError) {
      console.warn('Failed to send invitation email:', emailError);
      // Don't fail the invitation creation if email fails
    }

    return {
      id: result[0] || 0,
      email,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      invitedBy: '',
      message: message || null,
      token
    };
  }

  // Resend invitation
  async resendInvitation(invitationId: number, organizationId: string): Promise<Invitation> {
    const invitation = await db.query(
      'SELECT * FROM invitations WHERE id = ? AND organizationId = ? AND status = ?',
      {
        replacements: [invitationId, organizationId, 'pending'],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (invitation.length === 0) {
      throw new Error('Invitation not found or already processed');
    }

    // Update expiration date
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.query(
      'UPDATE invitations SET expiresAt = ?, updatedAt = NOW() WHERE id = ?',
      {
        replacements: [newExpiresAt, invitationId],
        type: QueryTypes.UPDATE
      }
    );

    // Resend email (similar to sendInvitation)
    // Implementation would be similar to sendInvitation email logic

    return invitation[0] as Invitation;
  }

  // Cancel invitation
  async cancelInvitation(invitationId: number, organizationId: string): Promise<Invitation> {
    const invitation = await db.query(
      'SELECT * FROM invitations WHERE id = ? AND organizationId = ? AND status = ?',
      {
        replacements: [invitationId, organizationId, 'pending'],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (invitation.length === 0) {
      throw new Error('Invitation not found or already processed');
    }

    await db.query(
      'UPDATE invitations SET status = ?, updatedAt = NOW() WHERE id = ?',
      {
        replacements: ['cancelled', invitationId],
        type: QueryTypes.UPDATE
      }
    );

    return invitation[0] as Invitation;
  }

  // Get activity logs
  async getActivityLogs(organizationId: string, options: PaginationOptions): Promise<{
    activities: ActivityLog[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const { page, limit, userId, action, dateFrom, dateTo } = options;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.organizationId = ?';
    const params: any[] = [organizationId];

    if (userId) {
      whereClause += ' AND a.userId = ?';
      params.push(userId);
    }

    if (action && action !== '') {
      whereClause += ' AND a.action LIKE ?';
      params.push(`%${action}%`);
    }

    if (dateFrom) {
      whereClause += ' AND a.createdAt >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND a.createdAt <= ?';
      params.push(dateTo);
    }

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM activity_logs a ${whereClause}`,
      {
        replacements: params,
        type: QueryTypes.SELECT
      }
    ) as any[];
    const total = countResult[0].total;

    // Get activity logs with pagination
    const rows = await db.query(
      `SELECT 
        a.id,
        a.userId as userId,
        u.full_name as userName,
        a.action,
        a.description,
        a.ipAddress as ipAddress,
        a.userAgent as userAgent,
        a.createdAt as timestamp,
        a.metadata
       FROM activity_logs a
       LEFT JOIN users u ON a.userId = u.id
       ${whereClause}
       ORDER BY a.createdAt DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...params, limit, offset],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const activities: ActivityLog[] = rows.map((row: any) => ({
      id: row.id,
      userId: row.userId,
      action: row.action,
      description: row.description,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      createdAt: row.timestamp,
      metadata: this.safeJSONParse(row.metadata),
      user: row.userName ? {
        fullName: row.userName,
        email: ''
      } : undefined
    }));

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get invitation by token (for invitation acceptance page)
  async getInvitationByToken(token: string): Promise<Invitation | null> {
    const rows = await db.query(
      `SELECT 
        i.id,
        i.email,
        i.role,
        i.status,
        i.createdAt,
        i.expiresAt,
        i.message,
        i.organizationId,
        o.name as organizationName,
        u.full_name as invitedBy
       FROM invitations i
       JOIN organizations o ON i.organizationId = o.id
       JOIN users u ON i.invitedBy = u.id
       WHERE i.token = ? AND i.status = 'pending'`,
      {
        replacements: [token],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    
    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(row.expiresAt);
    if (now > expiresAt) {
      // Mark as expired
      await db.query(
        'UPDATE invitations SET status = ? WHERE token = ?',
        {
          replacements: ['expired', token],
          type: QueryTypes.UPDATE
        }
      );
      return null;
    }

    return {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      invitedBy: row.invitedBy,
      message: row.message,
      token,
      organizationId: row.organizationId,
      organizationName: row.organizationName
    };
  }

  // Accept invitation - create user account and add to organization
  async acceptInvitation(token: string, userData: {
    fullName: string;
    password: string;
  }): Promise<{ user: any; organization: any }> {
    // First, get the invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error('Invitation not found or has expired');
    }

    const { email, role, organizationId } = invitation;

    // Check if user already exists with this email
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = ?',
      {
        replacements: [email],
        type: QueryTypes.SELECT
      }
    ) as any[];

    let userId: string;

    if (existingUser.length > 0) {
      // User exists, just add to organization
      userId = existingUser[0].id;
    } else {
      // Create new user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const { v4: uuidv4 } = require('uuid');
      
      userId = uuidv4();
      
      await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, is_active, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, true, true, NOW(), NOW())`,
        {
          replacements: [userId, email, hashedPassword, userData.fullName],
          type: QueryTypes.INSERT
        }
      );
    }

    // Check if user is already a member of this organization
    const existingMembership = await db.query(
      'SELECT id FROM user_organizations WHERE user_id = ? AND organization_id = ?',
      {
        replacements: [userId, organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (existingMembership.length === 0) {
      // Add user to organization
      await db.query(
        `INSERT INTO user_organizations (user_id, organization_id, role, status, joined_at, created_at, updated_at)
         VALUES (?, ?, ?, 'active', NOW(), NOW(), NOW())`,
        {
          replacements: [userId, organizationId, role],
          type: QueryTypes.INSERT
        }
      );
    }

    // Mark invitation as accepted
    await db.query(
      'UPDATE invitations SET status = ?, updated_at = NOW() WHERE token = ?',
      {
        replacements: ['accepted', token],
        type: QueryTypes.UPDATE
      }
    );

    // Get user and organization data
    const userResult = await db.query(
      'SELECT id, email, full_name as fullName, created_at as createdAt FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const orgResult = await db.query(
      'SELECT id, name, slug FROM organizations WHERE id = ?',
      {
        replacements: [organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    return {
      user: userResult[0],
      organization: orgResult[0]
    };
  }
}