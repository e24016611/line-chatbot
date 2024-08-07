import { Injectable } from '@nestjs/common';
import { TransactionRepository } from './transaction.repository';

@Injectable()
export class AppService {
  constructor(private readonly transactionRepository: TransactionRepository) {}
  getCategories() {
    return this.transactionRepository.categories();
  }
}
