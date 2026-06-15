import { IsIn } from 'class-validator';
import { ADMIN_ROLES, type AdminRole } from '@lexiroot/shared';

export class UpdateAdminRoleDto {
  @IsIn(ADMIN_ROLES as readonly string[], { message: 'role must be admin or instructor' })
  role!: AdminRole;
}
