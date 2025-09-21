import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    DocumentsModule,
    TasksModule,
    UsersModule,
    StorageModule,
    QueueModule,
    WebhooksModule,
  ],
})
export class AppModule {}