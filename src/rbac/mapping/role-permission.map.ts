import { UserRole } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SPECIALIST]: [
    Permission.PROFILE_MANAGE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
  ],

  [UserRole.USER]: [
    Permission.PROFILE_MANAGE,
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
  ],
};
