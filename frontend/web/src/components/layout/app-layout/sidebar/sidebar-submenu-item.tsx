import { useTranslations } from "@/i18n";
import { ChevronDownIcon } from "@/icons";
import { cn } from "@/utils";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { SubItem } from "./types";

interface SidebarSubmenuItemProps {
  subItem: SubItem;
  pathname: string;
}

export default function SidebarSubmenuItem({
  subItem,
  pathname,
}: SidebarSubmenuItemProps) {
  const t = useTranslations("sidebar");
  const hasSubItems = Boolean(subItem.subItems && subItem.subItems.length > 0);
  const hasActiveChild = Boolean(
    subItem.subItems?.some(
      (child) =>
        child.path === pathname ||
        child.subItems?.some((grandchild) => grandchild.path === pathname),
    ),
  );
  const isDirectActive = Boolean(subItem.path && subItem.path === pathname);
  const isActive = isDirectActive || hasActiveChild;

  const [isOpen, setIsOpen] = useState(hasActiveChild || isDirectActive);

  // Buka otomatis hanya ketika URL halaman berubah ke submenu ini pertama kali
  useEffect(() => {
    if (hasActiveChild || isDirectActive) {
      setIsOpen(true);
    }
  }, [pathname]);

  const labelClassName = cn(
    "group flex items-center justify-between menu-dropdown-item cursor-pointer",
    isActive ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive",
  );

  return (
    <li>
      {hasSubItems ? (
        /* Jika memiliki sub-items (anak), tombol berfungsi murni untuk toggle buka/tutup */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn("w-full text-start", labelClassName)}
        >
          <span>{t(`items.${subItem.key}`)}</span>
          <ChevronDownIcon
            className={cn(
              "ms-auto h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen ? "rotate-180 text-brand-500" : "",
            )}
          />
        </button>
      ) : subItem.path ? (
        /* Jika daun terakhir (tidak punya anak), Link mengarah ke halaman tujuan */
        <Link
          to={subItem.path}
          target={subItem.target}
          className={labelClassName}
        >
          <span>{t(`items.${subItem.key}`)}</span>
        </Link>
      ) : (
        <div className={labelClassName}>
          <span>{t(`items.${subItem.key}`)}</span>
        </div>
      )}

      {hasSubItems && isOpen && (
        <ul className="ms-3 mt-1 space-y-1 border-s border-gray-200 ps-2 dark:border-gray-800">
          {subItem.subItems!.map((child) => (
            <SidebarSubmenuItem
              key={child.key}
              subItem={child}
              pathname={pathname}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
