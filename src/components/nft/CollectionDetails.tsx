"use client";
import { useTokenDetails } from "@/context/details";
import Image from "next/image";
import Link from "next/link";
import { algoliaGetCollection } from "@/lib/search";
import { DeployedTokenInfo, TokenState } from "@/lib/token";
import React, { useEffect, useState, useContext } from "react";
import { SearchContext } from "@/context/search";
import { AddressContext } from "@/context/address";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import { getTokenState } from "@/lib/state";
import { socials_item } from "@/data/socials";
import {
  BlockberryTokenHolder,
  getTokenHoldersByTokenId,
  BlockberryTokenTransaction,
  getTransactionsByToken,
} from "@/lib/blockberry-tokens";
import { explorerTokenUrl, explorerAccountUrl } from "@/lib/chain";
import { Order } from "@/components/orderbook/OrderBook";
import Banner from "./Banner";
import Profile from "./Profile";
import Collection from "./Collection";
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
  tokenAddress: string;
}

export default function TokenDetails({ tokenAddress }: ItemDetailsProps) {
  const { state, dispatch } = useTokenDetails();
  const tokenDetails = state.tokens[tokenAddress] || {};
  const item = tokenDetails.info;
  const bid = tokenDetails.bid;
  const offer = tokenDetails.offer;
  const likes = state.likes[tokenAddress] || 0;
  const like = state.favorites.includes(tokenAddress);
  const isPriceLoaded = tokenDetails.isPriceLoaded;

  const setBid = (bid: Order) =>
    dispatch({ type: "SET_BID", payload: { tokenAddress, bid } });
  const setOffer = (offer: Order) =>
    dispatch({ type: "SET_OFFER", payload: { tokenAddress, offer } });
  const setIsPriceLoaded = (isPriceLoaded: boolean) =>
    dispatch({
      type: "SET_IS_PRICE_LOADED",
      payload: { tokenAddress, isPriceLoaded },
    });

  useEffect(() => {
    const fetchOrderbook = async () => {
      if (isPriceLoaded) return;

      // const { offers, bids } = await getOrderbook({
      //   tokenAddress,
      //   maxItems: 1,
      // });

      // const offer: Order | null =
      //   offers.length === 0
      //     ? null
      //     : ({
      //         amount: Number(offers[0].amount) / 10 ** (item?.decimals ?? 9),
      //         price: Number(offers[0].price) / 10 ** 9,
      //         address: offers[0].offerAddress,
      //         type: "offer",
      //       } as Order);

      // if (offer) setOffer(offer);
      // const bid: Order | null =
      //   bids.length === 0
      //     ? null
      //     : ({
      //         amount: Number(bids[0].amount) / 10 ** (item?.decimals ?? 9),
      //         price: Number(bids[0].price) / 10 ** 9,
      //         address: bids[0].bidAddress,
      //         type: "bid",
      //       } as Order);
      // if (bid) setBid(bid);
      setIsPriceLoaded(true);
    };
    fetchOrderbook();
  }, [tokenAddress]);

  const setItem = (info: DeployedTokenInfo) =>
    dispatch({ type: "SET_TOKEN_INFO", payload: { tokenAddress, info } });

  const setLikes = (likes: { tokenAddress: string; likes: number }[]) =>
    dispatch({ type: "SET_LIKES", payload: likes });

  const addFavorite = (tokenAddress: string) =>
    dispatch({ type: "ADD_FAVORITE", payload: { tokenAddress } });

  const tokenState = tokenDetails.tokenState;
  const setTokenState = (tokenState: TokenState) =>
    dispatch({
      type: "SET_TOKEN_STATE",
      payload: { tokenAddress, tokenState },
    });

  const holders = tokenDetails.holders || [];
  const setHolders = (holders: BlockberryTokenHolder[]) =>
    dispatch({ type: "SET_HOLDERS", payload: { tokenAddress, holders } });

  const transactions = tokenDetails.transactions || [];
  const setTransactions = (transactions: BlockberryTokenTransaction[]) =>
    dispatch({
      type: "SET_TRANSACTIONS",
      payload: { tokenAddress, transactions },
    });
  const { search } = useContext(SearchContext);
  const { address, setAddress } = useContext(AddressContext);

  useEffect(() => {
    if (DEBUG) console.log("tokenDetails", tokenDetails);
  }, [state]);

  useEffect(() => {
    if (DEBUG) console.log("tokenAddress", { tokenAddress, address });
    const fetchItem = async () => {
      if (tokenAddress && !item) {
        const item = await algoliaGetCollection({ tokenAddress });
        if (item) {
          setItem(item);
          if (DEBUG) console.log("item", item);
        } else {
          const tokenState = await getTokenState({ tokenAddress });
          if (tokenState.success && tokenState.info) setItem(tokenState.info);
          if (DEBUG) console.log("tokenState", tokenState);
        }
      }
    };
    fetchItem();
  }, [tokenAddress]);

  useEffect(() => {
    if (DEBUG) console.log("tokenAddress", { tokenAddress, address });
    const fetchItem = async () => {
      if (tokenAddress) {
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
  }, [tokenAddress]);

  useEffect(() => {
    if (DEBUG) console.log("tokenAddress", { tokenAddress, address });
    const fetchItem = async () => {
      if (tokenAddress && item && !tokenState) {
        const tokenStateResult = await getTokenState({
          tokenAddress,
          info: item,
        });

        if (tokenStateResult?.success)
          setTokenState(tokenStateResult.tokenState);
      }
    };
    fetchItem();
  }, [tokenAddress, item]);

  useEffect(() => {
    const fetchHolders = async () => {
      if (item?.tokenId) {
        const holders = await getTokenHoldersByTokenId({
          tokenId: item.tokenId,
        });
        const filteredHolders = holders?.data.filter(
          (holder) => holder.holderAddress !== tokenAddress
        );
        setHolders(filteredHolders ?? []);
        if (DEBUG) console.log("holders", filteredHolders);
      }
    };
    fetchHolders();
  }, [item]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (item?.tokenId) {
        const transactions = await getTransactionsByToken({
          tokenId: item.tokenId,
        });
        setTransactions(transactions?.data ?? []);
        if (DEBUG) console.log("transactions", transactions);
      }
    };
    fetchTransactions();
  }, [item]);

  function isNotEmpty(value: string | undefined) {
    return value && value.length > 0;
  }

  const addLike = async () => {
    if (!like) {
      dispatch({ type: "ADD_LIKE", payload: { tokenAddress } });
    }
    addFavorite(tokenAddress);
    let userAddress = address;
    if (!userAddress) {
      userAddress = (await getWalletInfo()).address;
      if (!userAddress)
        userAddress = (await connectWallet({ openLink: true })).address;
      if (userAddress) setAddress(userAddress);
    }
    if (DEBUG) console.log("userAddress", userAddress);
    // if (tokenAddress && userAddress) {
    //   const written = await writeLike({ tokenAddress, userAddress });
    //   if (DEBUG)
    //     console.log("written like", { written, tokenAddress, userAddress });
    // }
  };

  return (
    <>
      {item && "banner" in item && item?.banner && (
        <Banner image={item?.banner} />
      )}
      {item && <Profile item={item} />}
      {item && <Collection item={item} />}
    </>
  );
}
