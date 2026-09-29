/** Primary navigation. Add a section here when its page ships. */
export const NAV_ITEMS = [
  { href: "/", label: "Atlas" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/games", label: "Games" },
  { href: "/learn", label: "Learn" },
] as const;

export const isActivePath = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
