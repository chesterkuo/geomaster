import db from '../config/database';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

interface OrganizationSettings {
  company: {
    name: string;
    website?: string;
    timezone: string;
    language: string;
    currency: string;
  };
  preferences: {
    autoDataSync: boolean;
    dataRetentionMonths: number;
    defaultReportFormat: string;
  };
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordLastChanged: string | null;
  activeSessions: number;
  loginHistory: Array<{
    timestamp: string;
    ipAddress: string;
    location?: string;
    device: string;
  }>;
}

interface UserPreferences {
  appearance: {
    theme: string;
    compactMode: boolean;
    animations: boolean;
    language: string;
  };
  dashboard: {
    defaultView: string;
    itemsPerPage: number;
    chartColors?: string[];
  };
}

export class SettingsService {
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

  // Role definitions - same as TeamService for consistency
  private roleDefinitions = {
    owner: { permissions: ['user.manage', 'user.invite', 'settings.manage', 'billing.manage', 'content.edit', 'reports.view', 'reports.export', 'analytics.view', 'keywords.manage'] },
    admin: { permissions: ['user.manage', 'user.invite', 'settings.manage', 'content.edit', 'reports.view', 'reports.export', 'analytics.view', 'keywords.manage'] },
    editor: { permissions: ['content.edit', 'reports.view', 'analytics.view', 'keywords.manage'] },
    member: { permissions: ['reports.view', 'analytics.view'] }
  };

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

  // Get organization settings
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
    // Get organization basic info
    const orgInfo = await db.query(
      'SELECT name, website FROM organizations WHERE id = ?',
      {
        replacements: [organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (orgInfo.length === 0) {
      throw new Error('Organization not found');
    }

    // Get organization settings
    const settings = await db.query(
      'SELECT companyInfo, preferences FROM organization_settings WHERE organizationId = ?',
      {
        replacements: [organizationId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    let companyInfo = {
      name: orgInfo[0].name,
      website: orgInfo[0].website,
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      currency: 'TWD'
    };

    let preferences = {
      autoDataSync: true,
      dataRetentionMonths: 12,
      defaultReportFormat: 'pdf'
    };

    if (settings.length > 0) {
      if (settings[0].companyInfo) {
        const parsedCompanyInfo = this.safeJSONParse(settings[0].companyInfo);
        if (parsedCompanyInfo) companyInfo = { ...companyInfo, ...parsedCompanyInfo };
      }
      if (settings[0].preferences) {
        const parsedPreferences = this.safeJSONParse(settings[0].preferences);
        if (parsedPreferences) preferences = { ...preferences, ...parsedPreferences };
      }
    }

    return {
      company: companyInfo,
      preferences
    };
  }

  // Update organization settings
  async updateOrganizationSettings(organizationId: string, updates: any): Promise<OrganizationSettings> {
    const currentSettings = await this.getOrganizationSettings(organizationId);

    // Separate company info updates from preferences
    const companyUpdates: any = {};
    const preferenceUpdates: any = {};

    // Map updates to appropriate categories
    const companyFields = ['name', 'website', 'timezone', 'language', 'currency'];
    const preferenceFields = ['autoDataSync', 'dataRetentionMonths', 'defaultReportFormat'];

    Object.keys(updates).forEach(key => {
      if (companyFields.includes(key)) {
        companyUpdates[key] = updates[key];
      } else if (preferenceFields.includes(key)) {
        preferenceUpdates[key] = updates[key];
      }
    });

    // Update organization basic info if needed
    if (companyUpdates.name || companyUpdates.website) {
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (companyUpdates.name) {
        updateFields.push('name = ?');
        updateValues.push(companyUpdates.name);
      }
      if (companyUpdates.website) {
        updateFields.push('website = ?');
        updateValues.push(companyUpdates.website);
      }

      if (updateFields.length > 0) {
        await db.query(
          `UPDATE organizations SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
          {
            replacements: [...updateValues, organizationId],
            type: QueryTypes.UPDATE
          }
        );
      }
    }

    // Update organization settings
    const newCompanyInfo = { ...currentSettings.company, ...companyUpdates };
    const newPreferences = { ...currentSettings.preferences, ...preferenceUpdates };

    await db.query(
      `INSERT INTO organization_settings (organizationId, companyInfo, preferences, updatedAt) 
       VALUES (?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
       companyInfo = VALUES(companyInfo), 
       preferences = VALUES(preferences), 
       updatedAt = NOW()`,
      {
        replacements: [organizationId, JSON.stringify(newCompanyInfo), JSON.stringify(newPreferences)],
        type: QueryTypes.INSERT
      }
    );

    return {
      company: newCompanyInfo,
      preferences: newPreferences
    };
  }

  // Get security settings and status
  async getSecuritySettings(userId: string): Promise<SecuritySettings> {
    // Get user settings
    const userSettings = await db.query(
      'SELECT securitySettings FROM user_settings WHERE userId = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    let securitySettings = {
      twoFactorEnabled: false,
      sessionTimeout: 86400
    };

    if (userSettings.length > 0 && userSettings[0].securitySettings) {
      const parsedSettings = this.safeJSONParse(userSettings[0].securitySettings);
      if (parsedSettings) securitySettings = { ...securitySettings, ...parsedSettings };
    }

    // Get password last changed date
    const userInfo = await db.query(
      'SELECT updated_at FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    // Get recent login activity (simulated for now)
    const activityLogs = await db.query(
      `SELECT ipAddress, userAgent, createdAt 
       FROM activity_logs 
       WHERE userId = ? AND action LIKE '%login%' 
       ORDER BY createdAt DESC 
       LIMIT 10`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    const loginHistory = activityLogs.map((log: any) => ({
      timestamp: log.createdAt,
      ipAddress: log.ipAddress || 'Unknown',
      location: 'Taiwan', // Would need IP geolocation service
      device: this.parseUserAgent(log.userAgent)
    }));

    return {
      twoFactorEnabled: securitySettings.twoFactorEnabled,
      passwordLastChanged: userInfo[0]?.updated_at || null,
      activeSessions: 1, // Would track actual sessions in a real implementation
      loginHistory
    };
  }

  // Verify current password
  async verifyCurrentPassword(userId: string, password: string): Promise<boolean> {
    const user = await db.query(
      'SELECT password_hash FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (user.length === 0) {
      return false;
    }

    return bcrypt.compare(password, user[0].password_hash);
  }

  // Update password
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await db.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      {
        replacements: [hashedPassword, userId],
        type: QueryTypes.UPDATE
      }
    );
  }

  // Get active sessions (placeholder implementation)
  async getActiveSessions(userId: string): Promise<Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }>> {
    // This would be implemented with a proper session store in production
    return [
      {
        id: 'current',
        device: 'Chrome on Windows',
        location: 'Taipei, Taiwan',
        lastActive: new Date().toISOString(),
        current: true
      }
    ];
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    const settings = await db.query(
      'SELECT uiPreferences FROM user_settings WHERE userId = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    let preferences: UserPreferences = {
      appearance: {
        theme: 'dark',
        compactMode: false,
        animations: true,
        language: 'zh-TW'
      },
      dashboard: {
        defaultView: 'overview',
        itemsPerPage: 10,
        chartColors: ['#3b82f6', '#10b981', '#f59e0b']
      }
    };

    if (settings.length > 0 && settings[0].uiPreferences) {
      const storedPrefs = this.safeJSONParse(settings[0].uiPreferences);
      if (storedPrefs) {
        preferences = {
          appearance: { ...preferences.appearance, ...storedPrefs.appearance },
          dashboard: { ...preferences.dashboard, ...storedPrefs.dashboard }
        };
      }
    }

    return preferences;
  }

  // Update user preferences
  async updateUserPreferences(userId: string, updates: any): Promise<UserPreferences> {
    const currentPreferences = await this.getUserPreferences(userId);

    // Merge updates with current preferences
    const newPreferences: UserPreferences = {
      appearance: { ...currentPreferences.appearance },
      dashboard: { ...currentPreferences.dashboard }
    };

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'theme' || key === 'compactMode' || key === 'animations' || key === 'language') {
        (newPreferences.appearance as any)[key] = updates[key];
      } else if (key === 'defaultView' || key === 'itemsPerPage' || key === 'chartColors') {
        (newPreferences.dashboard as any)[key] = updates[key];
      }
    });

    // Save to database
    await db.query(
      `INSERT INTO user_settings (userId, uiPreferences, updatedAt) 
       VALUES (?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
       uiPreferences = VALUES(uiPreferences), 
       updatedAt = NOW()`,
      {
        replacements: [userId, JSON.stringify(newPreferences)],
        type: QueryTypes.INSERT
      }
    );

    return newPreferences;
  }

  // Enable 2FA - Generate QR code and secret
  async enable2FA(userId: string): Promise<{ qrCode: string; backupCodes: string[] }> {
    // Get user info for 2FA setup
    const user = await db.query(
      'SELECT email FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: user[0].email,
      issuer: 'GEO Platform',
      length: 32
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    // Store secret temporarily (would use Redis in production)
    await db.query(
      `INSERT INTO user_settings (userId, securitySettings, updatedAt) 
       VALUES (?, JSON_OBJECT('twoFactorSecret', ?, 'twoFactorBackupCodes', ?), NOW()) 
       ON DUPLICATE KEY UPDATE 
       securitySettings = JSON_MERGE(
         COALESCE(securitySettings, '{}'),
         JSON_OBJECT('twoFactorSecret', ?, 'twoFactorBackupCodes', ?)
       ), 
       updatedAt = NOW()`,
      {
        replacements: [userId, secret.base32, JSON.stringify(backupCodes), secret.base32, JSON.stringify(backupCodes)],
        type: QueryTypes.INSERT
      }
    );

    return { qrCode, backupCodes };
  }

  // Verify 2FA token
  async verify2FA(userId: string, token: string): Promise<boolean> {
    const settings = await db.query(
      'SELECT securitySettings FROM user_settings WHERE userId = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    ) as any[];

    if (settings.length === 0 || !settings[0].securitySettings) {
      return false;
    }

    const securitySettings = this.safeJSONParse(settings[0].securitySettings);
    
    if (!securitySettings || !securitySettings.twoFactorSecret) {
      return false;
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: securitySettings.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      // Enable 2FA permanently
      await db.query(
        `UPDATE user_settings 
         SET securitySettings = JSON_SET(
           COALESCE(securitySettings, '{}'),
           '$.twoFactorEnabled', true
         ),
         updatedAt = NOW()
         WHERE userId = ?`,
        {
          replacements: [userId],
          type: QueryTypes.UPDATE
        }
      );
    }

    return verified;
  }

  // Disable 2FA
  async disable2FA(userId: string): Promise<void> {
    await db.query(
      `UPDATE user_settings 
       SET securitySettings = JSON_SET(
         COALESCE(securitySettings, '{}'),
         '$.twoFactorEnabled', false,
         '$.twoFactorSecret', null,
         '$.twoFactorBackupCodes', null
       ),
       updatedAt = NOW()
       WHERE userId = ?`,
      {
        replacements: [userId],
        type: QueryTypes.UPDATE
      }
    );
  }

  // Parse user agent to get device info
  private parseUserAgent(userAgent: string): string {
    if (!userAgent) return 'Unknown Device';

    if (userAgent.includes('Chrome')) return 'Chrome on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux');
    if (userAgent.includes('Firefox')) return 'Firefox on ' + (userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : 'Linux');
    if (userAgent.includes('Safari')) return 'Safari on ' + (userAgent.includes('Mac') ? 'macOS' : 'iOS');
    if (userAgent.includes('Edge')) return 'Edge on Windows';

    return 'Unknown Device';
  }
}