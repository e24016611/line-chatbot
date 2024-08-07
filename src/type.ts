import {
  Category as CategoryPrisma,
  Item as ItemPrisma,
  TransactionDetail as TransactionDetailPrisma,
  Transaction as TransactionPrisma,
} from '@prisma/client';

export type Category = Pick<CategoryPrisma, 'id' | 'name' | 'isAgent'>;

export type Transaction = Pick<
  TransactionPrisma,
  | 'id'
  | 'buyer'
  | 'seller'
  | 'amount'
  | 'isAccounted'
  | 'isShipped'
  | 'deleted'
  | 'parentTransactionId'
> & {
  TransactionDetail: TransactionDetail[];
  transactionDate: Date | undefined;
  childTransactions: Transaction[];
};
export type TransactionDetail = Pick<
  TransactionDetailPrisma,
  'itemId' | 'quantity' | 'unitPrice'
>;

export type Item = Pick<ItemPrisma, 'id' | 'name'>;
export type TransactionKeys = keyof Transaction;

export type AssistantResponse = {
  purchases: LedgerStock[];
  orders: LedgerOrder[];
};

type LedgerOrder = {
  date: string;
  customer: string;
  order_quantity: number;
  unit_price: number;
  total_price: number;
};

type LedgerStock = {
  date: string;
  supplier: string;
  purchase_quantity: number;
  shipping_cost: number;
};
