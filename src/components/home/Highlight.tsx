import React from "react";

import { DeployedTokenInfo } from "@/lib/token";

interface HighlightProps {
  item: DeployedTokenInfo;
  attribute: string;
}

const Highlight: React.FC<HighlightProps> = ({ item, attribute }) => {
  const text =
    (item as any)._highlightResult?.[attribute]?.value ??
    (item as any)[attribute] ??
    "";
  const parts = text.split(/(<em>|<\/em>)/);
  const beforeEm = parts[0];
  const middleEm = parts.length > 2 ? parts[2] : "";
  const afterEm = parts.length > 4 ? parts[4] : "";

  return (
    <span>
      {beforeEm}
      <span className="bg-highlightBg text-highlightText">{middleEm}</span>
      {afterEm}
    </span>
  );
};

export default Highlight;
