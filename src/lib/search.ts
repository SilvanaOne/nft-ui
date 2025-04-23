"use server";
import { searchClient } from "@algolia/client-search";
import { getChain } from "@/lib/chain";
import { debug } from "@/lib/debug";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
import { log as logtail } from "@logtail/next";
const chain = getChain();

const log = logtail.with({
  chain,
  service: "search-nft",
});
const DEBUG = debug();

const { NFT_ALGOLIA_PROJECT, NFT_ALGOLIA_KEY } = process.env;
if (NFT_ALGOLIA_PROJECT === undefined)
  throw new Error("NFT_ALGOLIA_PROJECT is undefined");
if (NFT_ALGOLIA_KEY === undefined)
  throw new Error("NFT_ALGOLIA_KEY is undefined");

const client = searchClient(NFT_ALGOLIA_PROJECT, NFT_ALGOLIA_KEY);
const indexName = `standard-${chain}`;

export interface AlgoliaCollectionList {
  hits: CollectionInfo[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  exhaustiveTypo: boolean;
  exhaustive: { nbHits: boolean; typo: boolean };
  processingTimeMS: number;
}

export async function algoliaGetCollectionList(
  params: {
    creator?: string;
  } = {}
): Promise<CollectionInfo[]> {
  const { creator } = params;

  console.time("collections");
  const result = await client.searchSingleIndex({
    indexName,
    searchParams: {
      query: "",
      hitsPerPage: 1000,
      page: 0,
      facetFilters: creator
        ? [`creator:${creator}`, `status:created`, "contractType:collection"]
        : ["status:created", "contractType:collection"],
    },
  });
  const tokenList = result?.hits
    ? (result as unknown as AlgoliaCollectionList)
    : undefined;
  console.timeEnd("collections");

  return tokenList?.hits ?? [];
}

// export async function algoliaGetCollectionList(params: {
//   creator?: string;
// }): Promise<DeployedTokenInfo[]> {
//   const { creator } = params;
//   console.time("facets");
//   const result = await client.searchForFacetValues({
//     indexName,
//     facetName: "collectionAddress",
//   });
//   console.timeEnd("facets");
//   //console.log("collections", result);
//   if (!result?.facetHits || result.facetHits.length === 0) return [];

//   console.time("collections");
//   const data = await client.getObjects({
//     requests: result.facetHits.map((collection) => ({
//       indexName,
//       objectID: collection.value,
//     })),
//   });
//   const collections: DeployedTokenInfo[] = data.results.map((collection) => {
//     return {
//       ...(collection as unknown as CollectionDataSerialized),
//       minted:
//         result?.facetHits?.find(
//           (facet: any) => facet.value === (collection as any)?.address
//         )?.count ?? 1 - 1,
//     };
//   });
//   console.timeEnd("collections");

//   return collections;
// }

export async function algoliaGetCollection(params: {
  collectionAddress: string;
}): Promise<CollectionInfo | undefined> {
  try {
    const result = await client.getObject({
      indexName,
      objectID: params.collectionAddress,
    });
    return result as unknown as CollectionInfo | undefined;
  } catch (error: any) {
    log.error("algoliaGetCollection error:", {
      error: error?.message ?? String(error),
      params,
    });
    return undefined;
  }
}

export async function algoliaGetNFT(params: {
  collectionAddress: string;
  tokenAddress: string;
}): Promise<NftInfo | undefined> {
  const { collectionAddress, tokenAddress } = params;
  try {
    const result = await client.getObject({
      indexName,
      objectID: `${collectionAddress}.${tokenAddress}`,
    });
    return result as unknown as NftInfo | undefined;
  } catch (error: any) {
    log.error("algoliaGetNFT error:", {
      error: error?.message ?? String(error),
      params,
    });
    return undefined;
  }
}

export interface AlgoliaNFTList {
  hits: NftInfo[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  exhaustiveNbHits: boolean;
  exhaustiveTypo: boolean;
  exhaustive: { nbHits: boolean; typo: boolean };
  processingTimeMS: number;
}

export async function algoliaGetNFTs(params: {
  query?: string;
  hitsPerPage?: number;
  page?: number;
  onlyFavorites?: boolean;
  favorites?: string[];
  issuedByAddress?: string;
  ownedByAddress?: string;
  collectionAddress?: string;
  minPrice?: number;
  maxPrice?: number;
  createdLaterThan?: number;
}): Promise<AlgoliaNFTList | undefined> {
  //console.log("algoliaGetTokenList", params);
  const {
    onlyFavorites,
    favorites = [],
    issuedByAddress,
    ownedByAddress,
    collectionAddress,
    minPrice,
    maxPrice,
    createdLaterThan,
  } = params;

  const query = params.query ?? "";
  const hitsPerPage = params.hitsPerPage ?? 100;
  const page = params.page ?? 0;

  try {
    let tokenList: AlgoliaNFTList | undefined = undefined;

    console.time("algolia nft");
    let numericFilters = [];
    if (minPrice !== undefined) numericFilters.push(`price >= ${minPrice}`);
    if (maxPrice !== undefined) numericFilters.push(`price <= ${maxPrice}`);
    if (createdLaterThan !== undefined)
      numericFilters.push(`created > ${createdLaterThan}`);

    const result = await client.searchSingleIndex({
      indexName,
      searchParams: {
        query,
        hitsPerPage,
        page,
        facetFilters: collectionAddress
          ? [
              `collectionAddress:${collectionAddress}`,
              `status:created`,
              "contractType:nft",
            ]
          : ["status:created", "contractType:nft"],
        numericFilters: numericFilters.length > 0 ? numericFilters : undefined,
      },
    });
    console.timeEnd("algolia nft");
    tokenList = result?.hits
      ? (result as unknown as AlgoliaNFTList)
      : undefined;

    /*
{
    "hits": DeployedTokenInfo[],
    "nbHits": 2,
    "page": 0,
    "nbPages": 1,
    "hitsPerPage": 100,
    "exhaustiveNbHits": true,
    "exhaustiveTypo": true,
    "exhaustive": {
        "nbHits": true,
        "typo": true
    },
    "query": "",
    "params": "hitsPerPage=100&page=0",
    "renderingContent": {},
    "processingTimeMS": 1,
    "processingTimingsMS": {
        "_request": {
            "roundTrip": 80
        },
        "getIdx": {
            "load": {
                "total": 1
            },
            "total": 1
        },
        "total": 1
    },
    "serverTimeMS": 2
}
    */
    console.log("tokenList", tokenList?.hits?.length);
    return tokenList;
  } catch (error: any) {
    console.log("error", error);
    log.error("algoliaGetToken error:", {
      error: error?.message ?? String(error),
      params,
    });
    return undefined;
  }
}
