/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { checkAddress } from "@/lib/address";
import { MintAddress } from "@/lib/token";
import { AddressesModal } from "@/components/token/AddressesModal";

const MINT_TEST = process.env.NEXT_PUBLIC_MINT_TEST === "true";
const initialMintAddresses: MintAddress[] = MINT_TEST
  ? [
      {
        amount: 1000,
        address: "B62qobAYQBkpC8wVnRzydrtCgWdkYTqsfXTcaLdGq1imtqtKgAHN29K",
      },
      {
        amount: 2000,
        address: "B62qiq7iTTP7Z2KEpQ9eF9UVGLiEKAjBpz1yxyd2MwMrxVwpAMLta2h",
      },
    ]
  : [
      {
        amount: "",
        address: "",
      },
    ];

export interface MintAddressesModalProps {
  onSubmit: (mintAddresses: MintAddress[]) => void;
}

export function MintAddressesModal({ onSubmit }: MintAddressesModalProps) {
  return (
    <AddressesModal
      onSubmit={onSubmit}
      title="Mint addresses"
      buttonText="Save"
    />
  );
}
