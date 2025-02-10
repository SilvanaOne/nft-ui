import Image from "next/image";

export default function Banner({ image }: { image: string }) {
  return (
    <div className="relative">
      <Image
        width={1920}
        height={300}
        src={image}
        alt="banner"
        className="h-[18.75rem] object-cover"
      />
    </div>
  );
}
