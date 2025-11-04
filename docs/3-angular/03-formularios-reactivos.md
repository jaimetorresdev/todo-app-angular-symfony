# Ejercicio 03 · Formularios reactivos y validaciones

## Objetivo

Construir el formulario reactivo para crear o editar tareas dentro de la To-Do App, aplicando validaciones y mostrando mensajes de error con Tailwind.

## Ejercicios guiados

### Guía 1 · Crear el componente de formulario

1. Genera `TaskFormComponent` con `ng g component modules/tasks-page-component/components/task-form-component`.
2. Declara la dependencia de `ReactiveFormsModule` en la propiedad `imports` del componente (si usas VS Code u otro IDE, coloca el cursor sobre `ReactiveFormsModule`, pulsa la bombilla/`Quick Fix` y selecciona la opción para importar automáticamente).
3. Inyecta `FormBuilder` y define el `FormGroup` con los campos de la entidad `Tarea`: `titulo`, `descripcion`, `estado`, `fechaLimite`.

   - ¿Qué es `FormBuilder`? Es un servicio que nos ayuda a crear estructuras de formularios reactivos (`FormGroup`, `FormControl`) de forma concisa.
   - ¿Dónde se inyecta? En el constructor del componente.
   - ¿Qué creamos? Una propiedad `form` de tipo `FormGroup` con los 4 campos y valores iniciales.

   Ejemplo mínimo en `task-form-component.ts` (sin validaciones todavía):

   ```ts
   import { Component } from "@angular/core";
   import {
     FormBuilder,
     FormGroup,
     ReactiveFormsModule,
     Validators,
   } from "@angular/forms";

   @Component({
     selector: "app-task-form-component",
     standalone: true,
     imports: [ReactiveFormsModule, CommonModule],
     templateUrl: "./task-form-component.html",
   })
   export class TaskFormComponent implements OnInit {
     form!: FormGroup;

     constructor(private readonly fb: FormBuilder) {}

     ngOnInit(): void {
       this.form = this.fb.group({
         titulo: [""], // string vacío por defecto
         descripcion: [""], // string vacío por defecto
         estado: ["pendiente"], // valor inicial
         fechaLimite: [null], // puede ser null o string con fecha
       });
     }
   }
   ```

   Y un extracto del template `task-form-component.html` para vincular el formulario (recuerda crear los inputs reales más adelante):

   ```html
   <form [formGroup]="form">
     <label class="block text-sm font-medium">Título</label>
     <input
       type="text"
       formControlName="titulo"
       class="mt-1 w-full rounded border px-3 py-2"
     />

     <label class="mt-4 block text-sm font-medium">Descripción</label>
     <textarea
       formControlName="descripcion"
       rows="3"
       class="mt-1 w-full rounded border px-3 py-2"
     ></textarea>

     <label class="mt-4 block text-sm font-medium">Estado</label>
     <select
       formControlName="estado"
       class="mt-1 w-full rounded border px-3 py-2"
     >
       <option value="pendiente">Pendiente</option>
       <option value="en progreso">En progreso</option>
       <option value="completada">Completada</option>
     </select>

     <label class="mt-4 block text-sm font-medium">Fecha límite</label>
     <input
       type="date"
       formControlName="fechaLimite"
       class="mt-1 w-full rounded border px-3 py-2"
     />
   </form>
   ```

   Nota rápida sobre tipado (opcional): si quieres formularios tipados, puedes declarar de forma explícita el tipo del grupo o usar `NonNullableFormBuilder`. Para este ejercicio, con `FormBuilder` simple es suficiente; añadiremos validaciones en la guía 2.

### Guía 2 · Configurar validaciones

1. Agrega validaciones: `titulo` requerido (mínimo 3 caracteres), `descripcion` máximo 500, `fechaLimite` opcional (sin validación adicional, el input `type="date"` ya ayuda).

   - Importa `Validators` y crea el grupo con reglas:

   ```ts
   import { Validators } from "@angular/forms";

   this.form = this.fb.group({
     titulo: ["", [Validators.required, Validators.minLength(3)]],
     descripcion: ["", [Validators.maxLength(500)]],
     estado: ["pendiente", [Validators.required]],
     fechaLimite: [null],
   });
   ```

   - Para simplificar, no añadimos validador personalizado para fecha: con `type="date"` el navegador ya limita la entrada.

   - Ejemplos de mensajes de error en el template:

   ```html
   <input formControlName="titulo" />
   <p
     *ngIf="form.get('titulo')?.hasError('required') && form.get('titulo')?.touched"
   >
     El título es obligatorio.
   </p>
   <p
     *ngIf="form.get('titulo')?.hasError('minlength') && form.get('titulo')?.touched"
   >
     Mínimo 3 caracteres.
   </p>

   <input type="date" formControlName="fechaLimite" />
   ```

2. Implementa `onSubmit()` que marque todos los controles como tocados antes de emitir el valor:

   ```ts
   import { EventEmitter, Output } from '@angular/core';

   @Output() submitted = new EventEmitter<any>();

   onSubmit(): void {
     if (this.form.invalid) {
       this.form.markAllAsTouched();
       return;
     }
     this.submitted.emit(this.form.getRawValue());
   }
   ```

   - En el template, usa `(ngSubmit)="onSubmit()"` y deshabilita el botón mientras el formulario sea inválido:

   ```html
   <form [formGroup]="form" (ngSubmit)="onSubmit()">
     <!-- campos ... -->
     <button type="submit" [disabled]="form.invalid">Guardar</button>
   </form>
   ```

### Integración en la página de tareas

Al terminar, integra el formulario real en la página de tareas y sustituye cualquier formulario provisional o el botón de “Crear nueva tarea”.

1. Importa el componente en `src/app/modules/tasks-page-component/tasks-page-component.ts` y añádelo a `imports`:

```ts
import { TaskFormComponent } from "./components/task-form-component/task-form-component";

@Component({
  // ...
  imports: [CommonModule /* otros */, , TaskFormComponent],
  // ...
})
export class TasksPageComponent {
  tasks: Task[] = [
    {
      title: "Aprender Angular",
      status: "en progreso",
      dueDate: "2025-11-15",
    },
    {
      title: "Practicar con TypeScript",
      status: "pendiente",
      dueDate: "2025-11-20",
    },
    {
      title: "Estudiar Tailwind",
      status: "completada",
      dueDate: null,
    },
    {
      title: "Preparar presentaciones",
      status: "pendiente",
      dueDate: "2025-12-05",
    },
    {
      title: "Revisar pull requests",
      status: "en progreso",
      dueDate: null,
    },
  ];
  onTaskSubmitted(payload: any) {
    console.log("Tarea guardada", payload);
  }
}
```

2. En `src/app/modules/tasks-page-component/tasks-page-component.html`, sustituye el bloque del CTA por el formulario:

```html
<!-- Quita el botón de crear y coloca el formulario -->
<!-- <button class="...">Crear nueva tarea</button> -->

<app-task-form-component
  (submitted)="onTaskSubmitted($event)"
></app-task-form-component>
```

Consulta `03-formularios-reactivos.solucion.md` después de completar el reto.
