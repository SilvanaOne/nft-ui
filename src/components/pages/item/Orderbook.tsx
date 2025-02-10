import { Orderbook, Order } from "@/components/orderbook/OrderBook";
import {
  MintAddress,
  TokenAction,
  TokenState,
  TokenActionData,
  TokenActionTransactionParams,
} from "@/lib/token";
import { useState, useEffect } from "react";
import {
  TokenBuyTransactionParams,
  TokenSellTransactionParams,
} from "@minatokens/api";
import { useContext } from "react";
import { AddressContext } from "@/context/address";

export function OrderbookTab({
  tokenAddress,
  tokenState,
  symbol,
  decimals,
  onSubmit,
  tab,
}: {
  tokenAddress: string;
  tokenState: TokenState | undefined;
  symbol: string;
  decimals: number;
  onSubmit: (data: TokenActionData) => void;
  tab: TokenAction;
}) {
  const [bids, setBids] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { address } = useContext(AddressContext);

  const handleSubmit = (order: Order) => {
    onSubmit({
      symbol,
      txs: [
        {
          txType:
            tab === "orderbook"
              ? order.type === "offer"
                ? "token:offer:buy"
                : "token:bid:sell"
              : order.type === "offer"
              ? "token:offer:withdraw"
              : "token:bid:withdraw",
          amount: order.amount * 10 ** decimals,
          tokenAddress,
          sender: tokenState?.adminAddress,
          offerAddress: order.type === "offer" ? order.address : undefined,
          bidAddress: order.type === "bid" ? order.address : undefined,
        } as TokenBuyTransactionParams | TokenSellTransactionParams,
      ],
    });
  };

  return (
    <div>
      {isLoaded ? (
        <div className="flex items-center justify-center">
          <Orderbook
            bids={bids}
            offers={offers}
            bidSymbol="MINA"
            offerSymbol="MINA"
            priceSymbol={"MINA"}
            tab={tab}
            enableButtons={tokenState !== undefined}
            onSubmit={handleSubmit}
            offersTitle={"Offers"}
            bidsTitle={"Bids"}
          />
        </div>
      ) : (
        <div className="mb-2 flex items-left">
          <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
            Loading...
          </span>
        </div>
      )}
    </div>
  );
}
