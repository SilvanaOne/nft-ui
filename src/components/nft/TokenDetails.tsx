"use client";
import { useTokenDetails } from "@/context/details";
import Image from "next/image";
import Link from "next/link";
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

  // useEffect(() => {
  //   if (DEBUG) console.log("tokenAddress", { tokenAddress, address });
  //   const fetchItem = async () => {
  //     if (tokenAddress && !item) {
  //       const item = await algoliaGetToken({ tokenAddress });
  //       if (item) {
  //         setItem(item);
  //         if (DEBUG) console.log("item", item);
  //       } else {
  //         const tokenState = await getTokenState({ tokenAddress });
  //         if (tokenState.success && tokenState.info) setItem(tokenState.info);
  //         if (DEBUG) console.log("tokenState", tokenState);
  //       }
  //     }
  //   };
  //   fetchItem();
  // }, [tokenAddress]);

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
      <section className="relative pt-12 pb-24 lg:py-24">
        <picture className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
          <Image
            width={1920}
            height={789}
            src="/img/gradient_light.jpg"
            alt="gradient"
            className="h-full w-full"
          />
        </picture>
        <div className="container">
          {/* Item */}
          <div className="md:flex md:flex-wrap">
            {/* Image */}
            {item?.image && (
              <figure className="mb-8 md:w-2/5 md:flex-shrink-0 md:flex-grow-0 md:basis-auto lg:w-1/2">
                <Image
                  width={540}
                  height={670}
                  src={item?.image ?? "/launchpad.png"}
                  alt="token image"
                  className="cursor-pointer rounded-2.5xl w-[100%]"
                  data-bs-toggle="modal"
                  data-bs-target="#imageModal"
                  crossOrigin="anonymous"
                  priority
                />

                {/* Modal */}
                <div
                  className="modal fade"
                  id="imageModal"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <div className="modal-dialog !my-0 flex h-full items-center justify-center p-4">
                    <Image
                      width={787}
                      height={984}
                      src={item?.image ?? "/launchpad.png"}
                      alt="token image"
                      className="w-full rounded-[0.625rem]"
                      loading="lazy"
                      crossOrigin="anonymous"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-close absolute top-6 right-6"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="h-6 w-6 fill-white"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
                    </svg>
                  </button>
                </div>
                {/* end modal */}
              </figure>
            )}

            {/* Details */}
            <div className="md:w-3/5 md:basis-auto md:pl-8 lg:w-1/2 lg:pl-[3.75rem]">
              {/* Collection / Likes / Actions */}
              <div className="mb-3 flex">
                <div className="mb-4 font-display text-4xl font-semibold text-jacarta-700 dark:text-white">
                  {item?.name ? item.name : ""}
                </div>
                {/* Collection */}
                <div className="flex items-center">
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                    data-tippy-content="Verified Collection"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="h-[.875rem] w-[.875rem] fill-white"
                    >
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                    </svg>
                  </span>
                </div>

                {/* Likes / Actions */}
                {/* <div className="ml-auto flex space-x-2">
                  
                  <div className="dropdown rounded-xl border border-jacarta-100 bg-white hover:bg-jacarta-100 dark:border-jacarta-600 dark:bg-jacarta-700 dark:hover:bg-jacarta-600">
                    <a
                      href="#"
                      className="dropdown-toggle inline-flex h-10 w-10 items-center justify-center text-sm"
                      role="button"
                      id="collectionActions"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <svg
                        width="16"
                        height="4"
                        viewBox="0 0 16 4"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="fill-jacarta-500 dark:fill-jacarta-200"
                      >
                        <circle cx="2" cy="2" r="2"></circle>
                        <circle cx="8" cy="2" r="2"></circle>
                        <circle cx="14" cy="2" r="2"></circle>
                      </svg>
                    </a>
                    <div
                      className="dropdown-menu dropdown-menu-end z-10 hidden min-w-[200px] whitespace-nowrap rounded-xl bg-white py-4 px-2 text-left shadow-xl dark:bg-jacarta-800"
                      aria-labelledby="collectionActions"
                    >
                      <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                        New bid
                      </button>
                      <hr className="my-2 mx-4 h-px border-0 bg-jacarta-100 dark:bg-jacarta-600" />
                      <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                        Refresh Metadata
                      </button>
                      <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                        Share
                      </button>
                      <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                        Report
                      </button>
                    </div>
                  </div>
                </div> */}
              </div>

              <div className="mb-8 flex items-center space-x-4 whitespace-nowrap">
                {/*<div className="flex items-center">
                   <span className="-ml-1" data-tippy-content="ETH">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      x="0"
                      y="0"
                      viewBox="0 0 1920 1920"
                      // xml:space="preserve"
                      className="mr-1 h-4 w-4"
                    >
                      <path
                        fill="#8A92B2"
                        d="M959.8 80.7L420.1 976.3 959.8 731z"
                      ></path>
                      <path
                        fill="#62688F"
                        d="M959.8 731L420.1 976.3l539.7 319.1zm539.8 245.3L959.8 80.7V731z"
                      ></path>
                      <path
                        fill="#454A75"
                        d="M959.8 1295.4l539.8-319.1L959.8 731z"
                      ></path>
                      <path
                        fill="#8A92B2"
                        d="M420.1 1078.7l539.7 760.6v-441.7z"
                      ></path>
                      <path
                        fill="#62688F"
                        d="M959.8 1397.6v441.7l540.1-760.6z"
                      ></path>
                    </svg>
                  </span> 
                  <span className="text-sm font-medium tracking-tight text-green">
                    100 MINA
                  </span>
                </div>*/}
                <span className="text-sm text-jacarta-400 dark:text-jacarta-300">
                  {item?.symbol ?? ""}
                </span>
                {/* <span className="text-sm text-jacarta-400 dark:text-jacarta-300">
                  Supply:{" "}
                  {item?.totalSupply
                    ? item?.totalSupply.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })
                    : ""}
                </span> */}
                <div className="flex items-center space-x-1 rounded-xl border border-jacarta-100 bg-white py-2 px-4 dark:border-jacarta-600 dark:bg-jacarta-700">
                  <span
                    className={`js-likes relative cursor-pointer before:absolute before:h-4 before:w-4 before:bg-[url('../img/heart-fill.svg')] before:bg-cover before:bg-center before:bg-no-repeat before:opacity-0 ${
                      like ? "js-likes--active" : ""
                    }`}
                    data-tippy-content="Favorite"
                    onClick={() => addLike()}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="h-4 w-4 fill-jacarta-500 hover:fill-red dark:fill-jacarta-200 dark:hover:fill-red"
                    >
                      <path fill="none" d="M0 0H24V24H0z"></path>
                      <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z"></path>
                    </svg>
                  </span>
                  <span className="text-sm dark:text-jacarta-200">{likes}</span>
                </div>
              </div>

              <p className="mb-5 dark:text-jacarta-300">
                {item?.description ?? ""}
              </p>

              <p className="dark:text-jacarta-300">
                {item?.tokenId ? "TokenId:" : "Address:"}
              </p>
              <Link
                href={
                  item?.tokenId
                    ? `${explorerTokenUrl()}${item.tokenId}`
                    : `${explorerAccountUrl()}${tokenAddress}`
                }
                className="block mb-10 text-sm font-bold text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {item?.tokenId ?? tokenAddress}
              </Link>

              {/* Creator / Owner */}
              {/* <div className="flex flex-wrap">
                {isNotEmpty(item?.twitter) && (
                  <div className="mr-8 mb-4 flex">
                    <figure className="mr-4 shrink-0">
                      <Link
                        href={`https://twitter.com/${item?.twitter}`}
                        className="relative block"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Socials i={1} />

                        <div
                          className="absolute -right-3 top-[60%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                          data-tippy-content="Twitter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className="fill-white"
                          >
                            <path fill="none" d="M0 0h24v24H0z"></path>
                            <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                          </svg>
                        </div>
                      </Link>
                    </figure>
                    <div className="flex flex-col justify-center">
                      <span className="block text-sm text-jacarta-400 dark:text-white">
                        <strong>Twitter:</strong>
                      </span>
                      <Link
                        href={`https://twitter.com/${item?.twitter}`}
                        className="block text-accent"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="text-sm font-bold">
                          @{item?.twitter ?? ""}
                        </span>
                      </Link>
                    </div>
                  </div>
                )}

                {isNotEmpty(item?.discord) && (
                  <div className="mb-4 flex">
                    <figure className="mr-4 shrink-0">
                      <Link href={`/user/4`} className="relative block">
                        <Socials i={2} />
                        <div
                          className="absolute -right-3 top-[60%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                          data-tippy-content="Verified Collection"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className="h-[.875rem] w-[.875rem] fill-white"
                          >
                            <path fill="none" d="M0 0h24v24H0z"></path>
                            <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                          </svg>
                        </div>
                      </Link>
                    </figure>
                    <div className="flex flex-col justify-center">
                      <span className="block text-sm text-jacarta-400 dark:text-white">
                        Discord:
                      </span>
                      <Link href={`/user/6`} className="block text-accent">
                        <span className="text-sm font-bold">
                          {item?.discord ?? ""}
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap">
                {isNotEmpty(item?.website) && (
                  <div className="mr-8 mb-4 flex">
                    <figure className="mr-4 shrink-0">
                      <Link
                        href={`${item?.website}`}
                        className="relative block"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Socials i={5} />

                        <div
                          className="absolute -right-3 top-[60%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                          data-tippy-content="Twitter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className="fill-white"
                          >
                            <path fill="none" d="M0 0h24v24H0z"></path>
                            <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                          </svg>
                        </div>
                      </Link>
                    </figure>
                    <div className="flex flex-col justify-center">
                      <span className="block text-sm text-jacarta-400 dark:text-white">
                        <strong>Website:</strong>
                      </span>
                      <Link
                        href={`${item?.website}`}
                        className="block text-accent"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <span className="text-sm font-bold">
                          {item?.website ?? ""}
                        </span>
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap">
                  {isNotEmpty(item?.instagram) && (
                    <div className="mr-8 mb-4 flex">
                      <figure className="mr-4 shrink-0">
                        <Link
                          href={`https://twitter.com/${item?.twitter}`}
                          className="relative block"
                        >
                          <Socials i={3} />

                          <div
                            className="absolute -right-3 top-[60%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                            data-tippy-content="Twitter"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              className="fill-white"
                            >
                              <path fill="none" d="M0 0h24v24H0z"></path>
                              <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                            </svg>
                          </div>
                        </Link>
                      </figure>
                      <div className="flex flex-col justify-center">
                        <span className="block text-sm text-jacarta-400 dark:text-white">
                          <strong>Instagram:</strong>
                        </span>
                        <Link href={`/user/2`} className="block text-accent">
                          <span className="text-sm font-bold">
                            @{item?.instagram ?? ""}
                          </span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {isNotEmpty(item?.facebook) && (
                  <div className="mb-4 flex">
                    <figure className="mr-4 shrink-0">
                      <Link href={`/user/4`} className="relative block">
                        <Socials i={0} />
                        <div
                          className="absolute -right-3 top-[60%] flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
                          data-tippy-content="Verified Collection"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="24"
                            height="24"
                            className="h-[.875rem] w-[.875rem] fill-white"
                          >
                            <path fill="none" d="M0 0h24v24H0z"></path>
                            <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z"></path>
                          </svg>
                        </div>
                      </Link>
                    </figure>
                    <div className="flex flex-col justify-center">
                      <span className="block text-sm text-jacarta-400 dark:text-white">
                        Facebook:
                      </span>
                      <Link href={`/user/6`} className="block text-accent">
                        <span className="text-sm font-bold">
                          {item?.discord ?? ""}
                        </span>
                      </Link>
                    </div>
                  </div>
                )}
              </div> */}

              {/* Trade */}
              {(bid || offer) && (
                <div className="min-w-80 max-w-md rounded-2lg border border-jacarta-100 bg-white p-8 dark:border-jacarta-600 dark:bg-jacarta-700">
                  <div className="mb-8 sm:flex sm:flex-wrap">
                    <div className="sm:w-1/2 sm:pr-4 lg:pr-8">
                      <div className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-medium text-jacarta-400 dark:text-jacarta-300">
                          Highest bid
                        </span>
                      </div>
                      <div className="mt-3 flex">
                        <div>
                          <div className="flex items-center whitespace-nowrap">
                            <span className="text-lg font-medium leading-tight tracking-tight text-green">
                              {formatBalance(bid?.price)} MINA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="sm:w-1/2 sm:pr-4 lg:pr-8">
                      <div className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        <span className="text-medium text-jacarta-400 dark:text-jacarta-300">
                          Lowest offer
                        </span>
                      </div>
                      <div className="mt-3 flex">
                        <div>
                          <div className="flex items-center whitespace-nowrap">
                            <span className="text-lg font-medium leading-tight tracking-tight text-red">
                              {formatBalance(offer?.price)} MINA
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const tradeTab = document.getElementById("trade-tab");
                      const tradePane = document.getElementById("trade");
                      if (tradeTab && tradePane) {
                        // Remove active class from all tabs and panes
                        document
                          .querySelectorAll(".nav-link")
                          .forEach((tab) => {
                            tab.classList.remove("active");
                            tab.setAttribute("aria-selected", "false");
                          });
                        document
                          .querySelectorAll(".tab-pane")
                          .forEach((pane) => {
                            pane.classList.remove("show", "active");
                          });

                        // Activate trade tab and pane
                        tradeTab.classList.add("active");
                        tradeTab.setAttribute("aria-selected", "true");
                        tradePane.classList.add("show", "active");

                        // Scroll to the trade section
                        tradePane.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className="inline-block w-full rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
                  >
                    Trade
                  </button>
                </div>
              )}
              {/* end bid */}
            </div>
            {/* end details */}
          </div>

          {/* end tabs */}
        </div>
      </section>
    </>
  );
}
