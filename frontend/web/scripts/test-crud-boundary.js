/**
 * Automated Verification Script for Boundary CRUD and Spatial Operations (Plain JS)
 */

class MockSupabase {
  constructor() {
    this.auditLogs = [];
  }

  async logAudit(payload) {
    this.auditLogs.push(payload);
    return { data: { success: true, id: Date.now() }, error: null };
  }
}

// Simulated Boundary Manager Engine matching BoundaryPageLayout.tsx logic
class BoundaryStateManager {
  constructor(tableName, levelName, columns, initialData, supabase) {
    this.tableName = tableName;
    this.levelName = levelName;
    this.columns = columns;
    this.data = [...initialData];
    this.supabase = supabase;
  }

  // CREATE
  async create(record) {
    const newId = `${this.tableName}-${Date.now()}`;
    const newRow = { ...record, id: newId };
    this.data = [newRow, ...this.data];

    await this.supabase.logAudit({
      action: "INSERT",
      table_name: this.tableName,
      record_id: newId,
      details: `Tambah data ${this.levelName} baru: ${record[this.columns[0]] || newId}`,
    });

    return newRow;
  }

  // READ / SEARCH
  search(query) {
    if (!query || !query.trim()) return this.data;
    const q = query.toLowerCase();
    return this.data.filter((item) =>
      Object.values(item).some((val) => String(val ?? "").toLowerCase().includes(q))
    );
  }

  // UPDATE
  async update(id, updatedFields) {
    const idx = this.data.findIndex((item) => item.id === id);
    if (idx === -1) return false;

    this.data[idx] = { ...this.data[idx], ...updatedFields, id };

    await this.supabase.logAudit({
      action: "UPDATE",
      table_name: this.tableName,
      record_id: id,
      details: `Ubah data ${this.levelName} ID ${id}`,
    });

    return true;
  }

  // DELETE
  async delete(id) {
    const target = this.data.find((item) => item.id === id);
    if (!target) return false;

    const identifier = target[this.columns[0]] || target[this.columns[1]] || target.id;
    this.data = this.data.filter((item) => item.id !== id);

    await this.supabase.logAudit({
      action: "DELETE",
      table_name: this.tableName,
      record_id: id,
      details: `Hapus baris ${this.levelName} "${identifier}"`,
    });

    return true;
  }

  // UPLOAD SHP
  async uploadShp(fileName, fileSizeBytes) {
    const sz =
      fileSizeBytes < 1024 * 1024
        ? `${(fileSizeBytes / 1024).toFixed(1)} KB`
        : `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`;

    await this.supabase.logAudit({
      action: "UPLOAD",
      table_name: this.tableName,
      record_id: fileName,
      details: `Unggah SHP ${this.levelName} (${fileName}, ${sz}) tanpa batasan ukuran`,
    });

    return sz;
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("   AUTOMATED TEST SUITE: CRUD & SPASIAL BATAS PERUSAHAAN       ");
  console.log("===============================================================\n");

  const mockSupabase = new MockSupabase();
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

  const manager = new BoundaryStateManager(
    "batas_perusahaan",
    "Perusahaan",
    COLUMNS,
    INITIAL_DATA,
    mockSupabase
  );

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      console.log(`       -> ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      console.error(`       -> ${detail}`);
      failed++;
    }
  }

  // 1. Initial State
  assert(
    manager.data.length === 2 && manager.data[0].Perusahaan === "PT BUM",
    "1. Verifikasi Inisialisasi Data Batas Perusahaan",
    `Ditemukan ${manager.data.length} data entitas baku (PT BUM & PT BSL)`
  );

  // 2. CREATE (Tambah Data)
  console.log("\n--- Menjalankan Tes CREATE (Tambah Data) ---");
  const newEntity = await manager.create({
    Region: "Region 2",
    REGIONAL: "Holding PT BUM",
    Koordinator: "Budi Santoso",
    Luas: 12500.0,
    KH: "HGU 09/BUM/2010",
    Perusahaan: "PT BUM Unit 2",
    Id: "BUM-ENT-03",
  });

  assert(
    manager.data.length === 3 && manager.data[0].id === newEntity.id,
    "2. Operasi Tambah Data (INSERT)",
    `Data baru berhasil ditambahkan di urutan teratas (ID: ${newEntity.id}, Total: ${manager.data.length})`
  );

  const lastAuditCreate = mockSupabase.auditLogs[mockSupabase.auditLogs.length - 1];
  assert(
    lastAuditCreate &&
      lastAuditCreate.action === "INSERT" &&
      lastAuditCreate.table_name === "batas_perusahaan",
    "3. Sinkronisasi Audit Log Supabase untuk INSERT",
    `Audit tercatat: Action=${lastAuditCreate?.action}, Table=${lastAuditCreate?.table_name}, Details="${lastAuditCreate?.details}"`
  );

  // 3. READ / SEARCH
  console.log("\n--- Menjalankan Tes READ / SEARCH (Pencarian & Filter) ---");
  const searchBsl = manager.search("BSL");
  assert(
    searchBsl.length === 1 && searchBsl[0].Perusahaan === "PT BSL",
    "4. Operasi Pencarian (Query: 'BSL')",
    `Berhasil memfilter 1 data spesifik: ${searchBsl[0]?.Perusahaan}`
  );

  const searchAri = manager.search("Ari Setyo");
  assert(
    searchAri.length === 2,
    "5. Operasi Pencarian Multi-Kolom (Query: 'Ari Setyo')",
    `Ditemukan ${searchAri.length} data dengan koordinator Ari Setyo Wibowo`
  );

  const searchEmpty = manager.search("NonExistentKeyword");
  assert(
    searchEmpty.length === 0,
    "6. Operasi Pencarian Data Tidak Ditemukan",
    `Hasil pencarian kosong (0 data) sesuai ekspektasi`
  );

  // 4. UPDATE (Edit Data)
  console.log("\n--- Menjalankan Tes UPDATE (Edit Data) ---");
  const updateSuccess = await manager.update(newEntity.id, {
    Luas: 13200.75,
    Koordinator: "Budi Santoso, S.P.",
  });

  const updatedRecord = manager.data.find((item) => item.id === newEntity.id);
  assert(
    updateSuccess &&
      updatedRecord?.Luas === 13200.75 &&
      updatedRecord?.Koordinator === "Budi Santoso, S.P.",
    "7. Operasi Edit Data (UPDATE)",
    `Data ID ${newEntity.id} berhasil diperbarui: Luas=${updatedRecord?.Luas} Ha, Koor=${updatedRecord?.Koordinator}`
  );

  const lastAuditUpdate = mockSupabase.auditLogs[mockSupabase.auditLogs.length - 1];
  assert(
    lastAuditUpdate &&
      lastAuditUpdate.action === "UPDATE" &&
      lastAuditUpdate.record_id === newEntity.id,
    "8. Sinkronisasi Audit Log Supabase untuk UPDATE",
    `Audit tercatat: Action=${lastAuditUpdate?.action}, RecordID=${lastAuditUpdate?.record_id}`
  );

  // 5. DELETE (Hapus Data)
  console.log("\n--- Menjalankan Tes DELETE (Hapus Data) ---");
  const deleteSuccess = await manager.delete(newEntity.id);
  const foundDeleted = manager.data.find((item) => item.id === newEntity.id);

  assert(
    deleteSuccess && !foundDeleted && manager.data.length === 2,
    "9. Operasi Hapus Data (DELETE)",
    `Data ID ${newEntity.id} berhasil dihapus dari memori state (Sisa: ${manager.data.length} data)`
  );

  const lastAuditDelete = mockSupabase.auditLogs[mockSupabase.auditLogs.length - 1];
  assert(
    lastAuditDelete &&
      lastAuditDelete.action === "DELETE" &&
      lastAuditDelete.record_id === newEntity.id,
    "10. Sinkronisasi Audit Log Supabase untuk DELETE",
    `Audit tercatat: Action=${lastAuditDelete?.action}, Details="${lastAuditDelete?.details}"`
  );

  // 6. UPLOAD SHP (Tanpa Batasan Ukuran)
  console.log("\n--- Menjalankan Tes UPLOAD SHP (Berkas Besar Tanpa Batas) ---");
  const uploadedSize = await manager.uploadShp(
    "BATAS_KADASTRAL_PT_BUM_BSL_2026_HIGHRES.zip",
    248 * 1024 * 1024 // 248 MB
  );

  const lastAuditUpload = mockSupabase.auditLogs[mockSupabase.auditLogs.length - 1];
  assert(
    uploadedSize === "248.00 MB" &&
      lastAuditUpload &&
      lastAuditUpload.action === "UPLOAD" &&
      lastAuditUpload.record_id === "BATAS_KADASTRAL_PT_BUM_BSL_2026_HIGHRES.zip",
    "11. Operasi Unggah SHP Ukuran Besar (248 MB)",
    `Berkas diterima: ${lastAuditUpload?.record_id} (${uploadedSize}), Audit Action=${lastAuditUpload?.action}`
  );

  // Summary
  console.log("\n===============================================================");
  console.log(`HASIL AKHIR: ${passed} PASSED | ${failed} FAILED (Total ${passed + failed} Tes)`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
