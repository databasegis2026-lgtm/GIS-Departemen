import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";
import { PageMeta } from "@/components/shared/page-meta";
import { Card } from "@/components/ui/card";
import { PageIcon } from "@/icons";

export interface EmptyPageProps {
  title: string;
  category?: string;
  description?: string;
}

export function EmptyPage({
  title,
  category,
  description = "Halaman ini masih kosong. Silakan tambahkan komponen atau integrasikan data untuk modul ini.",
}: EmptyPageProps) {
  return (
    <div>
      <PageMeta
        title={`${title} | TailAdmin`}
        description={`Halaman ${title}`}
      />
      <PageBreadcrumb pageTitle={title} />

      <Card className="flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-none dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <PageIcon className="size-7" />
          </div>
          {category && (
            <span className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {category}
            </span>
          )}
          <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </Card>
    </div>
  );
}

export default EmptyPage;
