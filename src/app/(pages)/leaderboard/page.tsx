"use client";

import TokenFooter from "@/components/footer/TokenFooter";
//import TokenHeader from "@/components/headers/TokenHeader";
import { Leaderboard } from "@/components/nft/Leaderboard";

// export const metadata = {
//   title: "Privacy Policy || MinaTokens.com",
// };

export default function LeaderboardPage() {
  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <Leaderboard />
      </main>
      <TokenFooter />
    </>
  );
}
