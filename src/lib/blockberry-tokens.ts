"use server";
import { getChain } from "./chain";
const { BLOCKBERRY_API } = process.env;
const chain = getChain();
import { log as logtail } from "@logtail/next";
const log = logtail.with({
  service: "blockberry-tokens",
  chain,
});

/*
{
  data: [
    {
      tokenId: 'xBxjFpJkbWpbGua7Lf36S1NLhffFoEChyP3pz6SYKnx7dFCTwg',
      tokenSymbol: 'PUNK5',
      balance: 1181.49,
      nonce: 0,
      tokenType: 'CUSTOM_TOKEN',
      tokenName: 'Punk',
      tokenImage: 'https://strapi-dev.scand.app/uploads/Punkpoll_Logo_3f85b2e29d_2e251a1e65.jpg',
      isVerified: true,
      isBridged: false,
      coingeckoCoinId: null,
      coinmarketCoinId: null
    }
  ],
  size: 20,
  totalPages: 1,
  pageable: {
    sort: { sorted: true, empty: false, unsorted: false },
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false
  },
  last: true,
  totalElements: 1,
  number: 0,
  sort: { sorted: true, empty: false, unsorted: false },
  first: true,
  numberOfElements: 1,
  empty: false
}
*/

export interface BlockberryTokenData {
  tokenId: string;
  tokenSymbol: string;
  balance: number;
  nonce: number;
  tokenType: string;
  tokenName: string;
  tokenImage: string;
  isVerified: boolean;
  isBridged: boolean;
  coingeckoCoinId: string | null;
  coinmarketCoinId: string | null;
}

export interface BlockberryTokens {
  data: BlockberryTokenData[];
  size: number;
  totalPages: number;
  pageable: {
    sort: { sorted: boolean; empty: boolean; unsorted: boolean };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  number: number;
  sort: { sorted: boolean; empty: boolean; unsorted: boolean };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export async function getAllTokensByAddress(params: {
  account: string;
}): Promise<BlockberryTokenData[]> {
  if (chain === "zeko") return [];
  const { account } = params;
  let allTokens: BlockberryTokenData[] = [];
  let page = 0;
  let size = 50;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getTokensByAddress({ account, page, size });
    if (result) {
      allTokens.push(...(result.data ?? []));
      totalPages = result.totalPages;
      page++;
    } else {
      log.error("getAllTokensByAddress: error getting tokens by address", {
        account,
      });
      return allTokens;
    }
  }
  return allTokens;
}

export async function getTokensByAddress(params: {
  account: string;
  page?: number;
  size?: number;
}): Promise<BlockberryTokens | undefined> {
  if (chain === "zeko") return undefined;
  const { account, page = 0, size = 50 } = params;

  if (BLOCKBERRY_API === undefined) {
    throw new Error("BLOCKBERRY_API is undefined");
  }
  if (size < 1 || size > 50) throw new Error("size must be between 1 and 50");
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": BLOCKBERRY_API,
    },
  };
  try {
    const response = await fetch(
      `https://api.blockberry.one/mina-${chain}/v1/tokens/accounts/${account}?page=${page}&size=${size}&orderBy=DESC&sortBy=BALANCE`,
      options
    );
    if (!response.ok) {
      log.error("getTokensByAddress: response", { response });
      return undefined;
    }
    const result = await response.json();
    return result as unknown as BlockberryTokens;
  } catch (err) {
    log.error("getTokensByAddress: error", { error: err });
    return undefined;
  }
}
/*
    {
      "holderAddress": "B62qjwDWxjf4LtJ4YWJQDdTNPqZ69ZyeCzbpAFKN7EoZzYig5ZRz8JE",
      "holderName": null,
      "holderImg": null,
      "balance": 50071,
      "lockedBalance": 0,
      "movableBalance": 50071,
      "percentage": 83.4516666666561,
      "tokenSymbol": "PUNK5",
      "isZkappAccount": true
    },
  
*/

export interface BlockberryTokenHolder {
  holderAddress: string;
  holderName: string | null;
  holderImg: string | null;
  balance: number;
  lockedBalance: number;
  movableBalance: number;
  percentage: number;
  tokenSymbol: string;
  isZkappAccount: boolean;
}

export interface BlockberryTokenHolders {
  data: BlockberryTokenHolder[];
  size: number;
  totalPages: number;
  pageable: {
    sort: { sorted: boolean; empty: boolean; unsorted: boolean };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  number: number;
  sort: { sorted: boolean; empty: boolean; unsorted: boolean };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export async function getTokenHoldersByTokenId(params: {
  tokenId: string;
  page?: number;
  size?: number;
}): Promise<BlockberryTokenHolders | undefined> {
  if (chain === "zeko") return undefined;
  const { tokenId, page = 0, size = 50 } = params;
  if (BLOCKBERRY_API === undefined) {
    throw new Error("BLOCKBERRY_API is undefined");
  }
  if (size < 1 || size > 50) throw new Error("size must be between 1 and 50");
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": BLOCKBERRY_API,
    },
  };
  try {
    const response = await fetch(
      `https://api.blockberry.one/mina-${chain}/v1/tokens/${tokenId}/holders?page=${page}&size=${size}&orderBy=DESC&sortBy=BALANCE`,
      options
    );
    if (!response.ok) {
      log.error("getTokenHoldersByTokenId: response", { response });
      return undefined;
    }
    const result = await response.json();
    return result as unknown as BlockberryTokenHolders;
  } catch (err) {
    log.error("getTokenHoldersByTokenId: error", { error: err });
    return undefined;
  }
}

/*
  "data": [
    {
      "age": 1720137780000,
      "status": "applied",
      "updatedAccounts": [
        {
          "accountAddress": "B62qjwDWxjf4LtJ4YWJQDdTNPqZ69ZyeCzbpAFKN7EoZzYig5ZRz8JE",
          "accountName": null,
          "accountImg": null,
          "isZkappAccount": true,
          "verificationKey": "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",
          "verificationKeyHash": "11650856921655958414538643274183528216620911684498775340227886592145641370054"
        },
        {
          "accountAddress": "B62qp97PfbZ6zN5gJXBtv3ZMfU9njaWzx8WEpGU2ohnr1w7jxQYYPCC",
          "accountName": null,
          "accountImg": null,
          "isZkappAccount": true,
          "verificationKey": null,
          "verificationKeyHash": null
        },
        {
          "accountAddress": "B62qmcGpRPdBLJA8SFHnUA29DqfKZyXkW8PXJDE1mZuu6EANuL697YX",
          "accountName": null,
          "accountImg": null,
          "isZkappAccount": false,
          "verificationKey": null,
          "verificationKeyHash": null
        }
      ],
      "updatesCount": 3,
      "proverAddress": "B62qmepRzmp32RVYeHDyzzaCmo8prHR4cWooAHokpHgp1XXcXoa1mDP",
      "proverName": null,
      "proverImg": null,
      "isZkappAccount": false,
      "hash": "5Ju2LGeRyEoPbeSysjKCmXGapunkp1SUpMMBostu2zA824BYECjh",
      "fee": 0.1,
      "memo": "Reward 0.1PUNK.",
      "nonce": 98,
      "isAccountHijack": false
    },
*/

export interface BlockberryTokenTransaction {
  age: number;
  status: string;
  updatedAccounts: {
    accountAddress: string;
    accountName: string | null;
    accountImg: string | null;
    isZkappAccount: boolean;
    verificationKey: string | null;
    verificationKeyHash: string | null;
  }[];
  updatesCount: number;
  proverAddress: string;
  proverName: string | null;
  proverImg: string | null;
  isZkappAccount: boolean;
  hash: string;
  fee: number;
  memo: string;
}

export interface BlockberryTokenTransactions {
  data: BlockberryTokenTransaction[];
  size: number;
  totalPages: number;
  pageable: {
    sort: { sorted: boolean; empty: boolean; unsorted: boolean };
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  number: number;
  sort: { sorted: boolean; empty: boolean; unsorted: boolean };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export async function getTransactionsByToken(params: {
  tokenId: string;
  page?: number;
  size?: number;
}): Promise<BlockberryTokenTransactions | undefined> {
  if (chain === "zeko") return undefined;
  const { tokenId, page = 0, size = 50 } = params;
  if (BLOCKBERRY_API === undefined) {
    throw new Error("BLOCKBERRY_API is undefined");
  }
  if (size < 1 || size > 50) throw new Error("size must be between 1 and 50");
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-api-key": BLOCKBERRY_API,
    },
  };
  try {
    const response = await fetch(
      `https://api.blockberry.one/mina-${chain}/v1/tokens/${tokenId}/txs?page=${page}&size=${size}&orderBy=DESC&sortBy=AGE`,
      options
    );
    if (!response.ok) {
      log.error("getTransactionsByToken: response", { response });
      return undefined;
    }
    const result = await response.json();
    return result as unknown as BlockberryTokenTransactions;
  } catch (err) {
    log.error("getTransactionsByToken: error", { error: err });
    return undefined;
  }
}

export interface BlockberryScamInfo {
  scamId: number;
  objectType: string;
  onchainId: string;
  defaultSecurityMessage: string;
  securityMessage: string;
  scamType: string | null;
}

export async function getBlockberryScamInfo(params: {
  address: string;
}): Promise<BlockberryScamInfo[] | undefined> {
  if (chain === "zeko") return undefined;
  const { address } = params;
  if (BLOCKBERRY_API === undefined) {
    throw new Error("BLOCKBERRY_API is undefined");
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
      `https://api.blockberry.one/mina-${chain}/v1/security/scams?onChainIds=${address}`,
      options
    );
    if (!response.ok) {
      log.error("getBlockberryScamInfo: response", { response });
      return undefined;
    }
    const result = await response.json();
    return result as unknown as BlockberryScamInfo[];
  } catch (err) {
    log.error("getBlockberryScamInfo: error", { error: err });
    return undefined;
  }
}
