"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";
import { DeployedTokenInfo, TokenState, TokenAction } from "@/lib/token";
import { Order } from "@/components/orderbook/OrderBook";
import {
  BlockberryTokenTransaction,
  BlockberryTokenHolder,
} from "@/lib/blockberry-tokens";
import { log } from "@/lib/log";
interface TokenDetailsState {
  info: DeployedTokenInfo | undefined;
  tokenState: TokenState | undefined;
  holders: BlockberryTokenHolder[];
  transactions: BlockberryTokenTransaction[];
  action: TokenAction | undefined;
  bid: Order | undefined;
  offer: Order | undefined;
  isPriceLoaded: boolean;
}

interface TokenDetailsStates {
  tokens: { [tokenAddress: string]: TokenDetailsState };
  likes: { [tokenAddress: string]: number };
  list: DeployedTokenInfo[];
  favorites: string[];
}
type Action =
  | {
      type: "SET_TOKEN_INFO";
      payload: { tokenAddress: string; info: DeployedTokenInfo };
    }
  | {
      type: "SET_TOKEN_STATE";
      payload: { tokenAddress: string; tokenState: TokenState };
    }
  | {
      type: "SET_LIKES";
      payload: { tokenAddress: string; likes: number }[];
    }
  | {
      type: "ADD_LIKE";
      payload: { tokenAddress: string };
    }
  | {
      type: "SET_HOLDERS";
      payload: { tokenAddress: string; holders: BlockberryTokenHolder[] };
    }
  | {
      type: "SET_TRANSACTIONS";
      payload: {
        tokenAddress: string;
        transactions: BlockberryTokenTransaction[];
      };
    }
  | {
      type: "SET_ACTION";
      payload: { tokenAddress: string; action: TokenAction | undefined };
    }
  | {
      type: "SET_BID";
      payload: { tokenAddress: string; bid: Order | undefined };
    }
  | {
      type: "SET_OFFER";
      payload: { tokenAddress: string; offer: Order | undefined };
    }
  | {
      type: "SET_IS_PRICE_LOADED";
      payload: { tokenAddress: string; isPriceLoaded: boolean };
    }
  | {
      type: "SET_ITEMS";
      payload: { items: DeployedTokenInfo[] };
    }
  | {
      type: "SET_FAVORITES";
      payload: { favorites: string[] };
    }
  | {
      type: "ADD_FAVORITE";
      payload: { tokenAddress: string };
    };

const initialState: TokenDetailsStates = {
  tokens: {},
  list: [],
  favorites: [],
  likes: {},
};

const TokenDetailsContext = createContext<{
  state: TokenDetailsStates;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => {
    log.error(
      "Error: Dispatch TokenDetailsContext called but no provider found"
    );
    return null;
  },
});

const tokenDetailsReducer = (
  state: TokenDetailsStates,
  action: Action
): TokenDetailsStates => {
  switch (action.type) {
    case "SET_TOKEN_INFO":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            info: action.payload.info,
          },
        },
      };
    case "SET_TOKEN_STATE":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            tokenState: action.payload.tokenState,
          },
        },
      };

    case "SET_LIKES":
      return {
        ...state,
        likes: {
          ...state.likes,
          ...action.payload.reduce((acc: Record<string, number>, curr) => {
            acc[curr.tokenAddress] = curr.likes;
            return acc;
          }, {}),
        },
      };

    case "ADD_LIKE": {
      const tokenDetails = state.tokens[action.payload.tokenAddress];
      if (!tokenDetails?.info) return state;

      return {
        ...state,
        likes: {
          ...state.likes,
          [action.payload.tokenAddress]:
            (state.likes[action.payload.tokenAddress] || 0) + 1,
        },
      };
    }
    case "SET_HOLDERS":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            holders: action.payload.holders,
          },
        },
      };
    case "SET_TRANSACTIONS":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            transactions: action.payload.transactions,
          },
        },
      };
    case "SET_ACTION":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            action: action.payload.action,
          },
        },
      };
    case "SET_BID":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            bid: action.payload.bid,
          },
        },
      };
    case "SET_OFFER":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            offer: action.payload.offer,
          },
        },
      };
    case "SET_IS_PRICE_LOADED":
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [action.payload.tokenAddress]: {
            ...state.tokens[action.payload.tokenAddress],
            isPriceLoaded: action.payload.isPriceLoaded,
          },
        },
      };
    case "SET_ITEMS":
      return {
        ...state,
        list: action.payload.items,
        tokens: {
          ...state.tokens,
          ...action.payload.items.reduce<Record<string, TokenDetailsState>>(
            (acc, curr) => {
              acc[curr.tokenAddress] = {
                ...state.tokens[curr.tokenAddress],
                info: curr,
              };
              return acc;
            },
            {}
          ),
        },
      };
    case "SET_FAVORITES":
      return {
        ...state,
        favorites: action.payload.favorites,
      };
    case "ADD_FAVORITE":
      return {
        ...state,
        favorites: state.favorites.includes(action.payload.tokenAddress)
          ? state.favorites
          : [...state.favorites, action.payload.tokenAddress],
      };
    default:
      return state;
  }
};

export const TokenDetailsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(tokenDetailsReducer, initialState);

  return (
    <TokenDetailsContext.Provider value={{ state, dispatch }}>
      {children}
    </TokenDetailsContext.Provider>
  );
};

export const useTokenDetails = () => useContext(TokenDetailsContext);
