import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ADMIN_ROLES, COUNTRY_CODES, type AdminRole } from '@lexiroot/shared';

export class CreateAdminInvitationDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Matches(/^[^\d]+$/, { message: 'Name cannot contain numbers' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  displayName!: string;

  @IsIn(ADMIN_ROLES as readonly string[], { message: 'role must be admin or instructor' })
  role!: AdminRole;

  @IsOptional()
  @IsIn(COUNTRY_CODES as readonly string[], { message: 'country must be a valid ISO country code' })
  country?: string | null;
}
