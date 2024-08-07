import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mime from 'mime';
import * as jose from 'node-jose';
import {
  AccessTokenWrapper,
  MessageEvent,
  TextMessage,
  WebhookEvent,
} from './line.model';
import { OpenAIService } from './openai.service';
import { ACCESS_TOKEN_PATH, PRIVATE_KEY } from './secret';

@Injectable()
export class LineService {
  constructor(private readonly openAIService: OpenAIService) {}
  private async sign() {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: PRIVATE_KEY.kid,
    };

    const payload = {
      iss: '2005946394',
      sub: '2005946394',
      aud: 'https://api.line.me/',
      exp: Math.floor(new Date().getTime() / 1000) + 60 * 10,
      token_exp: 60 * 60 * 24 * 30,
    };

    const result = await jose.JWS.createSign(
      { format: 'compact', fields: header },
      JSON.parse(JSON.stringify(PRIVATE_KEY)),
    )
      .update(JSON.stringify(payload))
      .final();
    return result;
  }

  private async issueChannelAccessToken() {
    const jwt = await this.sign();

    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials');
    body.set(
      'client_assertion_type',
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    );
    body.set('client_assertion', JSON.stringify(jwt).replaceAll('"', ''));
    let result: AccessTokenWrapper | undefined;
    try {
      console.log(`body = ${body.toString()}`);
      const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });
      result = await response.json();
      console.log(`result = ${JSON.stringify(result)}`);
    } catch (error) {
      console.error(error);
    }

    return result;
  }

  private async getChannelAccessTokenFromFile() {
    if (!fs.existsSync(ACCESS_TOKEN_PATH)) return undefined;
    const content = fs.readFileSync(ACCESS_TOKEN_PATH, { encoding: 'utf-8' });
    const wrapper = JSON.parse(content) as AccessTokenWrapper;
    return wrapper;
  }
  private persistChannelToken(wrapper: AccessTokenWrapper) {
    fs.writeFileSync(ACCESS_TOKEN_PATH, JSON.stringify(wrapper));
  }

  private async getAccessToken() {
    let wrapper: AccessTokenWrapper =
      await this.getChannelAccessTokenFromFile();
    if (wrapper) return wrapper.access_token;

    wrapper = await this.issueChannelAccessToken();
    this.persistChannelToken(wrapper);
    return wrapper.access_token;
  }

  private async getContent(messageId: string) {
    try {
      const accessToken = await this.getAccessToken();
      console.log(
        `fetch https://api-data.line.me/v2/bot/message/${messageId}/content`,
      );
      console.log(`header = { Authorization: Bearer ${accessToken} }`);
      return fetch(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
    } catch (error) {
      console.error(error);
    }
  }

  private async reply(replyToken: string, messages: TextMessage[]) {
    try {
      const accessToken = await this.getAccessToken();
      const data = {
        replyToken: replyToken,
        messages: messages,
      };
      console.log(` reply data = ${JSON.stringify(data)}`);

      const response = await fetch(`https://api.line.me/v2/bot/message/reply`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'post',
        body: JSON.stringify(data),
      });
      console.log(`reply response = ${JSON.stringify(response)}`);
    } catch (error) {
      console.error(error);
    }
  }

  async processMessageEvent(event: MessageEvent) {
    const messageId = event.message.id;
    if (event.message.type == 'image') {
      const response = await this.getContent(messageId);
      const contentType = response.headers.get('Content-Type');
      const extension = mime.extension(contentType);
      const body = new DataView(await response.arrayBuffer());
      const filename = messageId + '.' + extension;
      fs.writeFileSync(filename, body);
      return this.openAIService.useLedgerAssistant(filename);
    } else {
      return {};
    }
  }

  async processWebhookEvent(message: WebhookEvent) {
    console.log(`message = ${JSON.stringify(message)}`);
    if (message.events.length == 0) return;
    for (const event of message.events) {
      if (event.type == 'message') {
        const messageEvent = event as MessageEvent;
        const replyData = await this.processMessageEvent(messageEvent);
        this.reply(messageEvent.replyToken, [
          { type: 'text', text: JSON.stringify(replyData) },
        ]);
      }
    }
  }
}
