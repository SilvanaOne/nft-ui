"use server";

import {
  LaunchNftCollectionStandardAdminParams,
  NftTransaction,
  config,
  launchNftCollection,
  mintNft,
  prove,
  getProof,
  JobResults,
  NftMintParams,
  NftTransferTransactionParams,
  NftApproveTransactionParams,
  NftSellTransactionParams,
  NftBuyTransactionParams,
  txStatus,
  TransactionStatus,
  sendTransaction as sendTransactionApi,
  SendTransactionReply,
  getNftInfo,
  NftRequestAnswer,
  getTokenBalance,
  transferNft,
  approveNft,
  sellNft,
  buyNft,
  NftMintTransactionParams,
  getTransactions as getTransactionsApi,
  TransactionData,
  getTokenHolders as getTokenHoldersApi,
  TokenHolder,
  TxStatus,
  TxStatusData,
  cmsStoreNft,
  cmsReadNft,
  CmsnftData,
} from "@silvana-one/api";
import { getChain } from "./chain";

export type { TokenHolder, TransactionData };

const SEND_TRANSACTION = true;

const chain = getChain();
const apiKey = process.env.MINATOKENS_JWT_KEY;
if (!apiKey) {
  throw new Error("MINATOKENS_JWT_KEY is not set");
}
config({
  apiKey,
  chain,
});

export async function getNFTInfo(params: {
  collectionAddress: string;
  nftAddress?: string;
}): Promise<
  | {
      success: true;
      info: NftRequestAnswer;
    }
  | {
      success: false;
      error?: string;
    }
> {
  const info = (
    await getNftInfo({
      body: params,
    })
  ).data;
  if (!info) return { success: false, error: "No info" };
  return { success: true, info };
}

export interface MintTransaction {
  mintType: "collection" | "nft";
  tx: NftTransaction;
  collectionAddress: string;
  collectionName: string;
  privateMetadata: string;
  metadataFileName: string;
  privateKeys: string;
  keysFileName: string;
  storage: string;
  metadataRoot: string;
  nftName: string;
  nftAddress: string;
}

export async function buildCollectionLaunchTransaction(
  params: LaunchNftCollectionStandardAdminParams
): Promise<
  | {
      success: true;
      tx: MintTransaction;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    console.log("buildCollectionLaunchTransaction: building transaction", {
      params,
    });
    const tx = (
      await launchNftCollection({
        body: params,
      })
    ).data;
    console.log("buildCollectionLaunchTransaction: transaction result", {
      tx,
    });
    if (!tx) return { success: false, error: "Failed to build transaction" };
    if (!tx.privateMetadata)
      return { success: false, error: "Failed to get private metadata" };
    if (!tx.storage) return { success: false, error: "Failed to get storage" };
    if (!tx.metadataRoot)
      return { success: false, error: "Failed to get metadata root" };

    if (!tx.request || !("adminContractAddress" in tx.request))
      return { success: false, error: "Failed to get admin contract address" };
    const adminContractAddress = tx?.request?.adminContractAddress;
    const collectionAddress = tx?.request?.collectionAddress;
    if (!collectionAddress)
      return { success: false, error: "Failed to get collection address" };
    console.log("NFT collection address:", collectionAddress);
    console.log("Admin contract address:", adminContractAddress);
    console.log("Storage address:", tx?.storage);
    console.log("Metadata root:", tx?.metadataRoot);
    let privateMetadata: string | undefined = undefined;
    let metadataFileName: string | undefined = undefined;
    let privateKeys: string | undefined = undefined;
    let keysFileName: string | undefined = undefined;

    metadataFileName = `collection-${collectionAddress}-metadata.json`;
    privateMetadata = tx.privateMetadata;
    // Remove private metadata from the transaction
    tx.privateMetadata = undefined;

    keysFileName = `collection-${collectionAddress}-keys.json`;
    privateKeys = JSON.stringify(
      {
        collectionName: tx?.collectionName,
        collectionAddress,
        masterNFT: tx?.nftName,
        adminContractAddress,
        collectionContractPrivateKey: tx?.request?.collectionContractPrivateKey,
        adminContractPrivateKey: tx?.request?.adminContractPrivateKey,
        storage: tx?.storage,
        metadataRoot: tx?.metadataRoot,
      },
      null,
      2
    );
    // Remove private keys from the request
    if (tx.request) {
      tx.request.collectionContractPrivateKey = undefined;
      tx.request.adminContractPrivateKey = undefined;
    }

    return {
      success: true,
      tx: {
        mintType: "collection",
        tx,
        collectionAddress,
        collectionName: tx.collectionName,
        privateMetadata,
        metadataFileName,
        privateKeys,
        keysFileName,
        storage: tx.storage,
        metadataRoot: tx.metadataRoot,
        nftName: tx.nftName,
        nftAddress: collectionAddress,
      },
    };
  } catch (error: any) {
    console.error("buildCollectionLaunchTransaction error", error?.message);
    return {
      success: false,
      error: `Error while building transaction ${
        error?.message ?? "error E305"
      }`,
    };
  }
}

export async function buildMintTransaction(
  params: NftMintTransactionParams
): Promise<
  | {
      success: true;
      tx: MintTransaction;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const tx = (
      await mintNft({
        body: params,
      })
    ).data;
    if (!tx) return { success: false, error: "Failed to build transaction" };
    if (!tx.privateMetadata)
      return { success: false, error: "Failed to get private metadata" };
    if (!tx.storage) return { success: false, error: "Failed to get storage" };
    if (!tx.metadataRoot)
      return { success: false, error: "Failed to get metadata root" };

    const collectionAddress = tx?.request?.collectionAddress;
    if (!collectionAddress)
      return { success: false, error: "Failed to get collection address" };
    const collectionName = tx?.collectionName;
    if (!collectionName)
      return { success: false, error: "Failed to get collection name" };
    const nftMintParams = (tx?.request as NftMintTransactionParams)
      .nftMintParams;
    const nftAddress = nftMintParams?.address;
    if (!nftAddress) {
      return { success: false, error: "Failed to get NFT address" };
    }
    const nftName = tx?.nftName;
    if (!nftName) {
      return { success: false, error: "Failed to get NFT name" };
    }
    if (!collectionAddress) {
      return { success: false, error: "Failed to get collection address" };
    }
    if (!nftAddress) {
      return { success: false, error: "Failed to get NFT address" };
    }
    console.log("NFT address:", nftAddress);
    console.log("NFT collection address:", collectionAddress);
    console.log("NFT collection name:", collectionName);
    console.log("Storage address:", tx?.storage);
    console.log("Metadata root:", tx?.metadataRoot);

    const metadataFileName = `nft-${collectionAddress}-${nftAddress}-metadata.json`;
    const privateMetadata = tx.privateMetadata;
    // Remove private metadata from the transaction
    tx.privateMetadata = undefined;

    const keysFileName = `nft-${collectionAddress}-${nftAddress}-keys.json`;
    const privateKeys = JSON.stringify(
      {
        nftName,
        collectionName: tx?.collectionName,
        collectionAddress,
        nftAddress,
        nftContractPrivateKey: nftMintParams?.addressPrivateKey,
        storage: tx?.storage,
        metadataRoot: tx?.metadataRoot,
      },
      null,
      2
    );
    // Remove private keys from the request
    if ((tx?.request as NftMintTransactionParams).nftMintParams) {
      (
        tx?.request as NftMintTransactionParams
      ).nftMintParams.addressPrivateKey = undefined;
    }

    return {
      success: true,
      tx: {
        mintType: "nft",
        tx,
        privateMetadata,
        metadataFileName,
        privateKeys,
        keysFileName,
        collectionName,
        nftName,
        nftAddress,
        collectionAddress,
        storage: tx.storage,
        metadataRoot: tx.metadataRoot,
      },
    };
  } catch (error: any) {
    console.error("buildMintTransaction error", error?.message);
    return {
      success: false,
      error: `Error while building transaction ${
        error?.message ?? "error E306"
      }`,
    };
  }
}

export interface BuiltNftTransaction {
  tx: NftTransaction;
  collectionAddress: string;
  collectionName: string;
  privateMetadata?: string;
  metadataFileName?: string;
  privateKeys?: string;
  keysFileName?: string;
  storage?: string;
  metadataRoot?: string;
  nftName: string;
}

export async function buildTransaction(
  params:
    | NftTransferTransactionParams
    | NftApproveTransactionParams
    | NftSellTransactionParams
    | NftBuyTransactionParams
): Promise<
  | {
      success: true;
      tx: BuiltNftTransaction;
    }
  | {
      success: false;
      error: string;
    }
> {
  try {
    const tx =
      params.txType === "nft:transfer"
        ? (
            await transferNft({
              body: params,
            })
          ).data
        : params.txType === "nft:sell"
        ? (
            await sellNft({
              body: params,
            })
          ).data
        : params.txType === "nft:buy"
        ? (
            await buyNft({
              body: params,
            })
          ).data
        : undefined;
    if (!tx) return { success: false, error: "Failed to build transaction" };
    if (!tx.storage) return { success: false, error: "Failed to get storage" };
    if (!tx.metadataRoot)
      return { success: false, error: "Failed to get metadata root" };

    const collectionAddress = tx?.request?.collectionAddress;
    if (!collectionAddress)
      return { success: false, error: "Failed to get collection address" };
    const collectionName = tx?.collectionName;
    if (!collectionName)
      return { success: false, error: "Failed to get collection name" };

    const nftName = tx?.nftName;
    if (!nftName) {
      return { success: false, error: "Failed to get NFT name" };
    }

    return {
      success: true,
      tx: {
        tx,
        nftName,
        collectionName,
        collectionAddress,
      },
    };
  } catch (error: any) {
    console.error("buildTransaction error", error?.message);
    return {
      success: false,
      error: `Error while building transaction ${
        error?.message ?? "error E305"
      }`,
    };
  }
}

export async function proveTransaction(params: {
  tx: NftTransaction;
  signedData: string;
  sendTransaction?: boolean;
}): Promise<
  { success: true; jobId: string } | { success: false; error: string }
> {
  try {
    const { tx, signedData, sendTransaction = SEND_TRANSACTION } = params;
    console.log("proveTransaction: proving transaction", {
      send: tx.sendTransaction,
    });
    tx.sendTransaction = sendTransaction;
    const proveTx = (
      await prove({
        body: {
          tx,
          signedData,
        },
      })
    ).data;
    if (!proveTx?.jobId) return { success: false, error: "No jobId" };
    return { success: true, jobId: proveTx.jobId };
  } catch (error: any) {
    console.error("proveTransaction error", error?.message);
    return {
      success: false,
      error: `Error while proving transaction ${
        error?.message ?? "error E306"
      }`,
    };
  }
}

export async function proveTransactions(params: {
  transactions: NftTransaction[];
  sendTransaction?: boolean;
}): Promise<string | undefined> {
  const { transactions, sendTransaction = SEND_TRANSACTION } = params;
  throw new Error("Not implemented");
  return undefined;
}

export async function getResult(jobId: string): Promise<
  | {
      success: true;
      results: JobResults;
    }
  | {
      success: false;
      error?: string;
    }
> {
  try {
    const proof = (
      await getProof({
        body: {
          jobId,
        },
      })
    ).data;
    if (!proof) return { success: false, error: "No proof" };
    return { success: true, results: proof };
  } catch (error: any) {
    console.error("getResult error", error?.message);
    return {
      success: false,
      error: `Error while getting result ${error?.message ?? "error E307"}`,
    };
  }
}

export async function getTransactionStatus(txHash: string): Promise<
  | {
      success: true;
      status: TransactionStatus;
    }
  | {
      success: false;
      error?: string;
    }
> {
  try {
    const status = (
      await txStatus({
        body: { hash: txHash },
      })
    ).data;
    if (!status) return { success: false, error: "No status" };
    return { success: true, status };
  } catch (error: any) {
    console.error("getTransactionStatus error", error?.message);
    return {
      success: false,
      error: `Error while getting transaction status ${
        error?.message ?? "error E308"
      }`,
    };
  }
}

export async function sendTransaction(transaction: string): Promise<
  | {
      success: true;
      reply: SendTransactionReply;
    }
  | {
      success: false;
      error?: string;
    }
> {
  try {
    const reply = (
      await sendTransactionApi({
        body: { transaction },
      })
    ).data;
    if (!reply) return { success: false, error: "Error sending transaction" };
    return { success: true, reply };
  } catch (error: any) {
    console.error("sendTransaction error", error?.message);
    return {
      success: false,
      error: `Error while sending transaction ${
        error?.message ?? "error E309"
      }`,
    };
  }
}

export async function balance(address: string): Promise<
  | {
      success: true;
      balance: number | undefined;
      hasAccount: boolean;
    }
  | {
      success: false;
      error?: string;
    }
> {
  try {
    const reply = (
      await getTokenBalance({
        body: { address },
      })
    ).data;
    if (!reply) return { success: false, error: "Error getting balance" };
    return {
      success: true,
      balance: reply.balance,
      hasAccount: reply.hasAccount ?? false,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error getting balance" };
  }
}

export async function getTransactions(params: {
  collectionAddress: string;
  nftAddress?: string;
}): Promise<
  | {
      success: true;
      transactions: TransactionData[];
    }
  | {
      success: false;
      error?: string;
    }
> {
  const { collectionAddress, nftAddress } = params;
  try {
    const reply = (
      await getTransactionsApi({
        body: { tokenAddress: collectionAddress, address: nftAddress },
      })
    ).data;
    if (!reply) return { success: false, error: "Error getting transactions" };
    return {
      success: true,
      transactions: reply.transactions,
    };
  } catch (error: any) {
    console.error("getTransactions error", error?.message);
    return {
      success: false,
      error: `Error while getting transactions ${
        error?.message ?? "error E310"
      }`,
    };
  }
}

export async function getUserTransactions(params: {
  collectionAddresses: string[];
  userAddress: string;
}): Promise<
  | {
      success: true;
      transactions: TransactionData[];
    }
  | {
      success: false;
      error?: string;
    }
> {
  const { collectionAddresses, userAddress } = params;
  try {
    const transactions: TransactionData[] = [];
    const uniqueCollectionAddresses = new Set(collectionAddresses);
    const uniqueAddressesArray = Array.from(uniqueCollectionAddresses);
    for (const collectionAddress of uniqueAddressesArray) {
      try {
        const reply = (
          await getTransactionsApi({
            body: { tokenAddress: collectionAddress, address: userAddress },
          })
        ).data;
        if (reply && reply.transactions && Array.isArray(reply.transactions)) {
          transactions.push(...reply.transactions);
        }
      } catch (error: any) {
        console.error("getUserTransactions", error?.message);
      }
    }
    return {
      success: true,
      transactions,
    };
  } catch (error: any) {
    console.error("getUserTransactions", error?.message);
    return { success: false, error: "Error getting transactions" };
  }
}

export async function getTokenHolders(params: {
  collectionAddress: string;
}): Promise<
  | {
      success: true;
      tokenHolders: TokenHolder[];
    }
  | {
      success: false;
      error?: string;
    }
> {
  const { collectionAddress } = params;
  try {
    const reply = (
      await getTokenHoldersApi({
        body: { address: collectionAddress },
      })
    ).data;
    if (!reply) return { success: false, error: "Error getting token holders" };
    return {
      success: true,
      tokenHolders: reply.holders,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error getting token holders" };
  }
}

export async function storeNft(params: {
  nft: CmsnftData;
  signature: string;
}): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      error?: string;
    }
> {
  const { nft, signature } = params;
  try {
    const reply = (
      await cmsStoreNft({
        body: { nft, signature },
      })
    ).data;
    if (!reply || !reply.success)
      return { success: false, error: "Error storing NFT" };

    return {
      success: true,
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Error while storing NFT" };
  }
}

export async function readNft(params: {
  collectionAddress: string;
  nftName?: string;
  signature?: string;
}): Promise<
  | {
      success: true;
      nfts: CmsnftData[];
    }
  | {
      success: false;
      error?: string;
    }
> {
  const { collectionAddress, nftName, signature } = params;
  try {
    const reply = (
      await cmsReadNft({
        body: { collectionAddress, nftName, signature },
      })
    ).data;
    if (!reply || !reply.nfts)
      return { success: false, error: "Error reading NFTs" };

    return {
      success: true,
      nfts: reply.nfts,
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error while reading NFTs" };
  }
}
