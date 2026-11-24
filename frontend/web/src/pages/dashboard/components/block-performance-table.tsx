import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SearchIcon } from "@/icons";
import { useState } from "react";
import { MOCK_BLOCK_DATA } from "../mock-data";
import type { DashboardBlockItem, DashboardFilterState } from "../types";

interface BlockPerformanceTableProps {
  filters?: DashboardFilterState;
  compact?: boolean;
}

export default function BlockPerformanceTable({ filters, compact = false }: BlockPerformanceTableProps) {
  const [search, setSearch] = useState("");
  const [selectedKondisi, setSelectedKondisi] = useState<string>("Semua");

  const filteredBlocks = MOCK_BLOCK_DATA.filter((item) => {
    if (filters) {
      if (filters.company === "BSL" && item.estate !== "BSL") return false;
      if (filters.company === "PT_BUM" && item.estate === "BSL") return false;
      if (filters.region !== "Semua" && item.region !== filters.region) return false;
      if (filters.estate !== "Semua" && item.estate !== filters.estate) return false;
    }

    const matchSearch =
      item.blok.toLowerCase().includes(search.toLowerCase()) ||
      item.estate.toLowerCase().includes(search.toLowerCase()) ||
      item.afdeling.toLowerCase().includes(search.toLowerCase()) ||
      item.warung.toLowerCase().includes(search.toLowerCase()) ||
      item.kondisi.toLowerCase().includes(search.toLowerCase());
    const matchKondisi =
      selectedKondisi === "Semua" || item.kondisi === selectedKondisi;
    return matchSearch && matchKondisi;
  });

  const renderKondisiBadge = (kondisi: string, warna: DashboardBlockItem["warnaKondisi"]) => {
    switch (warna) {
      case "hijau-tua":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-600" />
            {kondisi}
          </span>
        );
      case "hijau-soft":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-300">
            <span className="size-1.5 rounded-full bg-green-500" />
            {kondisi}
          </span>
        );
      case "kuning":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            <span className="size-1.5 rounded-full bg-amber-500" />
            {kondisi}
          </span>
        );
      case "merah-muda":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
            <span className="size-1.5 rounded-full bg-rose-400" />
            {kondisi}
          </span>
        );
      case "merah":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-950/50 dark:text-red-300">
            <span className="size-1.5 rounded-full bg-red-600" />
            {kondisi}
          </span>
        );
      case "biru":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <span className="size-1.5 rounded-full bg-blue-600" />
            {kondisi}
          </span>
        );
      case "orange":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-800 dark:bg-orange-950/50 dark:text-orange-300">
            <span className="size-1.5 rounded-full bg-orange-600" />
            {kondisi}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
            <span className="size-1.5 rounded-full bg-gray-400" />
            {kondisi}
          </span>
        );
    }
  };

  if (compact) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/3">
        {/* Compact Header & Search */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
          <div className="text-xs font-bold text-gray-800 dark:text-white/90">
            Daftar Blok ({filteredBlocks.length})
          </div>
          <div className="relative w-36">
            <SearchIcon className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari blok..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-full rounded-md border border-gray-200 bg-white pr-2 pl-6 text-[10px] text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Compact Scrollable Table */}
        <div className="mt-2 flex-1 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-100 text-[11px] dark:divide-gray-800">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="py-1 text-left font-semibold">Blok / Kebun</th>
                <th className="py-1 text-end font-semibold">Luas (Ha)</th>
                <th className="py-1 text-end font-semibold">Capaian</th>
                <th className="py-1 text-center font-semibold">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredBlocks.map((blk) => (
                <tr key={blk.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                  <td className="py-1.5">
                    <span className="font-bold text-brand-600 dark:text-brand-400">{blk.blok}</span>
                    <span className="ml-1 text-[10px] text-gray-400">{blk.estate}</span>
                  </td>
                  <td className="py-1.5 text-end font-medium">
                    {blk.realisasiHa.toFixed(1)} / {blk.luasHa.toFixed(1)}
                  </td>
                  <td className="py-1.5 text-end font-bold text-emerald-600 dark:text-emerald-400">
                    {blk.capaianPct.toFixed(0)}%
                  </td>
                  <td className="py-1.5 text-center">
                    {renderKondisiBadge(blk.kondisi, blk.warnaKondisi)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-white/3">
      {/* Table Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-800 sm:text-lg dark:text-white/90">
              Kinerja Spasial Blok Perkebunan (Standar 14 Kolom 2026)
            </h3>
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {filteredBlocks.length} Blok Terdaftar
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Satuan baku luas areal seluruh operasional menggunakan Hektar (Ha) dan SPH standar 136 Pkk/Ha
          </p>
        </div>

        {/* Search & Filter Dropdown */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari blok, afd, warung..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 bg-white pr-3 pl-9 text-xs text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
            />
          </div>

          <select
            value={selectedKondisi}
            onChange={(e) => setSelectedKondisi(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 outline-none transition-colors focus:border-brand-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200"
          >
            <option value="Semua">Semua Kondisi</option>
            <option value="BAPP">BAPP (100%)</option>
            <option value="Ringan">Ringan (85-99%)</option>
            <option value="Sedang">Sedang (60-84%)</option>
            <option value="Berat">Berat (35-59%)</option>
            <option value="Brushing">Brushing (&lt;35%)</option>
            <option value="Rotasi 1">Rotasi 1</option>
            <option value="Rotasi 2">Rotasi 2</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="mt-5 overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
          <TableHeader>
            <TableRow className="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/50">
              <TableCell isHeader className="py-3 text-left text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Wilayah Kebun
              </TableCell>
              <TableCell isHeader className="py-3 text-left text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Blok & Afd
              </TableCell>
              <TableCell isHeader className="py-3 text-left text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Warung
              </TableCell>
              <TableCell isHeader className="py-3 text-end text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Luas (Ha)
              </TableCell>
              <TableCell isHeader className="py-3 text-end text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Realisasi (Ha)
              </TableCell>
              <TableCell isHeader className="py-3 text-end text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Capaian
              </TableCell>
              <TableCell isHeader className="py-3 text-center text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                SPH
              </TableCell>
              <TableCell isHeader className="py-3 text-center text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Kondisi (Standar 2026)
              </TableCell>
              <TableCell isHeader className="py-3 text-center text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Status Spasial
              </TableCell>
              <TableCell isHeader className="py-3 text-left text-[11px] font-semibold text-gray-600 uppercase dark:text-gray-400">
                Keterangan
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredBlocks.map((blk) => (
              <TableRow key={blk.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                <TableCell className="py-3 text-xs">
                  <div className="font-semibold text-gray-800 dark:text-white/90">{blk.estate}</div>
                  <div className="text-[11px] text-gray-400">{blk.region}</div>
                </TableCell>

                <TableCell className="py-3 text-xs">
                  <div className="font-bold text-brand-600 dark:text-brand-400">{blk.blok}</div>
                  <div className="text-[11px] text-gray-400">{blk.afdeling}</div>
                </TableCell>

                <TableCell className="py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                  {blk.warung}
                </TableCell>

                <TableCell className="py-3 text-end text-xs font-semibold text-gray-800 dark:text-white/90">
                  {blk.luasHa.toFixed(2)} Ha
                </TableCell>

                <TableCell className="py-3 text-end text-xs font-semibold text-gray-800 dark:text-white/90">
                  {blk.realisasiHa.toFixed(2)} Ha
                </TableCell>

                <TableCell className="py-3 text-end text-xs">
                  <span
                    className={`font-bold ${
                      blk.capaianPct >= 90
                        ? "text-emerald-600 dark:text-emerald-400"
                        : blk.capaianPct >= 75
                        ? "text-blue-600 dark:text-blue-400"
                        : blk.capaianPct >= 60
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {blk.capaianPct.toFixed(1)}%
                  </span>
                </TableCell>

                <TableCell className="py-3 text-center text-xs">
                  <span className="font-mono text-gray-700 dark:text-gray-300">{blk.sph}</span>{" "}
                  <span className="text-[10px] text-gray-400">Pkk</span>
                </TableCell>

                <TableCell className="py-3 text-center text-xs">
                  {renderKondisiBadge(blk.kondisi, blk.warnaKondisi)}
                </TableCell>

                <TableCell className="py-3 text-center text-xs">
                  {blk.updatePeta === "Sinkron" ? (
                    <Badge color="success">Sinkron</Badge>
                  ) : blk.updatePeta === "Pembaruan" ? (
                    <Badge color="warning">Pembaruan</Badge>
                  ) : (
                    <Badge color="light">Tanpa Data</Badge>
                  )}
                </TableCell>

                <TableCell className="py-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="max-w-xs truncate" title={blk.keterangan}>
                    {blk.keterangan}
                  </div>
                  <div className="text-[10px] text-gray-400">{blk.tanggal}</div>
                </TableCell>
              </TableRow>
            ))}

            {filteredBlocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  Tidak ada data blok yang sesuai dengan filter pencarian.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
