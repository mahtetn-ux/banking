"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const { APPWRITE_TRANSACTION_TABLE_ID: TRANSACTION_TABLE_ID } = process.env;
const getTableConfig = (tableId: string | undefined, tableName: string) => {
  if (!DATABASE_ID) {
    throw new Error("APPWRITE_DATABASE_ID is not configured");
  }
  if (!tableId) {
    throw new Error(`${tableName} is not configured`);
  }

  return { databaseId: DATABASE_ID, tableId };
};

export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  try {
    const { tables } = await createAdminClient();

    const newTransaction = await tables.createRow({
      ...getTableConfig(TRANSACTION_TABLE_ID, "APPWRITE_TRANSACTION_TABLE_ID"),
      rowId: ID.unique(),
      data: {
        channel: "online",
        category: "Transfer",
        ...transaction,
      },
    });

    return parseStringify(newTransaction);
  } catch (error) {
    console.error("Failed to create transfer transaction in Appwrite:", error);
    throw error;
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  try {
    const { tables } = await createAdminClient();

    const senderTransactions = await tables.listRows({
      ...getTableConfig(TRANSACTION_TABLE_ID, "APPWRITE_TRANSACTION_TABLE_ID"),
      queries: [Query.equal("senderBankId", bankId)],
    });

    const receiverTransactions = await tables.listRows({
      ...getTableConfig(TRANSACTION_TABLE_ID, "APPWRITE_TRANSACTION_TABLE_ID"),
      queries: [Query.equal("receiverBankId", bankId)],
    });

    const transactions = {
      total: senderTransactions.total + receiverTransactions.total,
      rows: [...senderTransactions.rows, ...receiverTransactions.rows],
    };

    return parseStringify(transactions);
  } catch (error) {
    console.error("Failed to fetch transfer transactions from Appwrite:", error);
    throw error;
  }
};
