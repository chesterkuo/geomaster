import sequelize from '../config/database';
import User from './User';
import Organization from './Organization';
import UserOrganization from './UserOrganization';
import Website from './Website';
import Scan from './Scan';
import Content from './Content';
import AITrackingResult from './AITrackingResult';

// Define associations
// User-Organization many-to-many relationship
User.belongsToMany(Organization, {
  through: UserOrganization,
  foreignKey: 'userId',
  otherKey: 'organizationId',
  as: 'organizations'
});

Organization.belongsToMany(User, {
  through: UserOrganization,
  foreignKey: 'organizationId',
  otherKey: 'userId',
  as: 'users'
});

// Direct associations with the junction table
User.hasMany(UserOrganization, {
  foreignKey: 'userId',
  as: 'userOrganizations'
});

Organization.hasMany(UserOrganization, {
  foreignKey: 'organizationId',
  as: 'organizationUsers'
});

UserOrganization.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserOrganization.belongsTo(Organization, {
  foreignKey: 'organizationId',
  as: 'organization'
});

// Organization-Website one-to-many relationship
Organization.hasMany(Website, {
  foreignKey: 'organization_id',
  as: 'websites'
});

Website.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Website-Scan one-to-many relationship
Website.hasMany(Scan, {
  foreignKey: 'website_id',
  as: 'scans'
});

Scan.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Website-Content one-to-many relationship
Website.hasMany(Content, {
  foreignKey: 'website_id',
  as: 'contents'
});

Content.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Website-AITrackingResult one-to-many relationship
Website.hasMany(AITrackingResult, {
  foreignKey: 'website_id',
  as: 'trackingResults'
});

AITrackingResult.belongsTo(Website, {
  foreignKey: 'website_id',
  as: 'website'
});

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('Database synchronized successfully.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export {
  sequelize,
  User,
  Organization,
  UserOrganization,
  Website,
  Scan,
  Content,
  AITrackingResult
};