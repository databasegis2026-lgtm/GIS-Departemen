import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "Estate", "Luas", "Kasie"];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasEstatePage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Estate"
      levelName="Estate"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#2563EB"
      strokeWeight={3}
      fillOpacity={0.1}
      tableName="batas_estate"
    />
  );
}
