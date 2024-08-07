import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { WebhookEvent } from './line.model';
import { LineService } from './line.service';
import { OpenAIService } from './openai.service';

@Controller()
export class AppController {
  constructor(
    private readonly lineService: LineService,
    private readonly appService: AppService,
    private readonly openAIService: OpenAIService,
  ) {}

  @Get('categories')
  categories() {
    return this.appService.getCategories();
  }

  @Get('ledger')
  async ledger() {
    const ledger = this.openAIService.useLedgerAssistant('image.jpg');
    return ledger;
  }

  @Post('line/callback')
  messageCallback(@Body() body: WebhookEvent) {
    //TODO verify signature https://developers.line.biz/en/docs/messaging-api/receiving-messages/#verify-signature
    return this.lineService.processWebhookEvent(body);
  }
}
