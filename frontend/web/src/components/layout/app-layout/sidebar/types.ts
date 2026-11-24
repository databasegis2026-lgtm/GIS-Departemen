import React from "react";

export type MenuType = "main" | "support" | "others";

export interface SubItem {
  key: string;
  path?: string;
  subItems?: SubItem[];
  pro?: boolean;
  new?: boolean;
  target?: string;
}

export interface NavItem {
  key: string;
  icon: React.ReactNode;
  path?: string;
  new?: boolean;
  target?: string;
  subItems?: SubItem[];
}
