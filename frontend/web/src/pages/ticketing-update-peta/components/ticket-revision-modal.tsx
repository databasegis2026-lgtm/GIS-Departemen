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

interface TicketRevisionModalProps {
  config: {
    ticket: MapTicket;
    mode: "revision" | "edit";
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    ticketId: string,
    mode: "revision" | "edit",
    notes: string,
    fileName?: string
  ) => void;
  busy?: boolean;
}

export default function TicketRevisionModal({
  config,
  isOpen,
  onClose,
  onSubmit,
  busy = false,
}: TicketRevisionModalProps) {
  const isRevision = config?.mode === "revision";

  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (config) {
      setNotes(config.mode === "revision" ? "" : config.ticket.description);
      setFileName(config.mode === "revision" ? "" : config.ticket.attachment_name || "");
      setFormError("");
    }
  }, [config]);

  if (!config) return null;

  const { ticket, mode } = config;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!notes.trim()) {
      setFormError(
        isRevision
          ? "Rincian revisi / patok koreksi wajib diisi."
          : "Catatan permohonan wajib diisi."
      );
      return;
    }

    onSubmit(ticket.ticket_id, mode, notes.trim(), fileName.trim() || undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-800 dark:text-white">
            {isRevision ? "Ajukan Koreksi / Revisi Peta" : "Edit Catatan Permohonan"}
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
          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {isRevision ? "Rincian Koreksi / Revisi" : "Catatan Permohonan"}{" "}
              <span className="text-error-500">*</span>
            </FieldLabel>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isRevision
                  ? "Tuliskan bagian peta yang belum sesuai, pergeseran patok batas, atau luas netto yang perlu dikoreksi..."
                  : "Ubah catatan atau instruksi permohonan pembaruan peta..."
              }
              className="w-full rounded-[10px] border border-gray-300 bg-white p-3 text-xs text-gray-800 placeholder:text-gray-400 shadow-theme-xs outline-hidden transition-colors focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Lampiran Pendukung Baru <span className="text-gray-400 font-normal">(.pdf, .kml, .kmz, .jpg)</span>
            </FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Nama file lampiran pendukung baru..."
                className="h-10 text-xs flex-1"
              />
              <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] border border-gray-300 bg-gray-50 px-3.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span>Upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.kml,.kmz,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFileName(file.name);
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
              {isRevision ? "Kirim Revisi" : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
