import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["BLOK", "AFD", "ESTATE", "REGION", "luas", "WARUNG", "HARI", "Drive_Wafd"];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasWarungPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Warung"
      levelName="Warung"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#EA580C"
      strokeWeight={2}
      dashArray="6, 6"
      fillOpacity={0.12}
      tableName="batas_warung"
    />
  );
}
