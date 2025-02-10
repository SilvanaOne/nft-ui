"use client";

import Socials from "./Socials";
import Image from "next/image";
import Link from "next/link";
import { getSiteName, getSiteType, getChain } from "@/lib/chain";
const otherChain = getChain() == "mainnet" ? "Devnet" : "Mainnet";
const otherChainUrl =
  otherChain == "Devnet"
    ? "https://devnet.minatokens.com"
    : "https://minatokens.com";

const siteType = getSiteType();
export default function TokenFooter() {
  return (
    <footer className="page-footer bg-white dark:bg-jacarta-900">
      <div className="container">
        <div className="grid grid-cols-3 gap-x-7 gap-y-14 pt-12 pb-6 md:grid-cols-12">
          <div className="col-span-full sm:col-span-3 md:col-span-6 pe-96">
            <Link href="/" className="mb-6 flex items-center">
              <span className="inline-block">
                <Image
                  width={32}
                  height={32}
                  src={
                    siteType === "nft"
                      ? "/img/minanft.png"
                      : "/img/zkCloudWorker-logo.png"
                  }
                  className="--max-h-7 dark:hidden"
                  alt="MinaTokens.com"
                />
                <Image
                  width={32}
                  height={32}
                  src={
                    siteType === "nft"
                      ? "/img/minanft.png"
                      : "/img/zkCloudWorker-logo.png"
                  }
                  className="hidden --max-h-7 dark:block"
                  alt="MinaTokens.com"
                />
              </span>
              <span className="ms-4 text-white text-lg inline-block">
                {getSiteName()}
                {siteType === "nft" ? "" : ".com"}
              </span>
            </Link>

            <div className="flex space-x-5">
              <Socials />
            </div>
          </div>

          <div className="col-span-full sm:col-span-3 md:col-span-4 md:col-start-9">
            <p className="mb-4 dark:text-jacarta-300">
              {siteType === "nft"
                ? "Launch collections, buy and sell NFTs on Mina."
                : "Launch, buy and sell MINA custom tokens."}
              <br />
              Powered by &nbsp;
              <a
                className="text-accent font-bold"
                target="_blank"
                href="https://minaprotocol.com"
              >
                MINA Protocol
              </a>
              &nbsp; and &nbsp;
              <a
                className="text-accent font-bold"
                target="_blank"
                href={
                  siteType === "nft"
                    ? "https://minanft.io"
                    : "https://zkcloudworker.com"
                }
              >
                {siteType === "nft" ? "MinaNFT" : "zkCloudWorker"}
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between space-y-2 py-8 sm:flex-row sm:space-y-0">
          <span className="text-sm dark:text-jacarta-400">
            &copy; 2025 {getSiteName()} by{" "}
            <a
              href={
                siteType === "nft"
                  ? "https://minanft.io"
                  : "https://zkcloudworker.com"
              }
              className="hover:text-accent"
            >
              {siteType === "nft" ? "MinaNFT" : "zkCloudWorker"}
            </a>
          </span>
          <ul className="flex flex-wrap space-x-4 text-sm dark:text-jacarta-400">
            <li>
              <a href={otherChainUrl} className="hover:text-accent">
                {otherChain}
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-accent">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-accent">
                Privacy policy
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
