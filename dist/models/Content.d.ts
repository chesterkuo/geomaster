import { Model, Optional } from 'sequelize';
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
interface ContentCreationAttributes extends Optional<ContentAttributes, 'id' | 'contentType' | 'hasSchema' | 'optimizationStatus'> {
}
declare class Content extends Model<ContentAttributes, ContentCreationAttributes> implements ContentAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    calculateWordCount(): number;
    calculateReadingTime(): number;
    updateGeoScore(score: number): Promise<void>;
    markAsOptimized(optimizedContent: string): Promise<void>;
    needsOptimization(): boolean;
    hasGoodScore(): boolean;
    getSchemaTypesArray(): string[];
    addSchemaType(schemaType: string): void;
    removeSchemaType(schemaType: string): void;
}
export default Content;
//# sourceMappingURL=Content.d.ts.map