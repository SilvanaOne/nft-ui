"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { log } from "@/lib/log";
import { explorerAccountUrl } from "@/lib/chain";
import { TokenAction } from "@/lib/token";
import { getChain } from "@/lib/chain";
const chain = getChain();

function formatBalance(num: number | undefined): string {
  if (num === undefined) return "-";
  const fixed = num.toLocaleString(undefined, {
    maximumSignificantDigits: 3,
  });
  return fixed;
}

export type Order = {
  address: string;
  price: number;
  amount: number;
  type: "bid" | "offer";
};

export type OrderbookProps = {
  bids: Order[];
  offers: Order[];
  bidSymbol: string;
  offerSymbol: string;
  priceSymbol: string;
  enableButtons: boolean;
  onSubmit: (data: Order) => void;
  tab: TokenAction;
  offersTitle: string;
  bidsTitle: string;
};

export function Orderbook({
  bids,
  offers,
  bidSymbol,
  offerSymbol,
  priceSymbol,
  tab,
  offersTitle,
  bidsTitle,
  onSubmit,
  enableButtons,
}: OrderbookProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    offers.length > 0 ? offers[0] : bids.length > 0 ? bids[0] : null
  );
  const [amount, setAmount] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setAmount(order.amount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleAccept = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedOrder) return;
    const acceptedOrder: Order = {
      ...selectedOrder,
      amount: parseFloat(amount),
    };

    log.info("Order accepted:", acceptedOrder);
    onSubmit(acceptedOrder);
    setIsConfirmOpen(false);
    setSelectedOrder(null);
    setAmount("");
  };

  return (
    <section className="relative">
      <div className="container">
        <div className="w-full max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offers Column */}
            <div className="min-w-[300px]">
              <h3 className="text-lg font-semibold mb-4 text-jacarta-700 dark:text-white text-center">
                {offersTitle}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-2 ml-4 mr-4 text-base font-medium text-jacarta-700 dark:text-white">
                <div>Amount in {offerSymbol}</div>
                <div className="text-right">Price in {priceSymbol}</div>
              </div>

              <div className="space-y-2">
                {offers.length > 0 &&
                  offers.map((offer) => (
                    <OrderRow
                      key={offer.address}
                      order={offer}
                      type="offer"
                      onClick={() => handleOrderClick(offer)}
                      isSelected={selectedOrder?.address === offer.address}
                    />
                  ))}
              </div>

              {offers.length === 0 && (
                <div className="mb-2 flex justify-center items-center">
                  <span className="dark:text-jacarta-500">No offers</span>
                </div>
              )}
            </div>

            {/* Bids Column */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-jacarta-700 dark:text-white text-center">
                {bidsTitle}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-2 ml-4 mr-4 text-base font-medium text-jacarta-700 dark:text-white">
                <div>Amount in {bidSymbol}</div>
                <div className="text-right">Price in {priceSymbol}</div>
              </div>
              {bids.length > 0 && (
                <div className="space-y-2">
                  {bids.map((bid) => (
                    <OrderRow
                      key={bid.address}
                      order={bid}
                      type="bid"
                      onClick={() => handleOrderClick(bid)}
                      isSelected={selectedOrder?.address === bid.address}
                    />
                  ))}
                </div>
              )}
              {bids.length === 0 && (
                <div className="mb-2 flex justify-center items-center">
                  <span className="dark:text-jacarta-500">No bids</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Input Section */}
          {selectedOrder && (
            <div className="mt-6 p-4 border border-jacarta-100 dark:border-jacarta-600 rounded-lg bg-white dark:bg-jacarta-700">
              <h3 className="text-lg font-semibold mb-4 text-jacarta-700 dark:text-white">
                {tab === "orderbook" ? "Accept" : "Withdraw"}{" "}
                {selectedOrder.type === "offer" ? "Offer" : "Bid"}
              </h3>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border border-jacarta-100 bg-white py-2 px-3 text-sm dark:border-jacarta-600 dark:bg-jacarta-700 dark:text-white"
                />
                <Button
                  onClick={handleAccept}
                  disabled={!enableButtons}
                  className="rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
                >
                  {tab === "orderbook"
                    ? selectedOrder.type === "offer"
                      ? `Buy ${offerSymbol}`
                      : `Sell ${bidSymbol}`
                    : selectedOrder.type === "offer"
                    ? `Withdraw ${offerSymbol}`
                    : `Withdraw ${bidSymbol}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        order={selectedOrder}
        tab={tab}
        offerSymbol={offerSymbol}
        bidSymbol={bidSymbol}
        amount={amount}
        symbol={
          tab === "orderbook"
            ? selectedOrder?.type === "offer"
              ? offerSymbol
              : bidSymbol
            : selectedOrder?.type === "offer"
            ? offerSymbol
            : bidSymbol
        }
      />
    </section>
  );
}
interface OrderRowProps {
  order: Order;
  type: "bid" | "offer";
  onClick: () => void;
  isSelected: boolean;
}

function OrderRow({ order, type, onClick, isSelected }: OrderRowProps) {
  const baseClasses =
    "flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border";
  const colorClasses =
    type === "offer"
      ? "border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 text-red"
      : "border-green-200 hover:border-green-300 dark:border-green-800 dark:hover:border-green-700 text-green";
  const selectedClasses = isSelected ? "ring-2 ring-accent" : "";

  return (
    <div
      className={`${baseClasses} ${colorClasses} ${selectedClasses}`}
      onClick={onClick}
    >
      <span className="flex items-center space-x-2">
        {type === "offer" ? (
          <ArrowUpIcon className="w-4 h-4 text-red" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 text-green" />
        )}
        <span>
          <Link
            href={`${explorerAccountUrl()}${order.address}`}
            className="hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {order.amount.toFixed(2)}
          </Link>
        </span>
      </span>
      <span className="font-medium">{formatBalance(order.price)}</span>
    </div>
  );
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  tab,
  offerSymbol,
  bidSymbol,
  order,
  amount,
  symbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tab: TokenAction;
  offerSymbol: string;
  bidSymbol: string;
  order: Order | null;
  amount: string;
  symbol: string;
}) {
  if (!order) return null;
  const total = order.price * parseFloat(amount);
  const exceeded = chain === "mainnet" && total > 500;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Order</DialogTitle>
          <DialogDescription>
            Are you sure you want to{" "}
            {tab === "orderbook"
              ? order.type === "offer"
                ? `buy ${formatBalance(parseFloat(amount))} ${offerSymbol}`
                : `sell ${formatBalance(parseFloat(amount))} ${bidSymbol}`
              : order.type === "offer"
              ? `withdraw ${formatBalance(parseFloat(amount))} ${offerSymbol}`
              : `withdraw ${formatBalance(parseFloat(amount))} ${bidSymbol}`}
            ?
          </DialogDescription>
        </DialogHeader>
        {tab === "orderbook" && (
          <div className="py-4">
            <p>
              <strong className="inline-block w-32">Price:</strong>{" "}
              {formatBalance(order.price)} MINA
            </p>
            <p>
              <strong className="inline-block w-32">Amount:</strong> {amount}{" "}
              {symbol}
            </p>
            <p>
              <strong className="inline-block w-32">Total:</strong>{" "}
              {formatBalance(total)} MINA
            </p>
            {exceeded && (
              <p className="text-red-500">
                Note: This order exceeds the maximum amount for the mainnet
                during the alpha phase. The maximum amount is 500 MINA.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <button
            onClick={onClose}
            className="rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
          >
            Cancel
          </button>
          {!exceeded && (
            <button
              onClick={onConfirm}
              className="rounded-full border-2 border-accent py-2 px-8 text-center text-sm font-semibold text-accent transition-all hover:bg-accent hover:text-white"
            >
              {tab === "orderbook"
                ? order.type === "offer"
                  ? `Buy ${offerSymbol}`
                  : `Sell ${bidSymbol}`
                : order.type === "offer"
                ? `Withdraw ${offerSymbol}`
                : `Withdraw ${bidSymbol}`}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
