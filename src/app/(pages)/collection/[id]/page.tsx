//import TokenHeader from "@/components/headers/TokenHeader";
import TokenFooter from "@/components/footer/TokenFooter";
import CollectionDetails from "@/components/nft/CollectionDetails";

// export const metadata = {
//   title: "Token Details",
// };

export default async function CollectionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <CollectionDetails tokenAddress={id} />
      </main>
      <TokenFooter />
    </>
  );
}
