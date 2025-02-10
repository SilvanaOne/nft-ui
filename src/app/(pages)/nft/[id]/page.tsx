//import TokenHeader from "@/components/headers/TokenHeader";
import TokenFooter from "@/components/footer/TokenFooter";
import TokenDetails from "@/components/nft/TokenDetails";

// export const metadata = {
//   title: "Token Details",
// };

export default async function TokenDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <TokenDetails tokenAddress={id} />
      </main>
      <TokenFooter />
    </>
  );
}
