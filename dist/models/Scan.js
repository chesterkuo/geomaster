"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class Scan extends sequelize_1.Model {
    // Instance methods
    async updateProgress(progress) {
        this.progress = Math.min(100, Math.max(0, progress));
        await this.save();
    }
    async markAsStarted() {
        this.status = constants_1.SCAN_STATUS.RUNNING;
        this.startedAt = new Date();
        await this.save();
    }
    async markAsCompleted(results) {
        this.status = constants_1.SCAN_STATUS.COMPLETED;
        this.progress = 100;
        this.completedAt = new Date();
        this.results = results;
        await this.save();
    }
    async markAsFailed(errorMessage) {
        this.status = constants_1.SCAN_STATUS.FAILED;
        this.errorMessage = errorMessage;
        await this.save();
    }
    getDuration() {
        if (!this.startedAt)
            return null;
        const endTime = this.completedAt || new Date();
        return endTime.getTime() - this.startedAt.getTime();
    }
    isCompleted() {
        return this.status === constants_1.SCAN_STATUS.COMPLETED;
    }
    isFailed() {
        return this.status === constants_1.SCAN_STATUS.FAILED;
    }
    isRunning() {
        return this.status === constants_1.SCAN_STATUS.RUNNING;
    }
}
Scan.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    websiteId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        field: 'website_id',
        references: {
            model: 'websites',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    scanType: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SCAN_TYPES)),
        defaultValue: constants_1.SCAN_TYPES.STANDARD,
        field: 'scan_type'
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.SCAN_STATUS)),
        defaultValue: constants_1.SCAN_STATUS.PENDING
    },
    progress: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 100
        }
    },
    startedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'started_at'
    },
    completedAt: {
        type: sequelize_1.DataTypes.DATE,
        field: 'completed_at'
    },
    errorMessage: {
        type: sequelize_1.DataTypes.TEXT,
        field: 'error_message'
    },
    results: {
        type: sequelize_1.DataTypes.JSON
    }
}, {
    sequelize: database_1.default,
    modelName: 'Scan',
    tableName: 'scans',
    timestamps: true,
    underscored: true
});
exports.default = Scan;
//# sourceMappingURL=Scan.js.map