// /* eslint-disable react/no-unescaped-entities */
// "use client";

// import React, { useEffect } from "react";
// import { TimeLine } from "./TimeLine";
// import { TokenActionData } from "@/tokens/lib/token";
// import { tokenAction } from "./lib/action";
// import {
//   useTransactionContext,
//   TransactionTokenState,
// } from "@/context/transaction";
// import {
//   TimeLineItem,
//   TimelineGroup,
//   TimelineGroupStatus,
//   TimelineItemStatus,
// } from "./TimeLine";

// const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

// type MintStatistics = { [key in TimelineItemStatus]: number };
// let statistics: MintStatistics = {
//   success: 0,
//   error: 0,
//   waiting: 0,
// };

// export function getMintStatistics(): MintStatistics {
//   if (DEBUG) console.log("mintStatistics called", statistics);
//   return statistics;
// }

// let isErrorNow = false;
// export function isError(): boolean {
//   // if (DEBUG) console.log("isErrorNow called", isErrorNow);
//   return isErrorNow;
// }

// type TokenTransactionProps = {
//   tokenAddress: string;
//   tab: string;
// };

// const TokenTransaction: React.FC<TokenTransactionProps> = ({
//   tokenAddress,
//   tab,
// }) => {
//   const { state: transactionStates, dispatch } = useTransactionContext();
//   const state: TransactionTokenState = transactionStates[tokenAddress]?.[
//     tab
//   ] ?? {
//     tokenAddress,
//     tab,
//     timelineItems: [],
//     isApplied: false,
//   };

//   function addLog(timelineGroup: TimelineGroup) {
//     dispatch({
//       type: "ADD_TIMELINE_GROUP",
//       payload: { tokenAddress, tab, timelineGroup },
//     });
//   }

//   function updateTimelineItem(params: {
//     groupId: string;
//     update: TimeLineItem;
//   }) {
//     const { groupId, update } = params;
//     dispatch({
//       type: "UPDATE_TIMELINE_ITEM",
//       payload: { tokenAddress, tab, groupId, update },
//     });
//   }

//   function setIsApplied(isApplied: boolean) {
//     dispatch({
//       type: "SET_IS_APPLIED",
//       payload: { tokenAddress, tab, isApplied },
//     });
//   }

//   useEffect(() => {
//     if (DEBUG) console.log("state", state);
//     isErrorNow = state.timelineItems.some((item) => item.status === "error");
//     if (DEBUG) console.log("isErrorNow", isErrorNow);
//     const mintItems = state.timelineItems.filter((item) =>
//       item.groupId.startsWith("minting")
//     );
//     // if (DEBUG) console.log("mintItems", mintItems);
//     const newStatistics = {
//       success: 0,
//       error: 0,
//       waiting: 0,
//     };
//     mintItems.forEach((item) => {
//       if (item.status === "success") {
//         newStatistics.success++;
//       } else if (item.status === "error") {
//         newStatistics.error++;
//       } else if (item.status === "waiting") {
//         newStatistics.waiting++;
//       }
//     });

//     statistics = newStatistics;
//     // if (DEBUG) console.log("Updated statistics:", statistics);
//   }, [state]);

//   const handleLaunchButtonClick = async (tokenData: TokenActionData) => {
//     if (DEBUG) console.log("Token action:", tokenData);

//     dispatch({
//       type: "SET_TOKEN_DATA",
//       payload: {
//         tokenAddress,
//         tab,
//         timelineItems: [],
//         isApplied: false,
//         tokenData,
//       },
//     });
//     window.scrollTo({ top: 0, behavior: "instant" });

//     tokenAction({
//       data: tokenData,
//       addLog,
//       updateTimelineItem,
//       isError,
//       getMintStatistics,
//     });
//   };

//   return (
//     <>
//       <TimeLine items={state.timelineItems} />
//       {!state.tokenData && <LaunchForm onLaunch={handleLaunchButtonClick} />}
//     </>
//   );
// };

// export default TokenTransaction;
