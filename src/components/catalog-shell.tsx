import Link from "next/link";

import styles from "./catalog-shell.module.css";

export function CatalogIcon({ name, size = 18 }: { name: string; size?: number }) {
  const shapes: Record<string, React.ReactNode> = {
    all: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
    hsc: <><path d="m2 9 10-5 10 5-10 5-10-5Zm4 2v5c3 3 9 3 12 0v-5M2 9v7"/></>,
    ielts: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m6 15 2-6 2 6m-3-2h2m4-4h5m-2.5 0c0 2-1 4-2.5 5m1-3 3 4"/></>,
    robotics: <><rect x="4" y="7" width="16" height="13" rx="3"/><path d="M12 7V4m-9 8H2m20 0h-1m-12 3h.01m6 0h.01"/></>,
    mathematics: <><rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6m-6 4h.01m3 0h.01m3 0h.01M9 15h.01m3 0h.01m3 0h.01M9 18h.01m3 0h.01m3 0h.01"/></>,
    citizenship: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18m-9-9a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z"/></>,
    search: <><circle cx="10.7" cy="10.7" r="5.7"/><path d="m15 15 4 4"/></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></>,
    book: <><path d="M12 6v15m0-15c-3-2-6-2-9-2v14c3 0 6 0 9 3 3-3 6-3 9-3V4c-3 0-6 0-9 2Z"/></>,
    clock: <><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2 2"/></>,
    arrow: <path d="M4 12h15m-5-5 5 5-5 5"/>,
    chevron: <path d="m9 6 6 6-6 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
  };

  return (
    <svg
      aria-hidden="true"
      className={styles.icon}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {shapes[name] ?? shapes.book}
    </svg>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.label}>
            {index > 0 && <CatalogIcon name="chevron" size={11} />}
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
