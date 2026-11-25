import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "Estate", "JSPV_1", "JSPV_2", "SPV", "KASIE", "AFD"];

const INITIAL_DATA = [
  { id: "afd-1", Region: "Region 1", Estate: "Estate BUM 1", JSPV_1: "JSPV 1", JSPV_2: "JSPV 2", SPV: "SPV A", KASIE: "Kasie BUM 1", AFD: "OA" },
  { id: "afd-2", Region: "Region 1", Estate: "Estate BUM 1", JSPV_1: "JSPV 1", JSPV_2: "JSPV 2", SPV: "SPV B", KASIE: "Kasie BUM 1", AFD: "OB" },
  { id: "afd-3", Region: "Region 1", Estate: "Estate BUM 1", JSPV_1: "JSPV 1", JSPV_2: "JSPV 2", SPV: "SPV C", KASIE: "Kasie BUM 1", AFD: "OC" },
  { id: "afd-4", Region: "Region 1", Estate: "Estate BUM 2", JSPV_1: "JSPV 3", JSPV_2: "JSPV 4", SPV: "SPV D", KASIE: "Kasie BUM 2", AFD: "OD" },
  { id: "afd-5", Region: "Region 2", Estate: "Estate BUM 4", JSPV_1: "JSPV 5", JSPV_2: "JSPV 6", SPV: "SPV E", KASIE: "Kasie BUM 4", AFD: "OE" },
];

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
