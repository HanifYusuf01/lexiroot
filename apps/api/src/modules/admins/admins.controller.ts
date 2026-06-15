import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { AdminsService } from './admins.service';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';
import { AcceptAdminInvitationDto } from './dto/accept-admin-invitation.dto';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto';

@Controller('admin')
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  // --- Public endpoints used by the registration screen ---

  @Get('invitations/token/:token')
  preview(@Param('token') token: string) {
    return this.admins.previewInvitation(token);
  }

  @Post('invitations/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Body() dto: AcceptAdminInvitationDto) {
    return this.admins.acceptInvitation(dto);
  }

  // --- Admin-only management endpoints ---

  @Get('members')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listMembers() {
    return this.admins.listAdmins();
  }

  @Patch('members/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateRole(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateAdminRoleDto) {
    return this.admins.updateAdminRole(id, dto.role);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeMember(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.admins.removeAdmin(id, user.id);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listInvitations() {
    return this.admins.listInvitations();
  }

  @Post('invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  invite(@CurrentUser() user: User, @Body() dto: CreateAdminInvitationDto) {
    return this.admins.createInvitation(dto, user);
  }

  @Post('invitations/:id/resend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resend(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.admins.resendInvitation(id);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async revoke(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.admins.revokeInvitation(id);
  }
}
