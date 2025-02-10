import { createStore, StoreApi } from "zustand/vanilla";
import {
  TimeLineItem,
  TimelineGroup,
  TimelineGroupDated,
  addTimelineGroup,
  updateTimelineGroup,
  updateTimelineItem,
  deleteTimelineGroup,
  TimelineItemStatus,
} from "@/components/launch/TimeLine";
import { TokenActionData, MintAddress, TokenAction } from "@/lib/token";
import { debug } from "@/lib/debug";
const DEBUG = debug();
import { log } from "@/lib/log";

type TabId = string;
type TokenAddress = string;

export interface ActionTab {
  tokenAddress: TokenAddress;
  tab: TabId;
}

export interface TokenActionFormData {
  addresses: MintAddress[];
  amount?: number;
  price?: number;
}

export type TokenActionStatistics = { [key in TimelineItemStatus]: number };

export interface TransactionTokenState extends ActionTab {
  tokenAddress: TokenAddress;
  tab: TabId;
  timelineItems: TimelineGroupDated[];
  formData: TokenActionFormData;
  tokenData: TokenActionData;
  isProcessing: boolean;
  statistics: TokenActionStatistics;
  isErrorNow: boolean;
}

export interface SetFormDataAction extends ActionTab {
  formData: TokenActionFormData;
}

export interface AddTimelineGroupAction extends ActionTab {
  timelineGroup: TimelineGroup;
}

export interface UpdateTimelineGroupAction extends ActionTab {
  groupId: string;
  update: Partial<TimelineGroup>;
}

export interface UpdateTimelineItemAction extends ActionTab {
  groupId: string;
  update: TimeLineItem;
}

export interface DeleteTimelineGroupAction extends ActionTab {
  groupId: string;
}

export interface SetProcessingAction extends ActionTab {
  isProcessing: boolean;
}

function calculateStatistics(timelineItems: TimelineGroup[] = []): {
  statistics: TokenActionStatistics;
  isErrorNow: boolean;
} {
  const items = timelineItems.filter((item) => item.groupId.startsWith("tx"));
  const newStatistics = {
    success: 0,
    error: 0,
    waiting: 0,
  };
  items.forEach((item) => {
    if (item.status === "success") {
      newStatistics.success++;
    } else if (item.status === "error") {
      newStatistics.error++;
    } else if (item.status === "waiting") {
      newStatistics.waiting++;
    }
  });
  return { statistics: newStatistics, isErrorNow: newStatistics.error > 0 };
}

type TransactionStates = {
  transactionStates: {
    [tokenAddress: TokenAddress]: {
      [tab: TabId]: TransactionTokenState;
    };
  };
};

export interface TransactionTokenStore {
  transactionStates: TransactionStates;
  setTokenData: (payload: TransactionTokenState) => void;
  setFormData: (payload: SetFormDataAction) => void;
  addTimelineGroup: (payload: AddTimelineGroupAction) => void;
  updateTimelineGroup: (payload: UpdateTimelineGroupAction) => void;
  updateTimelineItem: (payload: UpdateTimelineItemAction) => void;
  deleteTimelineGroup: (payload: DeleteTimelineGroupAction) => void;
  setIsProcessing: (payload: SetProcessingAction) => void;
}

export type TransactionActions = {
  setTokenData: (payload: TransactionTokenState) => void;
  setFormData: (payload: SetFormDataAction) => void;
  addTimelineGroup: (payload: AddTimelineGroupAction) => void;
  updateTimelineGroup: (payload: UpdateTimelineGroupAction) => void;
  updateTimelineItem: (payload: UpdateTimelineItemAction) => void;
  deleteTimelineGroup: (payload: DeleteTimelineGroupAction) => void;
  setIsProcessing: (payload: SetProcessingAction) => void;
};

export type TransactionStore = TransactionStates & TransactionActions;

export const defaultInitState: TransactionStates = { transactionStates: {} };
export let transactionStore: StoreApi<TransactionStore> | null = null;

export const createTransactionStore = (
  initState: TransactionStates = defaultInitState
) => {
  if (transactionStore) {
    return transactionStore;
  }
  transactionStore = createStore<TransactionStore>()((set) => ({
    ...initState,
    setTokenData: (payload: TransactionTokenState) =>
      set((state) => ({
        transactionStates: {
          ...state.transactionStates,
          [payload.tokenAddress]: {
            ...state.transactionStates[payload.tokenAddress],
            [payload.tab]: payload,
          },
        },
      })),
    setFormData: (payload: SetFormDataAction) =>
      set((state) => ({
        transactionStates: {
          ...state.transactionStates,
          [payload.tokenAddress]: {
            ...state.transactionStates[payload.tokenAddress],
            [payload.tab]: {
              ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
              formData: payload.formData,
            },
          },
        },
      })),
    addTimelineGroup: (payload: AddTimelineGroupAction) =>
      set((state) => {
        const oldState = state.transactionStates;
        const currentItems =
          oldState[payload.tokenAddress]?.[payload.tab]?.timelineItems || [];
        const updatedItems = addTimelineGroup({
          item: payload.timelineGroup,
          items: currentItems,
        });
        const newState = {
          transactionStates: {
            ...state.transactionStates,
            [payload.tokenAddress]: {
              ...state.transactionStates[payload.tokenAddress],
              [payload.tab]: {
                ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
                timelineItems: updatedItems,
              },
            },
          },
        };
        const { statistics, isErrorNow } = calculateStatistics(updatedItems);
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].statistics = statistics;
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].isErrorNow = isErrorNow;
        return newState;
      }),
    updateTimelineGroup: (payload: UpdateTimelineGroupAction) =>
      set((state) => {
        const currentItems =
          state.transactionStates[payload.tokenAddress]?.[payload.tab]
            ?.timelineItems || [];
        const updatedItems = updateTimelineGroup({
          groupId: payload.groupId,
          update: payload.update,
          items: currentItems,
        });
        return {
          transactionStates: {
            ...state.transactionStates,
            [payload.tokenAddress]: {
              ...state.transactionStates[payload.tokenAddress],
              [payload.tab]: {
                ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
                timelineItems: updatedItems,
              },
            },
          },
        };
      }),
    updateTimelineItem: (payload: UpdateTimelineItemAction) =>
      set((state) => {
        const currentItems =
          state.transactionStates[payload.tokenAddress]?.[payload.tab]
            ?.timelineItems || [];
        const updatedItems = updateTimelineItem({
          items: currentItems,
          groupId: payload.groupId,
          update: payload.update,
        });
        const newState = {
          transactionStates: {
            ...state.transactionStates,
            [payload.tokenAddress]: {
              ...state.transactionStates[payload.tokenAddress],
              [payload.tab]: {
                ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
                timelineItems: updatedItems,
              },
            },
          },
        };
        const { statistics, isErrorNow } = calculateStatistics(updatedItems);
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].statistics = statistics;
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].isErrorNow = isErrorNow;
        return newState;
      }),
    deleteTimelineGroup: (payload: DeleteTimelineGroupAction) =>
      set((state) => {
        const currentItems =
          state.transactionStates[payload.tokenAddress]?.[payload.tab]
            ?.timelineItems || [];
        const updatedItems = deleteTimelineGroup({
          groupId: payload.groupId,
          items: currentItems,
        });
        const newState = {
          transactionStates: {
            ...state.transactionStates,
            [payload.tokenAddress]: {
              ...state.transactionStates[payload.tokenAddress],
              [payload.tab]: {
                ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
                timelineItems: updatedItems,
              },
            },
          },
        };
        const { statistics, isErrorNow } = calculateStatistics(updatedItems);
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].statistics = statistics;
        newState.transactionStates[payload.tokenAddress][
          payload.tab
        ].isErrorNow = isErrorNow;
        return newState;
      }),
    setIsProcessing: (payload: SetProcessingAction) =>
      set((state) => ({
        transactionStates: {
          ...state.transactionStates,
          [payload.tokenAddress]: {
            ...state.transactionStates[payload.tokenAddress],
            [payload.tab]: {
              ...state.transactionStates[payload.tokenAddress]?.[payload.tab],
              isProcessing: payload.isProcessing,
            },
          },
        },
      })),
  }));
  return transactionStore;
};
