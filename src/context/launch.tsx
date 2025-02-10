"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";
import {
  TimeLineItem,
  TimelineGroup,
  TimelineGroupDated,
  addTimelineGroup,
  updateTimelineGroup,
  updateTimelineItem,
  deleteTimelineGroup,
  TimelineItemStatus,
  TimelineGroupStatus,
} from "@/components/launch/TimeLine";
import { LaunchTokenData } from "@/lib/token";
import { log } from "@/lib/log";
interface LaunchTokenState {
  timelineItems: TimelineGroupDated[];
  tokenData: LaunchTokenData | null;
  totalSupply: number;
  tokenAddress: string;
  likes: number;
  isLaunched: boolean;
}

type Action =
  | { type: "SET_TOKEN_DATA"; payload: LaunchTokenData }
  | { type: "SET_TIMELINE_GROUPS"; payload: TimelineGroupDated[] }
  | { type: "ADD_TIMELINE_GROUP"; payload: TimelineGroup }
  | {
      type: "UPDATE_TIMELINE_GROUP";
      payload: { groupId: string; update: Partial<TimelineGroup> };
    }
  | {
      type: "UPDATE_TIMELINE_ITEM";
      payload: {
        groupId: string;
        update: TimeLineItem;
      };
    }
  | { type: "DELETE_TIMELINE_GROUP"; payload: string }
  | { type: "SET_TOTAL_SUPPLY"; payload: number }
  | { type: "SET_TOKEN_ADDRESS"; payload: string }
  | { type: "SET_LIKES"; payload: number }
  | { type: "SET_IS_LAUNCHED"; payload: boolean };

const initialState: LaunchTokenState = {
  tokenData: null,
  timelineItems: [],
  totalSupply: 0,
  tokenAddress: "launching",
  likes: 0,
  isLaunched: false,
};

const LaunchTokenContext = createContext<{
  state: LaunchTokenState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => {
    log.error(
      "Error: Dispatch LaunchTokenContext called but no provider found"
    );
    return null;
  },
});

const launchTokenReducer = (
  state: LaunchTokenState,
  action: Action
): LaunchTokenState => {
  switch (action.type) {
    case "SET_TOKEN_DATA":
      return { ...state, tokenData: action.payload };
    case "SET_TIMELINE_GROUPS":
      return { ...state, timelineItems: action.payload };
    case "ADD_TIMELINE_GROUP":
      return {
        ...state,
        timelineItems: addTimelineGroup({
          item: action.payload,
          items: state.timelineItems,
        }),
      };
    case "UPDATE_TIMELINE_GROUP":
      return {
        ...state,
        timelineItems: updateTimelineGroup({
          groupId: action.payload.groupId,
          update: action.payload.update,
          items: state.timelineItems,
        }),
      };
    case "UPDATE_TIMELINE_ITEM":
      return {
        ...state,
        timelineItems: updateTimelineItem({
          items: state.timelineItems,
          groupId: action.payload.groupId,
          update: action.payload.update,
        }),
      };
    case "DELETE_TIMELINE_GROUP":
      return {
        ...state,
        timelineItems: deleteTimelineGroup({
          groupId: action.payload,
          items: state.timelineItems,
        }),
      };
    case "SET_TOTAL_SUPPLY":
      return { ...state, totalSupply: action.payload };
    case "SET_TOKEN_ADDRESS":
      return { ...state, tokenAddress: action.payload };
    case "SET_LIKES":
      return { ...state, likes: action.payload };
    case "SET_IS_LAUNCHED":
      return { ...state, isLaunched: action.payload };
    default:
      return state;
  }
};

export const LaunchTokenProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(launchTokenReducer, initialState);

  return (
    <LaunchTokenContext.Provider value={{ state, dispatch }}>
      {children}
    </LaunchTokenContext.Provider>
  );
};

export const useLaunchToken = () => useContext(LaunchTokenContext);
