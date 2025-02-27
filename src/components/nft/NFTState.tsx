"use client";
import type { NftInfo, CollectionInfo } from "@silvana-one/api";
import Link from "next/link";
import { NotImplemented } from "./NotImplemented";
import { useEffect, useState } from "react";
import { getChainId } from "@/lib/chain";
import { explorerAccountUrl, explorerTokenUrl } from "@/lib/chain";
import { publicIpfsURL } from "@/lib/ipfs";
const chainId = getChainId();

export const tabs = [
  {
    id: 1,
    action: "NFT",
    tab: "nft",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
  {
    id: 2,
    action: "Traits",
    tab: "traits",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
  {
    id: 3,
    action: "NFT Permissions",
    tab: "nft_permissions",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
  {
    id: 4,
    action: "Collection",
    tab: "collection",
    svgPath: `M16.05 12.05L21 17l-4.95 4.95-1.414-1.414 2.536-2.537L4 18v-2h13.172l-2.536-2.536 1.414-1.414zm-8.1-10l1.414 1.414L6.828 6 20 6v2H6.828l2.536 2.536L7.95 11.95 3 7l4.95-4.95z`,
  },
  {
    id: 5,
    action: "Master NFT",
    tab: "master",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
  {
    id: 6,
    action: "Master NFT Traits",
    tab: "master_traits",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
  {
    id: 6,
    action: "Master NFT Permissions",
    tab: "master_permissions",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
];

export function NftStateTab({
  nftInfo,
  collectionInfo,
  tokenAddress,
  collectionAddress,
}: {
  nftInfo: NftInfo;
  collectionInfo: CollectionInfo | undefined;
  tokenAddress: string;
  collectionAddress: string;
}) {
  const [tab, setTab] = useState<string>("nft");
  const [storage, setStorage] = useState<string | undefined>(undefined);
  const contract =
    tab === "nft"
      ? nftInfo
      : tab === "collection"
      ? collectionInfo
      : tab === "master"
      ? collectionInfo?.masterNFT
      : undefined;
  const contractAddress =
    tab === "nft"
      ? nftInfo?.tokenAddress
      : tab === "collection"
      ? collectionInfo?.collectionAddress
      : tab === "master"
      ? collectionInfo?.masterNFT?.tokenAddress
      : undefined;

  const permissions =
    tab === "nft_permissions"
      ? nftInfo
      : tab === "master_permissions"
      ? collectionInfo?.masterNFT
      : undefined;

  const permissionsData = permissions
    ? Object.entries(permissions)
        .filter(([_, value]) => typeof value === "boolean")
        .map(([key, value]) => ({
          key: key,
          value: value ? "Yes" : "No",
        }))
    : undefined;

  const metadata =
    tab === "nft" || tab === "traits"
      ? nftInfo
      : tab === "master" || tab === "master_traits"
      ? collectionInfo?.masterNFT
      : undefined;

  const traits = metadata?.metadata?.traits
    ? (
        metadata?.metadata?.traits as {
          key: string;
          value: unknown;
          type: string;
        }[]
      )
        .filter(
          (item: any) =>
            (item?.type === "string" || item?.type === "number") &&
            (typeof item.value === "string" || typeof item.value === "number")
        )
        .map((item: any) => ({
          key: item.key ?? "",
          value: item.value ? String(item.value) : "",
        }))
    : undefined;
  console.log("traits", metadata?.metadata);
  console.log("traits 1", traits);

  useEffect(() => {
    const fetchStorage = async () => {
      if (metadata?.storage) {
        const storage = await publicIpfsURL({
          hash: metadata.storage,
        });
        setStorage(storage);
      } else {
        setStorage(undefined);
      }
    };
    fetchStorage();
  }, [metadata]);

  return (
    <div className="rounded-t-2lg rounded-b-2lg rounded-tl-none border border-jacarta-100 bg-white p-6 dark:border-jacarta-600 dark:bg-jacarta-700 md:p-10">
      <div className="flex flex-wrap mb-6">
        {tabs.map((elm, i) => (
          <button
            key={i}
            onClick={() => setTab(elm.tab)}
            className={
              tab === elm.tab
                ? "mr-2.5 mb-2.5 inline-flex items-center rounded-xl border border-transparent bg-accent px-4 py-3 hover:bg-accent-dark dark:hover:bg-accent-dark fill-white"
                : "group mr-2.5 mb-2.5 inline-flex items-center rounded-xl border border-jacarta-100 bg-white px-4 py-3 hover:border-transparent hover:bg-accent hover:text-white dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:hover:border-transparent dark:hover:bg-accent hover:fill-white dark:fill-white "
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className={`mr-2 h-4 w-4  `}
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path d={elm.svgPath}></path>
            </svg>
            <span
              className={`text-2xs font-medium ${
                tab === elm.tab ? "text-white" : ""
              } `}
            >
              {elm.action}
            </span>
          </button>
        ))}
      </div>

      <>
        {contractAddress && (
          <div className="mb-2 flex items-center">
            <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
              Contract Address:
            </span>
            <Link
              href={`${explorerAccountUrl()}${contractAddress}`}
              className=" text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {contractAddress}
            </Link>
          </div>
        )}
        {metadata && (tab === "nft" || tab === "master") && (
          <>
            {storage && (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Metadata IPFS hash:
                </span>
                <Link
                  href={storage ?? ""}
                  className=" text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {metadata.storage}
                </Link>
              </div>
            )}
            {metadata.metadataRoot && (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Metadata Root:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {metadata.metadataRoot}
                </span>
              </div>
            )}
            {metadata.metadataVerificationKeyHash && (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Metadata Verification Key:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {metadata.metadataVerificationKeyHash}
                </span>
              </div>
            )}
          </>
        )}
        {permissionsData &&
          (tab === "nft_permissions" || tab === "master_permissions") && (
            <>
              {permissionsData.map((permission) => (
                <div className="mb-2 flex items-center">
                  <span className="mr-2 min-w-[25rem] dark:text-jacarta-300">
                    {permission.key}:
                  </span>
                  <span className="text-jacarta-700 dark:text-white">
                    {permission.value}
                  </span>
                </div>
              ))}
            </>
          )}
        {/*         
          {tab === "admin" && (
            <>
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Admin Contract Type:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {nftState.adminType === "bondingCurve"
                    ? "Bonding Curve"
                    : nftState.adminType}
                </span>
              </div>
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Bonding Curve Mint Price:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {nftState.mintPrice ?? "N/A"}
                </span>
              </div>
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Bonding Curve Redeem Price:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {nftState.redeemPrice ?? "N/A"}
                </span>
              </div>
            </>
          )} */}
        {contract && (
          <>
            {contract.tokenId && (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Token ID:
                </span>
                <Link
                  href={`${explorerTokenUrl()}${contract.tokenId}`}
                  className=" text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {contract.tokenId}
                </Link>
              </div>
            )}
            {contract.symbol && (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Symbol:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {contract.symbol}
                </span>
              </div>
            )}

            {/* <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Total Supply:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {nftState.totalSupply.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 9,
                  })}
                </span>
              </div> */}

            {/* <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  Decimals:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {nftState.decimals}
                </span>
              </div> */}
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Paused:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {contract.isPaused ? "Yes" : "No"}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                URI:
              </span>
              <Link
                href={contract.uri}
                className=" text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {contract.uri}
              </Link>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Verification Key Hash:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {contract.contractVerificationKeyHash}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Contract Version:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {contract.contractVersion}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Contract Type:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {contract.contractType}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Chain:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {contract.chain}
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Chain ID:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {chainId}
              </span>
            </div>
          </>
        )}

        {(tab === "nft" || tab === "master") && (
          <>
            <div className="mb-2 mt-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Owner Address:
              </span>
              <Link
                href={`${explorerAccountUrl()}${
                  tab === "nft"
                    ? nftInfo?.owner
                    : collectionInfo?.masterNFT?.owner || ""
                }`}
                className=" text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {tab === "nft"
                  ? nftInfo?.owner
                  : collectionInfo?.masterNFT?.owner || ""}
              </Link>
            </div>
            {/* <div className="mb-2 flex items-center">
            <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
              Owner Token Balance:
            </span>
            <span className="text-jacarta-700 dark:text-white">
              {(nftState.adminTokenBalance / 1_000_000_000).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 9,
                }
              )}
            </span>
          </div> */}
          </>
        )}
        {tab === "collection" && (
          <>
            <div className="mb-2 mt-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Creator Address:
              </span>
              <Link
                href={`${explorerAccountUrl()}${collectionInfo?.creator || ""}`}
                className=" text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {collectionInfo?.creator || ""}
              </Link>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Base URL:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {collectionInfo?.baseURL}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Require Transfer Approval:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {collectionInfo?.requireTransferApproval ? "Yes" : "No"}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Minting Is Limited:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {collectionInfo?.mintingIsLimited ? "Yes" : "No"}
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Royalty Fee:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {((collectionInfo?.royaltyFee ?? 0) / 1000).toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4,
                  }
                )}{" "}
                %
              </span>
            </div>
            <div className="mb-2 flex items-center">
              <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                Transfer Fee:
              </span>
              <span className="text-jacarta-700 dark:text-white">
                {(
                  Number(
                    BigInt(collectionInfo?.transferFee ?? "0") / 1_000_000n
                  ) / 1000
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 4,
                })}{" "}
                MINA
              </span>
            </div>
          </>
        )}
        {(tab === "traits" || tab === "master_traits") && traits && (
          <>
            {traits.map((trait) => (
              <div className="mb-2 flex items-center">
                <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
                  {trait.key}:
                </span>
                <span className="text-jacarta-700 dark:text-white">
                  {trait.value ? String(trait.value) : ""}
                </span>
              </div>
            ))}
          </>
        )}
      </>
    </div>
  );
}
