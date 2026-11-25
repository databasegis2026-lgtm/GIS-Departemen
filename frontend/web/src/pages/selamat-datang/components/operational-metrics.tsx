import { CheckCircleIcon, TableIcon } from "@/icons";
import MetricCard from "@/pages/main/dashboard/ecommerce/components/metrics/metric-card";

export default function OperationalMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        icon={<TableIcon />}
        title="Realisasi Produksi TBS"
        value="0 Ton"
        change="0%"
        direction="up"
      />
      <MetricCard
        icon={<CheckCircleIcon />}
        title="Realisasi Pemupukan"
        value="0 Ha"
        change="0%"
        direction="up"
      />
      <MetricCard
        icon={<CheckCircleIcon />}
        title="Pengendalian Gulma (Semprot)"
        value="0 Ha"
        change="0%"
        direction="up"
      />
      <MetricCard
        icon={<CheckCircleIcon />}
        title="Pemeliharaan Pruning"
        value="0 Ha"
        change="0%"
        direction="up"
      />
    </div>
  );
}
