# Ejercicio 06 · Toasts, navegación y UX con Tailwind

## Objetivo

Implementar un sistema simple de notificaciones, manejar redirecciones tras acciones y aplicar utilidades Tailwind para feedback visual.

## ¿Qué son los toasts y por qué importan?

- Definición: mensajes de notificación breves, no modales y no bloqueantes que aparecen superpuestos (generalmente en la esquina) y desaparecen solos tras unos segundos.
- Para qué se usan:
  - Confirmaciones rápidas ("Guardado correctamente", "Eliminado").
  - Errores globales que no dependen de un campo concreto ("No se pudo conectar con la API").
  - Información secundaria o de estado ("Sesión expirada", "Reintentando...").
- Cuándo NO usarlos:
  - Acciones que requieren confirmación del usuario (usa diálogos modales).
  - Errores que necesitan contexto detallado (muestra mensajes cerca del campo o una vista de error).
  - Mensajes demasiado frecuentes que interrumpen el flujo (limita o agrupa).
- Por qué son importantes:
  - Dan feedback inmediato sin romper el flujo de trabajo.
  - Mejoran la percepción de rendimiento y la claridad de estados.
  - Alinean la UX entre distintas páginas (patrón consistente de mensajes).
- Buenas prácticas:
  - Duración: 3–4 s para éxito/info; 4–6 s para errores.
  - Contenido: una idea por toast; 1–2 líneas máximo.
  - Semántica visual: colores consistentes (éxito=verde, error=rojo, info=azul, aviso=ámbar).
  - Posición: esquina superior derecha; apila con separación y permite cierre manual.
  - Accesibilidad: anuncia con región en vivo (aria-live="polite"/"assertive"), contraste suficiente y foco no robado.
  - Evita duplicados: colapsa toasts idénticos o ignora repetidos en intervalos cortos.

## Ejercicios guiados

### Guía 1 · Crear el servicio de toasts (paso a paso)

1) Genera el servicio

```bash
ng g service shared/services/toast-service
```

2) Implementa el servicio

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

Explicación rápida del servicio (qué hace y cómo funciona)

- Propósito: actúa como un “bus de eventos” para notificaciones. Cualquier parte de la app puede emitir un toast y un contenedor (que verás en la Guía 2) los escucha y los pinta en pantalla.
- Tipos y modelo: `ToastType` define la semántica (success/error/info/warning) y la interfaz `Toast` estandariza lo que se envía (`id`, `type`, `message`, `timeout`).
- Emisor vs. lector:
  - `Subject<Toast>` es el emisor interno (privado) que publica los toasts.
  - `toasts$` es un `Observable<Toast>` de solo lectura que exponemos hacia fuera. El sufijo `$` indica “stream”. Así evitamos que otros componentes emitan accidentalmente.
- Métodos de azúcar: `success`, `error`, `info`, `warning` llaman a `emit(...)` con un timeout recomendado. Puedes ajustar esos valores por caso de uso.
- `emit(...)`: crea un `id` simple con `Date.now()` (suficiente para este ejercicio) y envía el toast por el `Subject`. El contenedor usará `id` para cerrar/eliminar el toast y `timeout` para programar su desaparición.
- `providedIn: 'root'`: el servicio es singleton en toda la app; no necesitas declararlo en módulos.

Cómo se usa desde un componente (ejemplo mínimo)

```ts
constructor(private readonly toast: ToastService) {}

guardar() {
  this.api.save().subscribe({
    next: () => this.toast.success('Guardado correctamente'),
    error: () => this.toast.error('No se pudo guardar')
  });
}
```

Flujo mental para entenderlo

- Un componente llama `toast.success('...')` → el servicio emite un objeto `Toast`.
- El contenedor de toasts está suscrito a `toasts$` → recibe el toast, lo añade a la lista y programa su eliminación con `setTimeout`.
- La plantilla del contenedor hace `*ngFor` sobre esa lista y muestra cada toast con estilos según `type`.

Notas

- Si cambias el nombre del archivo, asegúrate de que el `import` del contenedor coincide con la ruta real del servicio.
- En producción podrías mejorar el `id`, evitar duplicados o añadir `clearAll()`; para el ejercicio no es necesario.

### Guía 2 · Construir el contenedor (paso a paso)

1) Genera el componente

```bash
ng g component shared/components/toast-component
```

2) Implementa el contenedor

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

3) Móntalo en AppComponent

```ts
// src/app/app.component.ts (fragmento)
import { ToastComponent } from './shared/components/toast-component/toast-component';

@Component({
  // ...
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  // ...
})
export class AppComponent {}
```

```html
<!-- src/app/app.component.html -->
<app-toast-container></app-toast-container>
<router-outlet></router-outlet>
```

### Guía 3 · Integrar navegación y feedback (paso a paso)

1) Éxito tras guardar

```ts
// Dentro de TasksPageComponent o similar
constructor(private readonly toast: ToastService) {}

onTaskSubmitted(payload: TaskPayload) {
  this.api.createTask(payload).subscribe({
    next: () => {
      this.toast.success('Tarea guardada');
      this.list?.loadTasks();
    },
    error: () => this.toast.error('No se pudo guardar la tarea')
  });
}
```

## Reto práctico

Usa los diferentes tipos de toast en la aplicación, todos los tipos que declaramos en el componente.

Consulta `06-toasts-navegacion.solucion.md` tras intentar el reto.
