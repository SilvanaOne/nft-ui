"use client";
import confetti from "canvas-confetti";
import {
  NftInfo,
  CollectionInfo,
  MintAddress,
  MintAddressVerified,
  TokenAction,
  TokenActionData,
} from "@/lib/token";
import { TokenActionStatistics, transactionStore } from "@/context/action";
import { TokenActionFormData } from "@/context/action";
import {
  explorerAccountUrl,
  explorerTokenUrl,
  getChain,
  getChainId,
} from "@/lib/chain";
import { connectWallet, getWalletInfo } from "@/lib/wallet";
import { debug } from "@/lib/debug";
import { sleep } from "@/lib/sleep";
import { buildNftTransaction } from "./build";
import {
  TimeLineItem,
  TimelineGroup,
  TimelineGroupStatus,
  IsErrorFunction,
  TimelineItemStatus,
} from "@/components/timeline/TimeLine";
import {
  messages,
  LineId,
  GroupId,
  UpdateTimelineItemFunction,
} from "@/components/launch/lib/messages";
// import { getAccountNonce } from "@/lib/api";
import { waitForProveJob } from "@/components/launch/lib/mina-tx";
import { log } from "@/lib/log";
// import { AccountBalance, getBalances } from "@/lib/api/info/token-info";
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

async function stopProcessUpdateRequests() {
  while (updateRequests.length > 0) {
    await sleep(1000);
  }
  processRequests = false;
}

export function getActionStatistics(params: {
  tokenAddress: string;
  collectionAddress: string;
  tab: TokenAction;
}): TokenActionStatistics {
  if (!transactionStore) return { success: 0, error: 0, waiting: 0 };
  const store = transactionStore;
  const currentState = store.getState()?.transactionStates;
  if (DEBUG) console.log("getActionStatistics currentState", currentState);
  const result = currentState?.[params.collectionAddress]?.[
    params.tokenAddress
  ]?.[params.tab]?.statistics || {
    success: 0,
    error: 0,
    waiting: 0,
  };
  if (DEBUG) console.log("getActionStatistics result", { params, result });
  return result;
}

export async function tokenAction(params: {
  nftInfo: NftInfo;
  collectionInfo: CollectionInfo | undefined;
  tokenData: TokenActionData;
  tab: TokenAction;
  onBalanceUpdate: () => Promise<void>;
}) {
  const { nftInfo, collectionInfo, tokenData, tab, onBalanceUpdate } = params;
  const { nftAddress, collectionAddress, txs } = tokenData;
  const tokenAddress = nftAddress;
  if (DEBUG)
    console.log("tokenAction start", {
      nftAddress,
      collectionAddress,
      tab,
      tokenData,
    });

  function updateTimeLineItemInternal(params: {
    groupId: string;
    update: TimeLineItem;
  }) {
    const { groupId, update } = params;
    if (!transactionStore) return;
    const store = transactionStore;
    const currentState = store.getState();
    currentState.updateTimelineItem({
      collectionAddress,
      tokenAddress: nftAddress,
      tab,
      groupId,
      update,
    });
  }

  function isError(): boolean {
    if (!transactionStore) return false;
    const store = transactionStore;
    const currentState = store.getState();
    return (
      currentState.transactionStates[collectionAddress]?.[nftAddress]?.[tab]
        ?.isErrorNow ?? false
    );
  }

  function addLog(timelineGroup: TimelineGroup) {
    if (!transactionStore) return;
    const store = transactionStore;
    const currentState = store.getState();
    currentState.addTimelineGroup({
      collectionAddress,
      tokenAddress: nftAddress,
      tab,
      timelineGroup,
    });
  }
  startProcessUpdateRequests(updateTimeLineItemInternal);

  function updateTimelineItem(params: {
    groupId: string;
    update: TimeLineItem;
  }): void {
    const { groupId, update } = params;
    if (["o1js", "txSigned"].includes(update.lineId))
      updateTimeLineItemInternal({ groupId, update });
    else updateRequests.push({ groupId, update });
  }

  let isProcessedShown = false;
  let isWaitingShown = false;
  let isErrorShown = false;

  function showStatistics(txsToProcess: number, tab: TokenAction): boolean {
    const newStatistics = getActionStatistics({
      collectionAddress,
      tokenAddress,
      tab,
    });
    if (DEBUG) console.log("showStatistics", { params, newStatistics });
    if (newStatistics.success > 0 || isProcessedShown) {
      if (DEBUG) console.log("showStatistics update", isProcessedShown);
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "minted",
          content: `Processed ${newStatistics.success} ${tab} NFT transactions`,
          status:
            newStatistics.success === txsToProcess ? "success" : "waiting",
        },
      });
      isProcessedShown = true;
    }
    if (newStatistics.error > 0 || isErrorShown) {
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "notMinted",
          content: `${tab[0].toUpperCase() + tab.slice(1)} failed for ${
            newStatistics.error
          } addresses`,
          status: "error",
        },
      });
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "error",
          content: `Please make sure that you put right nonce in Auro wallet`,
          status: "error",
        },
      });
      isErrorShown = true;
    }
    if (newStatistics.waiting > 0 || isWaitingShown) {
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "waitToMint",
          content:
            newStatistics.waiting === 0
              ? `Processed all ${tab} transactions`
              : `Processing ${newStatistics.waiting} ${tab} transactions`,
          status: newStatistics.waiting === 0 ? "success" : "waiting",
        },
      });
      isWaitingShown = true;
    }
    return newStatistics.success === txsToProcess;
  }

  try {
    if (DEBUG) console.log("tokenAction:", tokenData);
    let txsToProcess = txs.length;

    const buildingMsg = (
      <>
        Building {txsToProcess}{" "}
        <a
          href={`${explorerAccountUrl()}/${tokenAddress}`}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          NFT
        </a>{" "}
        transactions...
      </>
    );

    addLog({
      groupId: "mint",
      status: "waiting",
      title: `Processing NFT transactions`,
      successTitle: `Processed NFT transactions`,
      errorTitle: `Failed to process NFT transactions`,
      lines: [
        {
          lineId: "build",
          content: buildingMsg,
          status: "waiting",
        },
      ],
      requiredForSuccess: ["build", "minted"],
      keepOnTop: true,
    });
    let walletInfo = await getWalletInfo();
    if (!walletInfo.address || walletInfo.network !== chainId) {
      await connectWallet();
      walletInfo = await getWalletInfo();
    }
    if (!walletInfo.address || walletInfo.network !== chainId) {
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "network",
          content: `Your wallet is not connected to ${chainId}, please connect to ${chainId}`,
          status: "error",
        },
      });
      return;
    }

    if (DEBUG) console.log("launchToken: Wallet Info:", walletInfo);
    const senderAddress = walletInfo.address;
    if (DEBUG) console.log("senderAddress", senderAddress);

    if (!senderAddress) {
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "noWallet",
          content: "Please connect the wallet",
          status: "error",
        },
      });
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "verifyData",
          content: "Data verification failed",
          status: "error",
        },
      });
      log.error("tokenAction: no wallet address", { tokenAddress, tab });
      await stopProcessUpdateRequests();
      return;
    }

    // TODO: check admin address in case of mint with standard admin
    // if (adminPublicKey !== walletInfo.address) {
    //   updateTimelineItem({
    //     groupId: "mint",
    //     update: {
    //       lineId: "adminRequired",
    //       content: messages.adminAddressDoNotMatch.content,
    //       status: "error",
    //     },
    //   });
    //   updateTimelineItem({
    //     groupId: "mint",
    //     update: {
    //       lineId: "verifyData",
    //       content: "Data verification failed",
    //       status: "error",
    //     },
    //   });
    //   return;
    // }
    if (isError()) return;
    const mina = (window as any).mina;
    if (mina === undefined || mina?.isAuro !== true) {
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "noAuroWallet",
          content: messages.noAuroWallet.content,
          status: "error",
        },
      });
      updateTimelineItem({
        groupId: "mint",
        update: {
          lineId: "verifyData",
          content: "Data verification failed",
          status: "error",
        },
      });
      log.error("tokenAction: no Auro wallet", { tokenAddress, tab });
      await stopProcessUpdateRequests();
      return;
    }
    if (isError()) return;

    // const mintItems: MintAddressVerified[] = [];
    // for (const item of addresses) {
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
    //         groupId: "mint",
    //         update: {
    //           lineId: "mintDataError",
    //           content: `Cannot ${tab} ${item.amount} ${symbol} tokens to ${item.address} because of wrong amount or address`,
    //           status: "error",
    //         },
    //       });
    //       updateTimelineItem({
    //         groupId: "mint",
    //         update: {
    //           lineId: "verifyData",
    //           content: "Data verification failed",
    //           status: "error",
    //         },
    //       });
    //       return;
    //     }
    //   }
    // }
    // if (DEBUG) console.log("Mint items filtered:", mintItems);
    // if (isError()) return;

    // updateTimelineItem({
    //   groupId: "mint",
    //   update: {
    //     lineId: "build",
    //     content: `Built ${txsToProcess} ${symbol} transactions`,
    //     status: "success",
    //   },
    // });
    // updateTimelineItem({
    //   groupId: "mint",
    //   update: messages.o1js,
    // });

    // let nonce = await getAccountNonce(senderAddress);
    // if (nonce === undefined) {
    //   updateTimelineItem({
    //     groupId: "mint",
    //     update: {
    //       lineId: "error",
    //       content: `Error getting account nonce for ${senderAddress}`,
    //       status: "error",
    //     },
    //   });
    //   await stopProcessUpdateRequests();
    //   await onBalanceUpdate();
    //   return;
    // }
    let txPromises: Promise<boolean>[] = [];

    for (let i = 0; i < txs.length; i++) {
      const item = txs[i];
      const groupId = `tx-NFT-${tab}-${i}`;
      const timeLineItems: TimeLineItem[] = [];
      // if ("amount" in item) {
      //   const amountMsg = (
      //     <>
      //       Amount: {item.amount / 1_000_000_000}{" "}
      //       <a
      //         href={`${explorerTokenUrl()}${tokenId}`}
      //         className="text-accent hover:underline"
      //         target="_blank"
      //         rel="noopener noreferrer"
      //       >
      //         {item.txType === "token:bid:withdraw" ? "MINA" : symbol}
      //       </a>{" "}
      //       tokens
      //     </>
      //   );
      //   timeLineItems.push({
      //     lineId: "amount",
      //     content: amountMsg,
      //     status: "success",
      //   });
      // }
      // if ("price" in item && item.price) {
      //   timeLineItems.push({
      //     lineId: "price",
      //     content: `Price: ${item.price / 1_000_000_000}`,
      //     status: "success",
      //   });
      // }
      const tokenAddressMsg = (
        <>
          NFT address:{" "}
          <a
            href={`${explorerAccountUrl()}${item.nftAddress}`}
            className="text-accent hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.nftAddress}
          </a>
        </>
      );
      timeLineItems.push({
        lineId: "address",
        content: tokenAddressMsg,
        status: "success",
      });
      const action =
        {
          "nft:mint": "mint",
          "nft:transfer": "transfer",
          "nft:approve": "approve",
          "nft:sell": "sell",
          "nft:buy": "buy",
          "nft:launch": "launch",
          process: "process",
        }[item.txType ?? "process"] || "process";

      addLog({
        groupId,
        status: "waiting",
        title: `${action[0].toUpperCase() + action.slice(1)}ing NFT`,
        successTitle: `NFT ${action}ed`,
        errorTitle: `Failed to ${action} NFT`,
        lines: [messages.txMint, ...timeLineItems],
        requiredForSuccess: ["txIncluded"],
      });

      if (item.txType === undefined) {
        updateTimelineItem({
          groupId,
          update: {
            lineId: "error",
            content: "Transaction type is undefined",
            status: "error",
          },
        });
        return;
      }

      item.memo = `${item.txType.split(":")[1]} NFT ${tokenData.nftName}`;

      const mintResult = await buildNftTransaction({
        sender: senderAddress,
        updateTimelineItem,
        groupId,
        data: item,
      });
      if (DEBUG) console.log("mintResult", mintResult);
      if (mintResult.success === false || mintResult.jobId === undefined) {
        log.error("tokenAction: apiTokenTransaction error", {
          tokenAddress,
          tab,
          mintResult,
        });
        updateTimelineItem({
          groupId,
          update: {
            lineId: "error",
            content:
              "Failed to create transaction. Please check your inputs and try again.",
            status: "error",
          },
        });
        await stopProcessUpdateRequests();
        await onBalanceUpdate();
        return;
      }
      const mintJobId = mintResult.jobId;
      // const addresses: string[] = [];
      // if (mintResult.bidAddress) addresses.push(mintResult.bidAddress);
      // if (mintResult.offerAddress) addresses.push(mintResult.offerAddress);
      // if (item.txType === "token:airdrop")
      //   addresses.push(
      //     ...item.recipients.map((recipient) => recipient.address)
      //   );
      // addresses.push(item.sender);
      // if ("to" in item && item.to) addresses.push(item.to);
      // if (mintResult.to) addresses.push(...mintResult.to);

      await sleep(1000);
      showStatistics(txsToProcess, tab);
      await sleep(1000);
      const waitForMintJobPromise = waitForProveJob({
        jobId: mintJobId,
        groupId,
        updateTimelineItem,
        type: action as TokenAction,
      });
      txPromises.push(waitForMintJobPromise);
      if (isError()) return; // TODO: add error handling like in launch
    }
    const builtMsg = (
      <>
        Built {txsToProcess}{" "}
        <a
          href={`${explorerAccountUrl()}/${tokenAddress}`}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          NFT
        </a>{" "}
        transactions.
      </>
    );
    updateTimelineItem({
      groupId: "mint",
      update: {
        lineId: "build",
        content: builtMsg,
        status: "success",
      },
    });
    // updateTimelineItem({
    //   groupId: "mint",
    //   update: {
    //     lineId: "wait",
    //     content: `Waiting for ${txsToProcess} ${symbol} transactions to be processed`,
    //     status: "waiting",
    //   },
    // });
    await onBalanceUpdate();
    while (!showStatistics(txsToProcess, tab) && !isError()) {
      await sleep(5000);
    }
    await onBalanceUpdate();

    await Promise.all(txPromises);
    await onBalanceUpdate();
    const finalStatistics = getActionStatistics({
      collectionAddress,
      tokenAddress,
      tab,
    });
    const mintedTokensMsg = (
      <>
        Successfully processed {finalStatistics.success}{" "}
        <a
          href={`${explorerAccountUrl()}/${tokenAddress}`}
          className="text-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          NFT
        </a>{" "}
        {tab} transaction(s)
      </>
    );
    updateTimelineItem({
      groupId: "mint",
      update: {
        lineId: "minted",
        content: mintedTokensMsg,
        status: finalStatistics.success === txsToProcess ? "success" : "error",
      },
    });

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
  } catch (error: any) {
    log.error(`tokenAction catch: ${tab}`, { error });
    addLog({
      groupId: "error",
      status: "error",
      title: `Error ${tab}ing token`,
      lines: [
        {
          lineId: "catch",
          content: String(error.message ?? "Unknown error"),
          status: "error",
        },
      ],
    });
    await stopProcessUpdateRequests();
    await onBalanceUpdate();
  }
}
