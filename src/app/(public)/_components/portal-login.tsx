"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCooldownMessage, getUiErrorResult } from "@/lib/client-error";
import { secureClientFetch } from "@/lib/browser-security";
import type { PortalRole } from "@/app/(public)/_config/portal-login-config";
import { AppShell } from "@/ui/app-shell";

type PortalLoginProps = {
  portalLabel: string;
  description: string;
  allowedRoles: PortalRole[];
  successRedirectPath?: string;
};

const FORCE_LOGIN_STORAGE_KEY = "sis_force_login_redirect";

export default function PortalLogin({
  portalLabel,
  description,
  allowedRoles,
  successRedirectPath
}: PortalLoginProps) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCooldownSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    if (cooldownSeconds > 0) {
      setError(formatCooldownMessage("Too many attempts. Please try again shortly.", cooldownSeconds));
      setPending(false);
      return;
    }

    const response = await secureClientFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId, password })
    });
    const result = await response.json();
    setPending(false);

    if (!response.ok) {
      const uiError = getUiErrorResult(result, "Login failed.");
      if (uiError.shouldBlockSubmit) {
        setCooldownSeconds(uiError.cooldownSeconds);
      }
      setError(formatCooldownMessage(uiError.message, uiError.cooldownSeconds));
      return;
    }

    if (!allowedRoles.includes(result.data?.user?.role)) {
      setError("Your account role cannot access this portal.");
      return;
    }

    if (successRedirectPath) {
      sessionStorage.removeItem(FORCE_LOGIN_STORAGE_KEY);
      window.location.assign(successRedirectPath);
      return;
    }

    sessionStorage.removeItem(FORCE_LOGIN_STORAGE_KEY);
    setCooldownSeconds(0);
    setMessage("Login successful.");
  }

  return (
    <AppShell>
      <section className="grid cols-2">
        <Card className="login-hero-card">
          <CardHeader className="stack-sm">
            <Badge variant="secondary">
              {portalLabel}
            </Badge>
            <CardTitle className="portal-title">
              {"Welcome to the \"Schoolname\" internal system"}
            </CardTitle>
            <CardDescription className="portal-description">{description}</CardDescription>
          </CardHeader>
        </Card>

        <Card className="login-form-card">
          <CardHeader>
            <CardTitle>Secure Sign In</CardTitle>
            <CardDescription>Access is revalidated server-side based on role and policy.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="stack" onSubmit={onSubmit}>
              <Label className="stack-xs">
                <span className="eyebrow">Login ID</span>
                <Input
                  placeholder="login_id"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  required
                />
              </Label>
              <Label className="stack-xs">
                <span className="eyebrow">Password</span>
                <Input
                  placeholder="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Label>
              <Button type="submit" disabled={pending || cooldownSeconds > 0}>
                {pending ? "Signing in..." : cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : "Secure Sign In"}
              </Button>
              {message ? <p className="muted">{message}</p> : null}
              {error ? <p className="danger">{error}</p> : null}
            </form>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
