import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  PlaidLinkOnSuccess,
  PlaidLinkOptions,
  usePlaidLink,
} from "react-plaid-link";
import { useRouter } from "next/navigation";
import {
  createLinkToken,
  exchangePublicToken,
} from "@/lib/actions/user.actions";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

const PlaidLink = ({ user, variant }: PlaidLinkProps) => {
  const router = useRouter();

  const [token, setToken] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [hasExistingBank, setHasExistingBank] = useState(false);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const tokenRequestedFor = useRef<string | null>(null);
  const updateModeRef = useRef(false);
  const openAfterLoad = useRef(false);
  const openRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (tokenRequestedFor.current === user.$id) return;
    tokenRequestedFor.current = user.$id;

    createLinkToken(user)
      .then((data) => {
        setHasExistingBank(Boolean(data?.hasExistingBank));
        setToken(data?.linkToken ?? "");
      })
      .catch((error) => {
        console.error("Failed to initialize Plaid Link:", error);
        setConnectionError("We couldn't load the bank connection flow.");
      });
  }, [user]);

  const updateTransactionConsent = async () => {
    setConnectionError("");
    setIsLoadingUpdate(true);

    try {
      const data = await createLinkToken(user, "update");
      updateModeRef.current = true;
      openAfterLoad.current = true;
      setToken(data?.linkToken ?? "");
    } catch (error) {
      console.error("Failed to create Plaid update Link token:", error);
      setConnectionError(
        "We couldn't load the transaction-consent flow. Please try again.",
      );
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (public_token: string) => {
      setConnectionError("");

      try {
        if (updateModeRef.current) {
          updateModeRef.current = false;
          router.refresh();
          return;
        }

        const result = await exchangePublicToken({
          publicToken: public_token,
          user,
        });

        if (!result?.publicTokenExchange) {
          throw new Error("The bank connection was not saved.");
        }

        router.push("/");
      } catch (error) {
        console.error("Failed to finish connecting the bank:", error);
        setConnectionError(
          "We couldn't save your bank connection. Please try again.",
        );
      }
    },
    [router, user],
  );

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
    onLoad: () => {
      if (openAfterLoad.current) {
        openAfterLoad.current = false;
        openRef.current();
      }
    },
  };

  const { open, ready } = usePlaidLink(config);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  return (
    <>
      {variant === "primary" ? (
        <Button
          onClick={() => open()}
          disabled={!ready}
          className="plaidlink-primary"
        >
          Connect bank
        </Button>
      ) : variant === "ghost" ? (
        <Button
          onClick={() => open()}
          variant="ghost"
          className="plaidlink-ghost"
        >
          <Image
            src="/icons/connect-bank.svg"
            alt="connect bank"
            width={24}
            height={24}
          />
          <p className="hiddenl text-[16px] font-semibold text-black-2 xl:block">
            Connect bank
          </p>
        </Button>
      ) : (
        <div className="sidebar-actions">
          <Button
            onClick={() => open()}
            disabled={!ready || isLoadingUpdate}
            variant="ghost"
            className="sidebar-link"
          >
            <Image
              src="/icons/connect-bank.svg"
              alt="connect bank"
              width={20}
              height={20}
            />
            <span className="sidebar-label">Connect bank</span>
          </Button>
          {/* {hasExistingBank && (
            <section className="transaction-access">
              <div>
                <h2 className="text-xs font-semibold text-gray-700">
                  Transaction sync
                </h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Allow access to your bank transactions.
                </p>
              </div>
              <Button
                onClick={updateTransactionConsent}
                disabled={!ready || isLoadingUpdate}
                variant="outline"
                className="transaction-access-button"
              >
                <ShieldCheck aria-hidden="true" />
                {isLoadingUpdate ? "Loading..." : "Grant access"}
              </Button>
            </section>
          )} */}
        </div>
      )}
      {connectionError && (
        <p role="alert" className="text-sm text-red-600">
          {connectionError}
        </p>
      )}
    </>
  );
};

export default PlaidLink;
