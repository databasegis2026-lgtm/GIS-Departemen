import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["BLOK", "AFD", "ESTATE", "REGION", "luas", "WARUNG", "HARI", "Drive_Wafd"];

const INITIAL_DATA = [
  { id: "wrg-1", BLOK: "E28", AFD: "OA", ESTATE: "Estate BUM 1", REGION: "Region 1", luas: 28.5, WARUNG: "Warung 1", HARI: "Senin", Drive_Wafd: "https://drive.google.com/..." },
  { id: "wrg-2", BLOK: "E29", AFD: "OA", ESTATE: "Estate BUM 1", REGION: "Region 1", luas: 30.2, WARUNG: "Warung 2", HARI: "Selasa", Drive_Wafd: "https://drive.google.com/..." },
  { id: "wrg-3", BLOK: "F30", AFD: "OB", ESTATE: "Estate BUM 1", REGION: "Region 1", luas: 25.0, WARUNG: "Warung 3", HARI: "Rabu", Drive_Wafd: "https://drive.google.com/..." },
  { id: "wrg-4", BLOK: "F31", AFD: "OB", ESTATE: "Estate BUM 1", REGION: "Region 1", luas: 27.8, WARUNG: "Warung 4", HARI: "Kamis", Drive_Wafd: "https://drive.google.com/..." },
  { id: "wrg-5", BLOK: "G32", AFD: "OC", ESTATE: "Estate BUM 2", REGION: "Region 1", luas: 29.1, WARUNG: "Warung 5", HARI: "Jumat", Drive_Wafd: "https://drive.google.com/..." },
  { id: "wrg-6", BLOK: "G33", AFD: "OC", ESTATE: "Estate BUM 2", REGION: "Region 1", luas: 26.4, WARUNG: "Warung 6", HARI: "Sabtu", Drive_Wafd: "https://drive.google.com/..." },
];

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
