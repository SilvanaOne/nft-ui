"use client";

import { TokenPreview, TokenPreviewProps } from "./TokenPreview";
import { TimeLine, TimeLineProps } from "./TimeLine";
import { motion } from "framer-motion";
import Image from "next/image";

export interface TokenProgressProps extends TimeLineProps, TokenPreviewProps {
  caption: string;
}

export function TokenProgress({
  tokenAddress,
  items,
  image,
  likes,
  name,
  symbol,
  totalSupply,
  isLiked,
  caption,
}: TokenProgressProps) {
  return (
    <section className="relative py-24">
      <picture className="pointer-events-none absolute inset-0 -z-10 dark:hidden">
        <Image
          width={1920}
          height={789}
          src="/img/gradient_light.jpg"
          priority
          alt="gradient"
          className="h-full w-full"
        />
      </picture>
      <div className="container">
        <div className="flex items-center justify-center space-x-4 text-jacarta-700 dark:text-white">
          <AnimatedRocket />
          <h1 className="py-16 text-center font-display text-4xl font-medium text-jacarta-700 dark:text-white">
            {caption}
          </h1>
          <AnimatedRocket />
        </div>

        <div className="lg:flex">
          {/* Timeline */}
          <TimeLine items={items} />

          {/* Token Preview */}
          <aside className="basis-4/12 lg:pl-5">
            <TokenPreview
              tokenAddress={tokenAddress}
              image={image}
              likes={likes}
              name={name}
              symbol={symbol}
              totalSupply={totalSupply}
              isLiked={isLiked}
            />
          </aside>
        </div>
      </div>
    </section>
  );
}

function AnimatedRocket() {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ y: 0 }}
      animate={{ y: [-2, 2, -2] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </motion.svg>
  );
}
