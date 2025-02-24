"use client";

import confetti from "canvas-confetti";
import { LaunchCollectionData, MintAddressVerified } from "@/lib/token";
import {
  explorerAccountUrl,
  explorerTokenUrl,
  getChain,
  getChainId,
} from "@/lib/chain";
import { getWalletInfo, connectWallet } from "@/lib/wallet";
import { getSystemInfo } from "@/lib/system-info";
import { debug } from "@/lib/debug";
import { sleep } from "@/lib/sleep";
import { mintNFT } from "./mint";
import {
  TimeLineItem,
  TimelineGroup,
  TimelineGroupStatus,
  IsErrorFunction,
  GetMintStatisticsFunction,
} from "../TimeLine";
import {
  messages,
  LineId,
  GroupId,
  UpdateTimelineItemFunction,
} from "./messages";
import { waitForContractVerification, waitForProveJob } from "./mina-tx";
import { log } from "@/lib/log";
import { LaunchNftCollectionStandardAdminParams } from "@silvana-one/api";
import { pinImage, publicIpfsURL } from "@/lib/ipfs";
const chain = getChain();
const chainId = getChainId();
const DEBUG = debug();

interface UpdateRequest {
  groupId: string;
  update: TimeLineItem;
}
let updateRequests: UpdateRequest[] = [];
let processRequests = false;

async function startProcessUpdateRequests(
  updateTimeLineItemInternal: UpdateTimelineItemFunction
) {
  updateRequests = [];
  processRequests = true;
  while (processRequests) {
    if (updateRequests.length > 0) {
      const request = updateRequests.shift();
      if (request) {
        updateTimeLineItemInternal(request);
      }
    }
    await sleep(1000);
  }
}

async function readFileAsync(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        // Remove data:image/* prefix from base64 string
        const base64 = reader.result.toString().split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("File reading failed"));
      }
    };

    reader.onerror = () => reject(new Error("File reading error"));

    reader.readAsDataURL(file);
  });
}

async function stopProcessUpdateRequests() {
  while (updateRequests.length > 0) {
    await sleep(1000);
  }
  processRequests = false;
}

export async function launchNFT(params: {
  data: LaunchCollectionData;
  addLog: (item: TimelineGroup) => void;
  updateTimelineItem: UpdateTimelineItemFunction;
  isError: IsErrorFunction;
  getMintStatistics: GetMintStatisticsFunction;
  setTotalSupply: (totalSupply: number) => void;
  setTokenAddress: (tokenAddress: string) => void;
  setLikes: (likes: number) => void;
  setIsLaunched: (isLaunched: boolean) => void;
}) {
  const {
    data,
    addLog,
    updateTimelineItem: updateTimeLineItemInternal,
    setTotalSupply,
    setTokenAddress,
    setLikes,
    isError,
    getMintStatistics,
    setIsLaunched,
  } = params;
  const { image, imageURL, banner, bannerURL, mintType } = data;
  let likes = 0;
  log.info("launchNFT: starting", { data });
  if (DEBUG) console.log("launchNFT: starting", { data });

  startProcessUpdateRequests(updateTimeLineItemInternal);

  function updateTimelineItem(params: {
    groupId: string;
    update: TimeLineItem;
  }): void {
    const { groupId, update } = params;
    if (["privateKeysSaved", "txSigned"].includes(update.lineId))
      updateTimeLineItemInternal({ groupId, update });
    else updateRequests.push({ groupId, update });
  }

  let isMintedShown = false;
  let isWaitingShown = false;
  let isErrorShown = false;

  // function showMintStatistics(tokensToMint: number): boolean {
  //   const statistics = getMintStatistics();
  //   if (DEBUG) console.log("Mint statistics:", statistics);
  //   if (statistics.success > 0 || isMintedShown) {
  //     updateTimelineItem({
  //       groupId: "mint",
  //       update: {
  //         lineId: "minted",
  //         content: `Minted tokens to ${statistics.success} addresses`,
  //         status: statistics.success === tokensToMint ? "success" : "waiting",
  //       },
  //     });
  //     isMintedShown = true;
  //   }
  //   if (statistics.error > 0 || isErrorShown) {
  //     log.error("showMintStatistics: mint failed", {
  //       statistics,
  //       isErrorShown,
  //     });
  //     updateTimelineItem({
  //       groupId: "mint",
  //       update: {
  //         lineId: "notMinted",
  //         content: `Mint failed for ${statistics.error} addresses`,
  //         status: "error",
  //       },
  //     });
  //     updateTimelineItem({
  //       groupId: "mint",
  //       update: {
  //         lineId: "error",
  //         content: `Please make sure that you put right nonce in Auro wallet`,
  //         status: "error",
  //       },
  //     });
  //     isErrorShown = true;
  //   }
  //   if (statistics.waiting > 0 || isWaitingShown) {
  //     updateTimelineItem({
  //       groupId: "mint",
  //       update: {
  //         lineId: "waitToMint",
  //         content:
  //           statistics.waiting === 0
  //             ? `Processed all mint transactions`
  //             : `Processing mint transactions for ${statistics.waiting} addresses`,
  //         status: statistics.waiting === 0 ? "success" : "waiting",
  //       },
  //     });
  //     isWaitingShown = true;
  //   }
  //   return statistics.success === tokensToMint;
  // }

  try {
    if (DEBUG) console.log("launchToken: minting NFT collection", { data });
    addLog({
      groupId: "deploy",
      status: "waiting",
      title:
        mintType === "collection" ? `Launching NFT collection` : `Minting NFT`,
      successTitle:
        mintType === "collection" ? `NFT collection launched` : `NFT minted`,
      errorTitle:
        mintType === "collection"
          ? `Failed to launch NFT collection`
          : `Failed to mint NFT`,
      lines: [messages.txPrepared],
      requiredForSuccess: ["minted"],
      keepOnTop: true,
    });

    if (mintType === "nft" && !data.collectionAddress) {
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "noCollectionAddress",
          content: "Please select a collection first",
          status: "error",
        },
      });
      log.error("launchToken: no collection address provided", { data });
      await stopProcessUpdateRequests();
      return;
    }

    if (DEBUG) console.log("launchToken: launching token:", data);
    let walletInfo = await getWalletInfo();
    if (DEBUG) console.log("launchToken: Wallet Info:", walletInfo);
    if (!walletInfo.address || walletInfo.network !== chainId) {
      await connectWallet();
      walletInfo = await getWalletInfo();
      if (!walletInfo.address || walletInfo.network !== chainId) {
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "noAuroWallet",
            content: `Please connect to ${chain} network first`,
            status: "error",
          },
        });
        log.error("launchToken: no Auro wallet", { walletInfo });
        await stopProcessUpdateRequests();
        return;
      }
    }
    const systemInfo = getSystemInfo();
    if (DEBUG) console.log("launchToken: System Info:", systemInfo);
    if (isError()) return;
    setLikes((likes += 10));
    const mina = (window as any).mina;
    if (
      mina === undefined ||
      mina?.isAuro !== true ||
      walletInfo.address === undefined
    ) {
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "noAuroWallet",
          content: messages.noAuroWallet.content,
          status: "error",
        },
      });
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "verifyData",
          content: "Data verification failed",
          status: "error",
        },
      });
      log.error("launchToken: no Auro wallet", { walletInfo });
      await stopProcessUpdateRequests();
      return;
    }
    if (isError()) return;

    // const mintItems: MintAddressVerified[] = [];
    // if (DEBUG) console.log("Mint addresses:", mintAddresses);
    // for (const item of mintAddresses) {
    //   if (item.amount === "" || item.address === "") {
    //     if (DEBUG) console.log("Empty mint item skipped:", item);
    //   } else {
    //     const verified = await checkMintData(item);
    //     if (verified !== undefined) {
    //       if (DEBUG) console.log("Mint item verified:", verified, item);
    //       mintItems.push(verified);
    //     } else {
    //       if (DEBUG) console.log("Mint item skipped:", item);
    //       updateTimelineItem({
    //         groupId: "deploy",
    //         update: {
    //           lineId: "mintDataError",
    //           content: `Cannot mint ${item.amount} ${symbol} tokens to ${item.address} because of wrong amount or address`,
    //           status: "error",
    //         },
    //       });
    //       updateTimelineItem({
    //         groupId: "deploy",
    //         update: {
    //           lineId: "verifyData",
    //           content: "Data verification failed",
    //           status: "error",
    //         },
    //       });
    //       log.error("launchToken: mint data error", { item });
    //       return;
    //     }
    //   }
    // }
    // if (DEBUG) console.log("Mint items filtered:", mintItems);
    // if (isError()) return;

    // updateTimelineItem({
    //   groupId: "deploy",
    //   update: {
    //     lineId: "verifyData",
    //     content: "NFT data is verified",
    //     status: "success",
    //   },
    // });

    let imageHash: string | undefined = undefined;
    let imageExtension: string | undefined = undefined;
    let bannerHash: string | undefined = undefined;
    let bannerExtension: string | undefined = undefined;

    if (banner) {
      updateTimelineItem({
        groupId: "deploy",
        update: messages.banner,
      });

      const base64 = await readFileAsync(banner);
      bannerHash = await pinImage({ imageBase64: base64 });
      bannerExtension = banner?.name?.split(".")?.pop();
      if (bannerHash) {
        const bannerTxMessage = (
          <>
            <a
              href={await publicIpfsURL({ hash: bannerHash })}
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Banner
            </a>{" "}
            is pinned to IPFS
          </>
        );
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "banner",
            content: bannerTxMessage,
            status: "success",
          },
        });
      } else {
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "banner",
            content: "Failed to pin NFT banner",
            status: "error",
          },
        });
        log.error("launch: failed to pin banner", { bannerHash });
        await stopProcessUpdateRequests();
        return;
      }
    } else if (bannerURL) {
      const bannerTxMessage = (
        <>
          <a
            href={bannerURL}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Banner
          </a>{" "}
          is ready.
        </>
      );
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "banner",
          content: bannerTxMessage,
          status: "success",
        },
      });
    }
    if (image) {
      updateTimelineItem({
        groupId: "deploy",
        update: messages.image,
      });

      const base64 = await readFileAsync(image);
      imageHash = await pinImage({ imageBase64: base64 });
      imageExtension = image?.name?.split(".")?.pop();
      if (imageHash) {
        const imageTxMessage = (
          <>
            <a
              href={await publicIpfsURL({ hash: imageHash })}
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Image
            </a>{" "}
            is pinned to IPFS
          </>
        );
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "image",
            content: imageTxMessage,
            status: "success",
          },
        });
      } else {
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "image",
            content: "Failed to pin NFT image",
            status: "error",
          },
        });
        log.error("launch: failed to pin image", { imageHash });
        await stopProcessUpdateRequests();
        return;
      }
    } else if (imageURL) {
      const imageTxMessage = (
        <>
          <a
            href={imageURL}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Image
          </a>{" "}
          is ready.
        </>
      );
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "image",
          content: imageTxMessage,
          status: "success",
        },
      });
    }
    const bannerImage = bannerHash
      ? await publicIpfsURL({ hash: bannerHash })
      : bannerURL;
    if (!bannerImage && mintType === "collection") {
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "banner",
          content: "No banner provided",
          status: "error",
        },
      });
      log.error("launch: no banner provided");
      await stopProcessUpdateRequests();
      return;
    }
    setLikes((likes += 10));
    const nftImage = imageHash
      ? await publicIpfsURL({ hash: imageHash })
      : imageURL;
    if (!nftImage) {
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "image",
          content: "No image provided",
          status: "error",
        },
      });
      log.error("launch: no image provided");
      await stopProcessUpdateRequests();
      return;
    }
    if (isError()) return;
    setLikes((likes += 10));

    const mintResult = await mintNFT({
      data,
      image: nftImage,
      banner: bannerImage,
      sender: walletInfo.address,
      updateTimelineItem,
      groupId: "deploy",
    });

    if (DEBUG)
      console.log("launchToken: minting NFT collection result", {
        mintResult,
      });

    if (mintResult.success === false) {
      updateTimelineItem({
        groupId: "deploy",
        update: {
          lineId: "deployTransactionError",
          content: mintResult.error ?? messages.deployTransactionError.content,
          status: "error",
        },
      });
      log.error("launchToken: failed to deploy token 1", { mintResult });
      await stopProcessUpdateRequests();
      return;
    }
    const {
      jobId,
      collectionAddress,
      privateMetadata,
      metadataFileName,
      privateKeys,
      keysFileName,
      storage,
      metadataRoot,
      nftAddress,
    } = mintResult;

    if (isError()) {
      addLog({
        groupId: "error",
        status: "error",
        title: "Error minting NFT",
        lines: [
          {
            lineId: "error",
            content: "Error minting NFT",
            status: "error",
          },
        ],
      });
      await stopProcessUpdateRequests();
      return;
    }
    setLikes((likes += 20));

    const tokenAddress =
      mintType === "collection" ? collectionAddress : nftAddress;
    const tokenAddressMsg = (
      <>
        {mintType === "collection" ? "NFT collection" : "NFT"} address:{" "}
        <a
          href={`${explorerAccountUrl()}${tokenAddress}`}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {tokenAddress}
        </a>
      </>
    );
    updateTimelineItem({
      groupId: "deploy",
      update: {
        lineId: "tokenAddress",
        content: tokenAddressMsg,
        status: "success",
      },
    });

    if (!collectionAddress) throw new Error("NFT collection is not deployed");
    console.log("NFT collection address:", collectionAddress);
    console.log("Storage address:", storage);
    console.log("Metadata root:", metadataRoot);

    updateTimelineItem({
      groupId: "deploy",
      update: messages.privateKeysSaved,
    });
    // TODO: save with password encryption
    const blob = new Blob([privateKeys], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = keysFileName;
    a.click();
    const saveDeployParamsSuccessMsg = (
      <>
        Private keys have been saved to a{" "}
        <a
          href={url}
          download={keysFileName}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          JSON file
        </a>
      </>
    );
    updateTimelineItem({
      groupId: "deploy",
      update: {
        lineId: "privateKeysSaved",
        content: saveDeployParamsSuccessMsg,
        status: "success",
      },
    });

    const blobMetadata = new Blob([privateMetadata], {
      type: "application/json",
    });
    const urlMetadata = URL.createObjectURL(blobMetadata);
    const aMetadata = document.createElement("a");
    aMetadata.href = urlMetadata;
    aMetadata.download = metadataFileName;
    aMetadata.click();
    const saveMetadataSuccessMsg = (
      <>
        Metadata has been saved to a{" "}
        <a
          href={urlMetadata}
          download={metadataFileName}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          JSON file
        </a>
      </>
    );
    updateTimelineItem({
      groupId: "deploy",
      update: {
        lineId: "metadataSaved",
        content: saveMetadataSuccessMsg,
        status: "success",
      },
    });

    if (isError()) return;

    setLikes((likes += 10));

    const txIncluded = await waitForProveJob({
      jobId,
      groupId: "deploy",
      updateTimelineItem,
      type: "launch",
    });

    if (!txIncluded) {
      addLog({
        groupId: "error",
        status: "error",
        title: "Error launching token",
        lines: [
          {
            lineId: "error",
            content: "Transaction not included",
            status: "error",
          },
        ],
      });
      log.error("launchToken: transaction not included", { txIncluded });
      await stopProcessUpdateRequests();
      return;
    }
    setLikes((likes += 20));
    const contractVerified = await waitForContractVerification({
      groupId: "deploy",
      updateTimelineItem,
      collectionAddress,
      nftAddress,
    });
    if (!contractVerified) {
      addLog({
        groupId: "error",
        status: "error",
        title: "Error launching NFT",
        lines: [
          {
            lineId: "error",
            content: "Contract verification failed",
            status: "error",
          },
        ],
      });
      log.error("launchToken: contract verification failed", {
        contractVerified,
      });
      await stopProcessUpdateRequests();
      return;
    }

    if (isError()) {
      addLog({
        groupId: "error",
        status: "error",
        title: "Error launching token",
        lines: [
          {
            lineId: "error",
            content: "Error launching token",
            status: "error",
          },
        ],
      });
      log.error("launchToken: error launching token", { isErrorShown });
      await stopProcessUpdateRequests();
      return;
    }
    setLikes((likes += 20));

    //     if (DEBUG) {
    //       console.log("Minting tokens", mintItems);
    //     }
    //     setLikes((likes += 10));
    //     log.info("launchToken: minting tokens", { mintItems });
    //     let price = 10000;

    //     if (mintItems.length > 0) {
    //       const tokensToMint = mintItems.length;

    //       const mintingTokensMsg = (
    //         <>
    //           Minting{" "}
    //           <a
    //             href={`${explorerTokenUrl()}/${tokenId}`}
    //             className="text-accent hover:underline"
    //             target="_blank"
    //             rel="noopener noreferrer"
    //           >
    //             {symbol}
    //           </a>{" "}
    //           tokens to {mintItems.length} addresses...
    //         </>
    //       );
    //       addLog({
    //         groupId: "mint",
    //         status: "waiting",
    //         title: `Minting ${data.symbol} tokens`,
    //         successTitle: `${data.symbol} tokens minted`,
    //         errorTitle: `Failed to mint ${data.symbol} tokens`,
    //         lines: [
    //           {
    //             lineId: "mintingTokens",
    //             content: mintingTokensMsg,
    //             status: "waiting",
    //           },
    //         ],
    //         requiredForSuccess: ["mintingTokens", "minted"],
    //         keepOnTop: true,
    //       });

    //       let nonce = await getAccountNonce(adminPublicKey);
    //       let mintPromises: Promise<boolean>[] = [];
    //       let supply = 0;

    //       for (let i = 0; i < mintItems.length; i++) {
    //         const item = mintItems[i];
    //         const groupId = `minting-${symbol}-${i}`;
    //         const amountMsg = (
    //           <>
    //             Amount: {item.amount}{" "}
    //             <a
    //               href={`${explorerTokenUrl()}${tokenId}`}
    //               className="text-accent hover:underline"
    //               target="_blank"
    //               rel="noopener noreferrer"
    //             >
    //               {symbol}
    //             </a>{" "}
    //             tokens
    //           </>
    //         );
    //         const tokenAddressMsg = (
    //           <>
    //             Address:{" "}
    //             <a
    //               href={`${explorerAccountUrl()}${item.address}`}
    //               className="text-accent hover:underline"
    //               target="_blank"
    //               rel="noopener noreferrer"
    //             >
    //               {item.address}
    //             </a>
    //           </>
    //         );
    //         addLog({
    //           groupId,
    //           status: "waiting",
    //           title: `Minting ${item.amount} ${data.symbol} tokens`,
    //           successTitle: `${item.amount} ${data.symbol} tokens minted`,
    //           errorTitle: `Failed to mint ${item.amount} ${data.symbol} tokens`,
    //           lines: [
    //             messages.txMint,
    //             {
    //               lineId: "amount",
    //               content: amountMsg,
    //               status: "success",
    //             },
    //             {
    //               lineId: "address",
    //               content: tokenAddressMsg,
    //               status: "success",
    //             },
    //           ],
    //           requiredForSuccess: ["txIncluded"],
    //         });

    //         /*
    // export async function apiTokenTransaction(params: {
    //   symbol: string;
    //   updateTimelineItem: UpdateTimelineItemFunction;
    //   sender: string;
    //   nonce: number;
    //   groupId: string;
    //   action: TokenAction;
    //   data: TransactionParams;

    //         */

    //         const mintParams: TokenMintTransactionParams = {
    //           txType: "token:mint",
    //           to: item.address,
    //           amount: item.amount * 1_000_000_000,
    //           tokenAddress: tokenPublicKey,
    //           sender: adminPublicKey,
    //           price,
    //         };
    //         price += Math.ceil((10000 * item.amount) / 100000);

    //         const mintResult = await apiTokenTransaction({
    //           symbol,
    //           updateTimelineItem,
    //           sender: adminPublicKey,
    //           groupId,
    //           action: "token:mint",
    //           data: mintParams,
    //           nonce: nonce++,
    //           // tokenAddress: tokenPublicKey,
    //           // adminContractAddress: adminContractPublicKey,
    //           // adminAddress: adminPublicKey,
    //           // to: item.address,
    //           // amount: item.amount,
    //           // nonce: nonce++,
    //           // groupId,
    //           // updateTimelineItem,
    //           // symbol,
    //           // lib,
    //           // action: "mint",
    //         });
    //         if (mintResult.success === false || mintResult.jobId === undefined) {
    //           break;
    //         }
    //         const mintJobId = mintResult.jobId;
    //         supply += item.amount;
    //         setTotalSupply(supply);
    //         await sleep(1000);
    //         showMintStatistics(tokensToMint);
    //         await sleep(1000);
    //         const waitForMintJobPromise = waitForProveJob({
    //           jobId: mintJobId,
    //           groupId,
    //           updateTimelineItem,
    //           type: "mint",
    //           tokenAddress: tokenPublicKey,
    //           accounts: [],
    //         });
    //         mintPromises.push(waitForMintJobPromise);
    //         if (isError()) {
    //           break;
    //         }
    //       }
    //       while (!showMintStatistics(tokensToMint) && !isError()) {
    //         await sleep(10000);
    //       }
    //       setLikes((likes += 10));

    //       await Promise.all(mintPromises);
    //       const statistics = getMintStatistics();
    //       log.info("launchToken: finished", { data, statistics });
    //       const mintedTokensMsg = (
    //         <>
    //           Successfully minted{" "}
    //           <a
    //             href={`${explorerTokenUrl()}${tokenId}`}
    //             className="text-accent hover:underline"
    //             target="_blank"
    //             rel="noopener noreferrer"
    //           >
    //             {symbol}
    //           </a>{" "}
    //           tokens to {statistics.success} addresses
    //         </>
    //       );
    //       updateTimelineItem({
    //         groupId: "mint",
    //         update: {
    //           lineId: "mintingTokens",
    //           content: mintedTokensMsg,
    //           status: statistics.success === tokensToMint ? "success" : "error",
    //         },
    //       });
    //     }
    //     setLikes((likes += 10));
    //     if (waitForArweaveImageTxPromise) await waitForArweaveImageTxPromise;
    //     setLikes((likes += 10));
    //     await waitForArweaveMetadataTxPromise;
    //     setLikes((likes += 10));

    const duration = 10 * 1000; // 10 seconds
    const end = Date.now() + duration;
    setIsLaunched(true);
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 100,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: Math.random(), // Random horizontal position
          y: Math.random() - 0.2, // Random vertical position
        },
      });
    }, 250); // Fire confetti every 250 milliseconds
    await stopProcessUpdateRequests();
  } catch (error: any) {
    console.error("launchToken catch:", error);
    log.error("launchToken: error launching token", { error });
    addLog({
      groupId: "error",
      status: "error",
      title: "Error launching token",
      lines: [
        {
          lineId: "error",
          content: String(error?.message ?? "Unknown error"),
          status: "error",
        },
      ],
    });
    await stopProcessUpdateRequests();
  }
}
