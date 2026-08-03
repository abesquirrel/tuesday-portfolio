export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface FilterState {
  album?: string;
  medium?: string;
  featured?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ModalState {
  id: string;
  isOpen: boolean;
  data?: any;
}

export interface AdminSettings {
  cloudName: string;
  adminDisplayName: string;
  heroImageId: string;
  aboutImageId: string;
}

export interface UploadProgress {
  id: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}