import { Suspense } from "react";
import HeaderBox from "@/components/HeaderBox";
import RightSideBar from "@/components/RightSideBar";
import TotalBalanceBox from "@/components/TotalBalanceBox";

import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import RecentTransactions from "@/components/RecentTransactions";

type HomeSearchParams = {
  id?: string | string[];
  page?: string | string[];
};

const Home = ({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) => (
  <Suspense
    fallback={
      <section className="home">
        <div className="home-content">
          <p>Loading your dashboard...</p>
        </div>
      </section>
    }
  >
    <HomeContent searchParams={searchParams} />
  </Suspense>
);

const HomeContent = async ({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) => {
  const { id, page } = await searchParams;
  const pageValue = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number.parseInt(pageValue ?? "1", 10);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const loggedIn = await getLoggedInUser();

  const accounts = await getAccounts({
    userId: loggedIn.$id,
  });

  if (!accounts || !accounts.data?.length) {
    return (
      <section className="home">
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.name || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <p>No bank accounts connected yet.</p>
        </div>
        <RightSideBar user={loggedIn} transactions={[]} banks={[]} />
      </section>
    );
  }

  const accountsData = accounts.data;
  const selectedId = Array.isArray(id) ? id[0] : id;
  const appwriteItemId = selectedId || accountsData[0].appwriteItemId;

  const account = await getAccount({ appwriteItemId });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.name || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts.totalBanks}
            totalCurrentBalance={accounts.totalCurrentBalance}
          />
        </header>

        <RecentTransactions
          accounts={accountsData}
          transactions={account?.transactions}
          appwriteItemId={appwriteItemId}
          page={currentPage}
        />
      </div>

      <RightSideBar
        user={loggedIn}
        transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
