"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { explorerTransactionUrl, getChain } from "@/lib/chain";
import { unavailableCountry } from "@/lib/availability";
import NotAvailable from "@/components/pages/NotAvailable";
import { Loading } from "./Loading";
import { CollectionInfo } from "@silvana-one/api";
import {
  algoliaGetCollection,
  algoliaGetCollectionLeaderBoard,
  algoliaGetUsersLeaderBoard,
} from "@/lib/search";
import { useTokenDetails } from "@/context/details";

const chain = getChain();

export interface LeaderboardItem {
  name?: string;
  address: string;
  count: number;
}

export const activity = [
  {
    id: 1,
    action: "Collections",
    filter: "collections",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
  {
    id: 2,
    action: "Users",
    filter: "users",
    svgPath: `M16.05 12.05L21 17l-4.95 4.95-1.414-1.414 2.536-2.537L4 18v-2h13.172l-2.536-2.536 1.414-1.414zm-8.1-10l1.414 1.414L6.828 6 20 6v2H6.828l2.536 2.536L7.95 11.95 3 7l4.95-4.95z`,
  },
];

export function Leaderboard() {
  const [filterAction, setfilterAction] = useState<"collections" | "users">(
    "collections"
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(!unavailableCountry);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collections, setCollections] = useState<LeaderboardItem[]>([]);
  const [users, setUsers] = useState<LeaderboardItem[]>([]);
  const { state, dispatch } = useTokenDetails();

  const setCollection = (info: CollectionInfo) =>
    dispatch({
      type: "SET_COLLECTION_INFO",
      payload: { collectionAddress: info.collectionAddress, info },
    });

  useEffect(() => {
    const fetchCollections = async () => {
      const collections = await algoliaGetCollectionLeaderBoard();
      setCollections(
        collections.map((collection) => ({
          address: collection.collectionAddress,
          count: collection.minted,
          name: state.collections?.[collection.collectionAddress]?.info
            ?.collectionName,
        }))
      );
      for (const collection of collections) {
        if (
          !state.collections?.[collection.collectionAddress]?.info
            ?.collectionName
        ) {
          const collectionInfo = await algoliaGetCollection({
            collectionAddress: collection.collectionAddress,
          });
          if (collectionInfo) {
            setCollection(collectionInfo);
            setCollections((prev) =>
              [
                ...prev.filter(
                  (c) => c.address !== collection.collectionAddress
                ),
                {
                  address: collection.collectionAddress,
                  count: collection.minted,
                  name: collectionInfo?.collectionName,
                },
              ].sort((a, b) => b.count - a.count)
            );
          }
        }
      }
    };
    const fetchUsers = async () => {
      const users = await algoliaGetUsersLeaderBoard();
      setUsers(
        users.map((user) => ({
          address: user.userAddress,
          count: user.owned,
        }))
      );
    };
    fetchCollections();
    fetchUsers();
    setIsLoading(false);
  }, []);

  return (
    <>
      {isAvailable && (
        <section className="mt-32 max-w-5xl mx-auto flex items-center justify-center h-full">
          <div className="ml-20 mr-20 w-full">
            <h2 className="mb-8 text-center font-display text-5xl text-jacarta-700 dark:text-white">
              Leaderboard
            </h2>
            <div className="border border-b-0 border-jacarta-100 bg-light-base px-4 pt-5 pb-2.5 dark:border-jacarta-600 dark:bg-jacarta-700">
              <div className="flex flex-wrap">
                {activity.map((elm, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setfilterAction(elm.filter as "collections" | "users")
                    }
                    className={
                      filterAction === elm.filter
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
                        filterAction === elm.filter ? "text-white" : ""
                      } `}
                    >
                      {elm.action}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div
              role="table"
              className="scrollbar-custom max-h-72 w-full overflow-y-auto rounded-lg rounded-tl-none border border-jacarta-100 bg-white text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
            >
              <div
                className="sticky top-0 flex bg-light-base dark:bg-jacarta-600"
                role="row"
              >
                <div className="w-[60%] py-2 px-4" role="columnheader">
                  <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
                    {filterAction === "collections" ? "Collection" : "User"}
                  </span>
                </div>
                <div className="w-[20%] py-2 px-4" role="columnheader">
                  <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
                    Position
                  </span>
                </div>
                <div className="w-[20%] py-2 px-4" role="columnheader">
                  <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
                    Number of NFTs
                  </span>
                </div>
              </div>
              {isLoading ? (
                <Loading />
              ) : (
                (filterAction === "collections" ? collections : users).map(
                  (elm, i) => (
                    <div key={i} className="flex" role="row">
                      <div
                        className="flex w-[60%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
                        role="cell"
                      >
                        <Link
                          href={`/${
                            filterAction === "collections"
                              ? "collection"
                              : "user"
                          }/${elm.address}`}
                          className="text-accent hover:underline"
                        >
                          {elm.name ?? elm.address}
                        </Link>
                      </div>
                      <div
                        className="flex w-[20%] items-center whitespace-nowrap border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
                        role="cell"
                      >
                        <span className="text-sm font-medium tracking-tight text-green">
                          {i + 1}
                        </span>
                      </div>
                      {/* <div
                    className="flex w-[44%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
                    role="cell"
                  >
                    <Link
                      href={`${explorerTransactionUrl()}${elm.hash}`}
                      className="text-accent hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {elm.hash}
                    </Link>
                  </div> */}

                      <div
                        className="flex w-[20%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
                        role="cell"
                      >
                        <span className="mr-1">{elm.count}</span>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </section>
      )}
      {!isAvailable && <NotAvailable />}
    </>
  );
}
