import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = [
  "BLOK",
  "AFD",
  "ESTATE",
  "REGION",
  "luas",
  "WARUNG",
  "HARI",
  "Drive_Wafd",
  "BLOK_1",
  "AFD_1",
  "ESTATE_1",
  "REGION_1",
  "WARUNG_1",
  "HARI_1",
  "No_Ancak",
  "Koord_X",
];

const INITIAL_DATA = [
  {
    id: "ack-1",
    BLOK: "E28",
    AFD: "OA",
    ESTATE: "Estate BUM 1",
    REGION: "Region 1",
    luas: 1.2,
    WARUNG: "Warung 1",
    HARI: "Senin",
    Drive_Wafd: "https://drive.google.com/...",
    BLOK_1: "E28",
    AFD_1: "OA",
    ESTATE_1: "Estate BUM 1",
    REGION_1: "Region 1",
    WARUNG_1: "Warung 1",
    HARI_1: "Senin",
    No_Ancak: "ACK-01",
    Koord_X: "110.3542",
  },
  {
    id: "ack-2",
    BLOK: "E28",
    AFD: "OA",
    ESTATE: "Estate BUM 1",
    REGION: "Region 1",
    luas: 1.1,
    WARUNG: "Warung 1",
    HARI: "Senin",
    Drive_Wafd: "https://drive.google.com/...",
    BLOK_1: "E28",
    AFD_1: "OA",
    ESTATE_1: "Estate BUM 1",
    REGION_1: "Region 1",
    WARUNG_1: "Warung 1",
    HARI_1: "Senin",
    No_Ancak: "ACK-02",
    Koord_X: "110.3550",
  },
  {
    id: "ack-3",
    BLOK: "E29",
    AFD: "OA",
    ESTATE: "Estate BUM 1",
    REGION: "Region 1",
    luas: 1.3,
    WARUNG: "Warung 2",
    HARI: "Selasa",
    Drive_Wafd: "https://drive.google.com/...",
    BLOK_1: "E29",
    AFD_1: "OA",
    ESTATE_1: "Estate BUM 1",
    REGION_1: "Region 1",
    WARUNG_1: "Warung 2",
    HARI_1: "Selasa",
    No_Ancak: "ACK-03",
    Koord_X: "110.3558",
  },
];

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
