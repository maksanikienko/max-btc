import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/room.dto';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomController {
  constructor(private rooms: RoomService) {}

  @Get()
  findAll() {
    return this.rooms.findPublicRooms();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rooms.findById(id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateRoomDto) {
    return this.rooms.create(user.id, dto);
  }

  @Post(':id/join')
  join(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.rooms.join(id, user.id);
  }

  @Post(':id/leave')
  leave(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.rooms.leave(id, user.id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.rooms.delete(id, user.id);
  }
}
