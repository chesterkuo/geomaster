import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Organization } from '../models';

interface AuthRequest extends Request {
  user?: any;
  organization?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Find user with organizations
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Organization,
        as: 'organizations',
        through: { attributes: ['role', 'joinedAt'] }
      }]
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requireOrganization = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const organizationId = req.headers['x-organization-id'] as string;
  
  if (!organizationId) {
    res.status(400).json({
      success: false,
      message: 'Organization ID required in X-Organization-ID header'
    });
    return;
  }

  try {
    // Check if user belongs to the organization
    const userOrganizations = req.user.organizations || [];
    const organization = userOrganizations.find((org: any) => org.id === organizationId);

    if (!organization) {
      res.status(403).json({
        success: false,
        message: 'User not authorized for this organization'
      });
      return;
    }

    req.organization = organization;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating organization access'
    });
  }
};