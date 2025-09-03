import { Model, Optional } from 'sequelize';
import { AI_PLATFORMS } from '../config/constants';
interface AITrackingResultAttributes {
    id: string;
    websiteId: string;
    keywordId?: string;
    platform: typeof AI_PLATFORMS[keyof typeof AI_PLATFORMS];
    query: string;
    isMentioned: boolean;
    isCited: boolean;
    citationPosition?: number;
    snippet?: string;
    fullResponse?: string;
    competitorMentions?: object;
    trackedAt: Date;
}
interface AITrackingResultCreationAttributes extends Optional<AITrackingResultAttributes, 'id' | 'isMentioned' | 'isCited' | 'trackedAt'> {
}
declare class AITrackingResult extends Model<AITrackingResultAttributes, AITrackingResultCreationAttributes> implements AITrackingResultAttributes {
    id: string;
    websiteId: string;
    keywordId?: string;
    platform: typeof AI_PLATFORMS[keyof typeof AI_PLATFORMS];
    query: string;
    isMentioned: boolean;
    isCited: boolean;
    citationPosition?: number;
    snippet?: string;
    fullResponse?: string;
    competitorMentions?: object;
    trackedAt: Date;
    getCompetitorMentionsArray(): string[];
    getVisibilityScore(): number;
    isPrimaryMention(): boolean;
    hasSnippet(): boolean;
    updateMentionStatus(mentioned: boolean, cited: boolean, position?: number): Promise<void>;
}
export default AITrackingResult;
//# sourceMappingURL=AITrackingResult.d.ts.map