import { Controller, Get } from '@nestjs/common';
import { LanguagesService } from './languages.service';

/**
 * Public, unauthenticated language catalog. Used by the mobile onboarding
 * picker (which runs before the user has an account) so the available
 * languages reflect the admin Settings catalog rather than a hardcoded list.
 */
@Controller('languages')
export class PublicLanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  @Get()
  list() {
    return this.languages.catalog();
  }
}
