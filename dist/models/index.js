"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AITrackingResult = exports.Content = exports.Scan = exports.Website = exports.Organization = exports.User = exports.sequelize = exports.initializeDatabase = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.sequelize = database_1.default;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Organization_1 = __importDefault(require("./Organization"));
exports.Organization = Organization_1.default;
const Website_1 = __importDefault(require("./Website"));
exports.Website = Website_1.default;
const Scan_1 = __importDefault(require("./Scan"));
exports.Scan = Scan_1.default;
const Content_1 = __importDefault(require("./Content"));
exports.Content = Content_1.default;
const AITrackingResult_1 = __importDefault(require("./AITrackingResult"));
exports.AITrackingResult = AITrackingResult_1.default;
// Define associations
// User-Organization many-to-many relationship
User_1.default.belongsToMany(Organization_1.default, {
    through: 'user_organizations',
    foreignKey: 'user_id',
    otherKey: 'organization_id',
    as: 'organizations'
});
Organization_1.default.belongsToMany(User_1.default, {
    through: 'user_organizations',
    foreignKey: 'organization_id',
    otherKey: 'user_id',
    as: 'users'
});
// Organization-Website one-to-many relationship
Organization_1.default.hasMany(Website_1.default, {
    foreignKey: 'organization_id',
    as: 'websites'
});
Website_1.default.belongsTo(Organization_1.default, {
    foreignKey: 'organization_id',
    as: 'organization'
});
// Website-Scan one-to-many relationship
Website_1.default.hasMany(Scan_1.default, {
    foreignKey: 'website_id',
    as: 'scans'
});
Scan_1.default.belongsTo(Website_1.default, {
    foreignKey: 'website_id',
    as: 'website'
});
// Website-Content one-to-many relationship
Website_1.default.hasMany(Content_1.default, {
    foreignKey: 'website_id',
    as: 'contents'
});
Content_1.default.belongsTo(Website_1.default, {
    foreignKey: 'website_id',
    as: 'website'
});
// Website-AITrackingResult one-to-many relationship
Website_1.default.hasMany(AITrackingResult_1.default, {
    foreignKey: 'website_id',
    as: 'trackingResults'
});
AITrackingResult_1.default.belongsTo(Website_1.default, {
    foreignKey: 'website_id',
    as: 'website'
});
// Initialize database
const initializeDatabase = async () => {
    try {
        await database_1.default.authenticate();
        console.log('Database connection established successfully.');
        // Sync models in development
        if (process.env.NODE_ENV === 'development') {
            await database_1.default.sync({ alter: true });
            console.log('Database synchronized successfully.');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=index.js.map