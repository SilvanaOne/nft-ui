"use client";
import { TimeLineItem } from "@/components/launch/TimeLine";
export type GroupId =
  | "verify"
  | "image"
  | "metadata"
  | "deploy"
  | "mint"
  | "transaction";

export type LineId =
  | "verifyData"
  | "mintDataError"
  | "o1js"
  | "tokenAddress"
  | "adminRequired"
  | "adminAddressDoNotMatch"
  | "noAuroWallet"
  | "pinningImage"
  | "pinningMetadata"
  | "privateKeysGenerated"
  | "privateKeysSaved"
  | "txPrepared"
  | "txMint"
  | "txSigned"
  | "txProved"
  | "txSent"
  | "txIncluded"
  | "contractStateVerified"
  | "mintBalance"
  | "error"
  | "accountNotFound"
  | "insufficientBalance"
  | "noUserSignature"
  | "deployTransactionProveJobFailed"
  | "deployTransactionError"
  | "contractVerification"
  | "mintingTokens"
  | "arweaveTx"
  | "arweaveIncluded";

export type UpdateTimelineItemFunction = (params: {
  groupId: string;
  update: TimeLineItem;
}) => void;

export const messages: { [key in LineId]: TimeLineItem } = {
  verifyData: {
    lineId: "verifyData",
    content: "Verifying data...",
    status: "waiting",
  },
  mintDataError: {
    lineId: "mintDataError",
    content: "Mint data error",
    status: "error",
  },
  o1js: {
    lineId: "o1js",
    content: (
      <>
        Loading{" "}
        <a
          href="https://docs.minaprotocol.com/zkapps/o1js"
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          o1js
        </a>{" "}
        library...
      </>
    ),
    status: "waiting",
  },
  tokenAddress: {
    lineId: "tokenAddress",
    content: "Token address is generated",
    status: "success",
  },
  adminRequired: {
    lineId: "adminRequired",
    content: "Admin address is required to launch a token",
    status: "error",
  },
  adminAddressDoNotMatch: {
    lineId: "adminAddressDoNotMatch",
    content: "Admin address does not match with wallet address",
    status: "error",
  },
  noAuroWallet: {
    lineId: "noAuroWallet",
    content: "No Auro Wallet found",
    status: "error",
  },
  pinningImage: {
    lineId: "pinningImage",
    content: "Uploading token image to Arweave...",
    status: "waiting",
  },
  pinningMetadata: {
    lineId: "pinningMetadata",
    content: "Uploading token metadata to Arweave...",
    status: "waiting",
  },
  privateKeysGenerated: {
    lineId: "privateKeysGenerated",
    content: "Generating token private keys...",
    status: "waiting",
  },
  privateKeysSaved: {
    lineId: "privateKeysSaved",
    content: "Saving token private keys...",
    status: "waiting",
  },
  txPrepared: {
    lineId: "txPrepared",
    content: "Preparing the transaction...",
    status: "waiting",
  },
  txMint: {
    lineId: "txMint",
    content: "Preparing the transaction...",
    status: "waiting",
  },
  txSigned: {
    lineId: "txSigned",
    content: "Please sign the transaction...",
    status: "waiting",
  },
  txProved: {
    lineId: "txProved",
    content: "Proving the transaction...",
    status: "waiting",
  },
  txSent: {
    lineId: "txSent",
    content: "Sending the transaction...",
    status: "waiting",
  },
  txIncluded: {
    lineId: "txIncluded",
    content: "Waiting for transaction to be included in a block...",
    status: "waiting",
  },
  mintBalance: {
    lineId: "mintBalance",
    content: "Checking token balance...",
    status: "waiting",
  },
  contractStateVerified: {
    lineId: "contractStateVerified",
    content: "Verifying the token contract state...",
    status: "waiting",
  },
  error: {
    lineId: "error",
    content: "Error launching token",
    status: "error",
  },
  accountNotFound: {
    lineId: "accountNotFound",
    content: "Account not found",
    status: "error",
  },
  insufficientBalance: {
    lineId: "insufficientBalance",
    content: "Insufficient balance",
    status: "error",
  },
  noUserSignature: {
    lineId: "noUserSignature",
    content: "No user signature received",
    status: "error",
  },

  deployTransactionProveJobFailed: {
    lineId: "deployTransactionProveJobFailed",
    content: "Deploy transaction proof job failed",
    status: "error",
  },

  deployTransactionError: {
    lineId: "deployTransactionError",
    content: "Deploy transaction error",
    status: "error",
  },
  contractVerification: {
    lineId: "contractVerification",
    content: "Verifying token contract state...",
    status: "waiting",
  },
  mintingTokens: {
    lineId: "mintingTokens",
    content: "Minting tokens...",
    status: "waiting",
  },
  arweaveTx: {
    lineId: "arweaveTx",
    content: "Sending transaction to Arweave...",
    status: "waiting",
  },
  arweaveIncluded: {
    lineId: "arweaveIncluded",
    content: "Waiting for arweave transaction to be included in a block...",
    status: "waiting",
  },
};
