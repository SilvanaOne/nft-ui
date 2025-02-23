/* eslint-disable react/no-unescaped-entities */
import React, { useState } from "react";
import { Trait } from "@/lib/token";
import { TraitModalForm } from "@/components/token/TraitModal";

export interface TraitsModalProps {
  onSubmit: (traits: Trait[]) => void;
}

export function TraitsModal({ onSubmit }: TraitsModalProps) {
  return (
    <TraitModalForm onSubmit={onSubmit} title="Traits" buttonText="Save" />
  );
}
