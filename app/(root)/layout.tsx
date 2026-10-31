import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense
      fallback={
        <main className="flex h-screen w-full items-center justify-center font-inter">
          <p>Loading...</p>
        </main>
      }
    >
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </Suspense>
  );
}

async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect("/sign-in");
  }

  return (
    <main className="flex min-h-screen w-full min-w-0 font-inter">
      <Sidebar user={loggedIn} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="root-layout">
          <Link href="/" className="flex items-center gap-2" aria-label="Horizon home">
            <Image src="/icons/logo.svg" width={30} height={30} alt="" />
            <span className="font-ibm-plex-serif text-xl font-bold text-black-1">
              Horizon
            </span>
          </Link>

          <MobileNav user={loggedIn} />
        </div>

        {children}
      </div>
    </main>
  );
}
