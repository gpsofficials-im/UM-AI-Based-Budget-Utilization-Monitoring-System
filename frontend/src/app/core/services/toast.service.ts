import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  public toasts = signal<ToastMessage[]>([]);

  public show(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 4000): void {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastMessage = { id, type, title, message };
    
    this.toasts.update((current) => [...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  public success(title: string, message: string): void {
    this.show('success', title, message);
  }

  public error(title: string, message: string): void {
    this.show('error', title, message);
  }

  public warning(title: string, message: string): void {
    this.show('warning', title, message);
  }

  public info(title: string, message: string): void {
    this.show('info', title, message);
  }

  public remove(id: string): void {
    this.toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
