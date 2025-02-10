"use server";

import { JobResult, TokenTransaction } from "@minatokens/api";
import { getChain } from "./chain";

const chain = getChain();

export async function proveTransaction(
  params: TokenTransaction
): Promise<string | undefined> {
  return undefined;
}

export async function proveTransactions(
  params: TokenTransaction[]
): Promise<string | undefined> {
  return undefined;
}

export async function getResult(jobId: string): Promise<
  | {
      success: true;
      results?: JobResult[];
    }
  | {
      success: false;
      error?: string;
    }
> {
  return {
    success: false,
    error: "not implemented",
  };
}
