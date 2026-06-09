import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CreateNotificationInput {
  type: string;
  title: string;
  body: string;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  create(userId: string, input: CreateNotificationInput) {
    return this.prisma.notification.create({ data: { userId, ...input } });
  }

  markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
