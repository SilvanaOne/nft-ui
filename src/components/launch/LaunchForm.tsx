"use client";
import CopyToClipboardTip from "@/utils/AddClipboardTip";
import Image from "next/image";
import { FileUpload } from "./FileUpload";
// import tippy from "tippy.js";
// import Tippy from "@tippyjs/react";
import React, { useEffect, useState, useContext } from "react";
import { AddressContext } from "@/context/address";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import { checkAddress } from "@/lib/address";
import { shortenString } from "@/lib/short";
import { LaunchCollectionData, MintAddress, TokenLinks } from "@/lib/token";
import { MintAddressesModal } from "../modals/MintAddressesModal";
import { checkAvailability, unavailableCountry } from "@/lib/availability";
import { log } from "@/lib/log";
import { generateImage } from "@/lib/ai";
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export function LaunchForm({
  onLaunch,
}: {
  onLaunch: (data: LaunchCollectionData) => void;
}) {
  const [image, setImage] = useState<File | undefined>(undefined);
  const [imageURL, setImageURL] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [symbol, setSymbol] = useState<string>("NFT");
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [tokenType, setTokenType] = useState<"standard" | "meme">("standard");
  const [links, setLinks] = useState<TokenLinks>({
    twitter: "",
    discord: "",
    telegram: "",
    instagram: "",
    facebook: "",
    website: "",
  });
  const [adminAddress, setAdminAddress] = useState<string | undefined>(
    undefined
  );
  const [addressValid, setAddressValid] = useState(true);
  const [launchTip, setLaunchTip] = useState<string>(
    "Please connect your wallet"
  );
  const [mintAddresses, setMintAddresses] = useState<MintAddress[]>([]);
  const [mintAddressesText, setMintAddressesText] = useState<string>("");
  const [imageGenerating, setImageGenerating] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const { address, setAddress } = useContext(AddressContext);

  async function addressChanged(address: string | undefined) {
    if (address) {
      setAdminAddress(address);
      if (DEBUG)
        console.log("adminAddress updated from address change:", address);
    }
    setAddressValid(address ? await checkAddress(address) : false);
  }

  async function generateImageWithAI() {
    if (!symbol || !name || !address) {
      return;
    }
    setImageGenerating(true);
    const { blob, error } = await generateImage({
      symbol,
      name,
      description,
      address,
    });
    if (DEBUG) console.log("image", image);
    if (blob) {
      const file = new File([blob], symbol + ".png", { type: blob.type });
      if (file) {
        const url = URL.createObjectURL(file);
        setImage(file);
        setImageURL(url);
      } else setImageError(error ?? "AI error ERR_AI_1");
    } else {
      log.error("No image generated", { symbol, name, description, address });
      setImageError(error ?? "AI error ERR_AI_2");
    }
    setImageGenerating(false);
  }

  useEffect(() => {
    addressChanged(address);
  }, [address]);

  useEffect(() => {
    const text = mintAddresses
      .map((mintAddress) => `${mintAddress.address}`)
      .join(", ");
    const maxLength = 40;
    if (text.length > maxLength) {
      const addresses = mintAddresses.map((mintAddress) =>
        shortenString(mintAddress.address, 10)
      );
      let displayText = "";
      for (let i = 0; i < addresses.length; i++) {
        if ((displayText + addresses[i]).length > maxLength) {
          displayText += " ...";
          break;
        }
        displayText += (displayText ? ", " : "") + addresses[i];
      }
      setMintAddressesText(displayText);
    } else {
      setMintAddressesText(text);
    }
  }, [mintAddresses]);

  // useEffect(() => {
  //   tippy("[data-tippy-content]");
  //   tippy("[button-tippy-content]");
  //   new CopyToClipboardTip();
  // }, []);

  useEffect(() => {
    if (!addressValid) {
      setLaunchTip("Connect your wallet");
    } else if (!symbol) {
      setLaunchTip("Please enter a symbol");
    } else if (!name) {
      setLaunchTip("Please enter a name");
    } else {
      setLaunchTip("Launch your token!");
    }
  }, [address, addressValid, name, symbol]);

  async function getAddress(): Promise<string | undefined> {
    let userAddress = address;

    userAddress = (await getWalletInfo()).address;

    if (adminAddress !== userAddress) {
      setAdminAddress(userAddress);
      if (DEBUG) console.log("adminAddress", userAddress);
    }
    if (address !== userAddress) {
      setAddress(userAddress);
      if (DEBUG) console.log("address", userAddress);
    }
    setAddressValid(userAddress ? await checkAddress(userAddress) : false);
    return userAddress;
  }

  useEffect(() => {
    getAddress();
  }, []);

  const launchToken = async () => {
    if (!adminAddress) {
      await getAddress();
      return;
    }
    if ((await checkAvailability()) !== null) {
      log.info("LaunchForm: not available", { adminAddress });
      window.location.href = "/not-available";
      return;
    }
    log.info("LaunchForm: launching token", { adminAddress, symbol, name });
    if (!symbol) {
      log.error("LaunchForm: no symbol", { adminAddress });
      return;
    }
    onLaunch({
      symbol,
      name: name,
      description: description ?? "",
      links,
      image,
      imageURL,
      adminAddress,
      mintAddresses,
    });
  };

  return (
    <section className="relative py-24 dark:bg-jacarta-800">
      <picture className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
        <Image
          width={1920}
          height={789}
          src="/img/gradient_light.jpg"
          priority
          alt="gradient"
          className="h-full w-full"
        />
      </picture>
      <div className="container">
        <h1 className="pt-16 text-center font-display text-4xl font-medium text-jacarta-700 dark:text-white">
          Launch your NFT collection
        </h1>

        <div className="mx-auto max-w-[48.125rem] md:flex mt-8">
          <div className="mb-12 md:w-1/2 md:pr-8">
            {/* Token name */}
            <div className="mb-6">
              <label
                htmlFor="token-name"
                className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white"
              >
                NFT collection name<span className="text-red">*</span>
              </label>
              <input
                type="text"
                id="token-name"
                className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                placeholder="Enter NFT collection name"
                required
                autoComplete="off"
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  setName(input.value);
                }}
              />
            </div>

            {/* Token description */}
            <div className="mb-6">
              <label
                htmlFor="token-description"
                className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white"
              >
                NFT collection description
              </label>
              <textarea
                id="token-description"
                className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                placeholder="Tell the world your story about the NFT collection"
                rows={2}
                autoComplete="off"
                onInput={(e) => {
                  const input = e.target as HTMLTextAreaElement;
                  setDescription(input.value);
                  // Adjust the number of rows based on the content
                  const lineCount = input.value.split("\n").length;
                  input.rows = Math.min(5, Math.max(2, lineCount));
                }}
              ></textarea>
            </div>

            {/* Token symbol */}
            <div className="mb-6">
              <label
                htmlFor="token-symbol"
                className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white"
              >
                NFT collection symbol<span className="text-red">*</span>
              </label>
              <input
                type="text"
                id="token-symbol"
                className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                placeholder="Enter NFT collection symbol (max 6 chars)"
                required
                autoComplete="off"
                maxLength={6}
                value={symbol}
                onInput={(e) => {
                  const input = e.target as HTMLInputElement;
                  setSymbol(input.value);
                }}
              />
            </div>

            {/* Token type */}
            {/* <div className="mb-6">
              <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                Token type
              </label>
              <div className="flex rounded-lg border border-jacarta-100 bg-white dark:border-jacarta-600 dark:bg-jacarta-700">
                <button
                  className={`flex-1 rounded-l-lg py-3 px-4 text-center ${
                    tokenType === "standard"
                      ? "bg-accent text-white"
                      : "hover:bg-jacarta-50 dark:text-jacarta-300 dark:hover:bg-jacarta-600"
                  }`}
                  onClick={() => setTokenType("standard")}
                >
                  Standard
                </button>
                <button
                  className={`flex-1 rounded-r-lg py-3 px-4 text-center ${
                    tokenType === "meme"
                      ? "bg-accent text-white"
                      : "hover:bg-jacarta-50 dark:text-jacarta-300 dark:hover:bg-jacarta-600"
                  }`}
                  onClick={() => setTokenType("meme")}
                >
                  Meme
                </button>
              </div>
            </div> */}

            {/* Links: website, telegram, twitter, discord, instagram */}

            <div className="mb-6">
              <label
                htmlFor="profile-twitter"
                className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white"
              >
                Links
              </label>
              {/* Twitter */}
              <div className="relative">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="twitter"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                </svg>
                <input
                  type="text"
                  id="profile-twitter"
                  className="w-full rounded-t-lg border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="twitter"
                  autoComplete="off"
                  value={links.twitter}
                  onChange={(e) => {
                    const twitterHandle = e.target.value;
                    const twitterRegex = /^@?(\w){1,15}$/;

                    if (
                      twitterHandle === "" ||
                      twitterRegex.test(twitterHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        twitter: twitterHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.twitter ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>
              {/* Discord */}
              <div className="relative">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="discord"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 30 30"
                >
                  <path d="M25.12,6.946c-2.424-1.948-6.257-2.278-6.419-2.292c-0.256-0.022-0.499,0.123-0.604,0.357 c-0.004,0.008-0.218,0.629-0.425,1.228c2.817,0.493,4.731,1.587,4.833,1.647c0.478,0.278,0.638,0.891,0.359,1.368 C22.679,9.572,22.344,9.75,22,9.75c-0.171,0-0.343-0.043-0.501-0.135C21.471,9.598,18.663,8,15.002,8 C11.34,8,8.531,9.599,8.503,9.615C8.026,9.892,7.414,9.729,7.137,9.251C6.86,8.775,7.021,8.164,7.497,7.886 c0.102-0.06,2.023-1.158,4.848-1.65c-0.218-0.606-0.438-1.217-0.442-1.225c-0.105-0.235-0.348-0.383-0.604-0.357 c-0.162,0.013-3.995,0.343-6.451,2.318C3.564,8.158,1,15.092,1,21.087c0,0.106,0.027,0.209,0.08,0.301 c1.771,3.11,6.599,3.924,7.699,3.959c0.007,0.001,0.013,0.001,0.019,0.001c0.194,0,0.377-0.093,0.492-0.25l1.19-1.612 c-2.61-0.629-3.99-1.618-4.073-1.679c-0.444-0.327-0.54-0.953-0.213-1.398c0.326-0.443,0.95-0.541,1.394-0.216 C7.625,20.217,10.172,22,15,22c4.847,0,7.387-1.79,7.412-1.808c0.444-0.322,1.07-0.225,1.395,0.221 c0.324,0.444,0.23,1.066-0.212,1.392c-0.083,0.061-1.456,1.048-4.06,1.677l1.175,1.615c0.115,0.158,0.298,0.25,0.492,0.25 c0.007,0,0.013,0,0.019-0.001c1.101-0.035,5.929-0.849,7.699-3.959c0.053-0.092,0.08-0.195,0.08-0.301 C29,15.092,26.436,8.158,25.12,6.946z M11,19c-1.105,0-2-1.119-2-2.5S9.895,14,11,14s2,1.119,2,2.5S12.105,19,11,19z M19,19 c-1.105,0-2-1.119-2-2.5s0.895-2.5,2-2.5s2,1.119,2,2.5S20.105,19,19,19z" />
                </svg>

                <input
                  type="text"
                  id="profile-discord"
                  className="-mt-px w-full border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="discord"
                  autoComplete="off"
                  value={links.discord}
                  onChange={(e) => {
                    const discordHandle = e.target.value;
                    const discordRegex = /^[^@#:\n]{2,32}$/;

                    if (
                      discordHandle.length < 2 ||
                      discordRegex.test(discordHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        discord: discordHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.discord ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>
              {/* Telegram */}
              <div className="relative">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="telegram"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 50 50"
                >
                  <path d="M25,2c12.703,0,23,10.297,23,23S37.703,48,25,48S2,37.703,2,25S12.297,2,25,2z M32.934,34.375	c0.423-1.298,2.405-14.234,2.65-16.783c0.074-0.772-0.17-1.285-0.648-1.514c-0.578-0.278-1.434-0.139-2.427,0.219	c-1.362,0.491-18.774,7.884-19.78,8.312c-0.954,0.405-1.856,0.847-1.856,1.487c0,0.45,0.267,0.703,1.003,0.966	c0.766,0.273,2.695,0.858,3.834,1.172c1.097,0.303,2.346,0.04,3.046-0.395c0.742-0.461,9.305-6.191,9.92-6.693	c0.614-0.502,1.104,0.141,0.602,0.644c-0.502,0.502-6.38,6.207-7.155,6.997c-0.941,0.959-0.273,1.953,0.358,2.351	c0.721,0.454,5.906,3.932,6.687,4.49c0.781,0.558,1.573,0.811,2.298,0.811C32.191,36.439,32.573,35.484,32.934,34.375z" />
                </svg>

                <input
                  type="text"
                  id="profile-telegram"
                  className="-mt-px w-full border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="telegram"
                  autoComplete="off"
                  value={links.telegram}
                  onChange={(e) => {
                    const telegramHandle = e.target.value;
                    const telegramRegex = /^@?(\w){5,32}$/;

                    if (
                      telegramHandle.length < 5 ||
                      telegramRegex.test(telegramHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        telegram: telegramHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.telegram ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>
              {/* Instagram */}
              <div className="relative">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="instagram"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                </svg>
                <input
                  type="text"
                  id="profile-instagram"
                  className="-mt-px w-full border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="instagram"
                  autoComplete="off"
                  value={links.instagram}
                  onChange={(e) => {
                    const instagramHandle = e.target.value;
                    const instagramRegex = /^@?(\w){1,30}$/;

                    if (
                      instagramHandle === "" ||
                      instagramRegex.test(instagramHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        instagram: instagramHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.instagram ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>

              {/* Facebook */}
              <div className="relative">
                <svg
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="facebook"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S252.43 0 225.36 0c-73.22 0-121.17 44.38-121.17 124.72v70.62H22.89V288h81.3v224h100.2V288z"></path>
                </svg>
                <input
                  type="text"
                  id="profile-instagram"
                  className="-mt-px w-full border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="facebook"
                  autoComplete="off"
                  value={links.facebook}
                  onChange={(e) => {
                    const facebookHandle = e.target.value;
                    const facebookRegex =
                      /^([a-zA-Z]+(?:['.-][a-zA-Z]+)*)(?:\s+([a-zA-Z]+(?:['.-][a-zA-Z]+)*))*$/;

                    if (
                      facebookHandle === "" ||
                      facebookRegex.test(facebookHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        facebook: facebookHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.facebook ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>

              {/* Website */}
              <div className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-jacarta-300 dark:fill-jacarta-400"
                >
                  <path fill="none" d="M0 0h24v24H0z" />
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z" />
                </svg>
                <input
                  type="url"
                  id="profile-website"
                  className="-mt-px w-full rounded-b-lg border-jacarta-100 py-3 pl-10 hover:ring-2 hover:ring-accent/10 focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  placeholder="web site"
                  autoComplete="off"
                  value={links.website}
                  onChange={(e) => {
                    const websiteHandle = e.target.value;
                    const websiteRegex = /^(https?:\/\/)?([^\s\/$.?#].[^\s]*)$/;

                    if (
                      websiteHandle.length < 2 ||
                      websiteRegex.test(websiteHandle)
                    ) {
                      setLinks((items) => ({
                        ...items,
                        website: websiteHandle,
                      }));
                      e.target.style.border = "";
                    } else {
                      e.target.value = links.website ?? "";
                      e.target.style.border = "2px solid red";
                      setTimeout(() => {
                        e.target.style.borderColor = "";
                      }, 1000);
                    }
                  }}
                />
              </div>
            </div>

            {/* Wallet address */}
            <div className="mb-6">
              <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                Your Wallet Address<span className="text-red">*</span>
              </label>
              <button
                className={`js-copy-clipboard flex w-full select-none items-center rounded-lg border bg-white py-3 px-4 hover:bg-jacarta-50 dark:bg-jacarta-700 dark:text-jacarta-300 ${
                  addressValid
                    ? "border-jacarta-100 dark:border-jacarta-600"
                    : "border-2 border-red"
                }`}
                id="admin-address"
                // data-tippy-content="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(adminAddress ?? "");
                }}
              >
                <span>{shortenString(adminAddress, 14) ?? ""}</span>

                <div className="ml-auto mb-px h-4 w-4 fill-jacarta-500 dark:fill-jacarta-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="15"
                    height="16"
                  >
                    <path fill="none" d="M0 0h24v24H0z"></path>
                    <path d="M7 7V3a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4v3.993c0 .556-.449 1.007-1.007 1.007H3.007A1.006 1.006 0 0 1 2 20.993l.003-12.986C2.003 7.451 2.452 7 3.01 7H7zm2 0h6.993C16.549 7 17 7.449 17 8.007V15h3V4H9v3zM4.003 9L4 20h11V9H4.003z"></path>
                  </svg>
                </div>
              </button>
            </div>

            {/* <Tippy content={launchTip}> */}
            <button
              onClick={launchToken}
              button-tippy-content="Name your token and launch it"
              className="rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
            >
              {addressValid ? "Launch NFT collection" : "Connect Wallet"}
            </button>
            {/* </Tippy> */}
          </div>
          <div className="mb-12 md:w-1/2 md:pr-8">
            <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
              <FileUpload
                setImage={setImage}
                setImageURL={setImageURL}
                url={imageURL}
              />
            </div>
            {imageError && (
              <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
                <p className="text-red">{imageError}</p>
              </div>
            )}
            {symbol && name && address && !imageError && (
              <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
                <button
                  onClick={generateImageWithAI}
                  disabled={imageGenerating || imageError !== undefined}
                  className="rounded-full bg-accent py-1 px-6 text-center text-white shadow-accent-volume transition-all hover:bg-accent-dark text-sm"
                >
                  {imageGenerating ? "Generating..." : "Generate with AI"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
