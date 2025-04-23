import TokenFooter from "@/components/footer/TokenFooter";
//import TokenHeader from "@/components/headers/TokenHeader";
import TokenList from "@/components/home/TokenList";
// import { getSiteName } from "@/lib/chain";
import { FC } from "react";

// export const metadata = {
//   title: `${getSiteName()} | Launchpad`,
// };

const HomeToken: FC = () => {
  return (
    <>
      {/* <TokenHeader showSearch={true} /> */}
      <main>
        <TokenList
          title={undefined}
          showIcon={true}
          initialNumberOfItems={50}
          key="home-list"
          hideFilters={true}
        />
      </main>
      <TokenFooter />
    </>
  );
};

export default HomeToken;
