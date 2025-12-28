"use server";

import {
  config,
  launchNftCollection,
  mintNft,
  prove,
  getProof,
  txStatus,
  sendTransaction as sendTransactionApi,
  getNftInfo,
  getTokenBalance,
  transferNft,
  approveNft,
  sellNft,
  buyNft,
  getTransactions as getTransactionsApi,
  getTokenHolders as getTokenHoldersApi,
  cmsStoreNft,
  cmsReadNft,
} from "@silvana-one/api";

import type {
  LaunchNftCollectionStandardAdminParams,
  NftTransaction,
  JobResults,
  NftMintParams,
  NftTransferTransactionParams,
  NftApproveTransactionParams,
  NftSellTransactionParams,
  NftBuyTransactionParams,
  TransactionStatus,
  SendTransactionReply,
  NftRequestAnswer,
  NftMintTransactionParams,
  TransactionData,
  TokenHolder,
  TxStatus,
  TxStatusData,
  CmsnftData,
} from "@silvana-one/api";
import { getChain } from "./chain";

export type { TokenHolder, TransactionData };

/**
 * Helper function to serialize error objects to strings
 * Handles various error formats including nested objects
 */
function serializeError(error: any): string | undefined {
  console.log("serializeError: error", error);
  if (!error) return undefined;

  // If it's already a string, return it
  if (typeof error === "string") return error;

  // If it has a message property, use that
  if (error.message && typeof error.message === "string") {
    return error.message;
  }

  // If it has an error property, recursively serialize it
  if (error.error) {
    const serialized = serializeError(error.error);
    if (serialized) return serialized;
  }

  // If it's an object, try to stringify it
  if (typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      // If JSON.stringify fails, fall back to toString
      return error.toString();
    }
  }

  // For other types, convert to string
  return String(error);
}

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
    const result = await launchNftCollection({
      body: params,
    });
    console.log("buildCollectionLaunchTransaction: result", result);
    if (!result)
      return { success: false, error: "Failed to build transaction" };
    if (!result?.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to build transaction: ${
          result.error ?? responseError ?? "Error E301-1"
        }`,
      };
    }
    const tx = result.data;
    if (!tx) return { success: false, error: "Failed to build transaction" };
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
    console.error("buildCollectionLaunchTransaction error", error);
    const serializedError = serializeError(error);
    console.log(
      "buildCollectionLaunchTransaction: serializedError",
      serializedError
    );
    return {
      success: false,
      error: `Error while building transaction ${
        serializedError ?? "error E305"
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
    const result = await mintNft({
      body: params,
    });
    if (!result)
      return { success: false, error: "Failed to build transaction" };
    if (!result?.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to build transaction: ${
          result.error ?? responseError ?? "Error E302-1"
        }`,
      };
    }
    const tx = result?.data;
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
    console.error("buildMintTransaction error", error);
    return {
      success: false,
      error: `Error while building transaction ${
        serializeError(error) ?? "error E306"
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
    const result =
      params.txType === "nft:transfer"
        ? await transferNft({
            body: params,
          })
        : params.txType === "nft:sell"
        ? await sellNft({
            body: params,
          })
        : params.txType === "nft:buy"
        ? await buyNft({
            body: params,
          })
        : undefined;
    if (!result)
      return { success: false, error: "Failed to build transaction" };
    if (!result?.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to build transaction: ${
          result.error ?? responseError ?? "Error E303-1"
        }`,
      };
    }
    const tx = result.data;
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
    console.error("buildTransaction error", error);
    return {
      success: false,
      error: `Error while building transaction ${
        serializeError(error) ?? "error E307"
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
    const result = await prove({
      body: {
        tx,
        signedData,
      },
    });
    if (!result)
      return { success: false, error: "Failed to prove transaction" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to prove transaction: ${
          result.error ?? responseError ?? "Error E304-1"
        }`,
      };
    }
    const jobId = result?.data?.jobId;
    if (!jobId) return { success: false, error: "No jobId" };
    return { success: true, jobId };
  } catch (error: any) {
    console.error("proveTransaction error", error);
    return {
      success: false,
      error: `Error while proving transaction ${
        serializeError(error) ?? "error E308"
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
    const result = await getProof({
      body: {
        jobId,
      },
    });
    if (!result) return { success: false, error: "Failed to get proof" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to get proof: ${
          result.error ?? responseError ?? "Error E309-1"
        }`,
      };
    }
    const results = result.data;
    if (!results) return { success: false, error: "No results" };
    return { success: true, results };
  } catch (error: any) {
    console.error("getResult error", error);
    return {
      success: false,
      error: `Error while getting result ${
        serializeError(error) ?? "error E309"
      }`,
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
    const result = await txStatus({
      body: { hash: txHash },
    });
    if (!result)
      return { success: false, error: "Failed to get transaction status" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to get transaction status: ${
          result.error ?? responseError ?? "Error E310-1"
        }`,
      };
    }
    const status = result?.data;
    if (!status) return { success: false, error: "No status" };
    return { success: true, status };
  } catch (error: any) {
    console.error("getTransactionStatus error", error);
    return {
      success: false,
      error: `Error while getting transaction status ${
        serializeError(error) ?? "error E310"
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
    const result = await sendTransactionApi({
      body: { transaction },
    });
    if (!result) return { success: false, error: "Failed to send transaction" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to send transaction: ${
          result.error ?? responseError ?? "Error E311-1"
        }`,
      };
    }
    const reply = result.data;
    if (!reply) return { success: false, error: "No reply" };
    return { success: true, reply };
  } catch (error: any) {
    console.error("sendTransaction error", error);
    return {
      success: false,
      error: `Error while sending transaction ${
        serializeError(error) ?? "error E311"
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
    const result = await getTokenBalance({
      body: { address },
    });
    if (!result) return { success: false, error: "Failed to get balance" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to get balance: ${
          result.error ?? responseError ?? "Error E312-1"
        }`,
      };
    }
    const reply = result.data;
    if (!reply) return { success: false, error: "No reply" };
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
    const result = await getTransactionsApi({
      body: { tokenAddress: collectionAddress, address: nftAddress },
    });
    if (!result) return { success: false, error: "Error getting transactions" };
    if (!result?.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to get transactions: ${
          result.error ?? responseError ?? "Error E312-1"
        }`,
      };
    }
    return {
      success: true,
      transactions: result.data.transactions,
    };
  } catch (error: any) {
    console.error("getTransactions error", error);
    return {
      success: false,
      error: `Error while getting transactions ${
        serializeError(error) ?? "error E312"
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
        const result = await getTransactionsApi({
          body: { tokenAddress: collectionAddress, address: userAddress },
        });
        if (!result)
          return { success: false, error: "Failed to get transactions" };
        if (!result.data) {
          const responseError = result?.response?.statusText;
          return {
            success: false,
            error: `Failed to get transactions: ${
              result.error ?? responseError ?? "Error E312-1"
            }`,
          };
        }
        if (
          result.data &&
          result.data.transactions &&
          Array.isArray(result.data.transactions)
        ) {
          transactions.push(...result.data.transactions);
        }
      } catch (error: any) {
        console.error("getUserTransactions", error);
      }
    }
    return {
      success: true,
      transactions,
    };
  } catch (error: any) {
    console.error("getUserTransactions", error);
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
    const result = await getTokenHoldersApi({
      body: { address: collectionAddress },
    });
    if (!result)
      return { success: false, error: "Error getting token holders" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to get token holders: ${
          result.error ?? responseError ?? "Error E312-1"
        }`,
      };
    }
    return {
      success: true,
      tokenHolders: result.data.holders,
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
    const result = await cmsStoreNft({
      body: { nft, signature },
    });
    if (!result) return { success: false, error: "Error storing NFT" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to store NFT: ${
          result.error ?? responseError ?? "Error E312-1"
        }`,
      };
    }
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
    const result = await cmsReadNft({
      body: { collectionAddress, nftName, signature },
    });
    if (!result) return { success: false, error: "Error reading NFTs" };
    if (!result.data) {
      const responseError = result?.response?.statusText;
      return {
        success: false,
        error: `Failed to read NFTs: ${
          result.error ?? responseError ?? "Error E312-1"
        }`,
      };
    }
    return {
      success: true,
      nfts: result.data?.nfts ?? [],
    };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Error while reading NFTs" };
  }
}
