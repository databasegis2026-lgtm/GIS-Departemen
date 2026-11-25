import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState, useMemo } from "react";
import { useLocation } from "react-router";
import { navItems, othersItems, supportItems } from "./data";
import AppSidebarHeader from "./sidebar-header";
import SidebarNavGroup from "./sidebar-nav-group";
import type { MenuType, NavItem } from "./types";
import { useAuth } from "@/context/auth-context";

export default function AppSidebar() {
  const { open, isMobile, isHovered } = useSidebar();
  const { pathname } = useLocation();
  const { isRouteAllowed } = useAuth();

  const showContent = open || isHovered || isMobile;

  // Filter menu navigation berdasarkan Role-Based Access Control
  const filteredNavItems = useMemo(() => {
    const filterItems = (items: NavItem[]): NavItem[] => {
      return items
        .filter((item) => {
          if (item.path && !isRouteAllowed(item.path)) {
            return false;
          }
          return true;
        })
        .map((item) => {
          if (!item.subItems) return item;
          const filteredSubs = item.subItems
            .filter((sub) => !sub.path || isRouteAllowed(sub.path))
            .map((sub) => {
              if (!sub.subItems) return sub;
              return {
                ...sub,
                subItems: sub.subItems.filter((sub2) => !sub2.path || isRouteAllowed(sub2.path)),
              };
            });

          return {
            ...item,
            subItems: filteredSubs,
          };
        })
        .filter((item) => {
          // Sembunyikan modul jika subItems kosong setelah disaring
          if (
            item.subItems &&
            item.subItems.length === 0 &&
            (!item.path ||
              item.path === "/monitoring" ||
              item.path === "/rekap-pekerjaan" ||
              item.path === "/aset" ||
              item.path === "/pembukaan-lahan" ||
              item.path === "/manajemen-pengguna")
          ) {
            return false;
          }
          return true;
        });
    };

    return filterItems(navItems);
  }, [isRouteAllowed]);

  const menuSections = useMemo(
    () => [
      { type: "main" as MenuType, labelKey: "groups.menu", items: filteredNavItems },
      { type: "support" as MenuType, labelKey: "groups.support", items: supportItems },
      { type: "others" as MenuType, labelKey: "groups.others", items: othersItems },
    ],
    [filteredNavItems]
  );

  const findMatchingSubmenu = (path: string) => {
    for (const section of menuSections) {
      for (let index = 0; index < section.items.length; index++) {
        const nav = section.items[index];
        const matchesPath = (items: NavItem["subItems"]): boolean =>
          Boolean(items?.some(
            (item) => item.path === path || matchesPath(item.subItems),
          ));
        if (nav.path === path || matchesPath(nav.subItems)) {
          return { type: section.type, index };
        }
      }
    }
    return null;
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuType;
    index: number;
  } | null>(() => findMatchingSubmenu(pathname));

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenSubmenu(findMatchingSubmenu(pathname));
  }

  const handleSubmenuToggle = (index: number, menuType: MenuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const activeSections = menuSections.filter(
    (section) => section.items.length > 0,
  );

  return (
    <Sidebar side="left" collapsible="icon">
      <AppSidebarHeader showContent={showContent} />

      <SidebarContent className="overflow-y-auto px-5 duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {activeSections.map((section) => (
              <SidebarNavGroup
                key={section.type}
                labelKey={section.labelKey}
                menuType={section.type}
                items={section.items}
                openSubmenu={openSubmenu}
                showContent={showContent}
                pathname={pathname}
                onToggleSubmenu={handleSubmenuToggle}
              />
            ))}
          </div>
        </nav>
      </SidebarContent>
    </Sidebar>
  );
}
