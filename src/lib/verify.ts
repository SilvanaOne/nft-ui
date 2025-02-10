"use server";
import { TokenInfo, DeployedTokenInfo } from "./token";
import { getChainId } from "@/lib/chain";
import { log as logtail } from "@logtail/next";
const chainId = getChainId();
const log = logtail.with({
  chainId,
  service: "verify",
});

export async function verifyFungibleTokenState(params: {
  tokenContractAddress: string;
  adminContractAddress: string;
  adminAddress: string;
  info: TokenInfo;
  created: number;
  updated: number;
  tokenId: string;
  rating: number;
  status: string;
}): Promise<boolean> {
  try {
    return true;
  } catch (error) {
    log.error("verifyFungibleTokenState: catch", { error });
    return false;
  }
}
