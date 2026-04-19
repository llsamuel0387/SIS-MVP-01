"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KeyRound, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ChangePasswordModal from "@/app/_components/change-password-modal";
import { readCookie, secureClientFetch } from "@/lib/browser-security";
import { parseFetchResponseJson } from "@/lib/parse-fetch-response-json";

type InternalTopbarLink = {
  href: string;
  label: string;
};

type InternalTopbarProps = {
  title: string;
  links: InternalTopbarLink[];
  logoutRedirectPath?: string;
  logoutOnBackNavigation?: boolean;
};

export default function InternalTopbar({
  title,
  links,
  logoutRedirectPath = "/admin/login",
  logoutOnBackNavigation = true
}: InternalTopbarProps) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [actorUserId, setActorUserId] = useState<string | null>(null);
  const hasAutoLoggedOut = useRef(false);
  const logoutRef = useRef<typeof logout | null>(null);
  const FORCE_LOGIN_STORAGE_KEY = "sis_force_login_redirect";
  const LOGOUT_ENDPOINT = "/api/auth/logout";

  async function logout(options?: { silent?: boolean; redirect?: boolean }) {
    if (!options?.silent) {
      setPending(true);
      setError("");
    }
    let response: Response;
    try {
      response = await secureClientFetch(LOGOUT_ENDPOINT, {
        method: "POST",
        keepalive: Boolean(options?.silent),
        headers: {
          "x-csrf-token": readCookie("csrf_token")
        }
      });
    } catch {
      if (!options?.silent) {
        setPending(false);
        setError("Logout failed. Please try again.");
      }
      return;
    }

    if (!options?.silent) {
      setPending(false);
    }
    if (!response.ok) {
      if (!options?.silent) {
        setError("Logout failed. Please try again.");
      }
      return;
    }

    sessionStorage.setItem(FORCE_LOGIN_STORAGE_KEY, logoutRedirectPath);

    if (options?.redirect === false) {
      return;
    }
    window.location.assign(logoutRedirectPath);
  }

  logoutRef.current = logout;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await secureClientFetch("/api/me");
        if (cancelled || !response.ok) {
          return;
        }
        const { data: body } = await parseFetchResponseJson<{ id?: string }>(response);
        if (body.id) {
          setActorUserId(body.id);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!logoutOnBackNavigation) {
      return;
    }

    const forcedLoginPath = sessionStorage.getItem(FORCE_LOGIN_STORAGE_KEY);
    if (forcedLoginPath) {
      window.location.replace(forcedLoginPath);
      return;
    }

    // Add a guard entry so browser back triggers popstate on this page first.
    window.history.pushState({ internalGuard: true }, "", window.location.href);

    const onPopState = () => {
      if (hasAutoLoggedOut.current) {
        return;
      }
      hasAutoLoggedOut.current = true;
      sessionStorage.setItem(FORCE_LOGIN_STORAGE_KEY, logoutRedirectPath);

      // keepalive fetch preserves CSRF header and works during navigation.
      void logoutRef.current?.({ silent: true, redirect: false });

      window.location.replace(logoutRedirectPath);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      const forcedPath = sessionStorage.getItem(FORCE_LOGIN_STORAGE_KEY);
      if (forcedPath) {
        window.location.replace(forcedPath);
        return;
      }

      if (event.persisted && hasAutoLoggedOut.current) {
        window.location.replace(logoutRedirectPath);
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [logoutOnBackNavigation, logoutRedirectPath]);

  return (
    <>
      <Card className="topbar-card">
        <CardContent className="topbar-content">
          <div className="topbar-head">
            <Badge variant="outline" className="topbar-title-badge">
              {title}
            </Badge>
            <div className="actions-row">
              <Button type="button" variant="outline" onClick={() => setChangePasswordOpen(true)}>
                <KeyRound />
                Change Password
              </Button>
              <Button type="button" variant="outline" onClick={() => void logout()} disabled={pending}>
                <LogOut />
                {pending ? "Signing out..." : "Logout"}
              </Button>
            </div>
          </div>
          <Separator />
          <p className="topbar-section-label">Navigation</p>
          <div className="topbar-links topbar-links-vertical">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="topbar-link-item">
                <Button
                  variant={pathname === link.href ? "default" : "secondary"}
                  size="sm"
                  className="topbar-link-button"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
          {error ? <p className="danger">{error}</p> : null}
        </CardContent>
      </Card>
      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        actorUserId={actorUserId}
      />
    </>
  );
}
