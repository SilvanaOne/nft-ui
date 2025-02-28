"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BlockberryTokenTransaction } from "@/lib/blockberry-tokens";
import { explorerTransactionUrl, getChain } from "@/lib/chain";
const chain = getChain();

interface TransactionsProps {
  transactions: BlockberryTokenTransaction[];
}

export const activity = [
  {
    id: 1,
    action: "Launch",
    filter: "launch",
    svgPath: `M14 20v2H2v-2h12zM14.586.686l7.778 7.778L20.95 9.88l-1.06-.354L17.413 12l5.657 5.657-1.414 1.414L16 13.414l-2.404 2.404.283 1.132-1.415 1.414-7.778-7.778 1.415-1.414 1.13.282 6.294-6.293-.353-1.06L14.586.686zm.707 3.536l-7.071 7.07 3.535 3.536 7.071-7.07-3.535-3.536z`,
  },
  {
    id: 2,
    action: "Mint",
    filter: "mint",
    svgPath: `M16.05 12.05L21 17l-4.95 4.95-1.414-1.414 2.536-2.537L4 18v-2h13.172l-2.536-2.536 1.414-1.414zm-8.1-10l1.414 1.414L6.828 6 20 6v2H6.828l2.536 2.536L7.95 11.95 3 7l4.95-4.95z`,
  },
  {
    id: 3,
    action: "Transfer",
    filter: "transfer",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
  {
    id: 4,
    action: "Approve",
    filter: "approve",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
  {
    id: 5,
    action: "Buy",
    filter: "buy",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
  {
    id: 6,
    action: "Sell",
    filter: "sell",
    svgPath: `M6.5 2h11a1 1 0 0 1 .8.4L21 6v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6l2.7-3.6a1 1 0 0 1 .8-.4zM19 8H5v12h14V8zm-.5-2L17 4H7L5.5 6h13zM9 10v2a3 3 0 0 0 6 0v-2h2v2a5 5 0 0 1-10 0v-2h2z`,
  },
];

function timeAgo(unixTime: number): string {
  const now = Date.now();
  let diffSeconds = Math.floor((now - unixTime) / 1000);

  // Handle future dates
  if (diffSeconds < 0) {
    return "in the future";
  }

  // Time intervals in seconds
  const intervals: [string, number][] = [
    ["year", 31536000], // 60 * 60 * 24 * 365
    ["month", 2592000], // 60 * 60 * 24 * 30
    ["week", 604800], // 60 * 60 * 24 * 7
    ["day", 86400], // 60 * 60 * 24
    ["hour", 3600], // 60 * 60
    ["minute", 60],
    ["second", 1],
  ];

  for (const [name, seconds] of intervals) {
    const value = Math.floor(diffSeconds / seconds);
    if (value >= 1) {
      return `${value} ${name}${value > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

export function Transactions({ transactions }: TransactionsProps) {
  const [filterAction, setfilterAction] = useState<string | undefined>(
    undefined
  );
  const [filteredItems, setFilteredItems] = useState<
    BlockberryTokenTransaction[]
  >([]);

  useEffect(() => {
    if (filterAction) {
      setFilteredItems(
        transactions.filter((elm) => elm.memo.includes(filterAction))
      );
    } else {
      setFilteredItems(transactions);
    }
  }, [filterAction, transactions]);

  return (
    <>
      <div className=" border border-b-0 border-jacarta-100 bg-light-base px-4 pt-5 pb-2.5 dark:border-jacarta-600 dark:bg-jacarta-700">
        <div className="flex flex-wrap">
          <button
            onClick={() => setfilterAction(undefined)}
            className={
              !filterAction
                ? "mr-2.5 mb-2.5 inline-flex items-center rounded-xl border border-transparent bg-accent px-4 py-3 hover:bg-accent-dark dark:hover:bg-accent-dark fill-white"
                : "group mr-2.5 mb-2.5 inline-flex items-center rounded-xl border border-jacarta-100 bg-white px-4 py-3 hover:border-transparent hover:bg-accent hover:text-white dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:hover:border-transparent dark:hover:bg-accent hover:fill-white dark:fill-white "
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className={`mr-2 h-4 w-4 `}
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path d="M10.9 2.1l9.899 1.415 1.414 9.9-9.192 9.192a1 1 0 0 1-1.414 0l-9.9-9.9a1 1 0 0 1 0-1.414L10.9 2.1zm.707 2.122L3.828 12l8.486 8.485 7.778-7.778-1.06-7.425-7.425-1.06zm2.12 6.364a2 2 0 1 1 2.83-2.829 2 2 0 0 1-2.83 2.829z"></path>
            </svg>
            <span
              className={`text-2xs font-medium ${
                !filterAction ? "text-white" : ""
              } `}
            >
              All
            </span>
          </button>

          {activity.map((elm, i) => (
            <button
              key={i}
              onClick={() => setfilterAction(elm.filter)}
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
          <div className="w-[17%] py-2 px-4" role="columnheader">
            <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
              Event
            </span>
          </div>
          <div className="w-[10%] py-2 px-4" role="columnheader">
            <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
              Status
            </span>
          </div>
          <div className="w-[44%] py-2 px-4" role="columnheader">
            <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
              Hash
            </span>
          </div>
          {/* <div className="w-[22%] py-2 px-4" role="columnheader">
            <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
              To
            </span>
          </div> */}
          <div className="w-[22%] py-2 px-4" role="columnheader">
            <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
              Date
            </span>
          </div>
        </div>
        {filteredItems.map((elm, i) => (
          <div key={i} className="flex" role="row">
            <div
              className="flex w-[17%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
              role="cell"
            >
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-2 h-4 w-4 fill-jacarta-700 group-hover:fill-white dark:fill-white"
              >
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path d={elm.svgPath}></path>
              </svg> */}
              {elm.memo}
            </div>
            <div
              className="flex w-[10%] items-center whitespace-nowrap border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
              role="cell"
            >
              {/* <span className="-ml-1" data-tippy-content={elm.status}>
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
              </span> */}
              <span className="text-sm font-medium tracking-tight text-green">
                {elm.status}
              </span>
            </div>
            <div
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
            </div>
            {/* <div
              className="flex w-[22%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
              role="cell"
            >
              <Link href={`/user/${elm.id}`} className="text-accent">
                {elm.token}
              </Link>
            </div> */}
            <div
              className="flex w-[22%] items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
              role="cell"
            >
              <span className="mr-1">{timeAgo(elm.age)}</span>
              {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="h-4 w-4 fill-current"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6zm11-3v8h-2V6.413l-7.793 7.794-1.414-1.414L17.585 5H13V3h8z" />
                </svg> */}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
