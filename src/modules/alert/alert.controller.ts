import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/alert.dto';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private alerts: AlertService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.alerts.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAlertDto) {
    return this.alerts.create(user.id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.alerts.delete(id, user.id);
  }
}
