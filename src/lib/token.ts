import {
  TokenTransactionType,
  LaunchTokenStandardAdminParams,
  LaunchTokenAdvancedAdminParams,
  TokenTransactionParams,
} from "@minatokens/api";

export type TokenAction = "mint" | "transfer" | "offer" | "bid" | "orderbook";

export interface MintAddress {
  amount: number | "" | undefined;
  address: string;
}

export interface MintAddressVerified {
  amount: number;
  address: string;
}
export interface TokenLinks {
  twitter?: string;
  discord?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

export interface LaunchTokenData {
  symbol: string;
  name?: string;
  description?: string;
  links: TokenLinks;
  image?: File;
  imageURL?: string;
  adminAddress: string;
  mintAddresses: MintAddress[];
}

export type TokenActionTransactionParams = Exclude<
  TokenTransactionParams,
  LaunchTokenStandardAdminParams | LaunchTokenAdvancedAdminParams
>;

export interface TokenActionData {
  symbol: string;
  txs: TokenActionTransactionParams[];
}

export interface TokenInfo {
  symbol: string;
  name?: string;
  description?: string;
  image?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
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

// export interface DeployedTokenInfo extends TokenInfo, TokenState {
//   created: number;
//   updated: number;
//   chain: string;
//   likes?: number;
//   rating?: number;
//   status?: string;
// }

export interface TokenDeployParams {
  tokenPrivateKey: string;
  adminContractPrivateKey: string;
  tokenPublicKey: string;
  tokenId: string;
  adminContractPublicKey: string;
}

export interface NFTDataSerialized {
  type: "nft" | "collection";
  tokenAddress: string;
  collectionName: string;
  collectionAddress: string;
  symbol: string;
  uri: string;
  tokenId: string;
  adminAddress: string;
  name: string;
  image: string;
  description?: string;
  metadataRoot: string;
  storage: string;
  metadataVerificationKeyHash: string;
  owner: string;
  approved?: string;
  version: number;
  id: string;
  canChangeOwnerByProof: boolean;
  canTransfer: boolean;
  canApprove: boolean;
  canChangeMetadata: boolean;
  canChangeStorage: boolean;
  canChangeName: boolean;
  canChangeMetadataVerificationKeyHash: boolean;
  canPause: boolean;
  isPaused: boolean;
  requireOwnerAuthorizationToUpgrade: boolean;
  metadata: object;
  status: string;
  rating: number;
  updated: number;
  created: number;
  chain: string;
  price?: number;
  likes?: number;
  like?: boolean;
}

export interface CollectionDataSerialized extends NFTDataSerialized {
  type: "collection";
  banner?: string;
  creator: string;
  adminAddress: string;
  baseURL: string;
  royaltyFee: number;
  transferFee: string;
  requireTransferApproval: boolean;
  mintingIsLimited: boolean;
  collectionIsPaused: boolean;
  minted?: number;
}

export type DeployedTokenInfo = NFTDataSerialized | CollectionDataSerialized;
