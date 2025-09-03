import { Model, Optional } from 'sequelize';
import { ORGANIZATION_PLANS } from '../config/constants';
interface OrganizationAttributes {
    id: string;
    name: string;
    slug: string;
    plan: typeof ORGANIZATION_PLANS[keyof typeof ORGANIZATION_PLANS];
    credits: number;
    maxUsers: number;
    maxWebsites: number;
    settings?: object;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialEndsAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'plan' | 'credits' | 'maxUsers' | 'maxWebsites'> {
}
declare class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
    id: string;
    name: string;
    slug: string;
    plan: typeof ORGANIZATION_PLANS[keyof typeof ORGANIZATION_PLANS];
    credits: number;
    maxUsers: number;
    maxWebsites: number;
    settings?: object;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    trialEndsAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    hasCredits(required?: number): boolean;
    useCredits(amount: number): Promise<void>;
    addCredits(amount: number): Promise<void>;
    canAddWebsite(): boolean;
    canAddUser(): boolean;
}
export default Organization;
//# sourceMappingURL=Organization.d.ts.map