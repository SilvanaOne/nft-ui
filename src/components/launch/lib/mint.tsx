"use client";

import {
  UpdateTimelineItemFunction,
  LineId,
  GroupId,
  messages,
} from "./messages";
import { debug } from "@/lib/debug";
import { getChain } from "@/lib/chain";
import { log } from "@/lib/log";
import {
  buildCollectionLaunchTransaction,
  proveTransaction,
  MintTransaction,
  buildMintTransaction,
} from "@/lib/api";
import {
  LaunchNftCollectionStandardAdminParams,
  NftMintTransactionParams,
  NftTransaction,
} from "@silvana-one/api";
import { LaunchCollectionData } from "@/lib/token";
const DEBUG = debug();
const chain = getChain();

export async function mintNFT(params: {
  data: LaunchCollectionData;
  image: string;
  banner: string | undefined;
  sender: string;
  updateTimelineItem: UpdateTimelineItemFunction;
  groupId: GroupId;
}): Promise<
  | {
      success: false;
      error: string;
    }
  | {
      success: true;
      jobId: string;
      collectionAddress: string;
      nftAddress: string | undefined;
      privateMetadata: string;
      metadataFileName: string;
      privateKeys: string;
      keysFileName: string;
      storage: string;
      metadataRoot: string;
    }
> {
  const { data, sender, image, banner, updateTimelineItem, groupId } = params;
  const { symbol, name, description, adminAddress, traits, mintType } = data;

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

    let reply: MintTransaction | undefined = undefined;

    if (mintType === "collection") {
      const collectionName = data.name;
      console.log(`Launching new NFT collection ${collectionName}...`, {
        sender,
        collectionName,
      });

      const collectionLaunchParams: LaunchNftCollectionStandardAdminParams = {
        txType: "nft:launch",
        collectionName,
        collectionData: {
          ...(data.collectionPermissions ?? {}),
          transferFee: data.collectionPermissions?.transferFee
            ? Number(data.collectionPermissions.transferFee)
            : undefined,
        },
        sender,
        adminContract: "standard",
        symbol: "NFT",
        masterNFT: {
          name: collectionName,
          data: {
            ...(data.nftPermissions ?? {}),
            owner: sender,
            id: data.nftPermissions?.id
              ? data.nftPermissions.id.toString()
              : undefined,
          },
          metadata: {
            name: collectionName,
            image,
            banner,
            description,
            traits: traits.map((trait) => ({
              key: trait.key,
              value: trait.value,
              isPrivate: trait.isPrivate,
              type: "string",
            })),
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
      console.log("launchCollection: build tx result", {
        launchReply,
      });
      if (!launchReply.success) {
        if (DEBUG)
          console.log("Error in launchCollection", {
            error: launchReply.error,
          });
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
      reply = launchReply.tx;
    }

    if (mintType === "nft") {
      console.log(`new NFT collection ${data.name}...`, {
        sender,
      });

      if (!data.collectionAddress) {
        log.error("mintNFT: Collection address is not set");
        updateTimelineItem({
          groupId,
          update: {
            lineId: "error",
            content: "Collection address is not set",
            status: "error",
          },
        });
        return {
          success: false,
          error: "Collection address is not set",
        };
      }
      const mintParams: NftMintTransactionParams = {
        txType: "nft:mint",
        sender,
        collectionAddress: data.collectionAddress,
        nftMintParams: {
          name: data.name,
          data: {
            ...(data.nftPermissions ?? {}),
            owner: sender,
            id: data.nftPermissions?.id
              ? data.nftPermissions.id.toString()
              : undefined,
          },
          metadata: {
            name: data.name,
            image,
            banner,
            description,
            traits: traits.map((trait) => ({
              key: trait.key,
              value: trait.value,
              isPrivate: trait.isPrivate,
              type: "string",
            })),
          },
        },
      };

      if (DEBUG)
        console.log("Mint NFT: building tx", {
          mintParams,
        });
      const mintReply = await buildMintTransaction(mintParams);
      if (!mintReply.success) {
        if (DEBUG)
          console.log("Error in mintNFT", {
            error: mintReply.error,
          });
        log.error("Error in mintNFT", { error: mintReply.error });
        updateTimelineItem({
          groupId,
          update: {
            lineId: "error",
            content: mintReply.error,
            status: "error",
          },
        });
        return {
          success: false,
          error: mintReply.error,
        };
      }
      reply = mintReply.tx;
    }

    if (!reply) {
      log.error("mintNFT: Failed to build transaction");
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
      collectionAddress: reply.collectionAddress,
      privateMetadata: reply.privateMetadata,
      metadataFileName: reply.metadataFileName,
      privateKeys: reply.privateKeys,
      keysFileName: reply.keysFileName,
      storage: reply.storage,
      metadataRoot: reply.metadataRoot,
      nftAddress: reply.nftAddress,
    };
  } catch (error: any) {
    console.error("Error in deployToken", error);
    log.error("deployToken: Error while deploying token", { error });
    updateTimelineItem({
      groupId,
      update: {
        lineId: "error",
        content: String(error?.message ?? "Unknown error"),
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
