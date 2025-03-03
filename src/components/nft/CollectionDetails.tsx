"use client";
import { useTokenDetails } from "@/context/details";
import Image from "next/image";
import Link from "next/link";
import { algoliaGetCollection } from "@/lib/search";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
import React, { useEffect, useState, useContext } from "react";
import { SearchContext } from "@/context/search";
import { AddressContext } from "@/context/address";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import { socials_item } from "@/data/socials";
import {
  TokenHolder,
  TransactionData,
  getTokenHolders,
  getTransactions,
} from "@/lib/api";
import { explorerTokenUrl, explorerAccountUrl } from "@/lib/chain";
// import { Order } from "@/components/orderbook/OrderBook";
import Banner from "./Banner";
import Profile from "./Profile";
import Collection from "./Collection";
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
  collectionAddress: string;
}

export default function CollectionDetails({
  collectionAddress,
}: ItemDetailsProps) {
  const { state, dispatch } = useTokenDetails();
  const collectionDetails = state.collections[collectionAddress] || {};
  const item = collectionDetails.info;
  const likes = collectionDetails.likes || 0;
  const like = collectionDetails.like;

  const setItem = (info: CollectionInfo) =>
    dispatch({
      type: "SET_COLLECTION_INFO",
      payload: { collectionAddress, info },
    });

  const addFavorite = (tokenAddress: string) =>
    dispatch({ type: "ADD_FAVORITE", payload: { tokenAddress } });

  const holders = collectionDetails.holders;
  const setHolders = (holders: TokenHolder[]) =>
    dispatch({ type: "SET_HOLDERS", payload: { collectionAddress, holders } });

  const transactions = collectionDetails.transactions;
  const setTransactions = (transactions: TransactionData[]) =>
    dispatch({
      type: "SET_COLLECTION_TRANSACTIONS",
      payload: { collectionAddress, transactions },
    });
  const { search } = useContext(SearchContext);
  const { address, setAddress } = useContext(AddressContext);

  useEffect(() => {
    if (DEBUG) console.log("collectionAddress", { collectionAddress, address });
    const fetchItem = async () => {
      if (collectionAddress && !item) {
        const item = await algoliaGetCollection({ collectionAddress });
        if (item) {
          setItem(item);
          if (DEBUG) console.log("item", item);
        } else {
          const info = await getNFTInfo({ collectionAddress });
          if (info.success && info.info) setItem(info.info.collection);
        }
      }
    };
    fetchItem();
  }, [collectionAddress]);

  useEffect(() => {
    if (DEBUG) console.log("collectionAddress", { collectionAddress, address });
    const fetchItem = async () => {
      if (collectionAddress) {
        let userAddress = address;
        if (!userAddress) {
          if (DEBUG) console.log("getting wallet info");
          userAddress = (await getWalletInfo()).address;
          if (userAddress) setAddress(userAddress);
        }
        if (DEBUG) console.log("userAddress", userAddress);
        // if (userAddress) {
        //   const like = await getLike({
        //     tokenAddress,
        //     userAddress,
        //   });
        //   if (like) addFavorite(tokenAddress);
        //   if (DEBUG) console.log("like", like);
        // }
        // const likes = await likesCount({ tokenAddress });
        // setLikes([{ tokenAddress, likes }]);
      }
    };
    fetchItem();
  }, [collectionAddress]);

  useEffect(() => {
    if (DEBUG) console.log("collectionAddress", { collectionAddress, address });
    const fetchItem = async () => {
      if (collectionAddress && item && !collectionDetails) {
        const info = await getNFTInfo({
          collectionAddress,
        });

        if (info.success && info.info) setItem(info.info.collection);
      }
    };
    fetchItem();
  }, [collectionAddress, item]);

  useEffect(() => {
    const fetchHolders = async () => {
      if (item?.tokenId) {
        const holdersData = await getTokenHolders({
          collectionAddress,
        });
        if (holdersData.success) {
          const filteredHolders = holdersData.tokenHolders.filter(
            (holder) => holder.address !== collectionAddress
          );
          setHolders(filteredHolders);
          if (DEBUG) console.log("holders", filteredHolders);
        }
      }
    };
    fetchHolders();
  }, [item]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (item?.tokenId) {
        const transactionsData = await getTransactions({
          collectionAddress,
        });
        if (transactionsData.success) {
          setTransactions(transactionsData.transactions);
          if (DEBUG) console.log("transactions", transactionsData.transactions);
        }
      }
    };
    fetchTransactions();
  }, [item]);

  function isNotEmpty(value: string | undefined) {
    return value && value.length > 0;
  }

  return (
    <>
      {item && "banner" in item && item?.banner && (
        <Banner image={item?.banner} />
      )}
      {item && <Profile item={item.masterNFT} />}
      {item && <Collection item={item} />}
    </>
  );
}
