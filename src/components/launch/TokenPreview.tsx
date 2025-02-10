import React from "react";
import Image from "next/image";
import Link from "next/link";

export interface TokenPreviewProps {
  tokenAddress: string;
  image: string;
  likes: number;
  name: string;
  symbol: string;
  totalSupply: number;
  isLiked: boolean;
}

export function TokenPreview({
  tokenAddress,
  image,
  likes,
  name,
  symbol,
  totalSupply,
  isLiked,
}: TokenPreviewProps) {
  return (
    <div className="max-w-xs mx-auto">
      <article key={tokenAddress}>
        <div className="block rounded-2.5xl border border-jacarta-100 bg-white p-[1.1875rem] transition-shadow hover:shadow-lg dark:border-jacarta-700 dark:bg-jacarta-700">
          <figure className="relative">
            <Link href={`/nft/${tokenAddress}`}>
              <Image
                width={230}
                height={230}
                src={image ?? "/launchpad.png"}
                alt="token 5"
                className="w-full rounded-[0.625rem]"
                loading="lazy"
                crossOrigin="anonymous"
              />
            </Link>
            <div className="absolute top-3 right-3 flex items-center space-x-1 rounded-md bg-white p-2 dark:bg-jacarta-700">
              <span
                className={`js-likes relative cursor-pointer before:absolute before:h-4 before:w-4 before:bg-[url('../img/heart-fill.svg')] before:bg-cover before:bg-center before:bg-no-repeat before:opacity-0 ${
                  isLiked ? "js-likes--active" : ""
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
              <span className="text-sm dark:text-jacarta-200">
                {likes ?? 0}
              </span>
            </div>
          </figure>
          <div className="mt-7 flex items-center justify-between">
            <span className="font-display text-base text-jacarta-700 hover:text-accent dark:text-white">
              {name}
            </span>
          </div>
          <div className="mt-2  mb-8 text-sm">
            <span className="text-jacarta-500 dark:text-jacarta-300 float-left">
              {symbol}
            </span>
            <span className="mr-1 text-jacarta-700 dark:text-jacarta-200 float-right">
              {`Supply: ${totalSupply}`}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
