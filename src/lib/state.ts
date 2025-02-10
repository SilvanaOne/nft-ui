"use server";
import { TokenState, DeployedTokenInfo, TokenInfo } from "./token";
import { getChainId } from "@/lib/chain";
import { debug } from "@/lib/debug";
import { log as logtail } from "@logtail/next";
const chainId = getChainId();
const log = logtail.with({
  chainId,
  service: "state",
});
const DEBUG = debug();

export async function getTokenState(params: {
  tokenAddress: string;
  info?: DeployedTokenInfo;
}): Promise<
  | {
      success: true;
      tokenState: TokenState;
      info: DeployedTokenInfo;
      isStateUpdated: boolean;
    }
  | {
      success: false;
      error: string;
    }
> {
  const { tokenAddress, info } = params;
  try {
    return {
      success: false,
      error: "not implemented",
    };
  } catch (error: any) {
    log.error("getTokenState: catch", { error });
    return {
      success: false,
      error: "getTokenState catch:" + (error?.message ?? String(error)),
    };
  }
}

export async function updateTokenInfo(params: {
  tokenAddress: string;
  tokenState: TokenState;
  info?: DeployedTokenInfo;
}): Promise<{ isStateUpdated: boolean; info?: DeployedTokenInfo }> {
  const { tokenAddress, tokenState, info } = params;

  return { isStateUpdated: false };
}

/*
export interface TokenInfo {
  symbol: string;
  name: string;
  description?: string;
  image?: string;
  twitter: string;
  discord: string;
  telegram: string;
  instagram: string;
  facebook: string;
  website: string;
  tokenContractCode?: string;
  adminContractsCode?: string[];
  data?: object;
  isMDA?: boolean;
  launchpad?: string;
}

export interface TokenState {
  tokenAddress: string;
  tokenId: string;
  adminContractAddress: string;
  adminAddress: string;
  adminTokenBalance: number;
  totalSupply: number;
  isPaused: boolean;
  decimals: number;
  tokenSymbol: string;
  verificationKeyHash: string;
  uri: string;
  version: number;
  adminTokenSymbol: string;
  adminUri: string;
  adminVerificationKeyHash: string;
  adminVersion: number;
}

export interface DeployedTokenInfo extends TokenInfo, TokenState {
  created: number;
  updated: number;
  chain: string;
  likes?: number;
}
*/
export async function restoreDeployedTokenInfo(params: {
  tokenState: TokenState;
}): Promise<DeployedTokenInfo> {
  const { tokenState } = params;
  const time = Date.now();
  let info: TokenInfo = {
    symbol: tokenState.tokenSymbol,
    name: tokenState.tokenSymbol,
  };
  try {
    const uri = tokenState.uri;
    let json: object | undefined;
    let isImage = false;
    if (uri && typeof uri === "string" && uri.startsWith("http")) {
      const response = await fetch(uri);
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          json = await response.json();
        } catch (e) {
          console.error("restoreDeployedTokenInfo: Cannot parse json", e);
        }
      } else if (contentType?.includes("image/")) {
        isImage = true;
      } else {
        try {
          json = await response.json();
        } catch (e) {}
        if (json === undefined) {
          try {
            const data = await response.text();
            // Check if data starts with common image data URI prefixes
            isImage =
              data.startsWith("data:image/") ||
              /^iVBORw0KGgo/.test(data) || // PNG
              /^\/9j\//.test(data) || // JPG
              /^R0lGOD/.test(data) || // GIF
              /^Qk/.test(data); // BMP
          } catch (e) {}
        }
      }
      if (isImage) {
        info.image = uri;
      } else if (json) {
        info = json as TokenInfo;
      }
    }
  } catch (e) {
    log.error("restoreDeployedTokenInfo: catch", { error: e });
  }
  // const deployedTokenInfo: DeployedTokenInfo = {
  //   ...info,
  //   // ...tokenState,
  //   symbol: tokenState.tokenSymbol,
  //   name: info.name ?? tokenState.tokenSymbol,
  //   created: time,
  //   updated: time,
  //   chain: chainId,
  //   rating: 100,
  // };
  // return deployedTokenInfo;
  throw new Error("Not implemented");
}
