import { SidebarHeader } from "@/components/ui/sidebar";
import { Link } from "react-router";

interface AppSidebarHeaderProps {
  showContent: boolean;
}

export default function AppSidebarHeader({
  showContent,
}: AppSidebarHeaderProps) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <SidebarHeader className="px-5 py-6">
      <Link to="/" className="flex items-center gap-3">
        <img
          src={`${baseUrl}images/logo/favicon.png`}
          alt="GIS Departemen"
          className="size-10 shrink-0 rounded-lg object-contain shadow-sm"
        />
        {showContent && (
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-base font-bold leading-tight tracking-tight text-gray-800 dark:text-white">
              GIS Departemen
            </span>
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">
              Sistem Manajemen Kebun
            </span>
          </div>
        )}
      </Link>
    </SidebarHeader>
  );
}
