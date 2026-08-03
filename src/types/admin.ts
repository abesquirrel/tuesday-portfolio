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