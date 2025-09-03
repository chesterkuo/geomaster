import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ContentAttributes {
  id: string;
  websiteId: string;
  url: string;
  title?: string;
  metaDescription?: string;
  contentType: 'page' | 'post' | 'product' | 'faq';
  originalContent?: string;
  optimizedContent?: string;
  geoScore?: number;
  wordCount?: number;
  readingTime?: number;
  hasSchema: boolean;
  schemaTypes?: string[];
  lastUpdated?: Date;
  optimizationStatus: 'pending' | 'optimized' | 'needs_update';
  createdAt?: Date;
  updatedAt?: Date;
}

interface ContentCreationAttributes extends Optional<ContentAttributes, 'id' | 'contentType' | 'hasSchema' | 'optimizationStatus'> {}

class Content extends Model<ContentAttributes, ContentCreationAttributes> implements ContentAttributes {
  public id!: string;
  public websiteId!: string;
  public url!: string;
  public title?: string;
  public metaDescription?: string;
  public contentType!: 'page' | 'post' | 'product' | 'faq';
  public originalContent?: string;
  public optimizedContent?: string;
  public geoScore?: number;
  public wordCount?: number;
  public readingTime?: number;
  public hasSchema!: boolean;
  public schemaTypes?: string[];
  public lastUpdated?: Date;
  public optimizationStatus!: 'pending' | 'optimized' | 'needs_update';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  calculateWordCount(): number {
    if (!this.originalContent) return 0;
    
    // Remove HTML tags and count words
    const textContent = this.originalContent.replace(/<[^>]*>/g, ' ');
    const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  calculateReadingTime(): number {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.wordCount || this.calculateWordCount();
    return Math.ceil(wordCount / wordsPerMinute);
  }

  async updateGeoScore(score: number): Promise<void> {
    this.geoScore = Math.min(100, Math.max(0, score));
    await this.save();
  }

  async markAsOptimized(optimizedContent: string): Promise<void> {
    this.optimizedContent = optimizedContent;
    this.optimizationStatus = 'optimized';
    this.lastUpdated = new Date();
    await this.save();
  }

  needsOptimization(): boolean {
    return this.optimizationStatus === 'pending' || this.optimizationStatus === 'needs_update';
  }

  hasGoodScore(): boolean {
    return (this.geoScore || 0) >= 70;
  }

  getSchemaTypesArray(): string[] {
    return this.schemaTypes || [];
  }

  addSchemaType(schemaType: string): void {
    const types = this.getSchemaTypesArray();
    if (!types.includes(schemaType)) {
      this.schemaTypes = [...types, schemaType];
      this.hasSchema = true;
    }
  }

  removeSchemaType(schemaType: string): void {
    const types = this.getSchemaTypesArray();
    this.schemaTypes = types.filter(type => type !== schemaType);
    this.hasSchema = this.schemaTypes.length > 0;
  }
}

Content.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    websiteId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'website_id',
      references: {
        model: 'websites',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      validate: {
        isUrl: true
      }
    },
    title: {
      type: DataTypes.STRING(500)
    },
    metaDescription: {
      type: DataTypes.TEXT,
      field: 'meta_description'
    },
    contentType: {
      type: DataTypes.ENUM('page', 'post', 'product', 'faq'),
      defaultValue: 'page',
      field: 'content_type'
    },
    originalContent: {
      type: DataTypes.TEXT('long'),
      field: 'original_content'
    },
    optimizedContent: {
      type: DataTypes.TEXT('long'),
      field: 'optimized_content'
    },
    geoScore: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'geo_score',
      validate: {
        min: 0,
        max: 100
      }
    },
    wordCount: {
      type: DataTypes.INTEGER,
      field: 'word_count'
    },
    readingTime: {
      type: DataTypes.INTEGER,
      field: 'reading_time'
    },
    hasSchema: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_schema'
    },
    schemaTypes: {
      type: DataTypes.JSON,
      field: 'schema_types'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      field: 'last_updated'
    },
    optimizationStatus: {
      type: DataTypes.ENUM('pending', 'optimized', 'needs_update'),
      defaultValue: 'pending',
      field: 'optimization_status'
    }
  },
  {
    sequelize,
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
  }
);

export default Content;