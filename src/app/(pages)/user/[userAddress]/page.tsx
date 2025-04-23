//import TokenHeader from "@/components/headers/TokenHeader";
import TokenFooter from "@/components/footer/TokenFooter";
import UserDetails from "@/components/nft/UserDetails";

// export const metadata = {
//   title: "Token Details",
// };

export default async function UserDetailsPage({
  params,
}: {
  params: Promise<{ userAddress: string }>;
}) {
  const { userAddress } = await params;

  return (
    <>
      {/* <TokenHeader showSearch={false} /> */}
      <main className="mt-24">
        <UserDetails userAddress={userAddress} />
      </main>
      <TokenFooter />
    </>
  );
}
