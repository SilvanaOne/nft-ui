"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSiteType } from "@/lib/chain";
const siteType = getSiteType();

export default function Nav() {
  const pathname = usePathname();
  const isActiveParentMenu = (menus) => {
    return menus.some(
      (elm) => elm.href.split("/")[1] == pathname.split("/")[1]
    );
  };
  return (
    <>
      <li className="group">
        <Link
          href={siteType === "token" ? "/launch" : "/create"}
          className={`flex items-center justify-between py-3.5 font-display text-base  ${
            "/launch".split("/")[1] == pathname.split("/")[1]
              ? "text-accent dark:text-accent"
              : "text-jacarta-700 dark:text-white"
          }  hover:text-accent focus:text-accent dark:hover:text-accent dark:focus:text-accent lg:px-5`}
        >
          {siteType === "token" ? "Launch" : "Create"}
        </Link>
      </li>
      {siteType === "nft" && (
        <li className="group">
          <Link
            href="/mint"
            className={`flex items-center justify-between py-3.5 font-display text-base  ${
              "/launch".split("/")[1] == pathname.split("/")[1]
                ? "text-accent dark:text-accent"
                : "text-jacarta-700 dark:text-white"
            }  hover:text-accent focus:text-accent dark:hover:text-accent dark:focus:text-accent lg:px-5`}
          >
            Mint
          </Link>
        </li>
      )}

      {siteType === "token" && (
        <>
          <li className="group">
            <Link
              href="/explore"
              className={`flex items-center justify-between py-3.5 font-display text-base  ${
                "/explore".split("/")[1] == pathname.split("/")[1]
                  ? "text-accent dark:text-accent"
                  : "text-jacarta-700 dark:text-white"
              }  hover:text-accent focus:text-accent dark:hover:text-accent dark:focus:text-accent lg:px-5`}
            >
              Explore
            </Link>
          </li>

          <li className="group">
            <Link
              href="/api"
              className={`flex items-center justify-between py-3.5 font-display text-base  ${
                "/api".split("/")[1] == pathname.split("/")[1]
                  ? "text-accent dark:text-accent"
                  : "text-jacarta-700 dark:text-white"
              }  hover:text-accent focus:text-accent dark:hover:text-accent dark:focus:text-accent lg:px-5`}
            >
              API
            </Link>
          </li>
        </>
      )}

      <li className="group">
        <Link
          href={
            siteType === "token"
              ? "https://docs.minatokens.com"
              : "https://docs.minanft.io"
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-between py-3.5 font-display text-base text-jacarta-700 dark:text-white
          hover:text-accent focus:text-accent dark:hover:text-accent dark:focus:text-accent lg:px-5`}
        >
          Docs
        </Link>
      </li>

      {/* <li className="js-nav-dropdown group relative">
        <Link
          href="#"
          className={`dropdown-toggle flex items-center justify-between py-3.5 font-display text-base text-black ${
            isActiveParentMenu(resources)
              ? "text-accent dark:text-accent"
              : "text-jacarta-700 dark:text-white"
          }  hover:text-accent lg:px-5 `}
          id="navDropdown-4"
          aria-expanded="false"
          role="button"
          data-bs-toggle="dropdown"
        >
          Resources
          <i className="lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="h-4 w-4 dark:fill-white"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path d="M12 13.172l4.95-4.95 1.414 1.414L12 16 5.636 9.636 7.05 8.222z" />
            </svg>
          </i>
        </Link>
        <ul
          className="dropdown-menu group-hover:visible lg:invisible left-0 top-[85%] z-10 hidden min-w-[200px] gap-x-4 whitespace-nowrap rounded-xl bg-white transition-all will-change-transform group-hover:opacity-100 dark:bg-jacarta-800 lg:absolute lg:grid lg:translate-y-4 lg:py-4 lg:px-2 lg:opacity-0 lg:shadow-2xl lg:group-hover:translate-y-2"
          aria-labelledby="navDropdown-4"
        >
          {resources.map((elm, i) => (
            <li key={i}>
              <Link
                href={elm.href}
                className="flex items-center rounded-xl px-5 py-2 transition-colors hover:bg-jacarta-50 hover:text-accent focus:text-accent dark:hover:bg-jacarta-600"
              >
                <span
                  className={`font-display text-sm  ${
                    elm.href.split("/")[1] == pathname.split("/")[1]
                      ? "text-accent dark:text-accent"
                      : "text-jacarta-700 dark:text-white"
                  } `}
                >
                  {elm.text}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </li> */}
    </>
  );
}
