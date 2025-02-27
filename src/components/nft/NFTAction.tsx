"use client";
import { TokenActionForm } from "@/components/nft/NFTActionForm";
import {
  MintAddress,
  TokenAction,
  TokenActionData,
  TokenActionTransactionParams,
} from "@/lib/token";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
import { TransactionTokenState, TokenActionFormData } from "@/context/action";
import { TimeLine } from "@/components/timeline/TimeLine";
import { debug } from "@/lib/debug";
import { useTransactionStore } from "@/context/tx-provider";
import { NftMintTransactionParams } from "@silvana-one/api";
// import { OrderbookTab } from "./Orderbook";

const DEBUG = debug();

// const initialAddresses: MintAddress[] = [
//   {
//     amount: "",
//     address: "",
//   },
// ];

// function initialTokenActionData(params: {
//   tokenState: TokenState;
//   tab: TokenAction;
//   formData: TokenActionFormData;
// }): TokenActionData {
//   const { tokenState, tab, formData } = params;
//   const txs: TokenActionTransactionParams[] = [];

//   switch (tab) {
//     case "mint":
//       txs.push(
//         ...formData.addresses.map(
//           (address) =>
//             ({
//               tokenAddress: tokenState.tokenAddress,
//               sender: tokenState.adminAddress,
//               txType: "token:mint",
//               to: address.address,
//               amount: Math.round(
//                 (address.amount ? Number(address.amount) : 0) * 1_000_000_000
//               ),
//               price: tokenState.mintPrice
//                 ? Math.round(Number(tokenState.mintPrice) * 1_000_000_000)
//                 : undefined,
//             } as TokenMintTransactionParams)
//         )
//       );
//       break;

//     case "redeem":
//       txs.push({
//         tokenAddress: tokenState.tokenAddress,
//         sender: tokenState.adminAddress,
//         txType: "token:redeem",
//         amount: Math.round(
//           (formData.amount ? Number(formData.amount) : 0) * 1_000_000_000
//         ),
//         price: tokenState.redeemPrice
//           ? Math.round(Number(tokenState.redeemPrice) * 1_000_000_000)
//           : undefined,
//       } as TokenRedeemTransactionParams);
//       break;

//     case "burn":
//       txs.push({
//         tokenAddress: tokenState.tokenAddress,
//         sender: tokenState.adminAddress,
//         txType: "token:burn",
//         amount: Math.round(
//           (formData.amount ? Number(formData.amount) : 0) * 1_000_000_000
//         ),
//       } as TokenBurnTransactionParams);
//       break;
//     case "transfer":
//       txs.push(
//         ...formData.addresses.map(
//           (address) =>
//             ({
//               tokenAddress: tokenState.tokenAddress,
//               sender: tokenState.adminAddress,
//               txType: "token:transfer",
//               to: address.address,
//               amount: Math.round(
//                 (address.amount ? Number(address.amount) : 0) * 1_000_000_000
//               ),
//             } as TokenTransferTransactionParams)
//         )
//       );
//       break;
//     case "airdrop":
//       txs.push({
//         tokenAddress: tokenState.tokenAddress,
//         sender: tokenState.adminAddress,
//         txType: "token:airdrop",
//         recipients: formData.addresses.map((address) => ({
//           address: address.address,
//           amount: Math.round(
//             (address.amount ? Number(address.amount) : 0) * 1_000_000_000
//           ),
//         })),
//       } as TokenAirdropTransactionParams);
//       break;
//     case "offer":
//       txs.push({
//         tokenAddress: tokenState.tokenAddress,
//         sender: tokenState.adminAddress,
//         txType: "token:offer:create",
//         amount: Math.round(
//           formData.amount ? Number(formData.amount) * 1_000_000_000 : 0
//         ),
//         price: Math.round(
//           formData.price
//             ? Number(formData.price) * 1_000_000_000
//             : 1_000_000_000
//         ),
//       } as TokenOfferTransactionParams);
//       break;
//     case "bid":
//       txs.push({
//         tokenAddress: tokenState.tokenAddress,
//         sender: tokenState.adminAddress,
//         txType: "token:bid:create",
//         amount: Math.round(
//           formData.amount ? Number(formData.amount) * 1_000_000_000 : 0
//         ),
//         price: Math.round(
//           formData.price
//             ? Number(formData.price) * 1_000_000_000
//             : 1_000_000_000
//         ),
//       } as TokenBidTransactionParams);
//       break;
//   }
//   return {
//     symbol: tokenState.tokenSymbol,
//     txs,
//   };
// }
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
    // const tokenData = initialTokenActionData({
    //   nftInfo,
    //   collectionInfo,
    //   tab,
    //   formData,
    // });
    // setTokenData({
    //   tokenAddress,
    //   tab,
    //   tokenData,
    //   timelineItems: [],
    //   formData,
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
          />
        </div>
      )}
    </>
  );
}
