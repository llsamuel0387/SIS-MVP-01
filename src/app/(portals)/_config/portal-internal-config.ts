type PortalInternalConfig = {
  title: string;
  links: Array<{ href: string; label: string }>;
  logoutRedirectPath: string;
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
};

export const STUDENT_PORTAL_INTERNAL_CONFIG: PortalInternalConfig = {
  title: "Student Internal Navigation",
  links: [
    { href: "/studentportal", label: "Student Home" },
    { href: "/studentportal/information-edit", label: "Information Edit" }
  ],
  logoutRedirectPath: "/studentportal/login",
  heroBadge: "Student Portal",
  heroTitle: "Student Workspace",
  heroDescription: "View your profile and request certificates."
};

export const STAFF_PORTAL_INTERNAL_CONFIG: PortalInternalConfig = {
  title: "Staff Internal Navigation",
  links: [{ href: "/staffportal", label: "Staff Home" }],
  logoutRedirectPath: "/staffportal/login",
  heroBadge: "Staff Portal",
  heroTitle: "Staff Workspace",
  heroDescription: "Review and manage assigned student records."
};
