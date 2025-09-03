import sequelize from '../config/database';
import User from './User';
import Organization from './Organization';
import Website from './Website';
import Scan from './Scan';
import Content from './Content';
import AITrackingResult from './AITrackingResult';

// Define associations
// User-Organization many-to-many relationship
User.belongsToMany(Organization, {
  through: 'user_organizations',
  foreignKey: 'user_id',
  otherKey: 'organization_id',
  as: 'organizations'
});

Organization.belongsToMany(User, {
  through: 'user_organizations',
  foreignKey: 'organization_id',
  otherKey: 'user_id',
  as: 'users'
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
      await sequelize.sync({ alter: true });
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
  Website,
  Scan,
  Content,
  AITrackingResult
};