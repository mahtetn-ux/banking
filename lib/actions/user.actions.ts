"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from "plaid";

import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const USER_TABLE_ID =
  process.env.APPWRITE_USER_TABLE_ID ??
  process.env.APPWRITE_USER_COLLECTION_ID;
const BANK_TABLE_ID =
  process.env.APPWRITE_BANK_TABLE_ID ??
  process.env.APPWRITE_BANK_COLLECTION_ID;

const getTableConfig = (tableId: string | undefined, tableName: string) => {
  if (!DATABASE_ID) {
    throw new Error("APPWRITE_DATABASE_ID is not configured");
  }
  if (!tableId) {
    throw new Error(`${tableName} is not configured`);
  }

  return { databaseId: DATABASE_ID, tableId };
};

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { tables } = await createAdminClient();

    const user = await tables.listRows({
      ...getTableConfig(USER_TABLE_ID, "APPWRITE_USER_TABLE_ID"),
      queries: [Query.equal("userId", [userId])],
    });

    const userRow = user.rows[0];

    return parseStringify({
      ...userRow,
      name: `${userRow.firstName} ${userRow.lastName}`.trim(),
    });
  } catch (error) {
    console.error("Failed to fetch user row from Appwrite:", error);
    throw error;
  }
};

export const signIn = async ({ email, password }: signInProps) => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    const user = await getUserInfo({ userId: session.userId });

    return parseStringify(user);
  } catch (error) {
    console.error("Error", error);
  }
};

export const signUp = async ({ password, ...userData }: SignUpParams) => {
  const { email, firstName, lastName } = userData;

  let newUserAccount;

  try {
    const { account, tables } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`,
    );

    if (!newUserAccount) throw new Error("Error creating user");

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: "personal",
    });

    if (!dwollaCustomerUrl) throw new Error("Error creating Dwolla customer");

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await tables.createRow({
      ...getTableConfig(USER_TABLE_ID, "APPWRITE_USER_TABLE_ID"),
      rowId: ID.unique(),
      data: {
        ...userData,
        userId: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
      },
    });

    const session = await account.createEmailPasswordSession(email, password);

    (await cookies()).set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    return parseStringify({
      ...newUser,
      name: `${firstName} ${lastName}`.trim(),
    });
  } catch (error) {
    console.error("Error", error);
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id });

    return parseStringify(user);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    (await cookies()).delete("appwrite-session");

    await account.deleteSession("current");
  } catch (error) {
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.error("Failed to fetch user row from Appwrite:", error);
    throw error;
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { tables } = await createAdminClient();

    const bankAccount = await tables.createRow({
      ...getTableConfig(BANK_TABLE_ID, "APPWRITE_BANK_TABLE_ID"),
      rowId: ID.unique(),
      data: {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      },
    });

    return parseStringify(bankAccount);
  } catch (error) {
    console.error("Failed to create bank row in Appwrite:", error);
    throw error;
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse =
      await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) {
      throw new Error("Dwolla did not return a funding source URL.");
    }

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    const bankAccount = await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });

    if (!bankAccount) {
      throw new Error("Appwrite did not return the saved bank account.");
    }

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while creating exchanging token:", error);
    throw error;
  }
};

export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { tables } = await createAdminClient();

    const banks = await tables.listRows({
      ...getTableConfig(BANK_TABLE_ID, "APPWRITE_BANK_TABLE_ID"),
      queries: [Query.equal("userId", [userId])],
    });

    return parseStringify(banks.rows);
  } catch (error) {
    console.error("Failed to fetch bank rows from Appwrite:", error);
    throw error;
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { tables } = await createAdminClient();

    const bank = await tables.getRow({
      ...getTableConfig(BANK_TABLE_ID, "APPWRITE_BANK_TABLE_ID"),
      rowId: documentId,
    });

    return parseStringify(bank.rows[0]);
  } catch (error) {
    console.log(error);
  }
};

export const getBankByAccountId = async ({
  accountId,
}: getBankByAccountIdProps) => {
  try {
    const { tables } = await createAdminClient();

    const bank = await tables.listRows({
      ...getTableConfig(BANK_TABLE_ID, "APPWRITE_BANK_TABLE_ID"),
      queries: [Query.equal("accountId", [accountId])],
    });

    if (bank.total !== 1) return null;

    return parseStringify(bank.rows[0]);
  } catch (error) {
    console.log(error);
  }
};
