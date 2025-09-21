import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ClerkService } from './clerk.service';

@Module({
  providers: [AuthService, AuthGuard, ClerkService],
  exports: [AuthService, AuthGuard, ClerkService],
})
export class AuthModule {}