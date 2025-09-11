import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TeamService } from '../services/teamService';
import { logActivity } from '../utils/activityLogger';

export class TeamController {
  private teamService = new TeamService();

  // GET /api/v1/team/members - List all team members in current organization
  getMembers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const { page = 1, limit = 10, search = '', role = '' } = req.query;

      const result = await this.teamService.getMembers(organizationId, {
        page: Number(page),
        limit: Number(limit),
        search: String(search),
        role: String(role)
      });

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.members.list',
        description: 'Viewed team members list',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team members'
      });
    }
  };

  // PUT /api/v1/team/members/:id - Update team member role or status
  updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { role, status } = req.body;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Check if user has permission to manage members
      const hasPermission = await this.teamService.hasPermission(
        req.user!.id, 
        organizationId, 
        'user.manage'
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to manage team members'
        });
        return;
      }

      const updatedMember = await this.teamService.updateMember(
        id, 
        organizationId, 
        { role, status }
      );

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.member.update',
        description: `Updated member ${updatedMember.fullName} - Role: ${role}, Status: ${status}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { targetUserId: id, role, status }
      });

      res.json({
        success: true,
        message: 'Member updated successfully',
        data: updatedMember
      });
    } catch (error: any) {
      console.error('Error updating team member:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update team member'
      });
    }
  };

  // DELETE /api/v1/team/members/:id - Remove team member from organization
  removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Check if user has permission to manage members
      const hasPermission = await this.teamService.hasPermission(
        req.user!.id, 
        organizationId, 
        'user.manage'
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to remove team members'
        });
        return;
      }

      const removedMember = await this.teamService.removeMember(id, organizationId);

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.member.remove',
        description: `Removed member ${removedMember.fullName} from organization`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { targetUserId: id }
      });

      res.json({
        success: true,
        message: 'Member removed successfully'
      });
    } catch (error: any) {
      console.error('Error removing team member:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove team member'
      });
    }
  };

  // GET /api/v1/team/roles - List available roles and their permissions
  getRoles = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const roles = this.teamService.getAvailableRoles();

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get roles'
      });
    }
  };

  // GET /api/v1/team/invitations - List pending and sent invitations
  getInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const { page = 1, limit = 10, status = '' } = req.query;

      const result = await this.teamService.getInvitations(organizationId, {
        page: Number(page),
        limit: Number(limit),
        status: String(status)
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting invitations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get invitations'
      });
    }
  };

  // POST /api/v1/team/invitations - Send invitation to new team member
  sendInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { email, role, message } = req.body;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      // Check if user has permission to invite members
      const hasPermission = await this.teamService.hasPermission(
        req.user!.id, 
        organizationId, 
        'user.invite'
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to invite team members'
        });
        return;
      }

      const invitation = await this.teamService.sendInvitation({
        organizationId,
        email,
        role,
        message,
        invitedBy: req.user!.id
      });

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.invitation.send',
        description: `Sent invitation to ${email} with role ${role}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { email, role, invitationId: invitation.id }
      });

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          invitationId: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send invitation'
      });
    }
  };

  // POST /api/v1/team/invitations/:id/resend - Resend invitation email
  resendInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const invitation = await this.teamService.resendInvitation(Number(id), organizationId);

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.invitation.resend',
        description: `Resent invitation to ${invitation.email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { invitationId: id, email: invitation.email }
      });

      res.json({
        success: true,
        message: 'Invitation resent successfully'
      });
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resend invitation'
      });
    }
  };

  // DELETE /api/v1/team/invitations/:id - Cancel pending invitation
  cancelInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const invitation = await this.teamService.cancelInvitation(Number(id), organizationId);

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'team.invitation.cancel',
        description: `Cancelled invitation to ${invitation.email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { invitationId: id, email: invitation.email }
      });

      res.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel invitation'
      });
    }
  };

  // GET /api/v1/team/activity - Get team activity logs
  getActivity = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.organization?.id;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const { 
        page = 1, 
        limit = 20, 
        userId = '', 
        action = '',
        dateFrom = '',
        dateTo = ''
      } = req.query;

      const result = await this.teamService.getActivityLogs(organizationId, {
        page: Number(page),
        limit: Number(limit),
        userId: userId ? String(userId) : undefined,
        action: String(action),
        dateFrom: dateFrom ? new Date(String(dateFrom)) : undefined,
        dateTo: dateTo ? new Date(String(dateTo)) : undefined
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting activity logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get activity logs'
      });
    }
  };

  // GET /api/v1/invitations/:token - Get invitation details by token (public endpoint)
  getInvitationByToken = async (req: any, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      const invitation = await this.teamService.getInvitationByToken(token);

      res.json({
        success: true,
        data: {
          email: invitation?.email,
          role: invitation?.role,
          organizationName: invitation?.organizationName,
          message: invitation?.message,
          expiresAt: invitation?.expiresAt,
          invitedBy: invitation?.invitedBy
        }
      });
    } catch (error: any) {
      console.error('Error getting invitation by token:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get invitation'
      });
    }
  };

  // POST /api/v1/invitations/:token/accept - Accept invitation and create user account (public endpoint)
  acceptInvitation = async (req: any, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      const { fullName, password } = req.body;

      const result = await this.teamService.acceptInvitation(token, {
        fullName,
        password
      });

      await logActivity({
        userId: result.user.id,
        organizationId: result.organization.id,
        action: 'team.invitation.accept',
        description: `${result.user.fullName} accepted invitation and joined organization`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { 
          invitationToken: token,
          email: result.user.email,
          role: result.user.role
        }
      });

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            fullName: result.user.fullName
          },
          organization: result.organization,
          role: result.user.role
        }
      });
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept invitation'
      });
    }
  };
}