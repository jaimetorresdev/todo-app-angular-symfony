import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmModalState {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  readonly state$ = new BehaviorSubject<ConfirmModalState | null>(null);

  confirm(message: string, options?: { confirmLabel?: string; danger?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      this.state$.next({ message, resolve, ...options });
    });
  }

  respond(value: boolean): void {
    this.state$.value?.resolve(value);
    this.state$.next(null);
  }
}
