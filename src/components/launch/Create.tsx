/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useEffect, useState } from "react";

import { TokenProgress } from "./TokenProgress";
import { LaunchForm } from "./LaunchForm";
import { LaunchCollectionData } from "@/lib/token";
import { useLaunchToken } from "@/context/launch";
import { launchNFT } from "./lib/launch";
import {
  TimeLineItem,
  TimelineGroup,
  TimelineGroupStatus,
  TimelineItemStatus,
} from "./TimeLine";
import { unavailableCountry, checkAvailability } from "@/lib/availability";
import NotAvailable from "@/components/pages/NotAvailable";

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";

type MintStatistics = { [key in TimelineItemStatus]: number };
let statistics: MintStatistics = {
  success: 0,
  error: 0,
  waiting: 0,
};

export function getMintStatistics(): MintStatistics {
  if (DEBUG) console.log("mintStatistics called", statistics);
  return statistics;
}

let isErrorNow = false;
export function isError(): boolean {
  // if (DEBUG) console.log("isErrorNow called", isErrorNow);
  return isErrorNow;
}

const LaunchToken: React.FC = () => {
  const { state, dispatch } = useLaunchToken();
  const [isAvailable, setIsAvailable] = useState<boolean>(!unavailableCountry);

  useEffect(() => {
    checkAvailability().then((result) => {
      setIsAvailable(!result);
      if (result) window.location.href = "/not-available";
    });
  }, []);

  function addLog(item: TimelineGroup) {
    dispatch({
      type: "ADD_TIMELINE_GROUP",
      payload: item,
    });
  }

  function updateTimelineItem(params: {
    groupId: string;
    update: TimeLineItem;
  }) {
    const { groupId, update } = params;
    dispatch({
      type: "UPDATE_TIMELINE_ITEM",
      payload: { groupId, update },
    });
  }

  function setTotalSupply(totalSupply: number) {
    dispatch({
      type: "SET_TOTAL_SUPPLY",
      payload: totalSupply,
    });
  }

  function setTokenAddress(tokenAddress: string) {
    dispatch({
      type: "SET_TOKEN_ADDRESS",
      payload: tokenAddress,
    });
  }

  function setLikes(likes: number) {
    dispatch({
      type: "SET_LIKES",
      payload: likes,
    });
  }

  function setIsLaunched(isLaunched: boolean) {
    dispatch({
      type: "SET_IS_LAUNCHED",
      payload: isLaunched,
    });
  }

  useEffect(() => {
    if (DEBUG) console.log("state", state);
    isErrorNow = state.timelineItems.some((item) => item.status === "error");
    if (DEBUG) console.log("isErrorNow", isErrorNow);
    const mintItems = state.timelineItems.filter((item) =>
      item.groupId.startsWith("minting")
    );
    // if (DEBUG) console.log("mintItems", mintItems);
    const newStatistics = {
      success: 0,
      error: 0,
      waiting: 0,
    };
    mintItems.forEach((item) => {
      if (item.status === "success") {
        newStatistics.success++;
      } else if (item.status === "error") {
        newStatistics.error++;
      } else if (item.status === "waiting") {
        newStatistics.waiting++;
      }
    });

    statistics = newStatistics;
    // if (DEBUG) console.log("Updated statistics:", statistics);
  }, [state]);

  const handleLaunchButtonClick = async (data: LaunchCollectionData) => {
    if (DEBUG) console.log("Launching token:", data);

    dispatch({ type: "SET_TOKEN_DATA", payload: data });
    dispatch({ type: "SET_TIMELINE_GROUPS", payload: [] });
    dispatch({ type: "SET_TOTAL_SUPPLY", payload: 0 });
    dispatch({ type: "SET_TOKEN_ADDRESS", payload: "launching" });
    dispatch({ type: "SET_LIKES", payload: 0 });
    dispatch({ type: "SET_IS_LAUNCHED", payload: false });
    window.scrollTo({ top: 0, behavior: "instant" });

    launchNFT({
      data,
      addLog,
      updateTimelineItem,
      setTotalSupply,
      setTokenAddress,
      setLikes,
      isError,
      getMintStatistics,
      setIsLaunched,
    });
  };

  return (
    <>
      {isAvailable && (
        <>
          {state.tokenData && (
            <TokenProgress
              caption={
                state.isLaunched
                  ? state.tokenData.mintType === "collection"
                    ? "NFT Collection Launched"
                    : "NFT Minted"
                  : state.tokenData.mintType === "collection"
                  ? "Launching NFT Collection"
                  : "Minting NFT"
              }
              items={state.timelineItems}
              tokenAddress={state.tokenAddress}
              image={state.tokenData.imageURL ?? "/img/minanft.png"}
              likes={state.likes}
              name={state.tokenData.name ?? state.tokenData.symbol}
              symbol={state.tokenData.symbol}
              totalSupply={state.totalSupply}
              isLiked={true}
            />
          )}
          {!state.tokenData && (
            <LaunchForm onLaunch={handleLaunchButtonClick} />
          )}
        </>
      )}
      {!isAvailable && <NotAvailable />}
    </>
  );
};

export default LaunchToken;
