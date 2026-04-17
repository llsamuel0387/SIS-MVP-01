export type PortalRole = "STUDENT" | "STAFF" | "ADMIN";

type PortalLoginConfig = {
  portalLabel: string;
  description: string;
  allowedRoles: PortalRole[];
  successRedirectPath: string;
};

export const STUDENT_LOGIN_CONFIG: PortalLoginConfig = {
  portalLabel: "Student Portal",
  description: "Sign in to access your own student records.",
  allowedRoles: ["STUDENT"],
  successRedirectPath: "/studentportal"
};

export const STAFF_LOGIN_CONFIG: PortalLoginConfig = {
  portalLabel: "Staff Portal",
  description: "Sign in to access records within your assigned student scope.",
  allowedRoles: ["STAFF"],
  successRedirectPath: "/staffportal"
};

export const ADMIN_LOGIN_CONFIG: PortalLoginConfig = {
  portalLabel: "Admin Portal",
  description: "Sign in with an admin account to manage users and access control.",
  allowedRoles: ["ADMIN"],
  successRedirectPath: "/admin"
};
