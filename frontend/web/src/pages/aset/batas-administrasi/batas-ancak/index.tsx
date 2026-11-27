import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = [
  "BLOK",
  "AFD",
  "ESTATE",
  "REGION",
  "luas",
  "WARUNG",
  "HARI",
  "No_Ancak",
  "Koord_X",
];

const INITIAL_DATA: Record<string, any>[] = [];

export default function BatasAncakPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Ancak"
      levelName="Ancak"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#06B6D4"
      strokeWeight={1.2}
      dashArray="3, 4"
      fillOpacity={0.1}
      tableName="batas_ancak"
    />
  );
}
