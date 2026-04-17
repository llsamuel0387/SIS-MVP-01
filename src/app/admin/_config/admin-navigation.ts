export const ADMIN_NAV_TITLE = "Admin Internal Navigation";

export const ADMIN_NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/accounts/create", label: "Create Account" },
  { href: "/admin/accounts/manage", label: "Manage Accounts" },
  { href: "/admin/requests", label: "Requests" }
] as const;

export const ADMIN_NAV_LINKS_WITH_SSO = [...ADMIN_NAV_LINKS, { href: "/admin/sso", label: "SSO Settings" }] as const;
