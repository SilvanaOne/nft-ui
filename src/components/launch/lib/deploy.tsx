"use client";

import {
  UpdateTimelineItemFunction,
  LineId,
  GroupId,
  messages,
} from "./messages";
import { debug } from "@/lib/debug";
import { getChain, getWallet } from "@/lib/chain";
import { log } from "@/lib/log";
const DEBUG = debug();
const chain = getChain();
const WALLET = getWallet();

export async function deployToken(params: {
  tokenPrivateKey: string;
  adminContractPrivateKey: string;
  adminPublicKey: string;
  symbol: string;
  uri: string;
  updateTimelineItem: UpdateTimelineItemFunction;
  groupId: GroupId;
  tokenType: "standard" | "meme";
}): Promise<{
  success: boolean;
  error?: string;
  jobId?: string;
}> {
  const {
    tokenPrivateKey,
    adminPublicKey,
    symbol,
    uri,
    updateTimelineItem,
    groupId,
    tokenType,
  } = params;

  try {
    const mina = (window as any).mina;
    if (mina === undefined || mina?.isAuro !== true) {
      log.error("deployToken: no Auro Wallet found");
      throw new Error("No Auro Wallet found");
    }

    return {
      success: false,
      error: "not implemented",
    };
  } catch (error) {
    console.error("Error in deployToken", error);
    log.error("deployToken: Error while deploying token", { error });
    updateTimelineItem({
      groupId,
      update: {
        lineId: "error",
        content: String(error),
        status: "error",
      },
    });
    log.error("deployToken: Error while deploying token", { error });
    return {
      success: false,
      error: "Error while deploying token",
    };
  }
}
