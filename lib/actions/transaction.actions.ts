"use server";

import { Query, type Models } from "node-appwrite";
import { createAdminClient } from "../appwrite";

type TransferTransactionRow = Models.Row & {
  name: string;
  amount: number;
  channel: string;
  category: string;
  senderBankId: string;
  receiverBankId: string;
};

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const TRANSACTION_TABLE_ID =
  process.env.APPWRITE_TRANSACTION_TABLE_ID ??
  process.env.APPWRITE_TRANSACTION_COLLECTION_ID;

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  if (!DATABASE_ID) {
    throw new Error("APPWRITE_DATABASE_ID is not configured");
  }
  if (!TRANSACTION_TABLE_ID) {
    throw new Error("APPWRITE_TRANSACTION_TABLE_ID is not configured");
  }

  const { tables } = await createAdminClient();

  return tables.listRows<TransferTransactionRow>({
    databaseId: DATABASE_ID,
    tableId: TRANSACTION_TABLE_ID,
    queries: [
      Query.or([
        Query.equal("senderBankId", [bankId]),
        Query.equal("receiverBankId", [bankId]),
      ]),
    ],
  });
};
