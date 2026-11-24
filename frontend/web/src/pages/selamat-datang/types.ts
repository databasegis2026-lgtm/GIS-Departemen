export type OperationalCategory =
  | "Produksi"
  | "Perawatan - Pemupukan"
  | "Perawatan - Semprot"
  | "Perawatan - Pruning"
  | "Perawatan - Pasar Pikul"
  | "Perawatan - Jangkos";

export type TicketStatus = "pending" | "in_review" | "completed";

export interface OperationalTicket {
  id: string;
  code: string;
  category: OperationalCategory;
  title: string;
  estate: string;
  block: string;
  reporter: string;
  status: TicketStatus;
  date: string;
}

export interface OperationalSummaryItem {
  key: string;
  title: string;
  path: string;
  progress: number;
  completedText: string;
  status: "normal" | "active" | "review";
}
