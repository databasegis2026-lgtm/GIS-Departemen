import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "Estate", "Luas", "Kasie"];

const INITIAL_DATA = [
  { id: "est-1", Region: "Region 1", Estate: "Estate BUM 1", Luas: 3420.5, Kasie: "Kasie BUM 1" },
  { id: "est-2", Region: "Region 1", Estate: "Estate BUM 2", Luas: 3810.2, Kasie: "Kasie BUM 2" },
  { id: "est-3", Region: "Region 1", Estate: "Estate BUM 3", Luas: 3150.0, Kasie: "Kasie BUM 3" },
  { id: "est-4", Region: "Region 2", Estate: "Estate BUM 4", Luas: 4100.8, Kasie: "Kasie BUM 4" },
  { id: "est-5", Region: "Region 2", Estate: "Estate BUM 5", Luas: 3670.3, Kasie: "Kasie BUM 5" },
  { id: "est-6", Region: "Region 2", Estate: "Estate BUM 6", Luas: 3920.4, Kasie: "Kasie BUM 6" },
  { id: "est-7", Region: "Region 3", Estate: "Estate BUM 7", Luas: 3550.1, Kasie: "Kasie BUM 7" },
  { id: "est-8", Region: "Region 3", Estate: "Estate BUM 8", Luas: 3280.9, Kasie: "Kasie BUM 8" },
  { id: "est-bsl", Region: "BSL", Estate: "Estate BUM BSL", Luas: 2890.6, Kasie: "Kasie BSL" },
];

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
