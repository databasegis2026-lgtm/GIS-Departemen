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
  "AFD",
];

const INITIAL_DATA = [
  {
    id: "blk-1",
    Region: "Region 1",
    Estate: "Estate BUM 1",
    Afdeling: "OA",
    Blok: "E28",
    TahunTanam: "2015",
    Luas: 28.5,
    TM_Pokok: 3840,
    JSPV_1: "JSPV 1",
    JSPV_2: "JSPV 2",
    SPV: "SPV A",
    KASIE: "Kasie BUM 1",
    KOOR_KASIE: "Koor Reg 1",
    AFD: "OA",
  },
  {
    id: "blk-2",
    Region: "Region 1",
    Estate: "Estate BUM 1",
    Afdeling: "OA",
    Blok: "E29",
    TahunTanam: "2015",
    Luas: 30.2,
    TM_Pokok: 4050,
    JSPV_1: "JSPV 1",
    JSPV_2: "JSPV 2",
    SPV: "SPV A",
    KASIE: "Kasie BUM 1",
    KOOR_KASIE: "Koor Reg 1",
    AFD: "OA",
  },
  {
    id: "blk-3",
    Region: "Region 1",
    Estate: "Estate BUM 1",
    Afdeling: "OB",
    Blok: "F30",
    TahunTanam: "2016",
    Luas: 25.0,
    TM_Pokok: 3375,
    JSPV_1: "JSPV 1",
    JSPV_2: "JSPV 2",
    SPV: "SPV B",
    KASIE: "Kasie BUM 1",
    KOOR_KASIE: "Koor Reg 1",
    AFD: "OB",
  },
  {
    id: "blk-4",
    Region: "Region 1",
    Estate: "Estate BUM 1",
    Afdeling: "OB",
    Blok: "F31",
    TahunTanam: "2016",
    Luas: 27.8,
    TM_Pokok: 3750,
    JSPV_1: "JSPV 1",
    JSPV_2: "JSPV 2",
    SPV: "SPV B",
    KASIE: "Kasie BUM 1",
    KOOR_KASIE: "Koor Reg 1",
    AFD: "OB",
  },
];

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
