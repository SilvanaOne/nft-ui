"use client";
import TokenFooter from "@/components/footer/TokenFooter";
//import TokenHeader from "@/components/headers/TokenHeader";
import LaunchToken from "@/components/launch/LaunchToken";
import { FC } from "react";
import { getSiteName } from "@/lib/chain";

// export const metadata = {
//   title: `${getSiteName()} | Launchpad`,
// };

const LaunchTokenPage: FC = () => {
  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main>
        <LaunchToken />
      </main>
      <TokenFooter />
    </>
  );
};

export default LaunchTokenPage;
