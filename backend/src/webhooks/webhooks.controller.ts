import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('clerk')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle Clerk webhooks' })
  async handleClerkWebhook(
    @Body() payload: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    return this.webhooksService.handleClerkWebhook(
      payload,
      svixId,
      svixTimestamp,
      svixSignature,
    );
  }

  @Post('ai-service')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle AI service completion webhooks' })
  async handleAIServiceWebhook(@Body() payload: any) {
    return this.webhooksService.handleAIServiceWebhook(payload);
  }
}