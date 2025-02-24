import { Orderbook, Order } from "@/components/orderbook/OrderBook";
import { TokenAction } from "@/lib/token";
import { NftInfo } from "@silvana-one/api";
import { useState, useEffect } from "react";
import {
  TokenBuyTransactionParams,
  TokenSellTransactionParams,
} from "@silvana-one/api";
import { useContext } from "react";
import { AddressContext } from "@/context/address";

export function OrderbookTab({
  collectionAddress,
  nftAddress,
  nftInfo,
  symbol,
  decimals,
  onSubmit,
  tab,
}: {
  collectionAddress: string;
  nftAddress: string;
  nftInfo: NftInfo;
  symbol: string;
  decimals: number;
  onSubmit: (data: any) => void;
  tab: TokenAction;
}) {
  const [bids, setBids] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { address } = useContext(AddressContext);

  const handleSubmit = (order: Order) => {
    // onSubmit({
    //   symbol,
    //   txs: [
    //     {
    //       txType:
    //         tab === "orderbook"
    //           ? order.type === "offer"
    //             ? "token:offer:buy"
    //             : "token:bid:sell"
    //           : order.type === "offer"
    //           ? "token:offer:withdraw"
    //           : "token:bid:withdraw",
    //       amount: order.amount * 10 ** decimals,
    //       tokenAddress,
    //       sender: tokenState?.adminAddress,
    //       offerAddress: order.type === "offer" ? order.address : undefined,
    //       bidAddress: order.type === "bid" ? order.address : undefined,
    //     } as TokenBuyTransactionParams | TokenSellTransactionParams,
    //   ],
    // });
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
            enableButtons={true}
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
