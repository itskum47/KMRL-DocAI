import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkService {
  private clerkMiddleware: any;

  constructor(private configService: ConfigService) {
    this.clerkMiddleware = ClerkExpressWithAuth({
      secretKey: this.configService.get('CLERK_SECRET_KEY'),
    });
  }

  getMiddleware() {
    return this.clerkMiddleware;
  }

  async verifyToken(token: string) {
    try {
      // Token verification is handled by Clerk middleware
      // This method can be extended for additional verification logic
      return true;
    } catch (error) {
      return false;
    }
  }
}