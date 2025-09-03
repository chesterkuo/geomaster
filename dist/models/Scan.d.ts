import { Model, Optional } from 'sequelize';
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
    updatedAt?: Date;
}
interface ScanCreationAttributes extends Optional<ScanAttributes, 'id' | 'scanType' | 'status' | 'progress'> {
}
declare class Scan extends Model<ScanAttributes, ScanCreationAttributes> implements ScanAttributes {
    id: string;
    websiteId: string;
    scanType: typeof SCAN_TYPES[keyof typeof SCAN_TYPES];
    status: typeof SCAN_STATUS[keyof typeof SCAN_STATUS];
    progress: number;
    startedAt?: Date;
    completedAt?: Date;
    errorMessage?: string;
    results?: object;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    updateProgress(progress: number): Promise<void>;
    markAsStarted(): Promise<void>;
    markAsCompleted(results: object): Promise<void>;
    markAsFailed(errorMessage: string): Promise<void>;
    getDuration(): number | null;
    isCompleted(): boolean;
    isFailed(): boolean;
    isRunning(): boolean;
}
export default Scan;
//# sourceMappingURL=Scan.d.ts.map