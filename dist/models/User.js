"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class User extends sequelize_1.Model {
    // Instance methods
    async validatePassword(password) {
        return bcryptjs_1.default.compare(password, this.passwordHash);
    }
    toJSON() {
        const values = { ...this.get() };
        const { passwordHash, ...userValues } = values;
        return userValues;
    }
}
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash'
    },
    fullName: {
        type: sequelize_1.DataTypes.STRING(255),
        field: 'full_name'
    },
    company: {
        type: sequelize_1.DataTypes.STRING(255)
    },
    role: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.USER_ROLES)),
        defaultValue: constants_1.USER_ROLES.USER
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    emailVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified'
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'last_login_at'
    }
}, {
    sequelize: database_1.default,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash) {
                user.passwordHash = await bcryptjs_1.default.hash(user.passwordHash, 10);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash')) {
                user.passwordHash = await bcryptjs_1.default.hash(user.passwordHash, 10);
            }
        }
    }
});
exports.default = User;
//# sourceMappingURL=User.js.map