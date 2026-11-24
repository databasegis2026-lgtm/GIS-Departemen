import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { RekapPekerjaanRecord } from "../types";
import {
  DEFAULT_AFDELINGS,
  DEFAULT_BLOCKS,
  DEFAULT_ESTATES,
  DEFAULT_ESTATES_BY_REGION,
  DEFAULT_REGIONS,
  KONDISI_BY_AKTIVITAS,
} from "../mock-rekap-operasional";

interface RekapFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: RekapPekerjaanRecord) => void;
  initialData?: RekapPekerjaanRecord | null;
  busy?: boolean;
}

export default function RekapFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  busy = false,
}: RekapFormModalProps) {
  const isEdit = Boolean(initialData);

  const [region, setRegion] = useState(initialData?.region || "REGION 1");
  const [estate, setEstate] = useState(initialData?.estate || "BUM 1");
  const [afdeling, setAfdeling] = useState(initialData?.afdeling || "AFD 1");
  const [blok, setBlok] = useState(initialData?.blok || DEFAULT_BLOCKS[0]);
  const [warung, setWarung] = useState(initialData?.warung || "Warung 01");
  const [luasHa, setLuasHa] = useState(initialData?.luas_ha?.toString() || "30.0");
  const [realisasiLuasHa, setRealisasiLuasHa] = useState(
    initialData?.realisasi_luas_ha?.toString() || "25.0"
  );
  const [sph, setSph] = useState(initialData?.sph?.toString() || "136");
  const [kondisi, setKondisi] = useState(initialData?.kondisi || "Ringan");
  const [kontraktor, setKontraktor] = useState(initialData?.kontraktor || "CV Makmur Tani");
  const [periode, setPeriode] = useState(initialData?.periode || "2026-02");
  const [tanggal, setTanggal] = useState(
    initialData?.tanggal || new Date().toISOString().slice(0, 10)
  );
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");
  const [aktivitas, setAktivitas] = useState<RekapPekerjaanRecord["aktivitas"]>(
    initialData?.aktivitas || "pruning"
  );
  const [lampiranAcuan, setLampiranAcuan] = useState(initialData?.lampiran_acuan || "");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
      setRegion(initialData.region);
      setEstate(initialData.estate);
      setAfdeling(initialData.afdeling);
      setBlok(initialData.blok);
      setWarung(initialData.warung);
      setLuasHa(initialData.luas_ha.toString());
      setRealisasiLuasHa(initialData.realisasi_luas_ha.toString());
      setSph(initialData.sph.toString());
      setKondisi(initialData.kondisi);
      setKontraktor(initialData.kontraktor);
      setPeriode(initialData.periode);
      setTanggal(initialData.tanggal);
      setKeterangan(initialData.keterangan);
      setAktivitas(initialData.aktivitas);
      setLampiranAcuan(initialData.lampiran_acuan || "");
      setErrorMsg("");
    }
  }, [initialData]);

  // List Estate dinamis berdasarkan Region
  const availableEstates = DEFAULT_ESTATES_BY_REGION[region] || DEFAULT_ESTATES;
  // Kondisi dinamis berdasarkan Aktivitas
  const availableKondisi = KONDISI_BY_AKTIVITAS[aktivitas] || ["Ringan", "Sedang", "Berat", "BAPP"];

  const handleRegionChange = (newReg: string) => {
    setRegion(newReg);
    const ests = DEFAULT_ESTATES_BY_REGION[newReg] || [];
    if (ests.length > 0 && !ests.includes(estate)) {
      setEstate(ests[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const targetNum = parseFloat(luasHa);
    const realisasiNum = parseFloat(realisasiLuasHa);
    const sphNum = parseInt(sph, 10);

    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg("Luas baku (Ha) harus angka valid lebih dari 0.");
      return;
    }
    if (isNaN(realisasiNum) || realisasiNum < 0) {
      setErrorMsg("Realisasi luas (Ha) harus angka valid.");
      return;
    }

    const capaian = targetNum > 0 ? (realisasiNum / targetNum) * 100 : 0;
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    const record: RekapPekerjaanRecord = {
      id: initialData?.id || `rkp-${Date.now()}`,
      kode_rekap: initialData?.kode_rekap || `RKP-202602-${aktivitas.slice(0, 3).toUpperCase()}-${randomSuffix}`,
      region,
      estate,
      afdeling,
      blok,
      warung,
      luas_ha: targetNum,
      realisasi_luas_ha: realisasiNum,
      capaian_persen: capaian,
      sph: isNaN(sphNum) ? 136 : sphNum,
      kondisi,
      kontraktor,
      update_peta: initialData?.update_peta || "Proses Verifikasi GIS",
      periode,
      tanggal,
      keterangan,
      aktivitas,
      status_verifikasi: initialData?.status_verifikasi || "submitted",
      lampiran_acuan: lampiranAcuan || "sketsa_lapangan.pdf",
      catatan_gis: initialData?.catatan_gis,
      verified_by_code: initialData?.verified_by_code,
      verified_by_name: initialData?.verified_by_name,
      database_committed: initialData?.database_committed || false,
      official_polygon: initialData?.official_polygon || [
        [-1.545, 113.965],
        [-1.545, 113.975],
        [-1.555, 113.975],
        [-1.555, 113.965],
      ],
      draft_polygon: initialData?.draft_polygon || [
        [-1.546, 113.965],
        [-1.546, 113.973],
        [-1.554, 113.973],
        [-1.554, 113.965],
      ],
    };

    onSave(record);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800 dark:text-white">
            {isEdit ? "Edit Rekap Pekerjaan Kebun" : "Tambah Rekap Pekerjaan Kebun"}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Input realisasi fisik lapangan (format identik Data Operasional) untuk diajukan ke tim GIS
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-2 text-xs text-error-800 dark:border-error-900/60 dark:bg-error-950/40 dark:text-error-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-1">
          {/* Baris 1: Aktivitas & Tanggal Kerja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Jenis Aktivitas <span className="text-error-500">*</span>
              </label>
              <select
                value={aktivitas}
                onChange={(e) => {
                  const newAkt = e.target.value as any;
                  setAktivitas(newAkt);
                  const validKond = KONDISI_BY_AKTIVITAS[newAkt] || [];
                  if (validKond.length > 0) setKondisi(validKond[0]);
                }}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
              >
                <option value="pruning">Pruning</option>
                <option value="pemupukan">Pemupukan</option>
                <option value="pasar_pikul">Pasar Pikul</option>
                <option value="jangkos">Jangkos</option>
                <option value="semprot">Semprot</option>
              </select>
            </div>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Tanggal Kerja <span className="text-error-500">*</span>
              </FieldLabel>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                onClick={(e) => (e.target as any).showPicker?.()}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Periode (Bulan-Tahun) <span className="text-error-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                required
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                placeholder="2026-02"
                className="h-10 text-xs"
              />
            </Field>
          </div>

          {/* Baris 2: Wilayah Kebun (Identik Data Operasional) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-gray-800 dark:bg-gray-800/30 space-y-2.5">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Lokasi Administratif Kebun
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {DEFAULT_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estate
                </label>
                <select
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {availableEstates.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Afdeling
                </label>
                <select
                  value={afdeling}
                  onChange={(e) => setAfdeling(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {DEFAULT_AFDELINGS.map((afd) => (
                    <option key={afd} value={afd}>
                      {afd}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Blok
                </label>
                <select
                  value={blok}
                  onChange={(e) => setBlok(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {DEFAULT_BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      Blok {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Warung
                </label>
                <Input
                  type="text"
                  value={warung}
                  onChange={(e) => setWarung(e.target.value)}
                  placeholder="Warung 01"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Baris 3: Data Fisik (Luas, Realisasi, SPH, Kondisi) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Luas Baku (Ha) <span className="text-error-500">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.1"
                required
                value={luasHa}
                onChange={(e) => setLuasHa(e.target.value)}
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Realisasi Luas (Ha) <span className="text-error-500">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.1"
                required
                value={realisasiLuasHa}
                onChange={(e) => setRealisasiLuasHa(e.target.value)}
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                SPH (Pokok/Ha)
              </FieldLabel>
              <Input
                type="number"
                value={sph}
                onChange={(e) => setSph(e.target.value)}
                className="h-10 text-xs"
              />
            </Field>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Kondisi / Status
              </label>
              <select
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
              >
                {availableKondisi.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 4: Kontraktor & Lampiran Acuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Pelaksana / Kontraktor / Mandor
              </FieldLabel>
              <Input
                type="text"
                value={kontraktor}
                onChange={(e) => setKontraktor(e.target.value)}
                placeholder="Nama mandor atau CV pemborong..."
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Lampiran Lapangan / Sketsa (.pdf, .jpg)
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={lampiranAcuan}
                  onChange={(e) => setLampiranAcuan(e.target.value)}
                  placeholder="Nama file acuan..."
                  className="h-10 text-xs flex-1"
                />
                <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-gray-300 bg-gray-50 px-3.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <span>Pilih</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.kml,.kmz,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setLampiranAcuan(file.name);
                    }}
                  />
                </label>
              </div>
            </Field>
          </div>

          {/* Baris 5: Keterangan Pekerjaan */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Keterangan & Catatan Fisik Pekerjaan
            </FieldLabel>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan pengerjaan di lapangan, kendala gawangan, dll..."
              className="w-full rounded-[10px] border border-gray-300 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 shadow-theme-xs outline-hidden transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </Field>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={busy}
              className="cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>{isEdit ? "Simpan Perubahan" : "Simpan & Ajukan ke GIS"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
