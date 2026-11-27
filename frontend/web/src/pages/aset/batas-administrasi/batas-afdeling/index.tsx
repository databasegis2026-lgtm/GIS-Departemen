import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "Estate", "AFD", "Luas", "JSPV_1", "JSPV_2", "SPV", "KASIE"];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasAfdelingPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Afdeling"
      levelName="Afdeling"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#F59E0B"
      strokeWeight={2.5}
      fillOpacity={0.12}
      tableName="batas_afdeling"
    />
  );
}
