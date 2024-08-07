export class WebhookEvent {
  destination: string;
  events: Event[];
}

export class Event {
  type: 'message' | 'unsend' | 'follow' | 'unfollow';
  mode: 'active' | 'standby';
  timestamp: number;
  webhookEventId: string;
  deliveryContext: { isRedelivery: boolean };
  source: {
    type: string;
    userId: string;
  };
}

export type MessageEvent = TextEvent | ImageEvent;

export class TextEvent extends Event {
  type: 'message';
  replyToken: string;
  message: {
    type: 'text';
    id: string;
    quoteToken: string;
    text: string;
  };
}

export class ImageEvent extends Event {
  type: 'message';
  replyToken: string;
  message: {
    type: 'image';
    id: string;
    quoteToken: string;
    contentProvider:
      | {
          type: 'line';
        }
      | {
          type: 'external';
          originalContentUrl: string;
        };
  };
}

export type AccessTokenWrapper = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  key_id: string;
};

export type TextMessage = {
  type: 'text';
  text: string;
};
