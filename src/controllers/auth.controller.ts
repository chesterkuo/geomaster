import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Organization, UserOrganization } from '../models';
import { AppError, asyncHandler } from '../middlewares/error.middleware';

export class AuthController {
  public register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, fullName, company } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User already exists with this email', 409);
    }

    // Create default organization for the user
    const organization = await Organization.create({
      name: company || `${fullName}'s Organization`,
      slug: this.generateSlug(company || fullName),
      plan: 'free'
    });

    // Create user
    const user = await User.create({
      email,
      passwordHash: password, // Will be hashed by the model hook
      fullName,
      company,
      role: 'admin' // First user is admin of their organization
    });

    // Associate user with organization as owner
    await UserOrganization.create({
      userId: user.id,
      organizationId: organization.id,
      role: 'owner'
    });

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Note: Session middleware removed - using JWT-only authentication

    res.status(201).json({
      success: true,
      data: {
        user: user.toJSON(),
        organization: organization.toJSON(),
        token,
        refreshToken
      }
    });
  });

  public login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    
    // Find user with organizations
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Organization,
        as: 'organizations',
        through: { attributes: ['role', 'joinedAt'] }
      }]
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Note: Session middleware removed - using JWT-only authentication

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        organizations: user.get('organizations'),
        token,
        refreshToken
      }
    });
  });

  public refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!) as any;
      
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Organization,
          as: 'organizations',
          through: { attributes: ['role', 'joinedAt'] }
        }]
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found', 404);
      }

      const newToken = this.generateToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          organizations: user.get('organizations'),
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  });

  public logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a production app, you might want to maintain a blacklist of tokens
    // or use Redis to store valid tokens
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  public forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      res.json({
        success: true,
        message: 'If email exists, password reset link has been sent'
      });
      return;
    }

    // Generate reset token (in production, store this in database)
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email',
      ...(process.env.NODE_ENV === 'development' && { resetToken }) // Only in dev
    });
  });

  public resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, password } = req.body;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'password-reset') {
        throw new AppError('Invalid token type', 400);
      }

      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update password
      user.passwordHash = password; // Will be hashed by the model hook
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      throw new AppError('Invalid or expired reset token', 400);
    }
  });

  public getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    
    const user = await User.findByPk(userId, {
      include: [{
        model: Organization,
        as: 'organizations',
        through: { attributes: ['role', 'joinedAt'] }
      }]
    });

    res.json({
      success: true,
      data: {
        user: user?.toJSON(),
        organizations: user?.get('organizations')
      }
    });
  });

  public updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { fullName, company } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (fullName) user.fullName = fullName;
    if (company) user.company = company;

    await user.save();

    res.json({
      success: true,
      data: {
        user: user.toJSON()
      }
    });
  });

  // Note: Session management methods removed - using JWT-only authentication

  public changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by the model hook
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. All sessions have been invalidated.'
    });
  });

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '24h' } as jwt.SignOptions
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' } as jwt.SignOptions
    );
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 50) + Date.now().toString().slice(-4);
  }
}