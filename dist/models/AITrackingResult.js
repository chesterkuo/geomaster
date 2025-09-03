"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const constants_1 = require("../config/constants");
class AITrackingResult extends sequelize_1.Model {
    // Instance methods
    getCompetitorMentionsArray() {
        if (!this.competitorMentions || typeof this.competitorMentions !== 'object') {
            return [];
        }
        return Object.keys(this.competitorMentions);
    }
    getVisibilityScore() {
        let score = 0;
        // Base score for being mentioned
        if (this.isMentioned) {
            score += 50;
        }
        // Additional score for being cited
        if (this.isCited) {
            score += 30;
            // Higher score for better citation position
            if (this.citationPosition) {
                const positionScore = Math.max(0, 20 - (this.citationPosition - 1) * 2);
                score += positionScore;
            }
        }
        return Math.min(100, score);
    }
    isPrimaryMention() {
        return this.isCited && (this.citationPosition || 0) <= 3;
    }
    hasSnippet() {
        return Boolean(this.snippet && this.snippet.length > 0);
    }
    async updateMentionStatus(mentioned, cited, position) {
        this.isMentioned = mentioned;
        this.isCited = cited;
        if (position !== undefined) {
            this.citationPosition = position;
        }
        await this.save();
    }
}
AITrackingResult.init({
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
    keywordId: {
        type: sequelize_1.DataTypes.UUID,
        field: 'keyword_id',
        references: {
            model: 'keywords',
            key: 'id'
        },
        onDelete: 'SET NULL'
    },
    platform: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(constants_1.AI_PLATFORMS)),
        allowNull: false
    },
    query: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    isMentioned: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_mentioned'
    },
    isCited: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_cited'
    },
    citationPosition: {
        type: sequelize_1.DataTypes.INTEGER,
        field: 'citation_position',
        validate: {
            min: 1
        }
    },
    snippet: {
        type: sequelize_1.DataTypes.TEXT
    },
    fullResponse: {
        type: sequelize_1.DataTypes.TEXT('long'),
        field: 'full_response'
    },
    competitorMentions: {
        type: sequelize_1.DataTypes.JSON,
        field: 'competitor_mentions'
    },
    trackedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
        field: 'tracked_at'
    }
}, {
    sequelize: database_1.default,
    modelName: 'AITrackingResult',
    tableName: 'ai_tracking_results',
    timestamps: false,
    underscored: true
});
exports.default = AITrackingResult;
//# sourceMappingURL=AITrackingResult.js.map