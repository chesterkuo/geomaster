"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Content extends sequelize_1.Model {
    // Instance methods
    calculateWordCount() {
        if (!this.originalContent)
            return 0;
        // Remove HTML tags and count words
        const textContent = this.originalContent.replace(/<[^>]*>/g, ' ');
        const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
        return words.length;
    }
    calculateReadingTime() {
        const wordsPerMinute = 200; // Average reading speed
        const wordCount = this.wordCount || this.calculateWordCount();
        return Math.ceil(wordCount / wordsPerMinute);
    }
    async updateGeoScore(score) {
        this.geoScore = Math.min(100, Math.max(0, score));
        await this.save();
    }
    async markAsOptimized(optimizedContent) {
        this.optimizedContent = optimizedContent;
        this.optimizationStatus = 'optimized';
        this.lastUpdated = new Date();
        await this.save();
    }
    needsOptimization() {
        return this.optimizationStatus === 'pending' || this.optimizationStatus === 'needs_update';
    }
    hasGoodScore() {
        return (this.geoScore || 0) >= 70;
    }
    getSchemaTypesArray() {
        return this.schemaTypes || [];
    }
    addSchemaType(schemaType) {
        const types = this.getSchemaTypesArray();
        if (!types.includes(schemaType)) {
            this.schemaTypes = [...types, schemaType];
            this.hasSchema = true;
        }
    }
    removeSchemaType(schemaType) {
        const types = this.getSchemaTypesArray();
        this.schemaTypes = types.filter(type => type !== schemaType);
        this.hasSchema = this.schemaTypes.length > 0;
    }
}
Content.init({
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
    url: {
        type: sequelize_1.DataTypes.STRING(1000),
        allowNull: false,
        validate: {
            isUrl: true
        }
    },
    title: {
        type: sequelize_1.DataTypes.STRING(500)
    },
    metaDescription: {
        type: sequelize_1.DataTypes.TEXT,
        field: 'meta_description'
    },
    contentType: {
        type: sequelize_1.DataTypes.ENUM('page', 'post', 'product', 'faq'),
        defaultValue: 'page',
        field: 'content_type'
    },
    originalContent: {
        type: sequelize_1.DataTypes.TEXT('long'),
        field: 'original_content'
    },
    optimizedContent: {
        type: sequelize_1.DataTypes.TEXT('long'),
        field: 'optimized_content'
    },
    geoScore: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        field: 'geo_score',
        validate: {
            min: 0,
            max: 100
        }
    },
    wordCount: {
        type: sequelize_1.DataTypes.INTEGER,
        field: 'word_count'
    },
    readingTime: {
        type: sequelize_1.DataTypes.INTEGER,
        field: 'reading_time'
    },
    hasSchema: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'has_schema'
    },
    schemaTypes: {
        type: sequelize_1.DataTypes.JSON,
        field: 'schema_types'
    },
    lastUpdated: {
        type: sequelize_1.DataTypes.DATE,
        field: 'last_updated'
    },
    optimizationStatus: {
        type: sequelize_1.DataTypes.ENUM('pending', 'optimized', 'needs_update'),
        defaultValue: 'pending',
        field: 'optimization_status'
    }
}, {
    sequelize: database_1.default,
    modelName: 'Content',
    tableName: 'content',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeSave: (content) => {
            if (content.originalContent) {
                content.wordCount = content.calculateWordCount();
                content.readingTime = content.calculateReadingTime();
            }
        }
    }
});
exports.default = Content;
//# sourceMappingURL=Content.js.map