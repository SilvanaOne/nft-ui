"use client";

import confetti from "canvas-confetti";
import { LaunchCollectionData, MintAddressVerified } from "@/lib/token";
import {
  explorerAccountUrl,
  explorerTokenUrl,
  getChain,
  getChainId,
} from "@/lib/chain";
import { getWalletInfo } from "@/lib/wallet";
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
import { waitForProveJob } from "./mina-tx";
import { log } from "@/lib/log";
import { LaunchNftCollectionStandardAdminParams } from "@silvana-one/api";
const chain = getChain();
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

export async function launchToken(params: {
  data: LaunchCollectionData;
  addLog: (item: TimelineGroup) => void;
  updateTimelineItem: UpdateTimelineItemFunction;
  isError: IsErrorFunction;
  getMintStatistics: GetMintStatisticsFunction;
  setTotalSupply: (totalSupply: number) => void;
  setTokenAddress: (tokenAddress: string) => void;
  setLikes: (likes: number) => void;
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
  } = params;
  const {
    symbol,
    name,
    description,
    links,
    image,
    imageURL,
    adminAddress,
    mintAddresses,
  } = data;
  const { twitter, telegram, website, discord, instagram, facebook } = links;
  let likes = 0;
  log.error("launchCollection: starting", { data });

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
    addLog({
      groupId: "verify",
      status: "waiting",
      title: `Verifying NFT collection data for ${data.symbol}`,
      successTitle: `NFT collection data for ${data.symbol} verified`,
      errorTitle: `Failed to verify NFT collection data for ${data.symbol}`,
      lines: [messages.verifyData],
      requiredForSuccess: ["verifyData", "privateKeysSaved"],
    });

    if (DEBUG) console.log("launchToken: launching token:", data);
    const walletInfo = await getWalletInfo();
    if (DEBUG) console.log("launchToken: Wallet Info:", walletInfo);
    const systemInfo = getSystemInfo();
    if (DEBUG) console.log("launchToken: System Info:", systemInfo);
    if (isError()) return;
    const mina = (window as any).mina;
    if (
      mina === undefined ||
      mina?.isAuro !== true ||
      walletInfo.address === undefined
    ) {
      updateTimelineItem({
        groupId: "verify",
        update: {
          lineId: "noAuroWallet",
          content: messages.noAuroWallet.content,
          status: "error",
        },
      });
      updateTimelineItem({
        groupId: "verify",
        update: {
          lineId: "verifyData",
          content: "Data verification failed",
          status: "error",
        },
      });
      log.error("launchToken: no Auro wallet", { walletInfo });
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
    //         groupId: "verify",
    //         update: {
    //           lineId: "mintDataError",
    //           content: `Cannot mint ${item.amount} ${symbol} tokens to ${item.address} because of wrong amount or address`,
    //           status: "error",
    //         },
    //       });
    //       updateTimelineItem({
    //         groupId: "verify",
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

    updateTimelineItem({
      groupId: "verify",
      update: {
        lineId: "verifyData",
        content: "NFT data is verified",
        status: "success",
      },
    });

    let imageHash: string | undefined = undefined;
    let imageExtension: string | undefined = undefined;
    if (image) {
      addLog({
        groupId: "image",
        status: "waiting",
        title: `Pinning token image for ${data.symbol}`,
        successTitle: `Token image for ${data.symbol} pinned`,
        errorTitle: `Failed to pin token image for ${data.symbol}`,
        lines: [messages.pinningImage],
        requiredForSuccess: ["pinningImage"],
      });

      // const base64 = await readFileAsync(image);
      // imageHash = await pinBase64ImageToArweave(base64);
      // imageExtension = image?.name?.split(".")?.pop();
      // if (imageHash) {
      //   const imageTxMessage = (
      //     <>
      //       <a
      //         href={`https://arscan.io/tx/${imageHash}`}
      //         className="text-accent hover:underline"
      //         target="_blank"
      //         rel="noopener noreferrer"
      //       >
      //         Transaction
      //       </a>{" "}
      //       is sent to Arweave
      //     </>
      //   );
      //   updateTimelineItem({
      //     groupId: "image",
      //     update: {
      //       lineId: "arweaveTx",
      //       content: imageTxMessage,
      //       status: "success",
      //     },
      //   });

      updateTimelineItem({
        groupId: "image",
        update: {
          lineId: "pinningImage",
          content: "NFT image is uploaded to IPFS",
          status: "success",
        },
      });
      //     updateTimelineItem({
      //       groupId: "image",
      //       update: messages.arweaveIncluded,
      //     });
      //   } else {
      //     updateTimelineItem({
      //       groupId: "image",
      //       update: {
      //         lineId: "pinningImage",
      //         content:
      //           "Failed to upload token image to Arweave permanent storage",
      //         status: "error",
      //       },
      //     });
      //     log.error("launchToken: failed to pin image", { imageHash });
      //     return;
      //   }
      // }
      if (isError()) return;

      // const imageURL = imageHash
      //   ? (await arweaveHashToUrl(imageHash)) +
      //     (imageExtension ? `/${symbol}.${imageExtension}` : "")
      //   : undefined;
      // const info: TokenInfo = {
      //   symbol,
      //   name,
      //   description,
      //   image: imageURL,
      //   twitter,
      //   discord,
      //   telegram,
      //   instagram,
      //   facebook,
      //   website,
      //   tokenContractCode:
      //     "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleToken.ts",
      //   adminContractsCode: [
      //     "https://github.com/MinaFoundation/mina-fungible-token/blob/main/FungibleTokenAdmin.ts",
      //   ],
      //   data: undefined,
      //   isMDA: undefined,
      //   launchpad: getLaunchpadUrl(),
      // };
      // if (DEBUG) console.log("Token info:", info);

      // addLog({
      //   groupId: "metadata",
      //   status: "waiting",
      //   title: `Pinning token metadata for ${data.symbol}`,
      //   successTitle: `Token metadata for ${data.symbol} pinned`,
      //   errorTitle: `Failed to pin token metadata for ${data.symbol}`,
      //   lines: [messages.pinningMetadata],
      //   requiredForSuccess: ["pinningMetadata", "arweaveTx", "arweaveIncluded"],
      // });

      // const metadataHash = await pinStringToArweave(
      //   JSON.stringify(info, null, 2)
      // );

      // if (!metadataHash) {
      //   updateTimelineItem({
      //     groupId: "metadata",
      //     update: {
      //       lineId: "pinningMetadata",
      //       content: "Failed to pin token metadata to Arweave permanent storage",
      //       status: "error",
      //     },
      //   });
      //   log.error("launchToken: failed to pin metadata", { metadataHash });
      //   return;
      // } else {
      //   const metadataTxMessage = (
      //     <>
      //       <a
      //         href={`https://arscan.io/tx/${metadataHash}`}
      //         className="text-accent hover:underline"
      //         target="_blank"
      //         rel="noopener noreferrer"
      //       >
      //         Transaction
      //       </a>{" "}
      //       is sent to Arweave
      //     </>
      //   );
      //   updateTimelineItem({
      //     groupId: "metadata",
      //     update: {
      //       lineId: "arweaveTx",
      //       content: metadataTxMessage,
      //       status: "success",
      //     },
      //   });
      //   updateTimelineItem({
      //     groupId: "metadata",
      //     update: {
      //       lineId: "pinningMetadata",
      //       content: "Token metadata is uploaded to Arweave",
      //       status: "success",
      //     },
      //   });
      //   updateTimelineItem({
      //     groupId: "metadata",
      //     update: messages.arweaveIncluded,
      //   });
      // }
      // if (isError()) return;
      // setLikes((likes += 10));

      // let waitForArweaveImageTxPromise = undefined;
      // if (imageHash) {
      //   waitForArweaveImageTxPromise = waitForArweaveTx({
      //     hash: imageHash,
      //     groupId: "image",
      //     lineId: "arweaveIncluded",
      //     updateTimelineItem,
      //     type: "image",
      //   });
      // }

      // const waitForArweaveMetadataTxPromise = waitForArweaveTx({
      //   hash: metadataHash,
      //   groupId: "metadata",
      //   lineId: "arweaveIncluded",
      //   updateTimelineItem,
      //   type: "metadata",
      // });

      // const uri = (await arweaveHashToUrl(metadataHash)) + `/${symbol}.json`;
      // const lib = await libPromise;

      // const {
      //   tokenPrivateKey,
      //   adminContractPrivateKey,
      //   tokenPublicKey,
      //   adminContractPublicKey,
      //   tokenId,
      // } = await deployTokenParams(lib);
      // if (DEBUG) console.log("Deploy Params received");
      // setTokenAddress(tokenPublicKey);
      // updateTimelineItem({
      //   groupId: "verify",
      //   update: {
      //     lineId: "privateKeysGenerated",
      //     content: `Token private keys are generated`,
      //     status: "success",
      //   },
      // });

      const mintResult = await mintNFT({
        symbol,
        sender: walletInfo.address,
        updateTimelineItem,
        groupId: "deploy",
        mintType: "collection",
      });

      // const tokenAddress = mintResult.jobId

      // const tokenAddressMsg = (
      //   <>
      //     Token address:{" "}
      //     <a
      //       href={`${explorerAccountUrl()}${tokenPublicKey}`}
      //       className="text-accent hover:underline"
      //       target="_blank"
      //       rel="noopener noreferrer"
      //     >
      //       {tokenPublicKey}
      //     </a>
      //   </>
      // );
      // updateTimelineItem({
      //   groupId: "verify",
      //   update: {
      //     lineId: "tokenAddress",
      //     content: tokenAddressMsg,
      //     status: "success",
      //   },
      // });
      // if (isError()) return;
      // // Save the result to a JSON file
      // const deployParams = {
      //   symbol,
      //   name,
      //   description,
      //   image: imageURL,
      //   website,
      //   telegram,
      //   twitter,
      //   discord,
      //   tokenPrivateKey,
      //   adminContractPrivateKey,
      //   tokenPublicKey,
      //   adminContractPublicKey,
      //   adminPublicKey,
      //   metadata: uri,
      // };
      // updateTimelineItem({
      //   groupId: "verify",
      //   update: messages.privateKeysSaved,
      // });
      // // TODO: save with password encryption
      // const deployParamsJson = JSON.stringify(deployParams, null, 2);
      // const blob = new Blob([deployParamsJson], { type: "application/json" });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement("a");
      // a.href = url;
      // const fileName = `${symbol}-${tokenPublicKey}.json`;
      // a.download = fileName;
      // a.click();
      // const saveDeployParamsSuccessMsg = (
      //   <>
      //     Token private keys have been saved to a{" "}
      //     <a
      //       href={url}
      //       download={fileName}
      //       className="text-accent hover:underline"
      //       target="_blank"
      //       rel="noopener noreferrer"
      //     >
      //       JSON file
      //     </a>
      //   </>
      // );
      // updateTimelineItem({
      //   groupId: "verify",
      //   update: {
      //     lineId: "privateKeysSaved",
      //     content: saveDeployParamsSuccessMsg,
      //     status: "success",
      //   },
      // });
      // setLikes((likes += 10));
      // addLog({
      //   groupId: "deploy",
      //   status: "waiting",
      //   title: `Launching token ${data.symbol}`,
      //   successTitle: `Token ${data.symbol} launched`,
      //   errorTitle: `Failed to launch token ${data.symbol}`,
      //   lines: [messages.txPrepared],
      //   requiredForSuccess: ["contractStateVerified"],
      //   keepOnTop: true,
      // });

      if (DEBUG) console.log("Mint result:", mintResult);
      if (mintResult.success === false || mintResult.jobId === undefined) {
        updateTimelineItem({
          groupId: "deploy",
          update: {
            lineId: "deployTransactionError",
            content:
              mintResult.error ?? messages.deployTransactionError.content,
            status: "error",
          },
        });
        log.error("launchToken: failed to deploy token", { mintResult });
        await stopProcessUpdateRequests();
        return;
      }
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
      setLikes((likes += 10));
      const mintJobId = mintResult.jobId;

      const txIncluded = await waitForProveJob({
        jobId: mintJobId,
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
        return;
      }
      setLikes((likes += 10));
      // const contractVerified = await waitForContractVerification({
      //   tokenAddress: tokenPublicKey,
      //   adminContractAddress: adminContractPublicKey,
      //   adminAddress: adminPublicKey,
      //   tokenId,
      //   groupId: "deploy",
      //   updateTimelineItem,
      //   info,
      // });
      // if (!contractVerified) {
      //   addLog({
      //     groupId: "error",
      //     status: "error",
      //     title: "Error launching token",
      //     lines: [
      //       {
      //         lineId: "error",
      //         content: "Contract verification failed",
      //         status: "error",
      //       },
      //     ],
      //   });
      //   log.error("launchToken: contract verification failed", {
      //     contractVerified,
      //   });
      //   await stopProcessUpdateRequests();
      //   return;
      // }

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
    }
  } catch (error) {
    console.error("launchToken catch:", error);
    log.error("launchToken: error launching token", { error });
    addLog({
      groupId: "error",
      status: "error",
      title: "Error launching token",
      lines: [
        {
          lineId: "error",
          content: String(error),
          status: "error",
        },
      ],
    });
    await stopProcessUpdateRequests();
  }
}
