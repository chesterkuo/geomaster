import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateRequest: (schema: {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonSchemas: {
    uuid: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    url: Joi.StringSchema<string>;
    pagination: {
        page: Joi.NumberSchema<number>;
        limit: Joi.NumberSchema<number>;
    };
};
export declare const authSchemas: {
    register: Joi.ObjectSchema<any>;
    login: Joi.ObjectSchema<any>;
    refreshToken: Joi.ObjectSchema<any>;
    forgotPassword: Joi.ObjectSchema<any>;
    resetPassword: Joi.ObjectSchema<any>;
};
export declare const websiteSchemas: {
    create: Joi.ObjectSchema<any>;
    update: Joi.ObjectSchema<any>;
    list: Joi.ObjectSchema<any>;
};
export declare const scanSchemas: {
    create: Joi.ObjectSchema<any>;
};
export declare const contentSchemas: {
    analyze: Joi.ObjectSchema<any>;
    optimize: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=validation.middleware.d.ts.map