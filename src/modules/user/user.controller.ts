import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserService } from './user.service';

class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private users: UserService) {}

  @Get('me')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUsernameDto,
  ) {
    return this.users.updateUsername(user.id, dto.username);
  }
}
