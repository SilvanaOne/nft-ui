//import TokenHeader from "@/components/headers/TokenHeader";
import TokenFooter from "@/components/footer/TokenFooter";
import NFTDetails from "@/components/nft/NFTDetails";

// export const metadata = {
//   title: "Token Details",
// };

export default async function TokenDetailsPage({
  params,
}: {
  params: Promise<{ collectionAddress: string; nftAddress: string }>;
}) {
  const { collectionAddress, nftAddress } = await params;

  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <NFTDetails
          collectionAddress={collectionAddress}
          nftAddress={nftAddress}
        />
      </main>
      <TokenFooter />
    </>
  );
}
