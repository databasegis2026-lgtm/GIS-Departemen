import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Perusahaan", "Luas"];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasPerusahaanPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Perusahaan"
      levelName="Perusahaan"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#4338CA"
      strokeWeight={5}
      fillOpacity={0.06}
      tableName="batas_perusahaan"
    />
  );
}
