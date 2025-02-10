"use server";
import { getChain } from "./chain";
import { log as logtail } from "@logtail/next";
const chain = getChain();
const log = logtail.with({
  chain,
  service: "tx-status",
});
const BLOCKBERRY_API = process.env.BLOCKBERRY_API;

export interface TxStatus {
  blockHeight: number;
  stateHash: string;
  blockStatus: string;
  timestamp: number;
  txHash: string;
  txStatus: string;
  failures: {
    index: number;
    failureReason: string;
  }[];
  memo: string;
  feePayerAddress: string;
  feePayerName: string | null;
  feePayerImg: string | null;
  fee: number;
  feeUsd: number;
  totalBalanceChange: number;
  totalBalanceChangeUsd: number;
  updatedAccountsCount: number;
  updatedAccounts: {
    accountAddress: string;
    accountName: string | null;
    accountImg: string | null;
    isZkappAccount: boolean;
    verificationKey: string | null;
    verificationKeyHash: string | null;
    incrementNonce: boolean;
    totalBalanceChange: number;
    totalBalanceChangeUsd: number;
    callDepth: number;
    useFullCommitment: boolean;
    callData: string;
    tokenId: string;
    update: {
      appState: string[];
      delegateeAddress: string | null;
      delegateeName: string | null;
      delegateeImg: string | null;
      permissions: {
        access: string | null;
        editActionState: string | null;
        editState: string | null;
        incrementNonce: string | null;
        receive: string | null;
        send: string | null;
        setDelegate: string | null;
        setPermissions: string | null;
        setTiming: string | null;
        setTokenSymbol: string | null;
        setVerificationKey: string | null;
        setVotingFor: string | null;
        setZkappUri: string | null;
      };
      timing: {
        initialMinimumBalance: string | null;
        cliffTime: number | null;
        cliffAmount: string | null;
        vestingPeriod: number | null;
        vestingIncrement: string | null;
      };
      tokenSymbol: string | null;
      verificationKey: string | null;
      votingFor: string | null;
      zkappUri: string | null;
    };
  }[];
  blockConfirmationsCount: number;
  isZkappAccount: boolean;
  nonce: number;
  isAccountHijack: boolean | null;
}

export async function getTxStatus(params: {
  hash: string;
}): Promise<TxStatus | undefined> {
  const { hash } = params;
  if (!BLOCKBERRY_API) {
    console.error("BLOCKBERRY_API is undefined");
    return undefined;
  }
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": BLOCKBERRY_API,
    },
  };
  try {
    const response = await fetch(
      `https://api.blockberry.one/${chain}/v1/zkapps/txs/${hash}`,
      options
    );
    if (response.ok) {
      const result = await response.json();
      return result as TxStatus;
    } else {
      console.error("getTxStatus error while getting tx status - not ok", {
        hash,
        text: response.statusText,
        status: response.status,
      });
      return undefined;
    }
  } catch (error: any) {
    // console.error("getTxStatus error - catch", {
    //   hash,
    //   error: error?.message ?? String(error),
    // });
    return undefined;
  }
}

/*
{
  "blockHeight": 339499,
  "stateHash": "3NKX5bjNMzRURbm1PArVgyV68j3QMF7kskDJFwLSgeknHevQ6SHX",
  "blockStatus": "canonical",
  "timestamp": 1724244660000,
  "txHash": "5JuV47jgqkXsBXEqg4xMA1q8p8MEbSNHd3Pj4jbh1zJ2pXZtnZTh",
  "txStatus": "applied",
  "failures": [],
  "memo": "Test ZKApp to Receiver",
  "feePayerAddress": "B62qpfgnUm7zVqi8MJHNB2m37rtgMNDbFNhC2DpMmmVpQt8x6gKv9Ww",
  "feePayerName": null,
  "feePayerImg": null,
  "fee": 0.1,
  "feeUsd": 0.05632500000000001,
  "totalBalanceChange": -0.1,
  "totalBalanceChangeUsd": -0.05632500000000001,
  "updatedAccountsCount": 2,
  "updatedAccounts": [
    {
      "accountAddress": "B62qpfgnUm7zVqi8MJHNB2m37rtgMNDbFNhC2DpMmmVpQt8x6gKv9Ww",
      "accountName": null,
      "accountImg": null,
      "isZkappAccount": false,
      "verificationKey": null,
      "verificationKeyHash": null,
      "incrementNonce": false,
      "totalBalanceChange": -2,
      "totalBalanceChangeUsd": -1.1265,
      "callDepth": 0,
      "useFullCommitment": true,
      "callData": "0",
      "tokenId": "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
      "update": {
        "appState": [
          ""
        ],
        "delegateeAddress": null,
        "delegateeName": null,
        "delegateeImg": null,
        "permissions": {
          "access": null,
          "editActionState": null,
          "editState": null,
          "incrementNonce": null,
          "receive": null,
          "send": null,
          "setDelegate": null,
          "setPermissions": null,
          "setTiming": null,
          "setTokenSymbol": null,
          "setVerificationKey": null,
          "setVotingFor": null,
          "setZkappUri": null
        },
        "timing": {
          "initialMinimumBalance": null,
          "cliffTime": null,
          "cliffAmount": null,
          "vestingPeriod": null,
          "vestingIncrement": null
        },
        "tokenSymbol": null,
        "verificationKey": null,
        "votingFor": null,
        "zkappUri": null
      }
    },
    {
      "accountAddress": "B62qpYCQrD9qxKcQF2Ja2bPTtfJ2Zj3SsVsgaivT515NknHsimg63CX",
      "accountName": null,
      "accountImg": null,
      "isZkappAccount": false,
      "verificationKey": null,
      "verificationKeyHash": null,
      "incrementNonce": false,
      "totalBalanceChange": 2,
      "totalBalanceChangeUsd": 1.1265,
      "callDepth": 1,
      "useFullCommitment": false,
      "callData": "0",
      "tokenId": "wSHV2S4qX9jFsLjQo8r1BsMLH2ZRKsZx6EJd1sbozGPieEC4Jf",
      "update": {
        "appState": [
          ""
        ],
        "delegateeAddress": null,
        "delegateeName": null,
        "delegateeImg": null,
        "permissions": {
          "access": null,
          "editActionState": null,
          "editState": null,
          "incrementNonce": null,
          "receive": null,
          "send": null,
          "setDelegate": null,
          "setPermissions": null,
          "setTiming": null,
          "setTokenSymbol": null,
          "setVerificationKey": null,
          "setVotingFor": null,
          "setZkappUri": null
        },
        "timing": {
          "initialMinimumBalance": null,
          "cliffTime": null,
          "cliffAmount": null,
          "vestingPeriod": null,
          "vestingIncrement": null
        },
        "tokenSymbol": null,
        "verificationKey": null,
        "votingFor": null,
        "zkappUri": null
      }
    }
  ],
  "blockConfirmationsCount": 18312,
  "isZkappAccount": false,
  "nonce": 195232,
  "isAccountHijack": null
}
*/
