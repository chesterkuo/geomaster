import { Model, Optional } from 'sequelize';
import { USER_ROLES } from '../config/constants';
interface UserAttributes {
    id: string;
    email: string;
    passwordHash: string;
    fullName?: string;
    company?: string;
    role: typeof USER_ROLES[keyof typeof USER_ROLES];
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'isActive' | 'emailVerified'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    email: string;
    passwordHash: string;
    fullName?: string;
    company?: string;
    role: typeof USER_ROLES[keyof typeof USER_ROLES];
    isActive: boolean;
    emailVerified: boolean;
    lastLoginAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    validatePassword(password: string): Promise<boolean>;
    toJSON(): {
        id: string;
        email: string;
        fullName?: string;
        company?: string;
        role: (typeof USER_ROLES)[keyof typeof USER_ROLES];
        isActive: boolean;
        emailVerified: boolean;
        lastLoginAt?: Date;
        createdAt?: Date;
        updatedAt?: Date;
    };
}
export default User;
//# sourceMappingURL=User.d.ts.map