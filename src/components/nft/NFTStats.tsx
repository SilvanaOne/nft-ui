"use client";
import { Holders } from "./Holders";
import { NftStateTab } from "./NFTState";
import { NftActionsTab } from "./NFTActions";
import { NftStateTabLoading } from "./NFTStateLoading";
import { NotImplemented } from "./NotImplemented";
import { NftInfo, CollectionInfo } from "@silvana-one/api";
import { Transactions } from "./Transactions";
//import History from "./History";
import {
  BlockberryTokenHolder,
  BlockberryTokenTransaction,
} from "@/lib/blockberry-tokens";

interface NftStatsProps {
  tokenAddress: string;
  collectionAddress: string;
  nftInfo: NftInfo | undefined;
  collectionInfo: CollectionInfo | undefined;
  holders: BlockberryTokenHolder[];
  transactions: BlockberryTokenTransaction[];
}

/*
{
    "age": 1728924660000,
    "status": "applied",
    "proverAddress": "B62qo69VLUPMXEC6AFWRgjdTEGsA3xKvqeU5CgYm3jAbBJL7dTvaQkv",
    "hash": "5Jv4QXdBK8vvceCtbEoHt5YwVqm5Z9HkhTokoKDCqBxWRCKweL9A",
    "fee": 0.2,
    "memo": "mint 2000 PNDFI",
    "nonce": 173,
}
*/

export function NftStats({
  transactions,
  tokenAddress,
  collectionAddress,
  nftInfo,
  collectionInfo,
  holders,
}: NftStatsProps) {
  return (
    <div className="scrollbar-custom mt-14 overflow-x-auto rounded-lg">
      <div className="min-w-fit">
        {/* Tabs Nav */}
        <ul className="nav nav-tabs flex items-center" role="tablist">
          {/* Trade */}
          {/* <li className="nav-item" role="presentation">
            <button
              className="nav-link active relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="trade-tab"
              data-bs-toggle="tab"
              data-bs-target="#trade"
              type="button"
              role="tab"
              aria-controls="trade"
              aria-selected="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M11.95 7.95l-1.414 1.414L8 6.828 8 20H6V6.828L3.465 9.364 2.05 7.95 7 3l4.95 4.95zm10 8.1L17 21l-4.95-4.95 1.414-1.414 2.537 2.536L16 4h2v13.172l2.536-2.536 1.414 1.414z" />
              </svg>
              <span className="font-display text-base font-medium">Trade</span>
            </button>
          </li> */}

          {/* Actions Panel */}
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="actions-tab"
              data-bs-toggle="tab"
              data-bs-target="#actions"
              type="button"
              role="tab"
              aria-controls="actions"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M11.95 7.95l-1.414 1.414L8 6.828 8 20H6V6.828L3.465 9.364 2.05 7.95 7 3l4.95 4.95zm10 8.1L17 21l-4.95-4.95 1.414-1.414 2.537 2.536L16 4h2v13.172l2.536-2.536 1.414 1.414z" />
              </svg>
              <span className="font-display text-base font-medium">
                Actions
              </span>
            </button>
          </li>

          {/* State */}
          <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="state-tab"
              data-bs-toggle="tab"
              data-bs-target="#state"
              type="button"
              role="tab"
              aria-controls="state"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M20 22H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1zm-1-2V4H5v16h14zM7 6h4v4H7V6zm0 6h10v2H7v-2zm0 4h10v2H7v-2zm6-9h4v2h-4V7z" />
              </svg>
              <span className="font-display text-base font-medium">State</span>
            </button>
          </li>

          {/* Holders */}
          {/* <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="holders-tab"
              data-bs-toggle="tab"
              data-bs-target="#holders"
              type="button"
              role="tab"
              aria-controls="holders"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M8 4h13v2H8V4zm-5-.5h3v3H3v-3zm0 7h3v3H3v-3zm0 7h3v3H3v-3zM8 11h13v2H8v-2zm0 7h13v2H8v-2z" />
              </svg>
              <span className="font-display text-base font-medium">
                Holders
              </span>
            </button>
          </li> */}

          {/* Properties */}
          {/* <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="properties-tab"
              data-bs-toggle="tab"
              data-bs-target="#properties"
              type="button"
              role="tab"
              aria-controls="properties"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M6.17 18a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2v-2h4.17zm6-7a3.001 3.001 0 0 1 5.66 0H22v2h-4.17a3.001 3.001 0 0 1-5.66 0H2v-2h10.17zm-6-7a3.001 3.001 0 0 1 5.66 0H22v2H11.83a3.001 3.001 0 0 1-5.66 0H2V4h4.17z" />
              </svg>
              <span className="font-display text-base font-medium">
                Properties
              </span>
            </button>
          </li> */}

          {/* Activity */}
          <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="activity-tab"
              data-bs-toggle="tab"
              data-bs-target="#activity"
              type="button"
              role="tab"
              aria-controls="activity"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M11.95 7.95l-1.414 1.414L8 6.828 8 20H6V6.828L3.465 9.364 2.05 7.95 7 3l4.95 4.95zm10 8.1L17 21l-4.95-4.95 1.414-1.414 2.537 2.536L16 4h2v13.172l2.536-2.536 1.414 1.414z" />
              </svg>
              <span className="font-display text-base font-medium">
                Transactions
              </span>
            </button>
          </li>

          {/* Admin Panel */}
          <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="admin-tab"
              data-bs-toggle="tab"
              data-bs-target="#admin"
              type="button"
              role="tab"
              aria-controls="admin"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M11.95 7.95l-1.414 1.414L8 6.828 8 20H6V6.828L3.465 9.364 2.05 7.95 7 3l4.95 4.95zm10 8.1L17 21l-4.95-4.95 1.414-1.414 2.537 2.536L16 4h2v13.172l2.536-2.536 1.414 1.414z" />
              </svg>
              <span className="font-display text-base font-medium">Admin</span>
            </button>
          </li>

          {/* Price History */}
          {/* <li className="nav-item" role="presentation">
            <button
              className="nav-link relative flex items-center whitespace-nowrap py-3 px-6 text-jacarta-400 hover:text-jacarta-700 dark:hover:text-white"
              id="price-history-tab"
              data-bs-toggle="tab"
              data-bs-target="#price-history"
              type="button"
              role="tab"
              aria-controls="price-history"
              aria-selected="false"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="mr-1 h-5 w-5 fill-current"
              >
                <path fill="none" d="M0 0H24V24H0z" />
                <path d="M5 3v16h16v2H3V3h2zm15.293 3.293l1.414 1.414L16 13.414l-3-2.999-4.293 4.292-1.414-1.414L13 7.586l3 2.999 4.293-4.292z" />
              </svg>
              <span className="font-display text-base font-medium">
                Price History
              </span>
            </button>
          </li> */}
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Offers */}
          {/* <div
            className="tab-pane fade"
            id="holders"
            role="tabpanel"
            aria-labelledby="holders-tab"
          >
            <Holders holders={holders} />
          </div> */}

          {/* Properties */}
          {/* <div
            className="tab-pane fade"
            id="properties"
            role="tabpanel"
            aria-labelledby="properties-tab"
          >
            <Properties />
          </div> */}

          <div
            className="tab-pane fade show active"
            id="actions"
            role="tabpanel"
            aria-labelledby="actions-tab"
          >
            <NftActionsTab
              tokenAddress={tokenAddress}
              collectionAddress={collectionAddress}
              nftInfo={nftInfo}
              collectionInfo={collectionInfo}
              actions="actions"
            />
          </div>

          {/* Details */}

          <div
            className="tab-pane fade "
            id="state"
            role="tabpanel"
            aria-labelledby="state-tab"
          >
            {nftInfo && (
              <NftStateTab
                nftInfo={nftInfo}
                collectionInfo={collectionInfo}
                tokenAddress={tokenAddress}
                collectionAddress={collectionAddress}
              />
            )}
            {!nftInfo && <NftStateTabLoading />}
          </div>

          {/* Activity */}
          <div
            className="tab-pane fade"
            id="activity"
            role="tabpanel"
            aria-labelledby="activity-tab"
          >
            {/* Filter */}
            <Transactions transactions={transactions} />
          </div>

          {/* Trade */}
          {/* <div
            className="tab-pane fade show active"
            id="trade"
            role="tabpanel"
            aria-labelledby="trade-tab"
          >
            <NftActionsTab
              tokenAddress={tokenAddress}
              collectionAddress={collectionAddress}
              nftInfo={nftInfo}
              collectionInfo={collectionInfo}
              actions="actions"
            />
          </div> */}

          <div
            className="tab-pane fade"
            id="admin"
            role="tabpanel"
            aria-labelledby="admin-tab"
          >
            <NftActionsTab
              tokenAddress={tokenAddress}
              collectionAddress={collectionAddress}
              nftInfo={nftInfo}
              collectionInfo={collectionInfo}
              actions="administrative_actions"
            />
          </div>

          {/* Price History */}
          {/* <div
            className="tab-pane fade"
            id="price-history"
            role="tabpanel"
            aria-labelledby="price-history-tab"
          >
            <History />
          </div> */}
        </div>
        {/* end tab content */}
      </div>
    </div>
  );
}
