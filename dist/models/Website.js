"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Website extends sequelize_1.Model {
    // Instance methods
    needsScan() {
        if (!this.lastScanAt)
            return true;
        const now = new Date();
        const timeDiff = now.getTime() - this.lastScanAt.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        switch (this.scanFrequency) {
            case 'daily':
                return daysDiff >= 1;
            case 'weekly':
                return daysDiff >= 7;
            case 'monthly':
                return daysDiff >= 30;
            default:
                return false;
        }
    }
    async updateLastScan() {
        this.lastScanAt = new Date();
        await this.save();
    }
    getRootDomain() {
        try {
            const url = new URL(this.url);
            return url.hostname;
        }
        catch {
            return this.domain;
        }
    }
}
Website.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    organizationId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'organization_id',
        references: {
            model: 'organizations',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    url: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    domain: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255)
    },
    description: {
        type: sequelize_1.DataTypes.TEXT
    },
    settings: {
        type: sequelize_1.DataTypes.JSON
    },
    robotsTxtStatus: {
        type: sequelize_1.DataTypes.ENUM('allowed', 'blocked', 'partial', 'unknown'),
        defaultValue: 'unknown',
        field: 'robots_txt_status'
    },
    lastScanAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'last_scan_at'
    },
    scanFrequency: {
        type: sequelize_1.DataTypes.ENUM('daily', 'weekly', 'monthly'),
        defaultValue: 'weekly',
        field: 'scan_frequency'
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    sequelize: database_1.default,
    modelName: 'Website',
    tableName: 'websites',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: (website) => {
            try {
                const url = new URL(website.url);
                website.domain = url.hostname;
            }
            catch (error) {
                throw new Error('Invalid URL format');
            }
        },
        beforeUpdate: (website) => {
            if (website.changed('url')) {
                try {
                    const url = new URL(website.url);
                    website.domain = url.hostname;
                }
                catch (error) {
                    throw new Error('Invalid URL format');
                }
            }
        }
    }
});
exports.default = Website;
//# sourceMappingURL=Website.js.map