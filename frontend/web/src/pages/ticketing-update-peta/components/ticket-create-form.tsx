import { useState, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MapTicket } from "../types";
import {
  DEFAULT_MAP_TYPES,
  DEFAULT_REGIONS,
  DEFAULT_WORK_TYPES,
  ESTATES_BY_REGION,
  getAdminForRegion,
  getAfdelingsForEstate,
  getRegionForEstate,
} from "../mock-requests";

interface TicketCreateFormProps {
  isOpen: boolean;
  onSubmit: (ticket: MapTicket) => void;
  onClose: () => void;
  busy?: boolean;
  lockedEstate?: string;
  lockedRegion?: "REGION 1" | "REGION 2" | "REGION 3";
  defaultRequesterName?: string;
}

// Blok sampel baku per Afdeling kebun
const SAMPLE_BLOCKS = [
  "A01", "A02", "A03", "A04", "A05",
  "B01", "B02", "B03", "B04", "B05",
  "C01", "C02", "C03", "C04", "C05",
  "D01", "D02", "D03", "D04", "D05",
  "E01", "E02", "E03", "E04", "E05",
  "F01", "F02", "F03", "G01", "G02",
];

export default function TicketCreateForm({
  isOpen,
  onSubmit,
  onClose,
  busy = false,
  lockedEstate,
  lockedRegion,
  defaultRequesterName = "",
}: TicketCreateFormProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const initialRegion = lockedRegion || (lockedEstate ? getRegionForEstate(lockedEstate) : "REGION 1");
  const initialEstate = lockedEstate || ESTATES_BY_REGION[initialRegion][0] || "BUM 1";

  const [title, setTitle] = useState("");
  const [requesterName, setRequesterName] = useState(defaultRequesterName);
  const [workType, setWorkType] = useState(DEFAULT_WORK_TYPES[0].label);
  const [mapType, setMapType] = useState<MapTicket["map_type"]>("PBLK");
  const [region, setRegion] = useState<MapTicket["region"]>(initialRegion);
  const [estate, setEstate] = useState(initialEstate);
  const [afdeling, setAfdeling] = useState(() => getAfdelingsForEstate(initialEstate)[0] || "AFD 1");
  const [blockNumber, setBlockNumber] = useState(SAMPLE_BLOCKS[0]);
  const [requestDate, setRequestDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [formError, setFormError] = useState("");

  // Penugasan Admin GIS otomatis di latar belakang sesuai Region
  const assignedAdmin = useMemo(() => getAdminForRegion(region), [region]);

  // List Afdeling yang sesuai dengan Estate yang dipilih
  const availableAfdelings = useMemo(() => getAfdelingsForEstate(estate), [estate]);

  // List Estate yang sesuai dengan Region yang dipilih
  const availableEstates = useMemo(() => ESTATES_BY_REGION[region] || [], [region]);

  const handleRegionChange = (newRegion: MapTicket["region"]) => {
    if (lockedRegion) return;
    setRegion(newRegion);
    const estates = ESTATES_BY_REGION[newRegion] || [];
    const nextEstate = estates[0] || "BUM 1";
    setEstate(nextEstate);
    const afds = getAfdelingsForEstate(nextEstate);
    setAfdeling(afds[0] || "AFD 1");
  };

  const handleEstateChange = (newEstate: string) => {
    if (lockedEstate) return;
    setEstate(newEstate);
    const matchedRegion = getRegionForEstate(newEstate);
    if (matchedRegion !== region) {
      setRegion(matchedRegion);
    }
    const afds = getAfdelingsForEstate(newEstate);
    setAfdeling(afds[0] || "AFD 1");
  };

  const selectedWorkTypeItem = useMemo(
    () => DEFAULT_WORK_TYPES.find((wt) => wt.label === workType) || DEFAULT_WORK_TYPES[0],
    [workType]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !requesterName.trim()) {
      setFormError("Judul permohonan dan nama pemohon wajib diisi.");
      return;
    }

    const cleanBlock = blockNumber || "-";
    const randomSuffix = Math.floor(100 + Math.random() * 900);

    // Format Nomor Peta Otomatis: MAP-[ESTATE]-[BLOK]-[KODE_PEKERJAAN]
    const mapNumberGenerated = `MAP-${estate.replace(/\s+/g, "")}-${cleanBlock}-${selectedWorkTypeItem.value_code}`;

    const newTicket: MapTicket = {
      ticket_id: `tkt-${Date.now()}`,
      ticket_number: `TKT-2026-02-${randomSuffix}`,
      map_number: mapNumberGenerated,
      title: title.trim(),
      order_name: assignedAdmin.adminName,
      assigned_admin_code: assignedAdmin.adminCode,
      work_type: workType,
      work_type_code: selectedWorkTypeItem.value_code,
      map_type: mapType,
      region,
      estate,
      afdeling,
      block_number: cleanBlock,
      target_date: requestDate,
      requester_name: requesterName.trim(),
      description: description.trim(),
      attachment_name: attachmentName || "dokumen_acuan.pdf",
      status: "submitted",
      progress_description: "Antrean verifikasi teknis GIS.",
      created_at: "24 Feb 2026",
      updated_at: "24 Feb 2026",
    };

    onSubmit(newTicket);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800 dark:text-white">
            Buat Permohonan Update Peta GIS
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            Formulir permohonan pembaruan peta blok kebun
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-xl border border-error-300 bg-error-50 px-4 py-2.5 text-xs text-error-800 dark:border-error-900/60 dark:bg-error-950/40 dark:text-error-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-1">
          {/* Baris 1: Judul Permohonan & Nama Pemohon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Judul Permohonan <span className="text-error-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Revisi Batas Pruning Blok A05"
                className="h-10 text-xs"
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Nama Pemohon <span className="text-error-500">*</span>
              </FieldLabel>
              <Input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Nama pemohon (Asisten / Mandor)"
                className="h-10 text-xs"
              />
            </Field>
          </div>

          {/* Baris 2: Lokasi Kebun (Region, Estate, Afdeling, Blok) */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Lokasi Kebun
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                PIC GIS: <span className="font-semibold text-brand-500">{assignedAdmin.adminName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Region */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Region
                </label>
                <select
                  value={region}
                  disabled={Boolean(lockedRegion)}
                  onChange={(e) => handleRegionChange(e.target.value as any)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {DEFAULT_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estate */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Estate
                </label>
                <select
                  value={estate}
                  disabled={Boolean(lockedEstate)}
                  onChange={(e) => handleEstateChange(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {availableEstates.map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>

              {/* Afdeling */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Afdeling
                </label>
                <select
                  value={afdeling}
                  onChange={(e) => setAfdeling(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {availableAfdelings.map((afd) => (
                    <option key={afd} value={afd}>
                      {afd}
                    </option>
                  ))}
                </select>
              </div>

              {/* Blok */}
              <div>
                <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Pilih Blok
                </label>
                <select
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold uppercase text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
                >
                  {SAMPLE_BLOCKS.map((blk) => (
                    <option key={blk} value={blk}>
                      Blok {blk}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Baris 3: Pekerjaan, Format & Tanggal Pengajuan dengan Kalender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Jenis Pekerjaan Kebun
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
              >
                {DEFAULT_WORK_TYPES.map((wt) => (
                  <option key={wt.value_code} value={wt.label}>
                    {wt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Format Layout Peta
              </label>
              <select
                value={mapType}
                onChange={(e) => setMapType(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
              >
                {DEFAULT_MAP_TYPES.map((mt) => (
                  <option key={mt.value_code} value={mt.label}>
                    {mt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Kalender: Tombol & Input Interaktif agar Kalender Selalu Terbuka */}
            <Field>
              <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Tanggal Pengajuan <span className="text-error-500">*</span>
              </FieldLabel>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-9 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                  title="Pilih tanggal di kalender"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              </div>
            </Field>
          </div>

          {/* Baris 4: Keterangan / Catatan */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Keterangan / Catatan Tambahan
            </FieldLabel>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan perubahan spasial yang diinginkan..."
              className="w-full rounded-[10px] border border-gray-300 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 shadow-theme-xs outline-hidden transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </Field>

          {/* Baris 5: File Lampiran Acuan */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Lampiran Acuan <span className="text-gray-400 font-normal">(.pdf, .kml, .kmz, .jpg)</span>
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                placeholder="Nama file lampiran acuan..."
                className="h-10 text-xs flex-1"
              />
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-gray-300 bg-gray-50 px-4 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span>Pilih File</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.kml,.kmz,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setAttachmentName(file.name);
                  }}
                />
              </label>
            </div>
          </Field>

          {/* Tombol Aksi Form */}
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
              <span>Kirim Permohonan</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
