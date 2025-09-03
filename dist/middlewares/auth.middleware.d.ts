import { Request, Response, NextFunction } from 'express';
interface AuthRequest extends Request {
    user?: any;
    organization?: any;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const requireOrganization: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=auth.middleware.d.ts.map