//import TokenHeader from "@/components/headers/TokenHeader";
import TokenFooter from "@/components/footer/TokenFooter";
import CollectionDetails from "@/components/nft/CollectionDetails";

// export const metadata = {
//   title: "Token Details",
// };

export default async function CollectionDetailsPage({
  params,
}: {
  params: Promise<{ collectionAddress: string }>;
}) {
  const { collectionAddress } = await params;

  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <CollectionDetails collectionAddress={collectionAddress} />
      </main>
      <TokenFooter />
    </>
  );
}
