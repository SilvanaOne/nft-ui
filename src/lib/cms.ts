"use server";
import { LaunchNftData, LaunchCollectionData, NftPermissions } from "./token";

import { CmsnftData } from "@silvana-one/api";

export async function cmsStoreNFT(params: {
  data: LaunchCollectionData;
}): Promise<
  | {
      success: true;
      nft: CmsnftData;
    }
  | {
      success: false;
      error: string;
    }
> {
  const { data } = params;
  if (data.mintType !== "nft") {
    return {
      success: false,
      error: "Invalid mint type, please deploy as a collection first",
    };
  }
  if (data.imageURL === undefined) {
    return {
      success: false,
      error: "Image URL is required",
    };
  }
  if (data.collectionAddress === undefined) {
    return {
      success: false,
      error: "Collection address is required",
    };
  }

  const nft: LaunchNftData = {
    ...data,
    mintType: "nft",
    collectionAddress: data.collectionAddress as string,
    imageURL: data.imageURL as string,
    nftPermissions: data.nftPermissions as NftPermissions,
  };
  console.log("nft", nft);
  const cmsNft: CmsnftData = {
    ...{ ...nft, mintType: undefined, adminAddress: undefined },
    traits: nft.traits.map((trait) => ({
      ...trait,
      type: "string",
    })),
  };
  return {
    success: true,
    nft: cmsNft,
  };
}
