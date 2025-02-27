import {
  NftTransactionParams,
  LaunchTokenStandardAdminParams,
  LaunchTokenAdvancedAdminParams,
  NftInfo,
  CollectionInfo,
} from "@silvana-one/api";

export type { NftInfo, CollectionInfo };

export type TokenAction = "mint" | "transfer" | "sell" | "approve" | "buy";

export interface MintAddress {
  amount: number | "" | undefined;
  address: string;
}

export interface MintAddressVerified {
  amount: number;
  address: string;
}

export interface Trait {
  key: string;
  value: string;
  isPrivate?: boolean;
}

export class NftPermissions {
  owner: string | undefined;
  id?: bigint | string;
  canChangeOwnerByProof?: boolean;
  canTransfer?: boolean;
  canApprove?: boolean;
  canChangeMetadata?: boolean;
  canChangeStorage?: boolean;
  canChangeName?: boolean;
  canChangeMetadataVerificationKeyHash?: boolean;
  canPause?: boolean;
  isPaused?: boolean;
  requireOwnerAuthorizationToUpgrade?: boolean;
  metadataVerificationKeyHash: string | undefined;

  constructor() {
    this.owner = undefined;
    this.id = undefined;
    this.canChangeOwnerByProof = false;
    this.canTransfer = true;
    this.canApprove = true;
    this.canChangeMetadata = false;
    this.canChangeStorage = false;
    this.canChangeName = false;
    this.canChangeMetadataVerificationKeyHash = false;
    this.canPause = true;
    this.isPaused = false;
    this.requireOwnerAuthorizationToUpgrade = false;
    this.metadataVerificationKeyHash = undefined;
  }

  isEqual(other: NftPermissions): boolean {
    return (
      this.owner === other.owner &&
      this.id === other.id &&
      this.canChangeOwnerByProof === other.canChangeOwnerByProof &&
      this.canTransfer === other.canTransfer &&
      this.canApprove === other.canApprove &&
      this.canChangeMetadata === other.canChangeMetadata &&
      this.canChangeStorage === other.canChangeStorage &&
      this.canChangeName === other.canChangeName &&
      this.canChangeMetadataVerificationKeyHash ===
        other.canChangeMetadataVerificationKeyHash &&
      this.canPause === other.canPause &&
      this.isPaused === other.isPaused &&
      this.requireOwnerAuthorizationToUpgrade ===
        other.requireOwnerAuthorizationToUpgrade &&
      this.metadataVerificationKeyHash === other.metadataVerificationKeyHash
    );
  }

  isDefault(): boolean {
    const defaultPermissions = new NftPermissions();
    return this.isEqual(defaultPermissions);
  }
}

export class CollectionPermissions {
  royaltyFee?: number;
  transferFee?: number | bigint | string;
  requireTransferApproval?: boolean;
  mintingIsLimited?: boolean;

  constructor() {
    this.royaltyFee = undefined;
    this.transferFee = undefined;
    this.requireTransferApproval = false;
    this.mintingIsLimited = false;
  }

  isEqual(other: CollectionPermissions): boolean {
    return (
      this.royaltyFee === other.royaltyFee &&
      this.transferFee === other.transferFee &&
      this.requireTransferApproval === other.requireTransferApproval &&
      this.mintingIsLimited === other.mintingIsLimited
    );
  }

  isDefault(): boolean {
    const defaultPermissions = new CollectionPermissions();
    return this.isEqual(defaultPermissions);
  }
}

export interface Permissions {
  nft: NftPermissions;
  collection: CollectionPermissions;
}

export interface LaunchCollectionData {
  mintType: "collection" | "nft";
  collectionAddress?: string;
  symbol: string;
  name: string;
  description?: string;
  image?: File;
  imageURL?: string;
  banner?: File;
  bannerURL?: string;
  adminAddress: string;
  traits: Trait[];
  nftPermissions?: NftPermissions;
  collectionPermissions?: CollectionPermissions;
}

export type TokenActionTransactionParams = Exclude<
  NftTransactionParams,
  LaunchTokenStandardAdminParams | LaunchTokenAdvancedAdminParams
>;

export interface TokenActionData {
  symbol: string;
  txs: TokenActionTransactionParams[];
}

// export interface TokenInfo {
//   symbol: string;
//   name?: string;
//   description?: string;
//   image?: string;
//   twitter?: string;
//   discord?: string;
//   telegram?: string;
//   instagram?: string;
//   facebook?: string;
//   website?: string;
//   tokenContractCode?: string;
//   adminContractsCode?: string[];
//   data?: object;
//   isMDA?: boolean;
//   launchpad?: string;
// }

// export interface TokenState {
//   tokenAddress: string;
//   tokenId: string;
//   adminContractAddress: string;
//   adminAddress: string;
//   adminTokenBalance: number;
//   totalSupply: number;
//   isPaused: boolean;
//   decimals: number;
//   tokenSymbol: string;
//   verificationKeyHash: string;
//   uri: string;
//   version: number;
//   adminTokenSymbol: string;
//   adminUri: string;
//   adminVerificationKeyHash: string;
//   adminVersion: number;
// }

// export interface DeployedTokenInfo extends TokenInfo, TokenState {
//   created: number;
//   updated: number;
//   chain: string;
//   likes?: number;
//   rating?: number;
//   status?: string;
// }

// export interface TokenDeployParams {
//   tokenPrivateKey: string;
//   adminContractPrivateKey: string;
//   tokenPublicKey: string;
//   tokenId: string;
//   adminContractPublicKey: string;
// }

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

// export type DeployedTokenInfo = NFTDataSerialized | CollectionDataSerialized;
