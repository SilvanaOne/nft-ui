"use client";
import { useTokenDetails } from "@/context/details";
import Image from "next/image";
import Link from "next/link";
import { algoliaGetCollection, algoliaGetNFTs } from "@/lib/search";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
import React, { useEffect, useState, useContext } from "react";
import { SearchContext } from "@/context/search";
import { AddressContext } from "@/context/address";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import TokenList from "@/components/home/TokenList";
import { socials_item } from "@/data/socials";
import {
  TokenHolder,
  TransactionData,
  getTokenHolders,
  getUserTransactions,
} from "@/lib/api";
import { explorerTokenUrl, explorerAccountUrl } from "@/lib/chain";
// import { Order } from "@/components/orderbook/OrderBook";
import Banner from "./Banner";
import UserProfile from "./UserProfile";
import UserNfts from "./UserNFTs";
import { getNFTInfo } from "@/lib/api";
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

function formatBalance(num: number | undefined): string {
  if (num === undefined) return "-";
  const fixed = num.toFixed(2);
  return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
}

export function Socials({ i }: { i: number }) {
  const elm = socials_item[i];
  return (
    <div key={i} className="group rtl:ml-4 rtl:mr-0">
      <svg
        aria-hidden="true"
        focusable="false"
        data-prefix="fab"
        data-icon={elm.icon}
        className="h-12 w-12 fill-jacarta-300 group-hover:fill-accent dark:group-hover:fill-white"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
        viewBox={elm.icon == "discord" ? "0 0 640 512" : "0 0 512 512"}
      >
        <path d={elm.svgPath}></path>
      </svg>
    </div>
  );
}

interface ItemDetailsProps {
  userAddress: string;
}

export default function UserDetails({ userAddress }: ItemDetailsProps) {
  const { state, dispatch } = useTokenDetails();
  const { search } = useContext(SearchContext);
  const { address, setAddress } = useContext(AddressContext);
  const userDetails = state.users[userAddress] || {};
  const avatar = userDetails.avatar;
  const nfts = userDetails.nfts;
  const fetchedNfts = userDetails.nfts
    ?.map((nft) => state.nfts[nft.collectionAddress]?.[nft.tokenAddress]?.info)
    .filter((nft) => nft !== undefined);
  const transactions = userDetails.transactions;
  const avatarNft =
    avatar?.collectionAddress && avatar?.tokenAddress
      ? state.nfts[avatar?.collectionAddress]?.[avatar?.tokenAddress]
      : undefined;
  const avatarCollection = avatar?.collectionAddress
    ? state.collections[avatar?.collectionAddress]
    : undefined;

  const setAvatar = (avatar: {
    collectionAddress: string;
    tokenAddress: string;
  }) =>
    dispatch({
      type: "SET_USER_AVATAR",
      payload: { userAddress, avatar },
    });

  const addNFTS = (
    nfts: { collectionAddress: string; tokenAddress: string }[]
  ) => dispatch({ type: "SET_USER_NFTS", payload: { userAddress, nfts } });

  const addTransactions = (transactions: TransactionData[]) =>
    dispatch({
      type: "ADD_USER_TRANSACTIONS",
      payload: { userAddress, transactions },
    });

  const setItem = (info: NftInfo) =>
    dispatch({
      type: "SET_NFT_INFO",
      payload: {
        collectionAddress: info.collectionAddress,
        tokenAddress: info.tokenAddress,
        info,
      },
    });

  const setCollection = (info: CollectionInfo) =>
    dispatch({
      type: "SET_COLLECTION_INFO",
      payload: { collectionAddress: info.collectionAddress, info },
    });

  useEffect(() => {
    if (DEBUG) console.log("user", { userAddress, address });
    const fetchItem = async () => {
      if (userAddress && !nfts) {
        const nfts = await algoliaGetNFTs({ ownedByAddress: userAddress });
        if (nfts?.hits && Array.isArray(nfts.hits) && nfts.hits.length > 0) {
          const userNfts = nfts.hits.map((nft) => ({
            collectionAddress: nft.collectionAddress,
            tokenAddress: nft.tokenAddress,
          }));
          addNFTS(userNfts);
          for (const nft of nfts.hits) {
            setItem(nft);
          }
          if (DEBUG) console.log("nfts", nfts);
          if (nfts.hits.length > 0) {
            const nft = nfts.hits[0];
            setAvatar({
              collectionAddress: nft.collectionAddress,
              tokenAddress: nft.tokenAddress,
            });
          }
        }
      }
    };
    fetchItem();
  }, [userAddress]);

  useEffect(() => {
    const fetchItem = async () => {
      let userAddress = address;
      if (!userAddress) {
        if (DEBUG) console.log("getting wallet info");
        userAddress = (await getWalletInfo()).address;
        if (userAddress) setAddress(userAddress);
      }
      if (DEBUG) console.log("userAddress", userAddress);
    };
    fetchItem();
  }, [userAddress]);

  useEffect(() => {
    if (userAddress && avatar && !avatarNft) {
      const fetchItem = async () => {
        const nft = await getNFTInfo({
          collectionAddress: avatar.collectionAddress,
          nftAddress: avatar.tokenAddress,
        });
        if (nft.success && nft.info && nft.info.nft && nft.info.collection) {
          setCollection(nft.info.collection);
          setItem(nft.info.nft);
        }
      };
      fetchItem();
    }
  }, [userAddress, nfts]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (userAddress && nfts && nfts.length > 0) {
        console.time("fetchTransactions");
        const collectionAddresses = nfts.map((nft) => nft.collectionAddress);
        const uniqueCollectionAddresses = [...new Set(collectionAddresses)];
        const txPromises: Promise<
          | {
              success: true;
              transactions: TransactionData[];
            }
          | {
              success: false;
              error?: string;
            }
        >[] = [];
        for (const collectionAddress of uniqueCollectionAddresses) {
          const txPromise = getUserTransactions({
            userAddress,
            collectionAddresses: [collectionAddress],
          });
          txPromises.push(txPromise);
        }
        for (const txPromise of txPromises) {
          const txData = await txPromise;
          if (txData.success) {
            addTransactions(txData.transactions);
          }
        }
        console.timeEnd("fetchTransactions");
      }
    };
    fetchTransactions();
  }, [userAddress, nfts]);

  console.log("user transactions", transactions?.length);

  return (
    <div className="relative py-28">
      {/* {avatarCollection?.info?.banner && (
        <Banner image={avatarCollection.info?.banner} />
      )} */}
      {avatarNft?.info && (
        <UserProfile item={avatarNft.info} userAddress={userAddress} />
      )}
      {fetchedNfts && (
        <UserNfts
          items={fetchedNfts}
          transactions={transactions?.sort((a, b) => b.timestamp - a.timestamp)}
        />
      )}
    </div>
  );
}
