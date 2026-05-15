export type Priority = 'Emergency' | 'High' | 'Medium' | 'Low';
export type RepairStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
// Bay names are dynamic (master data), so keep this as a plain string.
export type BayLocation = string;

export type UserRole = 'Admin' | 'Workshop Officer' | 'Factory Officer';

export interface CategoryCompletion {
  name: string;
  comment?: string;
}

export interface RepairOrder {
  id: string;
  vehicleId: string;
  mileage: number;
  priority: Priority;
  expectedTime: string;
  releaseTime?: string;
  problemDescription: string;
  checklist: string[];
  categories: string[];
  attachments?: string[];
  comments: string;
  status: RepairStatus;
  createdAt: string;
  location?: BayLocation;
  technician?: string;
  proposedTime?: string;
  completedAt?: string;
  completionComments?: string;
  completedCategories?: CategoryCompletion[];
}

export interface Vehicle {
  id: number;
  department_id?: number | null;
  make: string;
  model: string;
  year: number;
  vin: string;
  image_filename?: string | null;
  source?: 'manual' | 'api';
  external_id?: string | null;
  external_make?: string | null;
  external_model?: string | null;
  last_sync_at?: string | null;
  current_mileage?: number;
  mileage_last_synced_at?: string | null;
  created_at: string;
}

export interface VehicleMake {
  id: number;
  name: string;
  created_at: string;
}

export interface VehicleModel {
  id: number;
  make_id: number;
  make_name: string;
  name: string;
  created_at: string;
}
