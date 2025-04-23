"use client";

import React, { createContext, useReducer, useContext, ReactNode } from "react";
import { TokenAction } from "@/lib/token";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
// import { Order } from "@/components/orderbook/OrderBook";
import { TokenHolder, TransactionData } from "@/lib/api";
import { log } from "@/lib/log";
interface NFTDetailsState {
  info: NftInfo | undefined;
  transactions?: TransactionData[];
  action: TokenAction | undefined;
  // bid: Order | undefined;
  // offer: Order | undefined;
  isPriceLoaded: boolean;
  likes: number;
  like: boolean;
}

interface CollectionDetailsState {
  info: CollectionInfo | undefined;
  holders?: TokenHolder[];
  transactions?: TransactionData[];
  action: TokenAction | undefined;
  likes: number;
  like: boolean;
}

interface UserDetailsState {
  avatar?: { collectionAddress: string; tokenAddress: string };
  nfts?: { collectionAddress: string; tokenAddress: string }[];
  transactions?: TransactionData[];
}

interface TokenDetailsStates {
  nfts: {
    [collectionAddress: string]: { [tokenAddress: string]: NFTDetailsState };
  };
  collections: { [collectionAddress: string]: CollectionDetailsState };
  users: { [userAddress: string]: UserDetailsState };
  likes: { [tokenAddress: string]: number };
  list: NftInfo[];
  favorites: string[];
}
type Action =
  | {
      type: "SET_NFT_INFO";
      payload: {
        collectionAddress: string;
        tokenAddress: string;
        info: NftInfo;
      };
    }
  | {
      type: "SET_COLLECTION_INFO";
      payload: { collectionAddress: string; info: CollectionInfo };
    }
  | {
      type: "SET_NFT_LIKES";
      payload: {
        collectionAddress: string;
        tokenAddress: string;
        likes: number;
      }[];
    }
  | {
      type: "SET_COLLECTION_LIKES";
      payload: { collectionAddress: string; likes: number };
    }
  | {
      type: "ADD_NFT_LIKE";
      payload: { collectionAddress: string; tokenAddress: string };
    }
  | {
      type: "ADD_COLLECTION_LIKE";
      payload: { collectionAddress: string };
    }
  | {
      type: "SET_HOLDERS";
      payload: { collectionAddress: string; holders: TokenHolder[] };
    }
  | {
      type: "SET_NFT_TRANSACTIONS";
      payload: {
        collectionAddress: string;
        tokenAddress: string;
        transactions: TransactionData[];
      };
    }
  | {
      type: "SET_COLLECTION_TRANSACTIONS";
      payload: {
        collectionAddress: string;
        transactions: TransactionData[];
      };
    }
  | {
      type: "SET_NFT_ACTION";
      payload: {
        collectionAddress: string;
        tokenAddress: string;
        action: TokenAction | undefined;
      };
    }
  | {
      type: "SET_COLLECTION_ACTION";
      payload: { collectionAddress: string; action: TokenAction | undefined };
    }
  // | {
  //     type: "SET_NFT_BID";
  //     payload: {
  //       collectionAddress: string;
  //       tokenAddress: string;
  //       bid: Order | undefined;
  //     };
  //   }
  // | {
  //     type: "SET_COLLECTION_BID";
  //     payload: { collectionAddress: string; bid: Order | undefined };
  //   }
  // | {
  //     type: "SET_NFT_OFFER";
  //     payload: {
  //       collectionAddress: string;
  //       tokenAddress: string;
  //       offer: Order | undefined;
  //     };
  //   }
  // | {
  //     type: "SET_COLLECTION_OFFER";
  //     payload: { collectionAddress: string; offer: Order | undefined };
  //   }
  | {
      type: "SET_ITEMS";
      payload: { items: NftInfo[] };
    }
  | {
      type: "SET_FAVORITES";
      payload: { favorites: string[] };
    }
  | {
      type: "ADD_FAVORITE";
      payload: { tokenAddress: string };
    }
  | {
      type: "SET_USER_AVATAR";
      payload: {
        userAddress: string;
        avatar: { collectionAddress: string; tokenAddress: string };
      };
    }
  | {
      type: "SET_USER_NFTS";
      payload: {
        userAddress: string;
        nfts: { collectionAddress: string; tokenAddress: string }[];
      };
    }
  | {
      type: "SET_USER_TRANSACTIONS";
      payload: {
        userAddress: string;
        transactions: TransactionData[];
      };
    }
  | {
      type: "ADD_USER_TRANSACTIONS";
      payload: {
        userAddress: string;
        transactions: TransactionData[];
      };
    };

const initialState: TokenDetailsStates = {
  nfts: {},
  collections: {},
  list: [],
  favorites: [],
  likes: {},
  users: {},
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
    case "SET_NFT_INFO":
      return {
        ...state,
        nfts: {
          ...state.nfts,
          [action.payload.collectionAddress]: {
            ...(state.nfts[action.payload.collectionAddress] ?? {}),
            [action.payload.tokenAddress]: {
              ...((state.nfts[action.payload.collectionAddress] ?? {})[
                action.payload.tokenAddress
              ] ?? {}),
              info: action.payload.info,
            },
          },
        },
      };

    case "SET_COLLECTION_INFO":
      return {
        ...state,
        collections: {
          ...(state.collections ?? {}),
          [action.payload.collectionAddress]: {
            ...(state.collections[action.payload.collectionAddress] ?? {}),
            info: action.payload.info,
          },
        },
      };

    case "SET_HOLDERS":
      return {
        ...state,
        collections: {
          ...state.collections,
          [action.payload.collectionAddress]: {
            ...state.collections[action.payload.collectionAddress],
            holders: action.payload.holders,
          },
        },
      };
    case "SET_NFT_TRANSACTIONS":
      return {
        ...state,
        nfts: {
          ...state.nfts,
          [action.payload.collectionAddress]: {
            ...state.nfts[action.payload.collectionAddress],
            [action.payload.tokenAddress]: {
              ...state.nfts[action.payload.collectionAddress][
                action.payload.tokenAddress
              ],
              transactions: action.payload.transactions,
            },
          },
        },
      };
    case "SET_COLLECTION_TRANSACTIONS":
      return {
        ...state,
        collections: {
          ...state.collections,
          [action.payload.collectionAddress]: {
            ...state.collections[action.payload.collectionAddress],
            transactions: action.payload.transactions,
          },
        },
      };
    case "SET_NFT_ACTION":
      return {
        ...state,
        nfts: {
          ...state.nfts,
          [action.payload.collectionAddress]: {
            ...state.nfts[action.payload.collectionAddress],
            [action.payload.tokenAddress]: {
              ...state.nfts[action.payload.collectionAddress][
                action.payload.tokenAddress
              ],
              action: action.payload.action,
            },
          },
        },
      };
    case "SET_COLLECTION_ACTION":
      return {
        ...state,
        collections: {
          ...state.collections,
          [action.payload.collectionAddress]: {
            ...state.collections[action.payload.collectionAddress],
            action: action.payload.action,
          },
        },
      };
    // case "SET_NFT_BID":
    //   return {
    //     ...state,
    //     nfts: {
    //       ...state.nfts,
    //       [action.payload.collectionAddress]: {
    //         ...state.nfts[action.payload.collectionAddress],
    //         [action.payload.tokenAddress]: {
    //           ...state.nfts[action.payload.collectionAddress][
    //             action.payload.tokenAddress
    //           ],
    //           bid: action.payload.bid,
    //         },
    //       },
    //     },
    //   };

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
    case "SET_ITEMS":
      return {
        ...state,
        list: action.payload.items,
      };
    case "SET_USER_AVATAR":
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userAddress]: {
            ...state.users[action.payload.userAddress],
            avatar: action.payload.avatar,
          },
        },
      };
    case "SET_USER_NFTS":
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userAddress]: {
            ...state.users[action.payload.userAddress],
            nfts: action.payload.nfts,
          },
        },
      };
    case "SET_USER_TRANSACTIONS":
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userAddress]: {
            ...state.users[action.payload.userAddress],
            transactions: action.payload.transactions,
          },
        },
      };
    case "ADD_USER_TRANSACTIONS":
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userAddress]: {
            ...state.users[action.payload.userAddress],
            transactions: [
              ...(
                state.users[action.payload.userAddress]?.transactions ?? []
              ).filter(
                (existingTx) =>
                  !action.payload.transactions.some(
                    (newTx) => newTx.hash === existingTx.hash
                  )
              ),
              ...action.payload.transactions,
            ],
          },
        },
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
