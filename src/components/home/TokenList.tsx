"use client";

import Sidebar from "@/components/nft/Sidebar";
import { algoliaGetCollectionList, algoliaGetNFTs } from "@/lib/search";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import { SearchContext } from "@/context/search";
import { AddressContext } from "@/context/address";

// import tippy from "tippy.js";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import Highlight from "./Highlight";
import Pagination from "../common/Pagination";
import { unavailableCountry, checkAvailability } from "@/lib/availability";
import NotAvailable from "@/components/pages/NotAvailable";
import { log } from "@/lib/log";
import { useTokenDetails } from "@/context/details";
// import { Order } from "@/components/orderbook/OrderBook";
import { getSiteType } from "@/lib/chain";
import { CollectionInfo, NftInfo } from "@silvana-one/api";
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";
const siteType = getSiteType();
/*
interface Item {
  id: number;
  imageSrc: string;
  title: string;
  likes: number;
  creatorAvatar: string;
  ownerAvatar: string;
  price: number;
  category: string;
  creator: string;
  owner: string;
  bidCount: string;
  NFSW: boolean;
  LazyMinted: boolean;
  liked?: boolean;
  varified?: boolean;
}
  */

type categoriesTypes = "issued" | "owned" | "favorites";
interface Category {
  id: categoriesTypes;
  name: string;
  selected: boolean;
  icon: string;
}

const categoriesIndexes: Record<categoriesTypes, number> = {
  owned: 0,
  issued: 1,
  favorites: 2,
};

const initialCategories: Category[] = [
  {
    id: "owned",
    selected: false,
    name: siteType === "token" ? "Tokens I own" : "My NFTs",
    icon: "M2 4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5.5a2.5 2.5 0 1 0 0 5V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4zm6.085 15a1.5 1.5 0 0 1 2.83 0H20v-2.968a4.5 4.5 0 0 1 0-8.064V5h-9.085a1.5 1.5 0 0 1-2.83 0H4v14h4.085zM9.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  },
  {
    id: "issued",
    selected: false,
    name: siteType === "token" ? "Tokens I issued" : "Collections I created",
    icon: "M2 4a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v5.5a2.5 2.5 0 1 0 0 5V20a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4zm6.085 15a1.5 1.5 0 0 1 2.83 0H20v-2.968a4.5 4.5 0 0 1 0-8.064V5h-9.085a1.5 1.5 0 0 1-2.83 0H4v14h4.085zM9.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  },
  {
    id: "favorites",
    selected: false,
    name: "Favorites",
    icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  },
];

export type TokenListProps = {
  title?: string;
  showIcon: boolean;
  initialNumberOfItems?: number;
  hideSidebar?: boolean;
  collectionAddress?: string;
};

const numberOfItemsOptions = [20, 50, 100];
let connectWalletError = false;

export default function TokenList({
  title,
  showIcon,
  initialNumberOfItems,
  hideSidebar,
  collectionAddress,
}: TokenListProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const { state, dispatch } = useTokenDetails();
  const [itemsToDisplay, setItemsToDisplay] = useState<NftInfo[]>([]);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [numberOfItems, setNumberOfItems] = useState<number>(
    initialNumberOfItems ?? numberOfItemsOptions[0]
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(!unavailableCountry);
  const [selectedCollection, setSelectedCollection] = useState<
    string | undefined
  >(undefined);
  const { search } = useContext(SearchContext);
  const { address, setAddress } = useContext(AddressContext);

  function setListSelectedCollection(collection: string | undefined) {
    setSelectedCollection(collection);
  }

  useEffect(() => {
    // tippy("[data-tippy-content]");
    checkAvailability().then((result) => {
      setIsAvailable(!result);
      if (result) window.location.href = "/not-available";
    });
  }, []);

  const listOfNumberOfItems =
    initialNumberOfItems && !numberOfItemsOptions.includes(initialNumberOfItems)
      ? [initialNumberOfItems, ...numberOfItemsOptions]
      : numberOfItemsOptions;

  useEffect(() => {
    console.log("categories", categories);
    console.log("state.list", state.list);
    console.log("state.favorites", state.favorites);
    // const filtered = categories[categoriesIndexes.favorites].selected
    //   ? state.list.filter((item) =>
    //       state.favorites.includes(item.collectionAddress)
    //     )
    //   : state.list;
    const filteredByCollection = collectionAddress
      ? state.list.filter(
          (item) => item.collectionAddress === collectionAddress
        )
      : state.list;
    const filteredByMasterNFT = filteredByCollection.filter(
      (item) => item.tokenAddress !== item.collectionAddress
    );
    // Sort NFTs - ones with price first, then by update time
    const sortedByPriceAndTime = filteredByMasterNFT.sort((a, b) => {
      // First compare by price existence
      if (a.price && !b.price) return -1;
      if (!a.price && b.price) return 1;

      // If both have price or both don't have price, sort by update time
      const aTime = a.updated || a.created || 0;
      const bTime = b.updated || b.created || 0;
      return bTime - aTime; // Most recent first
    });
    setItemsToDisplay(sortedByPriceAndTime);
  }, [categories, state.list, state.favorites, numberOfItems]);

  // const setItem = (info: DeployedTokenInfo) =>
  //   dispatch({
  //     type: "SET_TOKEN_INFO",
  //     payload: { tokenAddress: info.tokenAddress, info },
  //   });

  const setItems = (items: NftInfo[]) =>
    dispatch({
      type: "SET_ITEMS",
      payload: { items },
    });

  const setFavorites = (favorites: string[]) =>
    dispatch({
      type: "SET_FAVORITES",
      payload: { favorites },
    });

  const addFavorite = (tokenAddress: string) =>
    dispatch({
      type: "ADD_FAVORITE",
      payload: { tokenAddress },
    });

  // const setBid = (tokenAddress: string, bid: Order) =>
  //   dispatch({
  //     type: "SET_BID",
  //     payload: { tokenAddress, bid },
  //   });

  // const setOffer = (tokenAddress: string, offer: Order) =>
  //   dispatch({
  //     type: "SET_OFFER",
  //     payload: { tokenAddress, offer },
  //   });

  // const setIsPriceLoaded = (tokenAddress: string, isPriceLoaded: boolean) =>
  //   dispatch({
  //     type: "SET_IS_PRICE_LOADED",
  //     payload: { tokenAddress, isPriceLoaded },
  //   });

  const setLikes = (
    likes: { collectionAddress: string; tokenAddress: string; likes: number }[]
  ) =>
    dispatch({
      type: "SET_NFT_LIKES",
      payload: likes,
    });

  const addLike = async (collectionAddress: string, tokenAddress: string) => {
    addFavorite(tokenAddress);
    const index = state.list.findIndex(
      (elm) => elm.tokenAddress === tokenAddress
    );
    if (index !== -1) {
      setLikes([
        {
          collectionAddress,
          tokenAddress: state.list[index].tokenAddress,
          likes: (state.list[index].likes ?? 0) + 1,
        },
      ]);
    }
    //if (address) await writeLike({ tokenAddress, userAddress: address });
  };

  const isLiked = (tokenAddress: string) => {
    return state.favorites.includes(tokenAddress);
  };

  useEffect(() => {
    const fetchTokenList = async () => {
      let userAddress = address;
      let onlyFavorites = categories[categoriesIndexes.favorites].selected;
      let onlyOwned = categories[categoriesIndexes.owned].selected;
      let onlyIssued = categories[categoriesIndexes.issued].selected;
      if (userAddress === undefined) {
        userAddress = (await getWalletInfo()).address;
        if (
          userAddress === undefined &&
          (onlyFavorites || onlyOwned || onlyIssued)
        ) {
          userAddress = (await connectWallet())?.address;
          if (userAddress === undefined) {
            console.error("Cannot connect wallet");
            if (!connectWalletError) {
              log.info("Cannot connect wallet");
              connectWalletError = true;
            }
            onlyFavorites = false;
            onlyOwned = false;
            onlyIssued = false;
            setCategories(initialCategories);
          }
        }
      }
      if (address !== userAddress) {
        setAddress(userAddress);
        if (DEBUG) console.log("address", userAddress);
      }

      const searchResult = await algoliaGetNFTs({
        query: search,
        page: page - 1,
        hitsPerPage: numberOfItems < 20 ? 20 : numberOfItems,
        onlyFavorites,
        favorites: onlyFavorites ? state.favorites : [],
        ownedByAddress: onlyOwned ? userAddress : undefined,
        issuedByAddress: onlyIssued ? userAddress : undefined,
        collectionAddress: selectedCollection,
      });
      console.log("searchResult", searchResult);

      let newItems: NftInfo[] = searchResult?.hits ?? [];

      setItems(newItems);
      setTotalPages(searchResult?.nbPages ?? 1);

      if (DEBUG)
        console.log("Search results:", {
          userAddress,
          categories,
          newItems,
        });
    };
    fetchTokenList();
  }, [
    categories,
    numberOfItems,
    page,
    search,
    refreshCounter,
    selectedCollection,
  ]);

  // useEffect(() => {
  //   const fetchTokenState = async () => {
  //     const tokensToFetch: DeployedTokenInfo[] = [];
  //     for (const item of state.list) {
  //       if (!state.tokens[item.tokenAddress]?.tokenState === undefined)
  //         tokensToFetch.push(item);
  //     }
  //     for (const token of tokensToFetch) {
  //       const state = await getTokenState({
  //         tokenAddress: token.tokenAddress,
  //         info: token,
  //       });
  //       if (state.success) {
  //         if (DEBUG) console.log("fetchTokenState", token.tokenAddress);
  //         setTokenState(state.tokenState);
  //       }
  //     }
  //   };
  //   fetchTokenState();
  // }, [state.list]);

  // useEffect(() => {
  //   const fetchLikes = async () => {
  //     const addresses = state.list
  //       .filter((item) => state.likes[item.tokenAddress] === undefined)
  //       .map((item) => item.tokenAddress);
  //     if (addresses.length === 0) return;
  //     const newLikes = await batchLikesCounts({
  //       tokens: addresses.map((address) => ({
  //         address,
  //       })),
  //     });
  //     setLikes(
  //       newLikes.map((like) => ({
  //         tokenAddress: like.address,
  //         likes: like.likes,
  //       }))
  //     );
  //   };
  //   fetchLikes();
  // }, [state.list]);

  // useEffect(() => {
  //   const fetchFavorites = async () => {
  //     if (!address) return;
  //     const newFavorites = await getUsersLikes({ userAddress: address });
  //     setFavorites(newFavorites.map((favorite) => favorite.tokenAddress));
  //   };
  //   fetchFavorites();
  // }, [address]);

  useEffect(() => {
    const fetchCollections = async () => {
      const collections = await algoliaGetCollectionList();
      console.log("collections", collections);
      setCollections(collections);
    };
    fetchCollections();
  }, []);

  return (
    <>
      {isAvailable && (
        <section className={`${collectionAddress ? "" : "py-32"}`}>
          <div className="ml-20 mr-20">
            {title && (
              <h2 className="mb-8 text-center font-display text-5xl text-jacarta-700 dark:text-white">
                {showIcon && (
                  <span
                    className="mr-3 inline-block h-8 w-8 bg-contain bg-center text-xl"
                    style={{
                      backgroundImage:
                        "url(https://cdn.jsdelivr.net/npm/emoji-datasource-apple@7.0.2/img/apple/64/26a1.png)",
                    }}
                  ></span>
                )}
                {title}
              </h2>
            )}
            {hideSidebar !== true && (
              <div className="mb-8 flex flex-wrap items-center justify-between">
                <ul className="flex flex-wrap items-center">
                  <li className="my-1 mr-2.5">
                    <div
                      onClick={() => setCategories(initialCategories)}
                      className={`  ${
                        categories.every(
                          (category) => category.selected === false
                        )
                          ? "bg-jacarta-100"
                          : "bg-white"
                      }  ${
                        categories.every(
                          (category) => category.selected === false
                        )
                          ? "dark:bg-jacarta-600"
                          : "dark:bg-jacarta-900"
                      } cursor-pointer group flex h-9 items-center rounded-lg border border-jacarta-100  px-4 font-display text-sm font-semibold text-jacarta-500 transition-colors hover:border-transparent hover:bg-accent hover:text-white dark:border-jacarta-600  dark:text-white dark:hover:border-transparent dark:hover:bg-accent dark:hover:text-white`}
                    >
                      All
                    </div>
                  </li>
                  {categories.map((elm, i) => (
                    <li
                      onClick={() =>
                        setCategories((prev) => {
                          const newCategories = prev.map((category, index) => {
                            if (index === i) {
                              return {
                                ...category,
                                selected: !category.selected,
                              };
                            }
                            return category;
                          });
                          if (DEBUG)
                            console.log("New categories", newCategories);
                          return newCategories;
                        })
                      }
                      key={i}
                      className="my-1 mr-2.5"
                    >
                      <div
                        className={`  ${
                          categories[i].selected ? "bg-jacarta-100" : "bg-white"
                        }  ${
                          categories[i].selected
                            ? "dark:bg-jacarta-600"
                            : "dark:bg-jacarta-900"
                        } cursor-pointer group flex h-9 items-center rounded-lg border border-jacarta-100  px-4 font-display text-sm font-semibold text-jacarta-500 transition-colors hover:border-transparent hover:bg-accent hover:text-white dark:border-jacarta-600  dark:text-white dark:hover:border-transparent dark:hover:bg-accent dark:hover:text-white`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 25 28"
                          width="24"
                          height="24"
                          className="mr-1 h-4 w-4 fill-jacarta-700 transition-colors group-hover:fill-white dark:fill-jacarta-100"
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d={elm.icon} />
                        </svg>
                        <span>{elm.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 my-1">
                  <button
                    onClick={() => setRefreshCounter(refreshCounter + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-jacarta-100 bg-white hover:border-transparent hover:bg-accent hover:text-white dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:hover:border-transparent dark:hover:bg-accent"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="h-4 w-4 fill-jacarta-700 group-hover:fill-white dark:fill-jacarta-100"
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M5.463 4.433A9.961 9.961 0 0 1 12 2c5.523 0 10 4.477 10 10 0 2.136-.67 4.116-1.81 5.74L17 12h3A8 8 0 0 0 6.46 6.228l-.997-1.795zm13.074 15.134A9.961 9.961 0 0 1 12 22C6.477 22 2 17.523 2 12c0-2.136.67-4.116 1.81-5.74L7 12H4a8 8 0 0 0 13.54 5.772l.997 1.795z" />
                    </svg>
                  </button>

                  <div className="dropdown my-1 cursor-pointer">
                    <div
                      className="dropdown-toggle inline-flex w-48 items-center justify-between rounded-lg border border-jacarta-100 bg-white py-2 px-3 text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
                      role="button"
                      id="numberOfItems"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span className="font-display">{numberOfItems}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="h-4 w-4 fill-jacarta-500 dark:fill-white"
                      >
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M12 13.172l4.95-4.95 1.414 1.414L12 16 5.636 9.636 7.05 8.222z" />
                      </svg>
                    </div>

                    <div
                      className="dropdown-menu z-10 hidden min-w-[220px] whitespace-nowrap rounded-xl bg-white py-4 px-2 text-left shadow-xl dark:bg-jacarta-800"
                      aria-labelledby="numberOfItems"
                    >
                      <span className="block px-5 py-2 font-display text-sm font-semibold text-jacarta-300">
                        Number of items
                      </span>
                      {listOfNumberOfItems.map((elm, i) => (
                        <button
                          onClick={() => setNumberOfItems(elm)}
                          key={i}
                          className={
                            numberOfItems == elm
                              ? "dropdown-item flex w-full items-center justify-between rounded-xl px-5 py-2 text-left font-display text-sm text-jacarta-700 transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600"
                              : "dropdown-item flex w-full items-center justify-between rounded-xl px-5 py-2 text-left font-display text-sm transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600"
                          }
                        >
                          {elm}
                          {numberOfItems == elm && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              className="mb-[3px] h-4 w-4 fill-accent"
                            >
                              <path fill="none" d="M0 0h24v24H0z" />
                              <path d="M10 15.172l9.192-9.193 1.415 1.414L10 18l-6.364-6.364 1.414-1.414z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="lg:flex mt-6">
              {/* Sidebar */}
              {siteType === "nft" && hideSidebar !== true && (
                <Sidebar
                  collections={collections}
                  selectedCollection={selectedCollection}
                  setSelectedCollection={setListSelectedCollection}
                />
              )}
              {/* end sidebar */}
              {/* Content */}
              <div className="grid grid-cols-1 gap-[1.875rem] md:grid-cols-2 lg:grid-cols-4">
                {itemsToDisplay.map((elm, i) => (
                  <article key={i}>
                    <div className="block rounded-2.5xl border border-jacarta-100 bg-white p-[1.1875rem] transition-shadow hover:shadow-lg dark:border-jacarta-700 dark:bg-jacarta-700">
                      <figure className="relative">
                        <Link
                          href={`/nft/${elm.collectionAddress}/${elm.tokenAddress}`}
                          className="block w-full h-full"
                        >
                          {/* <Image
                          width={0}
                          height={0}
                          sizes="100vw"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            objectPosition: "top",
                          }}
                          src={elm.image ?? "/launchpad.png"}
                          alt="token image"
                          className="rounded-[0.625rem]"
                          loading="lazy"
                          crossOrigin="anonymous"
                        /> */}
                          <Image
                            width={230}
                            height={230}
                            src={elm.image ?? "/launchpad.png"}
                            alt="token 5"
                            className="w-full rounded-[0.625rem]"
                            loading="lazy"
                            crossOrigin="anonymous"
                          />
                        </Link>
                        <div className="absolute top-3 right-3 flex items-center space-x-1 rounded-md bg-white p-2 dark:bg-jacarta-700">
                          <span
                            onClick={() =>
                              addLike(elm.collectionAddress, elm.tokenAddress)
                            }
                            className={`js-likes relative cursor-pointer before:absolute before:h-4 before:w-4 before:bg-[url('../img/heart-fill.svg')] before:bg-cover before:bg-center before:bg-no-repeat before:opacity-0 ${
                              isLiked(elm.tokenAddress)
                                ? "js-likes--active"
                                : ""
                            }`}
                            // data-tippy-content="Favorite"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              className="h-4 w-4 fill-jacarta-500 hover:fill-red dark:fill-jacarta-200 dark:hover:fill-red"
                            >
                              <path fill="none" d="M0 0H24V24H0z" />
                              <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z" />
                            </svg>
                          </span>
                          {/* <span className="text-sm dark:text-jacarta-200">
                      {elm.likes}
                    </span> */}
                          <span className="text-sm dark:text-jacarta-200">
                            {state.likes[elm.tokenAddress] ?? ""}
                          </span>
                        </div>
                      </figure>
                      <div className="mt-7 flex items-center justify-between">
                        <Link
                          href={`/nft/${elm.collectionAddress}/${elm.tokenAddress}`}
                          className="flex"
                        >
                          <span className="font-display text-base text-jacarta-700 hover:text-accent dark:text-white  float-left">
                            <Highlight item={elm} attribute="name" />
                          </span>
                        </Link>

                        <span className="mr-1 text-jacarta-700 dark:text-jacarta-200 float-right">
                          {elm.price ? elm.price.toString() + ` MINA` : ""}
                        </span>

                        {/* <div className="dropup rounded-full hover:bg-jacarta-100 dark:hover:bg-jacarta-600">
                        <a
                          href="#"
                          className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center text-sm"
                          role="button"
                          id="itemActions"
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
                            <circle cx="2" cy="2" r="2" />
                            <circle cx="8" cy="2" r="2" />
                            <circle cx="14" cy="2" r="2" />
                          </svg>
                        </a>
                        <div
                          className="dropdown-menu dropdown-menu-end z-10 hidden min-w-[200px] whitespace-nowrap rounded-xl bg-white py-4 px-2 text-left shadow-xl dark:bg-jacarta-800"
                          aria-labelledby="itemActions"
                        >
                          <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm font-semibold transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                            New bid
                          </button>
                          <hr className="my-2 mx-4 h-px border-0 bg-jacarta-100 dark:bg-jacarta-600" />
                          <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm font-semibold transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                            Refresh Metadata
                          </button>
                          <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm font-semibold transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                            Share
                          </button>
                          <button className="block w-full rounded-xl px-5 py-2 text-left font-display text-sm font-semibold transition-colors hover:bg-jacarta-50 dark:text-white dark:hover:bg-jacarta-600">
                            Report
                          </button>
                        </div>
                      </div>*/}
                      </div>
                      {siteType === "nft" && (
                        <div className="mt-2 text-sm">
                          <Link
                            href={`/collection/${
                              (elm as any).collectionAddress
                            }`}
                            className="flex hover:text-accent"
                          >
                            <span className="mr-1 text-jacarta-700 dark:text-jacarta-200 float-left">
                              Collection:{" "}
                              <Highlight
                                item={elm}
                                attribute="collectionName"
                              />
                            </span>
                          </Link>
                        </div>
                      )}
                      {siteType === "token" && (
                        <div className="mt-2 text-sm">
                          <span className="text-jacarta-500 dark:text-jacarta-300 float-left">
                            <Highlight item={elm} attribute="symbol" />
                          </span>

                          <span className="mr-1 text-jacarta-700 dark:text-jacarta-200 float-right">
                            {`Supply: ${
                              (elm as any).totalSupply?.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                }
                              ) ?? "0"
                            }`}
                          </span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        {/* <button
                        className="font-display text-sm font-semibold text-accent"
                        data-bs-toggle="modal"
                        data-bs-target="#buyNowModal"
                      >
                        Buy now
                      </button> */}
                        {/* <Link
                        href={`/nft/${elm.tokenAddress}`}
                        className="group flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          className="mr-1 mb-[3px] h-4 w-4 fill-jacarta-500 group-hover:fill-accent dark:fill-jacarta-200"
                        >
                          <path fill="none" d="M0 0h24v24H0z" />
                          <path d="M12 13.172l4.95-4.95 1.414 1.414L12 16 5.636 9.636 7.05 8.222z" />
                        </svg>
                        <span className=" rtl:mr-1 font-display text-sm font-semibold group-hover:text-accent dark:text-jacarta-200">
                          View History
                        </span>
                      </Link> */}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </section>
      )}
      {!isAvailable && <NotAvailable />}
    </>
  );
}
