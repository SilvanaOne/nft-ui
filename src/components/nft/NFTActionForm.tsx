"use client";
/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { checkAddress } from "@/lib/address";
import { TokenActionFormData } from "@/context/action";

export interface TokenActionFormProps {
  onSubmit: (data: TokenActionFormData, isSecondButton: boolean) => void;
  onChange: (data: TokenActionFormData) => void;
  title?: string;
  buttonText: string;
  data: TokenActionFormData;
  showPrice: boolean;
  showAmount: boolean;
  showAddMore: boolean;
  showAddress: boolean;
  showSalePrice: boolean;
  price?: number;
  showSecondButton?: boolean;
  secondButtonText?: string;
  disableButton?: boolean;
}

export function TokenActionForm({
  onSubmit,
  onChange,
  title,
  buttonText,
  data,
  showAddress,
  showPrice,
  showSalePrice,
  showAddMore,
  showAmount,
  price,
  showSecondButton,
  secondButtonText,
  disableButton,
}: TokenActionFormProps) {
  async function onChangeAddress(
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const newAddresses = [...data.addresses];
    newAddresses[index] = e.target.value;
    onChange({ ...data, addresses: newAddresses });

    const isValid =
      e.target.value.length === 0 ? true : await checkAddress(e.target.value);
    if (isValid) {
      e.target.style.border = "";
    } else {
      e.target.style.border = "2px solid red";
    }
  }

  // async function onChangeAmount(e: React.ChangeEvent<HTMLInputElement>) {
  //   onChange({ ...data, amount: parseFloat(e.target.value) });
  // }

  // async function onChangePrice(e: React.ChangeEvent<HTMLInputElement>) {
  //   onChange({ ...data, price: parseFloat(e.target.value) });
  // }

  const handleSubmit = (isSecondButton: boolean) => {
    if (onSubmit) {
      onSubmit(data, isSecondButton);
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
        {showSalePrice && (
          <h5 className="text-sm mb-4 text-jacarta-700 dark:text-white">
            Sale Price : {price ? price?.toString() + " MINA" : "Not on sale"}
          </h5>
        )}
        {showAddress && (
          <>
            <div className="relative my-3 flex items-center" key="title-mint">
              <div className="w-3/4 flex justify-center">
                <label className="mb-3 text-sm block font-display font-semibold text-jacarta-700 dark:text-white text-center">
                  Address
                </label>
              </div>
            </div>

            {/* TODO: add custom memo */}

            {(data?.addresses ?? []).map((address, index) => (
              <div className="relative flex items-center mb-3" key={index}>
                <button
                  onClick={() =>
                    onChange({
                      ...data,
                      addresses: data.addresses.filter((_, i) => i !== index),
                    })
                  }
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

                <div className="w-4/5">
                  <input
                    type="text"
                    className="h-12 w-full rounded-r-lg border border-jacarta-100 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                    placeholder="address (B62...)"
                    value={address ?? ""}
                    onChange={(e) => onChangeAddress(index, e)}
                  />
                </div>
              </div>
            ))}

            {showAddMore && (
              <button
                onClick={() =>
                  onChange({
                    ...data,
                    addresses: [...data.addresses, ""],
                  })
                }
                className="mt-2 rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
              >
                Add More
              </button>
            )}
          </>
        )}

        {(showPrice || showAmount) && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            {showAmount && (
              <div>
                <label className="mb-2 block font-display text-sm font-semibold text-jacarta-700 dark:text-white">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-jacarta-100 py-3 px-3 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                  placeholder="Enter amount"
                  value={data.amount ?? ""}
                  onChange={(e) => {
                    let amount = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    if (amount===0) {
                      amount = undefined;
                    }
                    onChange({
                      ...data,
                      amount,
                    });
                  }}
                />
              </div>
            )}
            {showPrice && (
              <div>
                <label className="mb-2 block font-display text-sm font-semibold text-jacarta-700 dark:text-white">
                  Price
                </label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-jacarta-100 py-3 px-3 text-sm focus:ring-inset focus:ring-accent dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white dark:placeholder-jacarta-300"
                  placeholder="Enter price"
                  value={data.salePrice ?? ""}
                  onChange={(e) => {
                    let amount = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    if (amount===0) {
                      amount = undefined;
                    }
                    onChange({
                      ...data,
                      salePrice: amount,
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => handleSubmit(false)}
            disabled={disableButton}
            className={`rounded-full py-3 px-8 text-center font-semibold text-white transition-all ${
              disableButton
                ? "bg-jacarta-300 cursor-not-allowed"
                : "bg-accent shadow-accent-volume hover:bg-accent-dark"
            }`}
          >
            {buttonText}
          </button>
          {showSecondButton && (
            <button
              onClick={() => handleSubmit(true)}
              className="ml-8 rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
            >
              {secondButtonText ?? "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
