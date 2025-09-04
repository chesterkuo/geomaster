import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { SCAN_TYPES, SCAN_STATUS } from '../config/constants';

interface ScanAttributes {
  id: string;
  websiteId: string;
  scanType: typeof SCAN_TYPES[keyof typeof SCAN_TYPES];
  status: typeof SCAN_STATUS[keyof typeof SCAN_STATUS];
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  results?: object;
  createdAt?: Date;
}

interface ScanCreationAttributes extends Optional<ScanAttributes, 'id' | 'scanType' | 'status' | 'progress'> {}

class Scan extends Model<ScanAttributes, ScanCreationAttributes> implements ScanAttributes {
  public id!: string;
  public websiteId!: string;
  public scanType!: typeof SCAN_TYPES[keyof typeof SCAN_TYPES];
  public status!: typeof SCAN_STATUS[keyof typeof SCAN_STATUS];
  public progress!: number;
  public startedAt?: Date;
  public completedAt?: Date;
  public errorMessage?: string;
  public results?: object;
  public createdAt?: Date;

  // Instance methods
  async updateProgress(progress: number): Promise<void> {
    this.progress = Math.min(100, Math.max(0, progress));
    await this.save();
  }

  async markAsStarted(): Promise<void> {
    this.status = SCAN_STATUS.RUNNING;
    this.startedAt = new Date();
    await this.save();
  }

  async markAsCompleted(results: object): Promise<void> {
    this.status = SCAN_STATUS.COMPLETED;
    this.progress = 100;
    this.completedAt = new Date();
    this.results = results;
    await this.save();
  }

  async markAsFailed(errorMessage: string): Promise<void> {
    this.status = SCAN_STATUS.FAILED;
    this.errorMessage = errorMessage;
    await this.save();
  }

  getDuration(): number | null {
    if (!this.startedAt) return null;
    
    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  isCompleted(): boolean {
    return this.status === SCAN_STATUS.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === SCAN_STATUS.FAILED;
  }

  isRunning(): boolean {
    return this.status === SCAN_STATUS.RUNNING;
  }
}

Scan.init(
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
    scanType: {
      type: DataTypes.ENUM(...Object.values(SCAN_TYPES)),
      defaultValue: SCAN_TYPES.STANDARD,
      field: 'scan_type'
    },
    status: {
      type: DataTypes.ENUM(...Object.values(SCAN_STATUS)),
      defaultValue: SCAN_STATUS.PENDING
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    startedAt: {
      type: DataTypes.DATE,
      field: 'started_at'
    },
    completedAt: {
      type: DataTypes.DATE,
      field: 'completed_at'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      field: 'error_message'
    },
    results: {
      type: DataTypes.JSON
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Scan',
    tableName: 'scans',
    timestamps: false,
    underscored: true
  }
);

export default Scan;