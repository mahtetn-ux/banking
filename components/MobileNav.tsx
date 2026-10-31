"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import PlaidLink from "./PlaidLink";

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();

  return (
    <section>
      <Sheet>
        <SheetTrigger className="flex size-10 items-center justify-center rounded-lg hover:bg-gray-25">
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(84vw,320px)] border-r border-gray-200 bg-white p-0 sm:w-80"
        >
          <Link
            href="/"
            className="flex min-h-16 items-center gap-2 border-b border-gray-200 px-5"
          >
            <Image
              src="/icons/logo.svg"
              width={30}
              height={30}
              alt="Horizon logo"
            />
            <h1 className="font-ibm-plex-serif text-2xl font-bold text-black-1">
              Horizon
            </h1>
          </Link>
          <div className="mobilenav-sheet px-4 py-5">
            <nav className="flex flex-col gap-2">
              {sidebarLinks.map((item) => {
                const isActive =
                  pathname === item.route ||
                  pathname.startsWith(`${item.route}/`);

                return (
                  <SheetClose
                    key={item.route}
                    render={
                      <Link
                        href={item.route}
                        className={cn("mobilenav-sheet_close", {
                          "bg-bank-gradient text-white hover:bg-bank-gradient":
                            isActive,
                        })}
                      >
                        <Image
                          src={item.imgURL}
                          alt=""
                          width={20}
                          height={20}
                          className={cn("shrink-0", {
                            "brightness-[3] invert-0": isActive,
                          })}
                        />
                        <span
                          className={cn("text-sm font-semibold text-black-2", {
                            "text-white": isActive,
                          })}
                        >
                          {item.label}
                        </span>
                      </Link>
                    }
                  />
                );
              })}
            </nav>
            <div className="mt-5 border-t border-gray-200 pt-4">
              <PlaidLink user={user} />
            </div>
            <Footer user={user} type="mobile" />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;
