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
import type { MapTicket } from "../types";

interface TicketProgressModalProps {
  ticket: MapTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveProgress: (
    ticketId: string,
    status: MapTicket["status"],
    progressDescription: string,
    resultPdfName?: string
  ) => void;
  busy?: boolean;
}

export default function TicketProgressModal({
  ticket,
  isOpen,
  onClose,
  onSaveProgress,
  busy = false,
}: TicketProgressModalProps) {
  const [status, setStatus] = useState<MapTicket["status"]>("in_progress");
  const [desc, setDesc] = useState("");
  const [resultFileName, setResultFileName] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status === "submitted" ? "in_progress" : ticket.status);
      setDesc(ticket.progress_description || "");
      setResultFileName(ticket.result_pdf_name || "");
      setFormError("");
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!desc.trim()) {
      setFormError("Catatan progres verifikasi wajib diisi.");
      return;
    }

    onSaveProgress(ticket.ticket_id, status, desc.trim(), resultFileName.trim() || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800 dark:text-white">
            Update Progres Peta
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
            {ticket.ticket_number} • {ticket.title}
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-xl border border-error-300 bg-error-50 px-3.5 py-2 text-xs text-error-800 dark:border-error-900/60 dark:bg-error-950/40 dark:text-error-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-1">
          {/* Status Tiket */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Status Pengerjaan GIS
            </FieldLabel>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs text-gray-800 shadow-theme-xs outline-hidden focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white cursor-pointer"
            >
              <option value="in_progress">Diproses (Digitasi / Verifikasi)</option>
              <option value="revision_requested">Revisi Diperlukan (Ada Kendala)</option>
              <option value="completed">Selesai (Siap Cetak / Diterbitkan)</option>
            </select>
          </Field>

          {/* Catatan Progres */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Catatan Progres / Masukan GIS <span className="text-error-500">*</span>
            </FieldLabel>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Tuliskan catatan kemajuan kerja, kendala patok di lapangan, atau status validasi..."
              className="w-full rounded-[10px] border border-gray-300 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 shadow-theme-xs outline-hidden transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </Field>

          {/* Lampiran Hasil PDF */}
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              File Peta Hasil (.pdf) <span className="text-gray-400 font-normal">(Opsional)</span>
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={resultFileName}
                onChange={(e) => setResultFileName(e.target.value)}
                placeholder="Nama file PDF peta final..."
                className="h-10 text-xs flex-1"
              />
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-gray-300 bg-gray-50 px-3.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span>Upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setResultFileName(file.name);
                  }}
                />
              </label>
            </div>
          </Field>

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
              className="cursor-pointer"
            >
              Simpan Progres
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
