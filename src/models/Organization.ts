import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
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

interface OrganizationCreationAttributes extends Optional<OrganizationAttributes, 'id' | 'plan' | 'credits' | 'maxUsers' | 'maxWebsites'> {}

class Organization extends Model<OrganizationAttributes, OrganizationCreationAttributes> implements OrganizationAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public plan!: typeof ORGANIZATION_PLANS[keyof typeof ORGANIZATION_PLANS];
  public credits!: number;
  public maxUsers!: number;
  public maxWebsites!: number;
  public settings?: object;
  public stripeCustomerId?: string;
  public stripeSubscriptionId?: string;
  public trialEndsAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  hasCredits(required: number = 1): boolean {
    return this.credits >= required;
  }

  async useCredits(amount: number): Promise<void> {
    this.credits = Math.max(0, this.credits - amount);
    await this.save();
  }

  async addCredits(amount: number): Promise<void> {
    this.credits += amount;
    await this.save();
  }

  canAddWebsite(): boolean {
    return this.maxWebsites === -1; // Unlimited
  }

  canAddUser(): boolean {
    return this.maxUsers === -1; // Unlimited
  }
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isAlphanumeric: true,
        isLowercase: true
      }
    },
    plan: {
      type: DataTypes.ENUM(...Object.values(ORGANIZATION_PLANS)),
      defaultValue: ORGANIZATION_PLANS.FREE
    },
    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'max_users'
    },
    maxWebsites: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      field: 'max_websites'
    },
    settings: {
      type: DataTypes.JSON
    },
    stripeCustomerId: {
      type: DataTypes.STRING(255),
      field: 'stripe_customer_id'
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING(255),
      field: 'stripe_subscription_id'
    },
    trialEndsAt: {
      type: DataTypes.DATE,
      field: 'trial_ends_at'
    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (org) => {
        if (!org.slug) {
          org.slug = org.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);
        }
      }
    }
  }
);

export default Organization;