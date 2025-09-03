"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Organization extends sequelize_1.Model {
    // Instance methods
    hasCredits(required = 1) {
        return this.credits >= required;
    }
    async useCredits(amount) {
        this.credits = Math.max(0, this.credits - amount);
        await this.save();
    }
    async addCredits(amount) {
        this.credits += amount;
        await this.save();
    }
    canAddWebsite() {
        return this.maxWebsites === -1; // Unlimited
    }
    canAddUser() {
        return this.maxUsers === -1; // Unlimited
    }
}
Organization.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false
    },
    slug: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isAlphanumeric: true,
            isLowercase: true
        }
    },
    plan: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.ORGANIZATION_PLANS)),
        defaultValue: constants_1.ORGANIZATION_PLANS.FREE
    },
    credits: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 100
    },
    maxUsers: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 5,
        field: 'max_users'
    },
    maxWebsites: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 3,
        field: 'max_websites'
    },
    settings: {
        type: sequelize_1.DataTypes.JSON
    },
    stripeCustomerId: {
        type: sequelize_1.DataTypes.STRING(255),
        field: 'stripe_customer_id'
    },
    stripeSubscriptionId: {
        type: sequelize_1.DataTypes.STRING(255),
        field: 'stripe_subscription_id'
    },
    trialEndsAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'trial_ends_at'
    }
}, {
    sequelize: database_1.default,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: (org) => {
            if (!org.slug) {
                org.slug = org.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            }
        }
    }
});
exports.default = Organization;
//# sourceMappingURL=Organization.js.map