import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { SettingsService } from '../services/settingsService';
import { logActivity } from '../utils/activityLogger';
import bcrypt from 'bcrypt';

export class SettingsController {
  private settingsService = new SettingsService();

  // GET /api/v1/settings/organization - Get organization/company settings
  getOrganizationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;

      const settings = await this.settingsService.getOrganizationSettings(organizationId);

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting organization settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get organization settings'
      });
    }
  };

  // PUT /api/v1/settings/organization - Update organization settings
  updateOrganizationSettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const organizationId = req.headers['x-organization-id'] as string;
      const updates = req.body;

      // Check if user has permission to manage settings
      const hasPermission = await this.settingsService.hasPermission(
        req.user!.id, 
        organizationId, 
        'settings.manage'
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: 'You do not have permission to manage organization settings'
        });
        return;
      }

      const updatedSettings = await this.settingsService.updateOrganizationSettings(
        organizationId, 
        updates
      );

      await logActivity({
        userId: req.user!.id,
        organizationId: organizationId,
        action: 'settings.organization.update',
        description: 'Updated organization settings',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { updates: Object.keys(updates) }
      });

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings
      });
    } catch (error: any) {
      console.error('Error updating organization settings:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update organization settings'
      });
    }
  };

  // GET /api/v1/settings/security - Get security settings and status
  getSecuritySettings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const securityInfo = await this.settingsService.getSecuritySettings(userId);

      res.json({
        success: true,
        data: securityInfo
      });
    } catch (error) {
      console.error('Error getting security settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get security settings'
      });
    }
  };

  // PUT /api/v1/settings/password - Change user password
  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await this.settingsService.verifyCurrentPassword(
        userId, 
        currentPassword
      );

      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await this.settingsService.updatePassword(userId, hashedNewPassword);

      await logActivity({
        userId,
        organizationId: req.headers['x-organization-id'] as string || '0',
        action: 'security.password.change',
        description: 'Password changed successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password'
      });
    }
  };

  // GET /api/v1/settings/security/sessions - List active sessions
  getActiveSessions = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const organizationId = req.headers['x-organization-id'] as string;

      const sessions = await this.settingsService.getActiveSessions(userId);

      res.json({
        success: true,
        data: { sessions }
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active sessions'
      });
    }
  };

  // GET /api/v1/settings/preferences - Get user interface preferences
  getUserPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      const preferences = await this.settingsService.getUserPreferences(userId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      console.error('Error getting user preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user preferences'
      });
    }
  };

  // PUT /api/v1/settings/preferences - Update user preferences
  updateUserPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const organizationId = req.headers['x-organization-id'] as string;
      const updates = req.body;

      const updatedPreferences = await this.settingsService.updateUserPreferences(
        userId, 
        updates
      );

      await logActivity({
        userId,
        organizationId: organizationId,
        action: 'settings.preferences.update',
        description: 'Updated user preferences',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: { updates: Object.keys(updates) }
      });

      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: updatedPreferences
      });
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update user preferences'
      });
    }
  };

  // POST /api/v1/settings/2fa/enable - Enable two-factor authentication
  enable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const organizationId = req.headers['x-organization-id'] as string;

      const twoFactorData = await this.settingsService.enable2FA(userId);

      await logActivity({
        userId,
        organizationId: organizationId,
        action: 'security.2fa.enable',
        description: 'Started 2FA setup process',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: '2FA setup initiated',
        data: twoFactorData
      });
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to enable 2FA'
      });
    }
  };

  // POST /api/v1/settings/2fa/verify - Verify and activate 2FA
  verify2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { token } = req.body;
      const userId = req.user!.id;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!token || token.length !== 6) {
        res.status(400).json({
          success: false,
          message: 'Valid 6-digit token is required'
        });
        return;
      }

      const isValid = await this.settingsService.verify2FA(userId, token);

      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
        return;
      }

      await logActivity({
        userId,
        organizationId: organizationId,
        action: 'security.2fa.verify',
        description: '2FA enabled successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to verify 2FA'
      });
    }
  };

  // DELETE /api/v1/settings/2fa - Disable two-factor authentication
  disable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;
      const userId = req.user!.id;
      const organizationId = req.headers['x-organization-id'] as string;

      if (!token || !password) {
        res.status(400).json({
          success: false,
          message: '2FA token and password are required'
        });
        return;
      }

      // Verify password and 2FA token
      const isValid = await this.settingsService.verifyCurrentPassword(userId, password);
      if (!isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid password'
        });
        return;
      }

      const is2FAValid = await this.settingsService.verify2FA(userId, token);
      if (!is2FAValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid 2FA token'
        });
        return;
      }

      await this.settingsService.disable2FA(userId);

      await logActivity({
        userId,
        organizationId: organizationId,
        action: 'security.2fa.disable',
        description: '2FA disabled successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to disable 2FA'
      });
    }
  };
}