import { Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('avatar/signature')
  signAvatarUpload(@CurrentUser() user: User) {
    return this.uploads.signAvatarUpload(user.id);
  }

  @Post('lesson-audio/signature')
  @UseGuards(RolesGuard)
  @Roles('admin')
  signLessonAudioUpload() {
    return this.uploads.signLessonMediaUpload('audio');
  }

  @Post('lesson-image/signature')
  @UseGuards(RolesGuard)
  @Roles('admin')
  signLessonImageUpload() {
    return this.uploads.signLessonMediaUpload('image');
  }

  @Post('cultural-audio/signature')
  @UseGuards(RolesGuard)
  @Roles('admin')
  signCulturalAudioUpload() {
    return this.uploads.signCulturalMediaUpload('audio');
  }

  @Post('cultural-image/signature')
  @UseGuards(RolesGuard)
  @Roles('admin')
  signCulturalImageUpload() {
    return this.uploads.signCulturalMediaUpload('image');
  }
}
