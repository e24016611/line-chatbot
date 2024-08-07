import { Injectable } from '@nestjs/common';
import prisma from './db';
import { Transaction, TransactionDetail } from './type';

@Injectable()
export class TransactionRepository {
  async categories() {
    return prisma.category.findMany();
  }

  async createTransaction(categoryId: string, transaction: Transaction) {
    const details: Omit<TransactionDetail, 'transactionId'>[] =
      transaction.TransactionDetail;
    return prisma.transaction.create({
      data: {
        buyer: transaction.buyer,
        seller: transaction.seller,
        categoryId: Number.parseInt(categoryId),
        amount: transaction.amount,
        transactionDate: transaction.transactionDate,
        parentTransactionId: transaction.parentTransactionId,
        TransactionDetail: {
          createMany: {
            data: details,
          },
        },
      },
    });
  }
}
