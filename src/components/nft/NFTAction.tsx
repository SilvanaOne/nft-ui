"use client";
import { TokenActionForm } from "@/components/nft/NFTActionForm";
import {
  TokenAction,
  TokenActionData,
  TokenActionTransactionParams,
} from "@/lib/token";
import {
  NftInfo,
  CollectionInfo,
  NftTransferTransactionParams,
  NftApproveTransactionParams,
  NftSellTransactionParams,
  NftBuyTransactionParams,
} from "@silvana-one/api";
import { TransactionTokenState, TokenActionFormData } from "@/context/action";
import { TimeLine } from "@/components/timeline/TimeLine";
import { debug } from "@/lib/debug";
import { useTransactionStore } from "@/context/tx-provider";
import { tokenAction } from "./lib/action";

// import { OrderbookTab } from "./Orderbook";

const DEBUG = debug();

// const initialAddresses: MintAddress[] = [
//   {
//     amount: "",
//     address: "",
//   },
// ];

function initialTokenActionData(params: {
  nftInfo: NftInfo;
  tab: TokenAction;
  formData: TokenActionFormData;
}): TokenActionData {
  const { nftInfo, tab, formData } = params;
  const txs: TokenActionTransactionParams[] = [];

  switch (tab) {
    case "transfer":
      txs.push({
        nftAddress: nftInfo.tokenAddress,
        collectionAddress: nftInfo.collectionAddress,
        sender: nftInfo.owner,
        txType: "nft:transfer",
        nftTransferParams: {
          to: formData.addresses[0],
        },
      } as NftTransferTransactionParams);
      break;

    case "approve":
      txs.push({
        nftAddress: nftInfo.tokenAddress,
        collectionAddress: nftInfo.collectionAddress,
        sender: nftInfo.owner,
        txType: "nft:approve",
        nftApproveParams: {
          to: formData.addresses[0],
        },
      } as NftApproveTransactionParams);
      break;

    case "sell":
      console.log("sell", formData.salePrice);
      txs.push({
        nftAddress: nftInfo.tokenAddress,
        collectionAddress: nftInfo.collectionAddress,
        sender: nftInfo.owner,
        txType: "nft:sell",
        nftSellParams: {
          price: formData.salePrice,
        },
      } as NftSellTransactionParams);
      break;

    case "buy":
      txs.push({
        nftAddress: nftInfo.tokenAddress,
        collectionAddress: nftInfo.collectionAddress,
        sender: nftInfo.owner,
        txType: "nft:buy",
        nftBuyParams: {
          buyer: undefined,
        },
      } as NftBuyTransactionParams);
      break;
  }
  return {
    nftName: nftInfo.name,
    collectionName: nftInfo.collectionName,
    nftAddress: nftInfo.tokenAddress,
    collectionAddress: nftInfo.collectionAddress,
    txs,
  };
}
export type NftActionProps = {
  tokenAddress: string;
  collectionAddress: string;
  nftInfo: NftInfo | undefined;
  collectionInfo: CollectionInfo | undefined;
  tab: TokenAction;
  onBalanceUpdate: () => Promise<void>;
};

export function NftActionComponent({
  tokenAddress,
  collectionAddress,
  nftInfo,
  collectionInfo,
  tab,
  onBalanceUpdate,
}: NftActionProps) {
  const { transactionStates, setTokenData, setFormData } = useTransactionStore(
    (state) => state
  );

  const state: TransactionTokenState = transactionStates[collectionAddress]?.[
    tokenAddress
  ]?.[tab] ?? {
    collectionAddress,
    tokenAddress,
    tab,
    timelineItems: [],
    isProcessing: false,
    formData: {
      addresses: [""],
      salePrice: undefined,
    },
    statistics: {
      success: 0,
      error: 0,
      waiting: 0,
    },
    isErrorNow: false,
  };
  const isProcessing = state?.isProcessing || false;
  const timelineItems = state?.timelineItems || [];

  function onChange(formData: TokenActionFormData) {
    console.log("onChange", formData);
    setFormData({
      tokenAddress,
      collectionAddress,
      tab,
      formData,
    });
  }

  async function onSubmit(formData: TokenActionFormData) {
    if (DEBUG) console.log("Processing form", formData);
    if (!nftInfo) return;
    const tokenData = initialTokenActionData({
      nftInfo,
      tab,
      formData,
    });

    setTokenData({
      tokenAddress,
      collectionAddress,
      tab,
      tokenData,
      timelineItems: [],
      formData,
      isProcessing: true,
      statistics: {
        success: 0,
        error: 0,
        waiting: 0,
      },
      isErrorNow: false,
    });
    tokenAction({
      nftInfo,
      collectionInfo,
      tokenData,
      tab,
      onBalanceUpdate,
    });
  }

  async function onSubmitOrder(tokenData: TokenActionData) {
    if (DEBUG) console.log("Processing order", tokenData);
    if (!nftInfo) return;
    // setTokenData({
    //   tokenAddress,
    //   tab,
    //   tokenData,
    //   timelineItems: [],
    //   formData: {
    //     addresses: [],
    //   },
    //   isProcessing: true,
    //   statistics: {
    //     success: 0,
    //     error: 0,
    //     waiting: 0,
    //   },
    //   isErrorNow: false,
    // });
    // tokenAction({
    //   tokenState,
    //   tokenData,
    //   tab,
    //   onBalanceUpdate,
    // });
  }

  return (
    <>
      {isProcessing && (
        <div className="container rounded-t-2lg rounded-b-2lg rounded-tl-none border border-jacarta-100 p-6 dark:border-jacarta-600">
          <TimeLine items={timelineItems} dark={true} />
        </div>
      )}
      {!isProcessing && (
        <div className="container rounded-t-2lg rounded-b-2lg rounded-tl-none border border-jacarta-100 p-6 dark:border-jacarta-600">
          <TokenActionForm
            key={
              "tokenAction-" +
              collectionAddress +
              "-" +
              tokenAddress +
              "-" +
              tab
            }
            onSubmit={onSubmit}
            onChange={onChange}
            data={state.formData}
            buttonText={tab.slice(0, 1).toUpperCase() + tab.slice(1)}
            showPrice={tab === "sell"}
            showAmount={false}
            showAddMore={false}
            showAddress={tab === "transfer" || tab === "approve"}
            showSalePrice={tab === "buy"}
            price={nftInfo?.price}
          />
        </div>
      )}
    </>
  );
}
