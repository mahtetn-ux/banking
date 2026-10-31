import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { Suspense } from "react";

const MyBanks = () => (
  <Suspense
    fallback={
      <section className="my-banks">
        <p>Loading your bank accounts...</p>
      </section>
    }
  >
    <MyBanksContent />
  </Suspense>
);

const MyBanksContent = async () => {
  const loggedIn = await getLoggedInUser();
  const accounts = await getAccounts({
    userId: loggedIn.$id,
  });

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="space-y-4">
          <h2 className="header-2">Your cards</h2>
          <div className="flex flex-wrap gap-6">
            {accounts?.data.length ? (
              accounts.data.map((account: Account) => (
                <BankCard
                  key={account.appwriteItemId}
                  account={account}
                  userName={loggedIn.firstName}
                />
              ))
            ) : (
              <p>No bank accounts connected yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;