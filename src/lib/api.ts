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
  NftMintTransactionParams,
  txStatus,
  TransactionStatus,
  sendTransaction as sendTransactionApi,
  SendTransactionReply,
  getNftInfo,
  NftRequestAnswer,
  getTokenBalance,
} from "@silvana-one/api";
import { getChain } from "./chain";

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
  const tx = (
    await launchNftCollection({
      body: params,
    })
  ).data;
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
  const nftMintParams = (tx?.request as NftMintTransactionParams).nftMintParams;
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
    (tx?.request as NftMintTransactionParams).nftMintParams.addressPrivateKey =
      undefined;
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
}

export async function buildTransferTransaction(
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
  const nftMintParams = (tx?.request as NftMintTransactionParams).nftMintParams;
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
    (tx?.request as NftMintTransactionParams).nftMintParams.addressPrivateKey =
      undefined;
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
}

export async function proveTransaction(params: {
  tx: NftTransaction;
  signedData: string;
}): Promise<
  { success: true; jobId: string } | { success: false; error: string }
> {
  const { tx, signedData } = params;
  console.log("proveTransaction: proving transaction", {
    send: tx.sendTransaction,
  });
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
}

export async function proveTransactions(
  params: NftTransaction[]
): Promise<string | undefined> {
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
  const proof = (
    await getProof({
      body: {
        jobId,
      },
    })
  ).data;
  if (!proof) return { success: false, error: "No proof" };
  return { success: true, results: proof };
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
  const status = (
    await txStatus({
      body: { hash: txHash },
    })
  ).data;
  if (!status) return { success: false, error: "No status" };
  return { success: true, status };
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
  const reply = (
    await sendTransactionApi({
      body: { transaction },
    })
  ).data;
  if (!reply) return { success: false, error: "Error sending transaction" };
  return { success: true, reply };
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
}
