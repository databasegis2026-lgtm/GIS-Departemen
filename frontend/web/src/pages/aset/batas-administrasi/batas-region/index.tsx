import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "Luas", "KOOR_KASIE"];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasRegionPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Region"
      levelName="Region"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#7C3AED"
      strokeWeight={4}
      fillOpacity={0.08}
      tableName="batas_region"
    />
  );
}
