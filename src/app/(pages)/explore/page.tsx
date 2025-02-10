"use client";

import TokenFooter from "@/components/footer/TokenFooter";
//import TokenHeader from "@/components/headers/TokenHeader";
import TokenList from "@/components/home/TokenList";
import { FC } from "react";
import { getSiteName } from "@/lib/chain";

// export const metadata = {
//   title: `${getSiteName()} | Explore`,
// };

const ExploreTokens: FC = () => {
  return (
    <>
      {/* <TokenHeader /> */}
      <main className="mt-4">
        <TokenList title="Explore" showIcon={false} key="explore-list" />
      </main>
      <TokenFooter />
    </>
  );
};

export default ExploreTokens;
