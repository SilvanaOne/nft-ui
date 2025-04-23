"use client";
import Image from "next/image";
import { FileUpload } from "./FileUpload";
import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { AddressContext } from "@/context/address";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import { checkAddress } from "@/lib/address";
import { shortenString } from "@/lib/short";
import {
  LaunchCollectionData,
  Trait,
  Permissions,
  CollectionPermissions,
  NftPermissions,
} from "@/lib/token";
import { checkAvailability, unavailableCountry } from "@/lib/availability";
import { TraitsModal } from "@/components/modals/TraitsModal";
import { log } from "@/lib/log";
import { generateImage } from "@/lib/ai";
import {
  randomName,
  randomText,
  randomBanner,
  randomImage,
} from "@/lib/random";
import { PermissionsModal } from "../modals/PermissionsModal";
import { CollectionInfo, CmsnftData } from "@silvana-one/api";
import { algoliaGetCollectionList } from "@/lib/search";
import { cmsStoreNFT } from "@/lib/cms";
import { pinImage } from "@/lib/ipfs";
import { readFileAsync } from "./lib/launch";
import { storeNft, readNft } from "@/lib/api";
import { sleep } from "@/lib/sleep";
const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

export interface CmsSignature {
  data: string;
  field: string;
  scalar: string;
  expiry: number;
  publicKey: string;
}

export function LaunchForm({
  onLaunch,
}: {
  onLaunch: (data: LaunchCollectionData) => void;
}) {
  const [image, setImage] = useState<File | undefined>(undefined);
  const [imageURL, setImageURL] = useState<string | undefined>(undefined);
  const [banner, setBanner] = useState<File | undefined>(undefined);
  const [bannerURL, setBannerURL] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  const [symbol, setSymbol] = useState<string>("NFT");
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [mintType, setMintType] = useState<"collection" | "nft">("collection");
  const [traits, setTraits] = useState<Trait[]>([]);
  const [traitsText, setTraitsText] = useState<string>("No traits");
  const [permissions, setPermissions] = useState<Permissions | undefined>(
    undefined
  );
  const [permissionsText, setPermissionsText] = useState<string>("Standard");
  const [adminAddress, setAdminAddress] = useState<string | undefined>(
    undefined
  );
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [addressValid, setAddressValid] = useState<boolean>(false);
  const [imageGenerating, setImageGenerating] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | undefined>(undefined);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [collectionAddress, setCollectionAddress] = useState<
    string | undefined
  >(undefined);
  const [nftData, setNftData] = useState<CmsnftData[]>([]);
  const { address, setAddress } = useContext(AddressContext);

  const selectCollection = (collection: string) => {
    if (DEBUG) console.log("selectCollection", collection);
    setCollectionAddress(collection);
  };

  const restoreSavedNFT = (nft: CmsnftData) => {
    console.log("restoreSavedNFT", nft);
    if (!nft) return;

    setName(nft.name);
    setDescription(nft.description);
    setImageURL(nft.imageURL);

    // Set traits if available
    if (nft.traits && nft.traits.length > 0) {
      setTraits(
        nft.traits.map((trait) => ({
          key: trait.key,
          value: trait.value as string,
        }))
      );
      setTraitsText(`${nft.traits.length} traits`);
    } else {
      setTraits([]);
      setTraitsText("No traits");
    }

    // Set permissions if available
    if (nft.nftData && permissions) {
      setPermissions({
        nft: new NftPermissions({
          ...nft.nftData,
        }),
        collection: permissions?.collection,
      });
      setPermissionsText("Custom");
    } else {
      setPermissions(undefined);
      setPermissionsText("Standard");
    }

    if (DEBUG) console.log("Restored NFT data:", nft.name);
  };

  useEffect(() => {
    async function getNftData() {
      if (!collectionAddress) {
        setNftData([]);
        return;
      }
      const nftData = await readNft({
        collectionAddress: collectionAddress,
      });
      if (nftData.success) {
        setNftData(nftData.nfts);
      } else {
        log.error("LaunchForm: failed to read NFT data", {
          adminAddress,
          error: nftData.error,
        });
        setNftData([]);
      }
    }
    getNftData();
  }, [collectionAddress]);

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
    async function getCollections() {
      if (!address) {
        setCollections([]);
        return;
      }
      const collections = (
        await algoliaGetCollectionList({
          creator: address,
        })
      ).sort((a, b) => b.updated - a.updated);
      setCollections(collections);
      if (collections.length > 0) {
        setCollectionAddress(collections[0].collectionAddress);
      }
    }
    getCollections();
  }, [address]);

  useEffect(() => {
    if (traits.length === 0) {
      setTraitsText("No traits");
      return;
    }
    setTraitsText(
      traits
        .map((trait) => `${trait.key}: ${trait.value}`)
        .join(", ")
        .slice(0, 30)
    );
  }, [traits]);

  useEffect(() => {
    if (
      permissions &&
      (!permissions.nft.isDefault() || !permissions.collection.isDefault())
    ) {
      setPermissionsText("Custom");
    } else {
      setPermissionsText("Standard");
    }
  }, [permissions]);

  useEffect(() => {
    setButtonDisabled(
      addressValid && (!name || (!symbol && mintType === "collection"))
    );
  }, [addressValid, name, symbol]);

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

  const generateRandomData = () => {
    setName(randomName());
    setSymbol("NFT");
    setDescription(randomText());
    setImageURL(randomImage());
    if (mintType === "collection") {
      setBannerURL(randomBanner());
    }
  };

  const launchToken = async (params: { storeInCMS: boolean }) => {
    const { storeInCMS } = params;
    if (!adminAddress) {
      await getAddress();
      return;
    }
    if (!name) {
      log.error("LaunchForm: no name", { adminAddress });
      return;
    }
    if (mintType === "nft" && !collectionAddress) {
      log.error("LaunchForm: no collection address", { adminAddress });
      return;
    }
    if ((await checkAvailability()) !== null) {
      log.info("LaunchForm: not available", { adminAddress });
      window.location.href = "/not-available";
      return;
    }

    log.info("LaunchForm: launching NFT", {
      adminAddress,
      symbol,
      name,
      storeInCMS,
      mintType,
      collectionAddress,
    });
    if (!symbol) {
      log.error("LaunchForm: no symbol", { adminAddress });
      return;
    }

    const launchData: LaunchCollectionData = {
      symbol,
      mintType,
      collectionAddress,
      name: name,
      description,
      image,
      imageURL,
      banner,
      bannerURL,
      adminAddress,
      traits,
      collectionPermissions: permissions?.collection,
      nftPermissions: permissions?.nft,
    };
    if (storeInCMS) {
      if (launchData.imageURL === undefined) {
        if (!image) {
          log.error("LaunchForm: no image for CMS", { adminAddress });
          return;
        }
        const base64 = await readFileAsync(image);
        launchData.imageURL = await pinImage({ imageBase64: base64 });
        if (launchData.imageURL === undefined) {
          log.error("LaunchForm: failed to pin image for CMS", {
            adminAddress,
          });
          return;
        }
        launchData.image = undefined;
      }
      const convertResult = await cmsStoreNFT({
        data: launchData,
      });
      if (convertResult.success) {
        const cmsNft = convertResult.nft;
        const expiry = Date.now() + 1000 * 60 * 60;
        const message: string = JSON.stringify({
          nft: cmsNft,
          expiry,
        });

        const signedSata = await (window as any)?.mina?.signMessage({
          message,
        });
        console.log("signedSata", signedSata);
        const signatureData: CmsSignature = {
          data: message,
          field: signedSata?.signature?.field,
          scalar: signedSata?.signature?.scalar,
          expiry,
          publicKey: signedSata?.publicKey,
        };
        console.log("signatureData", signatureData);
        const storeResult = await storeNft({
          nft: cmsNft,
          signature: JSON.stringify(signatureData),
        });
        console.log("storeResult", storeResult);
        if (storeResult.success) {
          console.log("NFT successfully saved for minting later");
          // Show success popup message to user
          toast.success("NFT successfully saved for minting later", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          if (collectionAddress) {
            await sleep(1000);
            const nftData = await readNft({
              collectionAddress: collectionAddress,
            });
            if (nftData.success) {
              setNftData(nftData.nfts);
            }
          }
        } else {
          log.error("LaunchForm: failed to store NFT in CMS", {
            adminAddress,
            error: storeResult.error,
          });
        }
      } else {
        log.error("LaunchForm: failed to store NFT in CMS", {
          adminAddress,
          error: convertResult.error,
        });
      }
    } else {
      onLaunch(launchData);
    }
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
          {mintType === "collection" ? "Launch NFT collection" : "Mint NFT"}
        </h1>

        <div className="mx-auto max-w-[48.125rem] md:flex mt-8">
          <div className="mb-12 md:w-1/2 md:pr-8">
            {/* Token type */}
            <div className="mb-6">
              <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                Mint type
              </label>
              <div className="flex rounded-lg border border-jacarta-100 bg-white dark:border-jacarta-600 dark:bg-jacarta-700">
                <button
                  className={`flex-1 rounded-l-lg py-3 px-4 text-center ${
                    mintType === "collection"
                      ? "bg-accent text-white"
                      : "hover:bg-jacarta-50 dark:text-jacarta-300 dark:hover:bg-jacarta-600"
                  }`}
                  onClick={() => setMintType("collection")}
                >
                  Collection
                </button>
                <button
                  className={`flex-1 rounded-r-lg py-3 px-4 text-center ${
                    mintType === "nft"
                      ? "bg-accent text-white"
                      : "hover:bg-jacarta-50 dark:text-jacarta-300 dark:hover:bg-jacarta-600"
                  }`}
                  onClick={() => setMintType("nft")}
                >
                  NFT
                </button>
              </div>
            </div>

            {mintType === "nft" && collections.length > 0 && (
              <div className="mb-6">
                <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                  Collection
                </label>
                <select
                  className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  onChange={(e) => selectCollection(e.target.value)}
                  value={collectionAddress}
                >
                  {collections.map((collection) => (
                    <option
                      key={collection.collectionAddress}
                      value={collection.collectionAddress}
                    >
                      {collection.collectionName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mintType === "nft" && collections.length === 0 && (
              <div className="mb-6">
                <p className="text-jacarta-500 dark:text-jacarta-300">
                  You don't have any collections yet. Please create a collection
                  first.
                </p>
              </div>
            )}

            {mintType === "nft" && nftData.length > 0 && (
              <div className="mb-6">
                <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                  Saved NFTs
                </label>
                <select
                  className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                  onChange={(e) => {
                    const selectedNft = nftData.find(
                      (nft) => nft.name === e.target.value
                    );
                    if (selectedNft) restoreSavedNFT(selectedNft);
                  }}
                >
                  {nftData.map((nft) => (
                    <option key={nft.name} value={nft.name}>
                      {nft.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {((mintType === "nft" && collectionAddress) ||
              mintType === "collection") && (
              <>
                {/* Token name */}
                <div className="mb-6">
                  <label
                    htmlFor="token-name"
                    className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white"
                  >
                    {mintType === "collection"
                      ? "NFT collection name"
                      : "NFT name"}
                    <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    id="token-name"
                    className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                    placeholder={
                      mintType === "collection"
                        ? "Enter NFT collection name"
                        : "Enter NFT name"
                    }
                    required
                    autoComplete="off"
                    value={name}
                    onChange={(e) => {
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
                    {mintType === "collection"
                      ? "NFT collection description"
                      : "NFT description"}
                  </label>
                  <textarea
                    id="token-description"
                    className="w-full rounded-lg border-jacarta-100 py-3 hover:ring-2 hover:ring-accent/10 focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder:text-jacarta-300"
                    placeholder={
                      mintType === "collection"
                        ? "Tell the world your story about the NFT collection"
                        : "Tell the world your story about the NFT"
                    }
                    rows={2}
                    value={description}
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
                {mintType === "collection" && (
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
                )}

                {/* Traits */}
                <div className="mb-6">
                  <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                    Traits
                  </label>
                  {/* <Tippy content={"Click to add"} hideOnClick={true}> */}
                  <button
                    className={`js-copy-clipboard flex w-full select-none items-center rounded-lg border bg-white py-3 px-4 hover:bg-jacarta-50 dark:bg-jacarta-700 dark:text-jacarta-300 ${
                      addressValid
                        ? "border-jacarta-100 dark:border-jacarta-600"
                        : "border-2 border-red"
                    }`}
                    id="traits"
                    data-bs-toggle="modal"
                    data-bs-target="#TraitsModal"
                  >
                    <span>{traitsText}</span>

                    <div className="ml-auto mb-px h-4 w-4 fill-jacarta-500 dark:fill-jacarta-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="15"
                        height="16"
                        className="fill-accent group-hover:fill-white rounded-md border border-accent "
                      >
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />{" "}
                      </svg>
                    </div>
                  </button>
                  {/* </Tippy> */}
                  <TraitsModal onSubmit={setTraits} />
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <label className="mb-1 block font-display text-sm text-jacarta-700 dark:text-white">
                    Permissions
                  </label>
                  {/* <Tippy content={"Click to add"} hideOnClick={true}> */}
                  <button
                    className={`js-copy-clipboard flex w-full select-none items-center rounded-lg border bg-white py-3 px-4 hover:bg-jacarta-50 dark:bg-jacarta-700 dark:text-jacarta-300 ${
                      addressValid
                        ? "border-jacarta-100 dark:border-jacarta-600"
                        : "border-2 border-red"
                    }`}
                    id="permissions"
                    data-bs-toggle="modal"
                    data-bs-target="#PermissionsModal"
                  >
                    <span>{permissionsText}</span>

                    <div className="ml-auto mb-px h-4 w-4 fill-jacarta-500 dark:fill-jacarta-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="15"
                        height="16"
                        className="fill-accent group-hover:fill-white rounded-md border border-accent "
                      >
                        <path fill="none" d="M0 0h24v24H0z" />
                        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />{" "}
                      </svg>
                    </div>
                  </button>
                  {/* </Tippy> */}
                  <PermissionsModal
                    onSubmit={setPermissions}
                    mintType={mintType}
                  />
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
                  onClick={() => launchToken({ storeInCMS: false })}
                  disabled={buttonDisabled}
                  className={`rounded-full py-3 px-8 text-center font-semibold transition-all ${
                    buttonDisabled
                      ? "bg-jacarta-300 text-white cursor-not-allowed"
                      : "bg-accent text-white shadow-accent-volume hover:bg-accent-dark"
                  }`}
                >
                  {addressValid
                    ? mintType === "collection"
                      ? "Launch NFT collection"
                      : "Mint NFT"
                    : "Connect Wallet"}
                </button>
                {addressValid && mintType === "nft" && (
                  <button
                    onClick={() => launchToken({ storeInCMS: true })}
                    disabled={buttonDisabled}
                    className={`rounded-full ml-10 py-3 px-8 text-center font-semibold transition-all ${
                      buttonDisabled
                        ? "bg-jacarta-300 text-white cursor-not-allowed"
                        : "bg-accent text-white shadow-accent-volume hover:bg-accent-dark"
                    }`}
                  >
                    Save draft
                  </button>
                )}
              </>
            )}
            {/* </Tippy> */}
          </div>
          {((mintType === "nft" && collectionAddress) ||
            mintType === "collection") && (
            <>
              <div className="mb-12 md:w-1/2 md:pr-8">
                <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
                  <FileUpload
                    setImage={setImage}
                    setImageURL={setImageURL}
                    url={imageURL}
                    label={
                      mintType === "collection"
                        ? "NFT collection image"
                        : "NFT image"
                    }
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
                      {imageGenerating
                        ? "Generating..."
                        : "Generate image with AI"}
                    </button>
                  </div>
                )}

                {mintType === "collection" && (
                  <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
                    <FileUpload
                      setImage={setBanner}
                      setImageURL={setBannerURL}
                      url={bannerURL}
                      label="NFT collection banner"
                      description="Upload a banner image (max 5MB). Recommended size is 1920x300 pixels."
                    />
                  </div>
                )}

                <div className="mb-6 flex space-x-5 md:pl-8 shrink-0">
                  <button
                    onClick={generateRandomData}
                    className="rounded-full bg-accent py-1 px-6 text-center text-white shadow-accent-volume transition-all hover:bg-accent-dark text-sm"
                  >
                    Generate random data
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
