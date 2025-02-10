"use server";

export async function checkAddress(
  address: string | undefined
): Promise<boolean> {
  if (!address || typeof address !== "string") {
    console.error("checkAddress params are invalid:", address);
    return false;
  }
  try {
    // TODO: check address
    return true;
  } catch (error) {
    console.error("checkAddress catch", { address, error });
    return false;
  }
}
