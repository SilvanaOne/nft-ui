// src/providers/counter-store-provider.tsx
"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import { type TransactionStore, createTransactionStore } from "./action";

export type TransactionStoreApi = ReturnType<typeof createTransactionStore>;

export const TransactionStoreContext = createContext<
  TransactionStoreApi | undefined
>(undefined);

export interface TransactionStoreProviderProps {
  children: ReactNode;
}

export const TransactionStoreProvider = ({
  children,
}: TransactionStoreProviderProps) => {
  const storeRef = useRef<TransactionStoreApi>(null);
  if (!storeRef?.current) {
    storeRef.current = createTransactionStore();
  }

  return (
    <TransactionStoreContext.Provider value={storeRef.current}>
      {children}
    </TransactionStoreContext.Provider>
  );
};

export const useTransactionStore = <T,>(
  selector: (store: TransactionStore) => T
): T => {
  const transactionStoreContext = useContext(TransactionStoreContext);

  if (!transactionStoreContext) {
    throw new Error(
      `useTransactionStore must be used within TransactionStoreProvider`
    );
  }

  return useStore(transactionStoreContext, selector);
};
