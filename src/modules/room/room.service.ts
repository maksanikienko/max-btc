import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoomDto } from './dto/room.dto';

@Injectable()
export class RoomService {
  constructor(private prisma: PrismaService) {}

  findPublicRooms() {
    return this.prisma.room.findMany({
      where: { isPublic: true },
      include: { _count: { select: { members: true } } },
    });
  }

  findById(id: string) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } },
      },
    });
  }

  create(hostId: string, dto: CreateRoomDto) {
    return this.prisma.room.create({
      data: { name: dto.name, hostId, isPublic: dto.isPublic ?? true },
    });
  }

  async join(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new NotFoundException('Room not found');
    if (!room.isPublic) throw new ForbiddenException('Room is private');
    return this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId },
      update: {},
    });
  }

  leave(roomId: string, userId: string) {
    return this.prisma.roomMember.deleteMany({ where: { roomId, userId } });
  }

  async delete(id: string, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== userId) throw new ForbiddenException('Only the host can delete');
    return this.prisma.room.delete({ where: { id } });
  }
}
