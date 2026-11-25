import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "REGIONAL", "Koordinator", "Luas", "KH", "Perusahaan", "Id"];

const INITIAL_DATA = [
  {
    id: "pt-1",
    Region: "Region 1, 2, 3",
    REGIONAL: "Holding PT BUM",
    Koordinator: "Ari Setyo Wibowo",
    Luas: 28940.5,
    KH: "HGU 01/BUM/1998",
    Perusahaan: "PT BUM",
    Id: "BUM-ENT-01",
  },
  {
    id: "pt-2",
    Region: "BSL",
    REGIONAL: "Holding PT BSL",
    Koordinator: "Ari Setyo Wibowo",
    Luas: 14250.2,
    KH: "HGU 04/BSL/2005",
    Perusahaan: "PT BSL",
    Id: "BSL-ENT-02",
  },
];

export default function BatasPerusahaanPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Perusahaan"
      levelName="Perusahaan"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#4338CA"
      strokeWeight={5}
      fillOpacity={0.06}
      tableName="batas_perusahaan"
    />
  );
}
