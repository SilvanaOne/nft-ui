/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import {
  NftPermissions,
  CollectionPermissions,
  Permissions,
} from "@/lib/token";

export interface PermissionsModalProps {
  onSubmit: (permissions: Permissions) => void;
  title?: string;
  buttonText: string;
  mintType: "nft" | "collection";
}

/*
export class NftPermissions {
  canChangeOwnerByProof?: boolean;
  canTransfer?: boolean;
  canApprove?: boolean;
  canChangeMetadata?: boolean;
  canChangeStorage?: boolean;
  canChangeName?: boolean;
  canChangeMetadataVerificationKeyHash?: boolean;
  canPause?: boolean;
  isPaused?: boolean;
  requireOwnerAuthorizationToUpgrade?: boolean;
  requireTransferApproval?: boolean;

  constructor() {
    this.canChangeOwnerByProof = false;
    this.canTransfer = true;
    this.canApprove = true;
    this.canChangeMetadata = false;
    this.canChangeStorage = false;
    this.canChangeName = false;
    this.canChangeMetadataVerificationKeyHash = false;
    this.canPause = true;
    this.isPaused = false;
    this.requireOwnerAuthorizationToUpgrade = false;
    this.requireTransferApproval = false;
  }

}
*/

type Item = {
  label: string;
  key: string;
  description: string;
  value: boolean;
};

const initialItems: Item[] = [
  {
    label: "Can change owner by proof",
    key: "canChangeOwnerByProof",
    description:
      "Allow any user to change the owner of the NFT by providing a proof.",
    value: false,
  },
  {
    label: "Can transfer",
    key: "canTransfer",
    description: "Allow the owner to transfer the NFT.",
    value: true,
  },
  {
    label: "Can approve",
    key: "canApprove",
    description:
      "Allow the owner to approve the address authorized to transfer NFT.",
    value: true,
  },
  {
    label: "Can change metadata",
    key: "canChangeMetadata",
    description: "Allow the owner to change the metadata of the NFT.",
    value: false,
  },
  {
    label: "Can change storage",
    key: "canChangeStorage",
    description: "Allow the owner to change the storage of the NFT.",
    value: false,
  },
  {
    label: "Can change name",
    key: "canChangeName",
    description: "Allow the owner to change the name of the NFT.",
    value: false,
  },
  {
    label: "Can change metadata verification key hash",
    key: "canChangeMetadataVerificationKeyHash",
    description:
      "Allow the owner to change the metadata verification key hash of the NFT.",
    value: false,
  },
  {
    label: "Can pause",
    key: "canPause",
    description: "Allow the owner to pause the NFT.",
    value: true,
  },
  {
    label: "Is paused",
    key: "isPaused",
    description: "The NFT is paused.",
    value: false,
  },
  {
    label: "Require owner authorization to upgrade",
    key: "requireOwnerAuthorizationToUpgrade",
    description: "Require the owner to authorize the upgrade of the NFT.",
    value: false,
  },
  {
    label: "Require transfer approval",
    key: "requireTransferApproval",
    description:
      "Require the collection admin to approve the transfer of the NFT.",
    value: false,
  },
];

export function PermissionsModalForm({
  onSubmit,
  title,
  buttonText,
  mintType,
}: PermissionsModalProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [nftPermissions, setNftPermissions] = useState<NftPermissions>(
    new NftPermissions()
  );
  const [collectionPermissions, setCollectionPermissions] =
    useState<CollectionPermissions>(new CollectionPermissions());

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        nft: nftPermissions,
        collection: collectionPermissions,
      });
    }
  };

  const handleCheckboxChange = (key: string, value: boolean) => {
    const nft = nftPermissions;
    const collection = collectionPermissions;
    const newItems = items.map((item) => {
      if (item.key === key) {
        return { ...item, value };
      }
      return item;
    });
    setItems(newItems);
    switch (key) {
      case "canChangeOwnerByProof":
        nft.canChangeOwnerByProof = value;
        break;
      case "canTransfer":
        nft.canTransfer = value;
        break;
      case "canApprove":
        nft.canApprove = value;
        break;
      case "canChangeMetadata":
        nft.canChangeMetadata = value;
        break;
      case "canChangeStorage":
        nft.canChangeStorage = value;
        break;
      case "canChangeName":
        nft.canChangeName = value;
        break;
      case "canChangeMetadataVerificationKeyHash":
        nft.canChangeMetadataVerificationKeyHash = value;
        break;
      case "canPause":
        nft.canPause = value;
        break;
      case "isPaused":
        nft.isPaused = value;
        break;
      case "requireOwnerAuthorizationToUpgrade":
        nft.requireOwnerAuthorizationToUpgrade = value;
        break;
      case "requireTransferApproval":
        collection.requireTransferApproval = value;
        break;
    }
    setNftPermissions(nft);
    setCollectionPermissions(collection);
  };

  return (
    <div
      className="modal fade"
      id="PermissionsModal"
      tabIndex={-1}
      aria-labelledby="addPermissionsLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog max-w-3xl">
        <div className="modal-content">
          <div className="modal-header">
            {title && (
              <h5 className="modal-title text-sm" id="addPropertiesLabel">
                {title}
              </h5>
            )}
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="h-6 w-6 fill-jacarta-700 dark:fill-white"
              >
                <path fill="none" d="M0 0h24v24H0z" />
                <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z" />
              </svg>
            </button>
          </div>

          {items
            .filter(
              (item) =>
                mintType === "collection" ||
                item.key !== "requireTransferApproval"
            )
            .map((item, index) => (
              <div className="relative py-2 px-6 dark:border-jacarta-600">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <div>
                      <label className="block font-display text-sm text-jacarta-700 dark:text-white">
                        {item.label}
                      </label>
                      <p className="text-sm dark:text-jacarta-300">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    value="checkbox"
                    name="check"
                    checked={item.value}
                    onChange={(e) =>
                      handleCheckboxChange(item.key, e.target.checked)
                    }
                    className="relative h-6 w-[2.625rem] cursor-pointer appearance-none rounded-full border-none bg-jacarta-100 after:absolute after:top-[0.1875rem] after:left-[0.1875rem] after:h-[1.125rem] after:w-[1.125rem] after:rounded-full after:bg-jacarta-400 after:transition-all checked:bg-accent checked:bg-none checked:after:left-[1.3125rem] checked:after:bg-white checked:hover:bg-accent focus:ring-transparent focus:ring-offset-0 checked:focus:bg-accent"
                  />
                </div>
              </div>
            ))}

          <div className="modal-footer">
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                data-bs-dismiss="modal"
                className="rounded-full bg-accent py-3 px-8 text-center font-semibold text-white shadow-accent-volume transition-all hover:bg-accent-dark"
                onClick={handleSubmit}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
