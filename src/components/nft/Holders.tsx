"use client";

import Link from "next/link";
import { TokenHolder } from "@/lib/api";
import { explorerAccountUrl } from "@/lib/chain";

interface HoldersProps {
  holders: TokenHolder[];
}

export function Holders({ holders }: HoldersProps) {
  return (
    <div
      role="table"
      className="scrollbar-custom max-h-72 w-full overflow-y-auto rounded-lg rounded-tl-none border border-jacarta-100 bg-white text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
    >
      <div
        className="sticky top-0 flex bg-light-base dark:bg-jacarta-600"
        role="row"
      >
        <div className="w-[30%] py-2 px-4" role="columnheader">
          <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
            Number of NFTs
          </span>
        </div>

        <div className="w-[70%] py-2 px-4" role="columnheader">
          <span className="w-full overflow-hidden text-ellipsis text-jacarta-700 dark:text-jacarta-100">
            Owner
          </span>
        </div>
      </div>
      {holders.map((elm: TokenHolder, i: number) => (
        <div key={i} className="flex" role="row">
          <div
            className="w-[30%] flex items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
            role="cell"
          >
            {elm.balance}
          </div>

          <div
            className="w-[70%] flex items-center border-t border-jacarta-100 py-4 px-4 dark:border-jacarta-600"
            role="cell"
          >
            <div className="w-full overflow-hidden">
              <Link
                href={`/user/${elm.address}`}
                className="text-accent hover:underline block truncate"
                title={elm.address}
              >
                {elm.address}
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
