import { Model, Optional } from 'sequelize';
interface WebsiteAttributes {
    id: string;
    organizationId: string;
    url: string;
    domain: string;
    name?: string;
    description?: string;
    settings?: object;
    robotsTxtStatus: 'allowed' | 'blocked' | 'partial' | 'unknown';
    lastScanAt?: Date;
    scanFrequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface WebsiteCreationAttributes extends Optional<WebsiteAttributes, 'id' | 'robotsTxtStatus' | 'scanFrequency' | 'isActive'> {
}
declare class Website extends Model<WebsiteAttributes, WebsiteCreationAttributes> implements WebsiteAttributes {
    id: string;
    organizationId: string;
    url: string;
    domain: string;
    name?: string;
    description?: string;
    settings?: object;
    robotsTxtStatus: 'allowed' | 'blocked' | 'partial' | 'unknown';
    lastScanAt?: Date;
    scanFrequency: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    needsScan(): boolean;
    updateLastScan(): Promise<void>;
    getRootDomain(): string;
}
export default Website;
//# sourceMappingURL=Website.d.ts.map