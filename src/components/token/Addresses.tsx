/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { checkAddress } from "@/lib/address";
import { MintAddress } from "@/lib/token";

export interface MintAddressesProps {
  onSubmit: (mintAddresses: MintAddress[]) => void;
  onChange: (mintAddresses: MintAddress[]) => void;
  title?: string;
  buttonText: string;
  addresses: MintAddress[];
}

export function Addresses({
  onSubmit,
  onChange,
  title,
  buttonText,
  addresses,
}: MintAddressesProps) {
  async function onChangeAddress(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const newAddresses = [...addresses];
    newAddresses[index].address = e.target.value;
    onChange(newAddresses);

    const isValid =
      e.target.value.length === 0 ? true : await checkAddress(e.target.value);
    if (isValid) {
      e.target.style.border = "";
    } else {
      e.target.style.border = "2px solid red";
    }
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(addresses);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-jacarta-700 rounded-lg shadow-lg">
      <div className="p-6">
        {title && (
          <h5 className="text-lg font-semibold mb-4 text-jacarta-700 dark:text-white">
            {title}
          </h5>
        )}

        <div className="relative my-3 flex items-center" key="title-mint">
          <div className="w-1/4 flex justify-center">
            <label className="mb-3 text-sm block font-display font-semibold text-jacarta-700 dark:text-white text-center">
              Amount
            </label>
          </div>

          <div className="w-3/4 flex justify-center">
            <label className="mb-3 text-sm block font-display font-semibold text-jacarta-700 dark:text-white text-center">
              Address
            </label>
          </div>
        </div>

        {addresses.map((address, index) => (
          <div className="relative flex items-center mb-3" key={index}>
            <button
              onClick={() => onChange(addresses.filter((_, i) => i !== index))}
              className="flex h-12 w-12 shrink-0 items-center justify-center self-end rounded-l-lg border border-r-0 border-jacarta-100 bg-jacarta-50 hover:bg-jacarta-100 dark:border-jacarta-600 dark:bg-jacarta-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="h-6 w-6 fill-jacarta-500 dark:fill-jacarta-300"
              >
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"></path>
              </svg>
            </button>

            <div className="w-1/5">
              <input
                type="number"
                className="h-12 w-full border border-r-0 border-jacarta-100 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                placeholder="amount"
                value={address.amount}
                onChange={(e) => {
                  onChange(
                    addresses.map((item, i) =>
                      i === index
                        ? { ...item, amount: parseFloat(e.target.value) }
                        : item
                    )
                  );
                }}
              />
            </div>

            <div className="w-4/5">
              <input
                type="text"
                className="h-12 w-full rounded-r-lg border border-jacarta-100 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                placeholder="address (B62...)"
                value={address.address}
                onChange={(e) => onChangeAddress(index, e)}
              />
            </div>
          </div>
        ))}

        <button
          onClick={() => onChange([...addresses, { amount: "", address: "" }])}
          className="mt-2 rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
        >
          Add More
        </button>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmit}
            className="rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
