import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { ConfirmModalService } from './confirm-modal.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [NgIf, AsyncPipe],
  template: `
    @if (svc.state$ | async; as state) {
      <!-- Backdrop -->
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
        (click)="svc.respond(false)">

        <!-- Overlay -->
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"></div>

        <!-- Panel -->
        <div class="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900
                    border border-slate-200 dark:border-slate-700
                    shadow-xl shadow-slate-900/20 dark:shadow-slate-950/60
                    p-6 animate-in zoom-in-95 fade-in duration-150"
          (click)="$event.stopPropagation()">

          <!-- Icono -->
          <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
            [class.bg-rose-100]="state.danger !== false"
            [class.dark:bg-rose-900/30]="state.danger !== false"
            [class.bg-slate-100]="state.danger === false"
            [class.dark:bg-slate-800]="state.danger === false">
            <svg class="h-5 w-5"
              [class.text-rose-600]="state.danger !== false"
              [class.dark:text-rose-400]="state.danger !== false"
              [class.text-slate-500]="state.danger === false"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
          </div>

          <!-- Mensaje -->
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug mb-6">
            {{ state.message }}
          </p>

          <!-- Acciones -->
          <div class="flex items-center justify-end gap-3">
            <button type="button" (click)="svc.respond(false)"
              class="h-9 px-4 rounded-xl border border-slate-200 dark:border-slate-700
                     text-sm font-bold text-slate-600 dark:text-slate-300
                     hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="button" (click)="svc.respond(true)"
              class="h-9 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              [class.bg-rose-600]="state.danger !== false"
              [class.hover:bg-rose-700]="state.danger !== false"
              [class.shadow-rose-600/25]="state.danger !== false"
              [class.bg-blue-600]="state.danger === false"
              [class.hover:bg-blue-700]="state.danger === false"
              [class.shadow-blue-600/25]="state.danger === false"
              class="shadow-lg">
              {{ state.confirmLabel ?? 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModalComponent {
  readonly svc = inject(ConfirmModalService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.svc.state$.value) this.svc.respond(false);
  }
}
