import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LineService } from './line.service';
import { OpenAIService } from './openai.service';
import { TransactionRepository } from './transaction.repository';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [LineService, AppService, TransactionRepository, OpenAIService],
})
export class AppModule {}
