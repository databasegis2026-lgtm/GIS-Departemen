import BoundaryPageLayout from "../components/boundary-page-layout";

const COLUMNS = ["Region", "REGIONAL", "KOOR_KASIE"];

const INITIAL_DATA = [
  { id: "reg-1", Region: "Region 1", REGIONAL: "REGIONAL 1", KOOR_KASIE: "Koor Reg 1" },
  { id: "reg-2", Region: "Region 2", REGIONAL: "REGIONAL 2", KOOR_KASIE: "Koor Reg 2" },
  { id: "reg-3", Region: "Region 3", REGIONAL: "REGIONAL 3", KOOR_KASIE: "Koor Reg 3 + BSL" },
  { id: "reg-bsl", Region: "BSL", REGIONAL: "REGIONAL BSL", KOOR_KASIE: "Koor Reg 3 + BSL" },
];

export default function BatasRegionPage() {
  return (
    <BoundaryPageLayout
      pageTitle="Batas Region"
      levelName="Region"
      columns={COLUMNS}
      initialData={INITIAL_DATA}
      strokeColor="#7C3AED"
      strokeWeight={4}
      fillOpacity={0.08}
      tableName="batas_region"
    />
  );
}
