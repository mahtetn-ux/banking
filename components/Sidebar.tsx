'use client'

import Link from "next/link";
import Image from "next/image";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import PlaidLink from "./PlaidLink";

const Sidebar = ({ user }: SiderbarProps) => {
  const pathname = usePathname();
  return (
    <section className="sidebar">
      <div>
        <Link href="/" className="mb-8 flex cursor-pointer items-center gap-2 px-2">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon logo"
            className="size-8"
          />
          <h1 className="sidebar-logo">Horizon</h1>
        </Link>

        <nav className="flex flex-col gap-2">
          {sidebarLinks.map((item) => {
            const isActive =
              pathname === item.route ||
              (item.route !== "/" && pathname.startsWith(`${item.route}/`));

            return (
              <Link
                href={item.route}
                key={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn("sidebar-link", {
                  "bg-bank-gradient hover:bg-bank-gradient": isActive,
                })}
              >
                <span className="relative size-5 shrink-0">
                  <Image
                    src={item.imgURL}
                    alt=""
                    fill
                    className={cn({
                      "brightness-[3] invert-0": isActive,
                    })}
                  />
                </span>
                <span
                  className={cn("sidebar-label", {
                    "!text-white": isActive,
                  })}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <PlaidLink user={user} />
      </div>

      <Footer user={user} type="desktop"/>
    </section>
  );
};

export default Sidebar;
