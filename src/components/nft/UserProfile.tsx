/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Image from "next/image";
import { NftInfo } from "@silvana-one/api";

export default function Profile({
  item,
  userAddress,
}: {
  item?: NftInfo;
  userAddress: string;
}) {
  return (
    <section className="relative bg-light-base pb-12 pt-28 dark:bg-jacarta-800">
      <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <figure className="relative">
          <Image
            width={138}
            height={138}
            src={item?.image ? item.image : "/img/minanft.png"}
            alt="collection avatar"
            className="rounded-xl border-[5px] border-white dark:border-jacarta-600"
          />
          <div
            className="absolute -right-3 bottom-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green dark:border-jacarta-600"
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
        </figure>
      </div>

      <div className="container">
        <div className="text-center">
          <h4 className="mb-2 font-display text-xl font-medium text-jacarta-700 dark:text-white">
            {userAddress}
          </h4>
        </div>
      </div>
    </section>
  );
}
