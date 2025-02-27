"use client";

import Link from "next/link";
import { BlockberryTokenHolder } from "@/lib/blockberry-tokens";
import { explorerAccountUrl } from "@/lib/chain";

interface HoldersProps {
  holders: BlockberryTokenHolder[];
}

export function Holders({ holders }: HoldersProps) {
  return (
    <div
      role="table"
      className="scrollbar-custom grid max-h-72 w-full grid-cols-2 overflow-y-auto rounded-lg rounded-tl-none border border-jacarta-100 bg-white text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
    >
      <div className="contents" role="row">
        <div
          className="sticky top-0 bg-light-base py-2 px-4 dark:bg-jacarta-600"
          role="columnheader"
        >
          <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
            Amount
          </span>
        </div>

        <div
          className="sticky top-0 bg-light-base py-2 px-4 dark:bg-jacarta-600"
          role="columnheader"
        >
          <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
            Holder
          </span>
        </div>
      </div>
      {holders.map((elm: BlockberryTokenHolder, i: number) => (
        <div key={i} className="contents" role="row">
          <div
            className="flex items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
            role="cell"
          >
            {elm.balance}
          </div>

          <div
            className="flex items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
            role="cell"
          >
            <Link
              href={`${explorerAccountUrl()}${elm.holderAddress}`}
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {elm.holderAddress}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
