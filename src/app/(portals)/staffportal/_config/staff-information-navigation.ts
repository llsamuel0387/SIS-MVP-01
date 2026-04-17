export const STAFF_INFORMATION_TABS = [
  { href: "/staffportal/students", label: "Student Information" },
  { href: "/staffportal/staff", label: "Staff Information" }
] as const;

export const STAFF_INFORMATION_CARD_LINKS = [
  {
    href: "/staffportal/students",
    title: "Student Information",
    description: "Open student list and see detailed profile information from the dedicated tab.",
    buttonLabel: "Go to Student Information"
  },
  {
    href: "/staffportal/staff",
    title: "Staff Information",
    description: "Open staff list and see detailed profile information from the dedicated tab.",
    buttonLabel: "Go to Staff Information"
  }
] as const;
