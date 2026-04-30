export type GarmentType = 'tshirt' | 'shorts' | 'combo';

export interface Style {
  id: string;
  barcode: string;
  name: string;
  type: GarmentType;
  imageUrl?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  layoutImage?: string;
  customPoints?: { id: string; label: string; x: number; y: number }[];
}

export interface SelectedDefect {
  category: string;
  subCategory: string;
  imageUrl: string;
  part: string;
}

export interface DefectReport {
  id?: string;
  reportId?: string; // ID from Firebase or custom generator
  styleId: string;
  styleName: string;
  layoutImage?: string;
  category: string; // Primary category for quick reference
  subCategory: string; // List of sub-categories as string for quick reference
  part: string;
  status: 'pending' | 'resolved';
  createdAt: any; // Date string or Timestamp
  reporterEmail: string;
  reporterUid: string;
  inspectorName?: string;
  operation?: string;
  operatorName?: string;
  notes?: string;
  defects?: SelectedDefect[]; // Detailed list with images
  customPoints?: { id: string; label: string; x: number; y: number }[];
}

export interface DefectSubCategory {
  name: string;
  description: string;
  imageUrl: string;
}

export interface DefectCategory {
  name: string;
  icon: string;
  imageUrl?: string;
  subCategories: DefectSubCategory[];
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'employee';
  name?: string;
}

export interface StyleStats {
  counts: Record<string, number>;
  details: Record<string, Record<string, number>>;
  totalReports: number;
  totalDefects: number;
}
