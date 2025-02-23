/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { Permissions } from "@/lib/token";
import { PermissionsModalForm } from "@/components/token/PermissionsModal";

export interface PermissionsModalProps {
  onSubmit: (permissions: Permissions) => void;
  mintType: "nft" | "collection";
}

export function PermissionsModal({
  onSubmit,
  mintType,
}: PermissionsModalProps) {
  return (
    <PermissionsModalForm
      onSubmit={onSubmit}
      title="Permissions"
      buttonText="Save"
      mintType={mintType}
    />
  );
}
