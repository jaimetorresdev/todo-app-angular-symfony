# Solución · Ejercicio 06

## Servicio de toasts

```ts
// src/app/shared/services/toast-service.ts
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  timeout?: number; // ms
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private subject = new Subject<Toast>();
  toasts$: Observable<Toast> = this.subject.asObservable();

  success(message: string, timeout = 3000): void {
    this.emit('success', message, timeout);
  }

  error(message: string, timeout = 4000): void {
    this.emit('error', message, timeout);
  }

  info(message: string, timeout = 3000): void {
    this.emit('info', message, timeout);
  }

  warning(message: string, timeout = 3000): void {
    this.emit('warning', message, timeout);
  }

  private emit(type: ToastType, message: string, timeout: number): void {
    this.subject.next({ id: Date.now(), type, message, timeout });
  }
}
```

## Contenedor de toasts (extracto)

```ts
// src/app/shared/components/toast-component/toast-component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Toast, ToastService } from '../../services/toast-service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-component.html',
})
export class ToastComponent {
  toasts: Toast[] = [];

  constructor(private readonly toast: ToastService) {
    this.toast.toasts$.subscribe((t) => {
      this.toasts.push(t);
      const ttl = t.timeout ?? 3000;
      setTimeout(() => this.dismiss(t.id), ttl);
    });
  }

  dismiss(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}
```

```html
<!-- src/app/shared/components/toast-component/toast-component.html -->
<div class="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
  <div *ngFor="let t of toasts"
       class="pointer-events-auto rounded px-4 py-3 text-white shadow transition"
       [ngClass]="{
         'bg-green-600': t.type === 'success',
         'bg-red-600': t.type === 'error',
         'bg-blue-600': t.type === 'info',
         'bg-amber-600': t.type === 'warning'
       }">
    <div class="flex items-start justify-between gap-3">
      <p class="text-sm">{{ t.message }}</p>
      <button type="button" class="ml-2 text-white/80 hover:text-white" (click)="dismiss(t.id)">×</button>
    </div>
  </div>
  
</div>
```

## Montaje en `AppComponent`

```ts
// src/app/app.component.ts (fragmento)
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast-component/toast-component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}
```

```html
<!-- src/app/app.component.html -->
<app-toast-container></app-toast-container>
<router-outlet></router-outlet>
```

## Uso en el flujo

```ts
this.taskApi.createTask(taskPayload).subscribe({
  next: task => {
    this.toastService.success(`Tarea "${task.titulo}" guardada correctamente`);
    this.router.navigate(['/tasks']);
  },
  error: () => this.toastService.error('No se pudo guardar la tarea'),
});
```

## Puntos clave

- Los toasts expiran automáticamente con `setTimeout`, evitando acumulaciones.
- `router.navigate` recibe un array de segmentos y respeta el estado actual del router; `navigateByUrl` es útil cuando tienes la URL final como string.
- Tailwind facilita estilizar estados `hover`, `focus-visible` para accesibilidad.
- Como `AppComponent` es standalone, recuerda importar `ToastComponent` y colocarlo antes de `<router-outlet>` para que esté disponible en toda la app.
- Los guards del ejercicio 07 pueden reutilizar `ToastService.info` o `.warning` para comunicar bloqueos de navegación sin crear componentes adicionales.
