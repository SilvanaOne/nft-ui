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
import { buildCollectionLaunchTransaction, proveTransaction } from "@/lib/api";
import {
  randomName,
  randomImage,
  randomBanner,
  randomText,
} from "@/lib/random";
import { LaunchNftCollectionStandardAdminParams } from "@silvana-one/api";
const DEBUG = debug();
const chain = getChain();
const WALLET = getWallet();

export async function mintNFT(params: {
  symbol: string;
  sender: string;
  updateTimelineItem: UpdateTimelineItemFunction;
  groupId: GroupId;
  mintType: "collection" | "nft";
}): Promise<{
  success: boolean;
  error?: string;
  jobId?: string;
}> {
  const { symbol, sender, updateTimelineItem, groupId, mintType } = params;

  try {
    const mina = (window as any).mina;
    if (mina === undefined || mina?.isAuro !== true) {
      log.error("deployToken: no Auro Wallet found");
      throw new Error("No Auro Wallet found");
    }

    const collectionName = randomName();
    console.log(`Launching new NFT collection ${collectionName}...`, {
      sender,
      collectionName,
    });

    const collectionLaunchParams: LaunchNftCollectionStandardAdminParams = {
      txType: "nft:launch",
      collectionName,
      sender,
      adminContract: "standard",
      symbol: "NFT",
      masterNFT: {
        name: collectionName,
        data: {
          owner: sender,
        },
        metadata: {
          name: collectionName,
          image: randomImage(),
          banner: randomBanner(),
          description: randomText(),
          traits: [
            {
              key: "Collection Trait 1",
              type: "string",
              value: "Collection Value 1",
            },
            {
              key: "Collection Trait 2",
              type: "string",
              value: "Collection Value 2",
            },
          ],
        },
      },
    };

    if (DEBUG)
      console.log("launchCollection: building tx", {
        collectionLaunchParams,
      });
    const launchReply = await buildCollectionLaunchTransaction(
      collectionLaunchParams
    );
    if (!launchReply.success) {
      if (DEBUG)
        console.log("Error in launchCollection", { error: launchReply.error });
      log.error("Error in launchCollection", { error: launchReply.error });
      updateTimelineItem({
        groupId,
        update: {
          lineId: "error",
          content: launchReply.error,
          status: "error",
        },
      });
      return {
        success: false,
        error: launchReply.error,
      };
    }

    updateTimelineItem({
      groupId,
      update: {
        lineId: "txPrepared",
        content:
          mintType === "collection"
            ? "NFT collection launch transaction is built"
            : "NFT mint transaction is built",
        status: "success",
      },
    });
    updateTimelineItem({
      groupId,
      update: messages.txSigned,
    });

    const payloads = launchReply.tx;
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
      log.error("mintNFT: Transaction prove job failed", { symbol });
      console.error("JobId is undefined");
      updateTimelineItem({
        groupId,
        update: {
          lineId: "deployTransactionProveJobFailed",
          content: messages.deployTransactionProveJobFailed.content,
          status: "error",
        },
      });
      log.error("mintNFT: Transaction prove job failed");
      return {
        success: false,
        error: "Transaction prove job failed",
      };
    }

    const jobId = proveReply.jobId;

    const jobIdMessage = (
      <>
        <a
          href={`https://zkcloudworker.com/job/${jobId}`}
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
