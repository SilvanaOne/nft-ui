"use client";

import {
  UpdateTimelineItemFunction,
  LineId,
  GroupId,
  messages,
} from "@/components/launch/lib/messages";
import { debug } from "@/lib/debug";
import { getChain } from "@/lib/chain";
import { log } from "@/lib/log";
import {
  buildTransaction,
  proveTransaction,
  BuiltNftTransaction,
} from "@/lib/api";

import { TokenActionTransactionParams } from "@/lib/token";
const DEBUG = debug();
const chain = getChain();

export async function buildNftTransaction(params: {
  data: TokenActionTransactionParams;
  sender: string;
  updateTimelineItem: UpdateTimelineItemFunction;
  groupId: string;
}): Promise<
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      jobId: string;
      collectionAddress: string;
      nftAddress?: string;
      privateMetadata?: string;
      metadataFileName?: string;
      privateKeys?: string;
      keysFileName?: string;
      storage?: string;
      metadataRoot?: string;
    }
> {
  const { data, sender, updateTimelineItem, groupId } = params;

  try {
    const mina = (window as any).mina;
    if (mina === undefined || mina?.isAuro !== true) {
      log.error("deployToken: no Auro Wallet found");
      updateTimelineItem({
        groupId,
        update: {
          lineId: "error",
          content: "No Auro Wallet found",
          status: "error",
        },
      });
      return {
        success: false,
        error: "No Auro Wallet found",
      };
    }

    let reply: BuiltNftTransaction | undefined = undefined;

    const txParams = data;
    txParams.sender = sender;
    if ("nftTransferParams" in txParams && !txParams.nftTransferParams.from) {
      txParams.nftTransferParams.from = sender;
    }

    const txReply = await buildTransaction(txParams);
    if (!txReply.success) {
      if (DEBUG)
        console.log("Error in buildTransaction", {
          error: txReply.error,
        });
      log.error("Error in buildTransaction", { error: txReply.error });
      updateTimelineItem({
        groupId,
        update: {
          lineId: "error",
          content: txReply.error,
          status: "error",
        },
      });
      return {
        success: false,
        error: txReply.error,
      };
    }
    reply = txReply.tx;

    if (!reply) {
      log.error("buildNftTransaction: Failed to build transaction");
      updateTimelineItem({
        groupId,
        update: {
          lineId: "error",
          content: "Failed to build transaction",
          status: "error",
        },
      });
      return { success: false, error: "Failed to build transaction" };
    }
    updateTimelineItem({
      groupId,
      update: {
        lineId: "txPrepared",
        content:
          txParams.txType === "nft:transfer"
            ? "NFT transfer transaction is built"
            : txParams.txType === "nft:approve"
            ? "NFT approve transaction is built"
            : txParams.txType === "nft:sell"
            ? "NFT sell transaction is built"
            : "NFT buy transaction is built",
        status: "success",
      },
    });
    updateTimelineItem({
      groupId,
      update: messages.txSigned,
    });

    const payloads = reply.tx;
    const txResult = await mina?.sendTransaction(payloads.walletPayload);
    if (DEBUG) console.log("Transaction result", txResult);
    payloads.signedData = txResult?.signedData;

    if (payloads.signedData === undefined) {
      if (DEBUG) console.log("No signed data");
      updateTimelineItem({
        groupId,
        update: {
          lineId: "noUserSignature",
          content: messages.noUserSignature.content,
          status: "error",
        },
      });
      log.error("deployToken: No user signature received");

      return {
        success: false,
        error: "No user signature received",
      };
    }

    updateTimelineItem({
      groupId,
      update: {
        lineId: "txSigned",
        content: "Transaction is signed",
        status: "success",
      },
    });

    updateTimelineItem({
      groupId,
      update: messages.txProved,
    });
    payloads.sendTransaction = false;
    const proveReply = await proveTransaction({
      tx: payloads,
      signedData: payloads.signedData,
    });

    if (DEBUG) console.log("Sent transaction, jobId", proveReply);
    if (proveReply.success === false) {
      log.error("buildNftTransaction: Transaction prove job failed", {
        txType: txParams.txType,
      });
      console.error("JobId is undefined");
      updateTimelineItem({
        groupId,
        update: {
          lineId: "deployTransactionProveJobFailed",
          content: messages.deployTransactionProveJobFailed.content,
          status: "error",
        },
      });
      log.error("buildNftTransaction: Transaction prove job failed");
      return {
        success: false,
        error: "Transaction prove job failed",
      };
    }

    const jobId = proveReply.jobId;

    const jobIdMessage = (
      <>
        <a
          href={`https://silvascan.io/testnet/agent-job/${jobId}`}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Proving
        </a>{" "}
        the transaction...
      </>
    );

    updateTimelineItem({
      groupId,
      update: {
        lineId: "txProved",
        content: jobIdMessage,
        status: "waiting",
      },
    });

    return {
      success: true,
      jobId,
      collectionAddress: reply.collectionAddress,
      privateMetadata: reply.privateMetadata,
      metadataFileName: reply.metadataFileName,
      privateKeys: reply.privateKeys,
      keysFileName: reply.keysFileName,
      storage: reply.storage,
      metadataRoot: reply.metadataRoot,
    };
  } catch (error: any) {
    console.error("build: Error in deployToken", error);
    log.error("build: deployToken: Error while deploying token", { error });
    updateTimelineItem({
      groupId,
      update: {
        lineId: "error",
        content: String(error?.message ?? "Unknown error"),
        status: "error",
      },
    });
    return {
      success: false,
      error: "Error while deploying token",
    };
  }
}
