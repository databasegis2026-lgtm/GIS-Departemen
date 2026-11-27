import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = [
  "Region",
  "Estate",
  "Afdeling",
  "Blok",
  "TahunTanam",
  "Luas",
  "TM_Pokok",
  "JSPV_1",
  "JSPV_2",
  "SPV",
  "KASIE",
  "KOOR_KASIE",
];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasBlokPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Blok"
      levelName="Blok"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#10B981"
      strokeWeight={1.8}
      fillOpacity={0.15}
      tableName="batas_blok"
    />
  );
}
