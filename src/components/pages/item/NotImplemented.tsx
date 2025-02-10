"use client";

export function NotImplemented() {
  return (
    <div className="rounded-t-2lg rounded-b-2lg rounded-tl-none border border-jacarta-100 bg-white p-6 dark:border-jacarta-600 dark:bg-jacarta-700 md:p-10">
      <div className="mb-2 flex items-center">
        <span className="mr-2 min-w-[14rem] dark:text-jacarta-300">
          Not Implemented, check back soon!
        </span>
      </div>
    </div>
  );
}
