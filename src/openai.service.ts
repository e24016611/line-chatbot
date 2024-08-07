import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import OpenAI from 'openai';
import { Assistant } from 'openai/resources/beta/assistants';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;
  private ledgerAssistant: Assistant;
  constructor() {
    this.openai = new OpenAI({
      organization: process.env.ORG_ID,
      project: process.env.PROJECT_ID,
      apiKey: process.env.OPENAI_APIKEY,
    });
  }

  private async getAssistant() {
    this.ledgerAssistant = await this.openai.beta.assistants.retrieve(
      process.env.LEDGER_ASSISTANT_ID,
    );
  }

  private uploadImageForAssistant(filename: string) {
    return this.openai.files.create({
      file: fs.createReadStream(filename),
      purpose: 'vision',
    });
  }

  async useLedgerAssistant(ledgerFilename: string) {
    if (!this.ledgerAssistant) await this.getAssistant();
    const file = await this.uploadImageForAssistant(ledgerFilename);
    console.log(`file = ${JSON.stringify(file)}`);

    const thread = await this.openai.beta.threads.create();
    await this.openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'please parse transactions from this picture',
        },
        {
          type: 'image_file',
          image_file: { file_id: file.id },
        },
      ],
    });
    const messages = await this.openai.beta.threads.runs
      .stream(thread.id, {
        assistant_id: this.ledgerAssistant.id,
      })
      .on('textCreated', () => process.stdout.write('\nassistant > '))
      .on('textDelta', (textDelta) => process.stdout.write(textDelta.value))
      .on('toolCallCreated', (toolCall) =>
        process.stdout.write(`\nassistant > ${toolCall.type}\n\n`),
      )
      .on('toolCallDelta', (toolCallDelta) => {
        if (toolCallDelta.type === 'code_interpreter') {
          if (toolCallDelta.code_interpreter.input) {
            process.stdout.write(toolCallDelta.code_interpreter.input);
          }
          if (toolCallDelta.code_interpreter.outputs) {
            process.stdout.write('\noutput >\n');
            toolCallDelta.code_interpreter.outputs.forEach((output) => {
              if (output.type === 'logs') {
                process.stdout.write(`\n${output.logs}\n`);
              }
            });
          }
        }
      })
      .finalMessages();

    let result;
    messages.forEach((msg) => {
      msg.content.forEach((content) => {
        if (content.type == 'text') {
          console.log(`text = ${content.text.value} `);
          result = JSON.parse(content.text.value);
        }
      });
    });

    return result;
  }
}
