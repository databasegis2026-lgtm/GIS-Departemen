import { useState, useEffect } from "react";
import type { OperasionalRecord } from "../types";
import { DEFAULT_AFDELINGS, DEFAULT_ESTATES } from "../mock-operasional";

interface OperasionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: OperasionalRecord) => void;
  initialData?: OperasionalRecord | null;
}

export default function OperasionalFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: OperasionalFormModalProps) {
  if (!isOpen) return null;

  const isEdit = Boolean(initialData);

  const [region, setRegion] = useState(initialData?.region || "REGION 1");
  const [estate, setEstate] = useState(initialData?.estate || "BUM 1");
  const [afdeling, setAfdeling] = useState(initialData?.afdeling || "AFD 1");
  const [blok, setBlok] = useState(initialData?.blok || "");
  const [warung, setWarung] = useState(initialData?.warung || "Warung 01");
  const [luasHa, setLuasHa] = useState(initialData?.luas_ha?.toString() || "30.0");
  const [realisasiLuasHa, setRealisasiLuasHa] = useState(
    initialData?.realisasi_luas_ha?.toString() || "25.0"
  );
  const [sph, setSph] = useState(initialData?.sph?.toString() || "136");
  const [kondisi, setKondisi] = useState(initialData?.kondisi || "Ringan");
  const [kontraktor, setKontraktor] = useState(initialData?.kontraktor || "CV Makmur Tani");
  const [updatePeta, setUpdatePeta] = useState(initialData?.update_peta || "Tersinkron");
  const [periode, setPeriode] = useState(initialData?.periode || "2026-02");
  const [tanggal, setTanggal] = useState(initialData?.tanggal || new Date().toISOString().slice(0, 10));
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");
  const [aktivitas, setAktivitas] = useState<OperasionalRecord["aktivitas"]>(
    initialData?.aktivitas || "pruning"
  );
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
      setUpdatePeta(initialData.update_peta);
      setPeriode(initialData.periode);
      setTanggal(initialData.tanggal);
      setKeterangan(initialData.keterangan);
      setAktivitas(initialData.aktivitas);
      setErrorMsg("");
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!blok.trim()) {
      setErrorMsg("Kode blok wajib diisi.");
      return;
    }

    const luas = parseFloat(luasHa) || 0;
    const realisasi = parseFloat(realisasiLuasHa) || 0;
    const capaian = luas > 0 ? (realisasi / luas) * 100 : 0;

    const record: OperasionalRecord = {
      id: initialData?.id || `ops-${Date.now()}`,
      region,
      estate,
      afdeling,
      blok: blok.toUpperCase().trim(),
      warung: warung.trim(),
      luas_ha: luas,
      realisasi_luas_ha: realisasi,
      capaian_persen: Math.round(capaian * 10) / 10,
      sph: parseInt(sph, 10) || 136,
      kondisi: kondisi.trim(),
      kontraktor: kontraktor.trim(),
      update_peta: updatePeta.trim(),
      periode: periode.trim(),
      tanggal,
      keterangan: keterangan.trim(),
      aktivitas,
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="flex flex-col w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {isEdit ? "Edit Data Operasional" : "Tambah Data Operasional"}
            </h2>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Standar 15 Atribut Operasional Kebun Kelapa Sawit
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto max-h-[80vh]">
          {errorMsg && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Aktivitas & Tanggal & Periode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aktivitas *
              </label>
              <select
                value={aktivitas}
                onChange={(e) => setAktivitas(e.target.value as any)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer font-medium"
              >
                <option value="pruning">Pruning</option>
                <option value="semprot">Semprot</option>
                <option value="pemupukan">Pemupukan</option>
                <option value="pasar_pikul">Pasar Pikul</option>
                <option value="jangkos">Jangkos</option>
                <option value="produksi">Produksi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal *
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Periode *
              </label>
              <input
                type="text"
                required
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
                placeholder="2026-02"
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Region, Estate, Afdeling, Blok, Warung */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-800/20 space-y-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Identitas Wilayah & Blok
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="REGION 1">REGION 1</option>
                  <option value="REGION 2">REGION 2</option>
                  <option value="REGION 3">REGION 3</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Estate</label>
                <select
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {DEFAULT_ESTATES.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Afdeling</label>
                <select
                  value={afdeling}
                  onChange={(e) => setAfdeling(e.target.value)}
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-1.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {DEFAULT_AFDELINGS.map((afd) => (
                    <option key={afd} value={afd}>
                      {afd}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Blok *</label>
                <input
                  type="text"
                  required
                  value={blok}
                  onChange={(e) => setBlok(e.target.value)}
                  placeholder="A05"
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Warung</label>
                <input
                  type="text"
                  value={warung}
                  onChange={(e) => setWarung(e.target.value)}
                  placeholder="Warung 01"
                  className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Luas (Ha), Realisasi Luas (Ha), SPH */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Luas (Ha) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={luasHa}
                onChange={(e) => setLuasHa(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Realisasi Luas (Ha) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={realisasiLuasHa}
                onChange={(e) => setRealisasiLuasHa(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SPH (Pokok/Ha)
              </label>
              <input
                type="number"
                min="0"
                value={sph}
                onChange={(e) => setSph(e.target.value)}
                placeholder="136"
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Kondisi, Kontraktor, Update Peta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kondisi *
              </label>
              <input
                type="text"
                required
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value)}
                placeholder="BAPP / Selesai / Rotasi 1"
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kontraktor / Pelaksana
              </label>
              <input
                type="text"
                value={kontraktor}
                onChange={(e) => setKontraktor(e.target.value)}
                placeholder="CV Makmur Tani"
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Update Peta
              </label>
              <select
                value={updatePeta}
                onChange={(e) => setUpdatePeta(e.target.value)}
                className="h-8.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="Tersinkron">Tersinkron</option>
                <option value="Perlu Update">Perlu Update</option>
                <option value="Tiket Diajukan">Tiket Diajukan</option>
              </select>
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Keterangan
            </label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan teknis hasil pengerjaan lapangan..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Tombol Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm cursor-pointer"
            >
              {isEdit ? "Simpan Perubahan" : "Tambah Data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
