# Ejercicio 02 · Componentes standalone y reutilización

## Objetivo

Construir dos vistas standalone básicas (landing y listado de tareas) y extraer componentes compartidos para los encabezados. Practicarás rutas perezosas sin módulos tradicionales y prepararás la base para formularios reactivos y consumo de API en los ejercicios siguientes.

## Ejercicios guiados

### Guía 1 · Landing page mínima

> **Nota rápida sobre los archivos generados**
> Cada `ng g component` crea `.ts`, `.html`, `.css` y `.spec.ts`.
> En este proyecto solo trabajaremos con `.ts` y `.html` aplicando clases Tailwind dentro de la plantilla.
> Los `.css` y `.spec.ts` pueden quedarse vacíos (puedes incluso borrarlos).

1. Genera `LandingPageComponent` con `ng g component modules/landing-page-component` (bien dentro del contenedor del front o desde angular-frontend en la terminal).
2. En `src/app/app.routes.ts`, añade la ruta raíz. Primero importa el componente y luego añádelo a las rutas:

   ```ts
   export const routes: Routes = [
     { path: '', component: LandingPageComponent }
   ];
   ```

   No te olvides de importar el componente al principio del archivo. (`import { LandingPageComponent } from './modules/landing-page-component/landing-page-component';`)

3. 3. Para que el routing funcione correctamente, primero necesitamos configurar el app-component:

   ```html
   <!-- app-component.html -->
   <!-- Dejamos solo el router-outlet ya que será el punto donde Angular renderizará 
        dinámicamente los componentes según la ruta actual -->
   <router-outlet></router-outlet>
   ```

   ```ts
   // app-component.ts
   import { Component } from '@angular/core';
   import { RouterOutlet } from '@angular/router';

   @Component({
     selector: 'app-root',
     standalone: true,
     imports: [RouterOutlet], // Necesario para usar router-outlet
     templateUrl: './app-component.html',
   })
   export class AppComponent { }
   ```

   Ahora, diseña el hero en el landing page component. Primero configura el componente:

   ```ts
   // landing-page-component.ts
   import { Component } from '@angular/core';
   import { RouterLink } from '@angular/router'; // Necesario para usar routerLink

   @Component({
     selector: 'app-landing-page',
     standalone: true,
     imports: [RouterModule], // Necesario para la navegación
     templateUrl: './landing-page-component.html'
   })
   export class LandingPageComponent { }
   ```

   Y crea el hero con el template (crea tu propio HTML, el siguiente es solo un ejemplo):

   ```html
   <!-- landing-page-component.html -->
   <main class="min-h-screen bg-white">
     <div class="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
       <div class="mx-auto max-w-2xl text-center">
         <!-- Heading -->
         <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
           Gestiona tus tareas de forma eficiente
         </h1>
         
         <!-- Descripción -->
         <p class="mt-6 text-lg leading-8 text-gray-600">
           Una aplicación simple pero potente para organizar tu trabajo diario. 
           Crea, actualiza y completa tareas fácilmente.
         </p>
         
         <!-- Botón CTA -->
         <div class="mt-10 flex items-center justify-center gap-x-6">
           <a routerLink="/tasks" 
              class="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white 
                     shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 
                     focus-visible:outline-offset-2 focus-visible:outline-blue-600">
             Comenzar
           </a>
         </div>
       </div>
     </div>
   </main>
   ```

   > **¿Por qué solo router-outlet en app.component.html?**
   >
   > El `router-outlet` es una directiva especial que actúa como un marcador de posición
   > donde Angular insertará dinámicamente los componentes basándose en la ruta actual.
   > Cuando navegas a '/', Angular renderizará el LandingPageComponent dentro del router-outlet.
   > Cuando navegas a '/tasks', reemplazará el contenido con el TasksPageComponent.
   > Esta es la base del enrutamiento en Angular y permite la navegación sin recargar la página.

Nota: para hacer uso de routerlink hay que importar RouterModule en el archivo ts, sección imports.

### Guía 2 · Vista de tareas mock

1. Genera `TasksPageComponent` con `ng g component modules/tasks-page-component`.
2. Añade la ruta para `/tasks`. Actualiza `src/app/app.routes.ts`:

   ```ts
   import { Routes } from '@angular/router';
   import { LandingPageComponent } from './modules/landing/landing-page-component';
   import { TasksPageComponent } from './modules/tasks/tasks-page-component';

   export const routes: Routes = [
     { path: '', component: LandingPageComponent },
     { path: 'tasks', component: TasksPageComponent }
   ];
   ```

3. Vamos a crear la lista de tareas paso a paso:

   Primero, modifica el archivo tasks-page-component.ts:

   ```ts
   // tasks-page-component.ts
   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common'; // Necesario para NgFor

   // Definimos una interfaz para tipar nuestras tareas
   interface Task {
     title: string;
     status: 'pendiente' | 'en progreso' | 'completada';
     dueDate: string | null;
   }

   @Component({
     selector: 'app-tasks-page',
     standalone: true,
     imports: [CommonModule], // Importamos CommonModule para usar directivas como NgFor
     templateUrl: './tasks-page.component.html'
   })
   export class TasksPageComponent {
     // Creamos un array de tareas de ejemplo
     tasks: Task[] = [
       {
         title: 'Aprender Angular',
         status: 'en progreso',
         dueDate: '2025-11-15'
       },
       {
         title: 'Practicar con TypeScript',
         status: 'pendiente',
         dueDate: '2025-11-20'
       },
       {
         title: 'Estudiar Tailwind',
         status: 'completada',
         dueDate: null
       }
     ];
   }
   ```

   Ahora, crea el template en tasks-page-component.html (usalo de referencia, dale tu propio estilo):

   ```html
   <!-- tasks-page-component.html -->
   <main class="min-h-screen bg-white p-8">
     <!-- Título de la página -->
     <h1 class="mb-8 text-3xl font-bold text-gray-900">Mis Tareas</h1>

     <!-- Botón Crear Tarea -->
     <button class="mb-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
       Crear Tarea
     </button>

     <!-- Lista de Tareas -->
     <div class="mt-6 space-y-4">
       <!-- *ngFor itera sobre el array tasks -->
       <div *ngFor="let task of tasks" 
            class="rounded-lg border border-gray-200 p-4 shadow-sm">
         
         <!-- Título de la tarea -->
         <h3 class="text-lg font-semibold text-gray-900">
           {{ task.title }}
         </h3>
         
         <!-- Estado de la tarea -->
         <p class="mt-2">
           Estado: 
           <span [class]="
             task.status === 'completada' ? 'text-green-600' :
             task.status === 'en progreso' ? 'text-blue-600' : 
             'text-yellow-600'
           ">
             {{ task.status }}
           </span>
         </p>
         
         <!-- Fecha límite (si existe) -->
         @if (task.dueDate) {
           <p class="mt-1 text-sm text-gray-600">
             Fecha límite: {{ task.dueDate }}
           </p>
         }
       </div>
     </div>
   </main>
   ```

   > **Explicación paso a paso:**
   >
   > 1. **Interfaz Task:**
   >    - Define la estructura de una tarea
   >    - Usa TypeScript para garantizar que todas las tareas tengan las propiedades correctas
   >
   > 2. **Array de tareas:**
   >    - Creamos un array `tasks` con datos de ejemplo
   >    - Cada tarea sigue la estructura de la interfaz Task
   >
   > 3. **Directivas de Angular usadas:**
   >    - `*ngFor="let task of tasks"`: Itera sobre el array de tareas
   >    - `@if (task.dueDate) { ... }`: Muestra la fecha límite solo si existe
   >    - `{{ }}`: Sintaxis de interpolación para mostrar valores
   >
   > 4. **Clases de Tailwind:**
   >    - Usamos clases para espaciado (`p-4`, `mt-2`)
   >    - Estilos de tarjeta (`rounded-lg`, `border`, `shadow-sm`)
   >    - Colores según el estado (`text-green-600`, etc.)
   >
   > 5. **Estructura HTML:**
   >    - Contenedor principal con `<main>`
   >    - Título de la página
   >    - Botón de crear tarea
   >    - Lista de tareas con diseño de tarjetas

### Guía 3 · Componentes compartidos

1. Vamos a crear un componente compartido para el botón de volver:

   a) Primero, genera el componente con el CLI:

   ```bash
   ng g component shared/components/back-to-landing-button
   ```

   b) Configura el componente en `back-to-landing-button.component.ts`:

   ```ts
      b) Configura el componente en `back-to-landing-button-component.ts`:
   ```ts
   // src/app/shared/components/back-to-landing-button/back-to-landing-button-component.ts
   import { Component } from '@angular/core';
   import { RouterLink } from '@angular/router';

   @Component({
     selector: 'app-back-to-landing-button',
     standalone: true,
     imports: [RouterModule], // Necesario para usar routerLink
     templateUrl: './back-to-landing-button-component.html'
   })
   export class BackToLandingButtonComponent { }
   ```

   c) Crea el template del botón en `back-to-landing-button-component.html`:

   ```html

<a routerLink="/"
      class="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
     <svg xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="h-4 w-4">

      <path stroke-linecap="round"
             stroke-linejoin="round"
             d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
     </svg>
     Volver a inicio
</a>

   ```

   d) Ahora, para usar este componente en la vista de tareas, modifica `tasks-page-component.ts`:

   ```ts
   // src/app/modules/tasks/tasks-page-component.ts
   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button-component';

   @Component({
     selector: 'app-tasks-page',
     standalone: true,
     imports: [
       CommonModule,
       BackToLandingButtonComponent // Añadimos el componente a los imports
     ],
     templateUrl: './tasks-page.component.html'
   })
   export class TasksPageComponent {
     // ... resto del código existente ...
   }
   ```

   e) Finalmente, usa el componente en el template de tareas (`tasks-page-component.html`):

   ```html
   <main class="min-h-screen bg-white p-8">
     <!-- Añadimos el botón de volver al inicio -->
     <app-back-to-landing-button class="mb-6 block"></app-back-to-landing-button>

     <!-- Resto del contenido existente -->
     <h1 class="mb-8 text-3xl font-bold text-gray-900">Mis Tareas</h1>
     <!-- ... -->
   </main>
   ```

   > **Explicación de los pasos:**
   >
   > 1. **Generación del componente:**
   >    - Usamos `ng g component` para crear un componente autónomo
   >    - Lo ubicamos en `shared/components` para mantener organizado el código reutilizable
   >
   > 2. **Configuración del componente:**
   >    - Importamos `RouterModule` para la navegación
   >
   > 3. **Diseño del botón:**
   >    - Usamos un `<a>` con `routerLink="/"` para la navegación
   >    - Incluimos un icono SVG de flecha
   >    - Aplicamos clases Tailwind para estilos y hover
   >
   > 4. **Integración en la vista de tareas:**
   >    - Importamos el componente en `TasksPageComponent`
   >    - Lo añadimos al array de imports
   >    - Lo usamos en el template con su selector `<app-back-to-landing-button>`
   >
2. Vamos a crear un componente reutilizable para títulos de página en la carpeta shared/components:

   a) Primero, genera el componente con el CLI:

   ```bash
   ng g component shared/components/page-title
   ```

   b) Configura el componente en `page-title-component.ts`:

   ```ts
   // src/app/shared/components/page-title/page-title.component.ts
   import { Component, Input } from '@angular/core'; // Importamos Input

   @Component({
      selector: 'app-page-title',
      standalone: true,
      templateUrl: './page-title.component.html',
   })
   export class PageTitleComponent {
     // Decorador @Input() para recibir datos del componente padre
     @Input() title: string = ''; // Valor por defecto vacío
     @Input() subtitle?: string; // Opcional (puede ser undefined)
   }
   ```

   c) Crea el template para mostrar el título y subtítulo en `page-title-component.html`:

   ```html
   <!-- src/app/shared/components/page-title/page-title.component.html -->
   <header class="space-y-2 text-center sm:text-left">
     <!-- Título principal -->
     <h1 class="text-3xl font-bold tracking-tight text-gray-900">
       {{ title }}
     </h1>
     
     <!-- Subtítulo (solo se muestra si existe) -->
     @if (subtitle) {
       <p class="text-lg leading-8 text-gray-600">
         {{ subtitle }}
       </p>
     }
   </header>
   ```

   d) Para usar este componente en la vista de tareas, modifica `tasks-page-component.ts`:

   ```ts
   // src/app/modules/tasks/tasks-page-component.ts
   import { Component } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { PageTitleComponent } from '../../shared/components/page-title/page-title-component';

   @Component({
     selector: 'app-tasks-page',
     standalone: true,
     imports: [
       CommonModule,
       PageTitleComponent // Añadimos el componente a los imports
     ],
     templateUrl: './tasks-page-component.html'
   })
   export class TasksPageComponent {
     // ... resto del código existente ...
   }
   ```

   e) Usa el componente en el template pasándole los datos (`tasks-page-component.html`):

   ```html
   <main class="min-h-screen bg-white p-8">
     <!-- Uso del componente pasando props -->
     <app-page-title
       title="Gestión de Tareas"
       subtitle="Organiza y administra tus tareas pendientes"
     ></app-page-title>

     <!-- Resto del contenido -->
     <!-- ... -->
   </main>
   ```

   > **Explicación del uso de @Input():**
   >
   > 1. **¿Qué es @Input()?**
   >    - Es un decorador que permite que un componente reciba datos de su componente padre
   >    - Se usa para hacer componentes reutilizables y configurables
   >
   > 2. **Sintaxis en el componente hijo:**
>
   > ```ts
   > @Input() propiedad: tipo = valorPorDefecto;
   >    ```
>
   > - `@Input()`: Decorador que marca la propiedad como entrada
   > - `propiedad`: Nombre que usaremos para acceder al valor
   > - `tipo`: Tipo de dato que aceptará (string, number, etc.)
   > - `valorPorDefecto`: Valor inicial opcional
   >
   > 3. **Uso en el template padre:**
>
   >    ```html
   >    <app-page-title [title]="'Mi Título'" [subtitle]="'Mi Subtítulo'">
   >    </app-page-title>
   >    ```
>
   >    - Los corchetes `[]` indican binding de propiedad
   >    - Sin corchetes sería texto estático
   >
   > 4. **Propiedades opcionales:**
   >    - Usando `?` en la definición (`subtitle?: string`)
   >    - Permite omitir la propiedad al usar el componente
   >    - Útil con `@if` para renderizado condicional
   >
3. Reutiliza `PageTitleComponent` en ambas vistas: `LandingPageComponent` mostrará el CTA y `TasksPageComponent` los usará en su cabecera junto con la lista mock.

### Reto práctico

Ahora que ya tenemos y hacemos uso de componentes compartidos, implementa los siguientes requisitos para hacer la aplicación completamente responsiva:

1. **Contenedor Principal (Landing y Tasks)**
   - El contenido debe estar centrado en la página
   - Ancho máximo de 1280px (max-w-7xl)
   - Padding horizontal que se ajuste según el tamaño de pantalla:
     * Móvil: 1rem (px-4)
     * Tablet: 2rem (sm:px-8)
     * Desktop: 4rem (lg:px-16)

2. **Hero Section (Landing)**
   - Título: 
     * Móvil: texto de 2.25rem (text-4xl)
     * Desktop: texto de 3.75rem (sm:text-6xl)
   - Descripción:
     * Texto centrado en móvil
     * Alineado a la izquierda en desktop (sm:text-left)
   - Botón CTA:
     * Ancho completo en móvil (w-full)
     * Ancho automático en tablet (sm:w-auto)

3. **Lista de Tareas**
   - Grid layout responsivo:
     * 1 columna en móvil
     * 2 columnas en tablet (sm:grid-cols-2)
     * 3 columnas en desktop (lg:grid-cols-3)
   - Gap entre elementos que aumente con el viewport:
     * Móvil: 1rem (gap-4)
     * Desktop: 1.5rem (lg:gap-6)

4. **Componentes Compartidos**
  - PageTitle:
     * Texto centrado en móvil
     * Cambia a alineación izquierda en desktop con utilidades responsivas
     * Tamaños de texto responsivos
   - BackToLandingButton:
     * Visible siempre en móvil
     * En desktop, opcional ocultarlo si hay navegación alternativa

5. **Mejoras de Usabilidad**
   - Botones y enlaces:
     * Área de click mínima de 44px en móvil
     * Estados hover solo en dispositivos que lo soporten (hover:)
     * Focus visible para navegación por teclado
   - Espaciado:
     * Incrementar márgenes y padding en viewports más grandes
     * Usar unidades rem para mantener proporción con tamaño de fuente

Para implementar estos cambios:
1. Revisa y actualiza las clases Tailwind en todos los templates
2. Añade las clases responsivas usando los prefijos sm:, md: y lg:
3. Prueba la aplicación en diferentes tamaños de pantalla usando el Device Toolbar del navegador:
   - Abre las herramientas de desarrollo (F12 o Click Derecho → Inspeccionar)
   - Activa el Device Toolbar:
     * Chrome/Edge: Click en el icono "Toggle device toolbar" (Ctrl + Shift + M)
     * Firefox: Click en el icono "Responsive Design Mode" (Ctrl + Shift + M)
   - Prueba dispositivos predefinidos:
     * Selecciona diferentes dispositivos del dropdown (iPhone, iPad, etc.)
     * Usa las dimensiones comunes: 320px (móvil pequeño), 768px (tablet), 1024px (desktop)
   - Modo responsivo:
     * Arrastra los bordes para probar tamaños personalizados
     * Rota el dispositivo con el icono de rotación
     * Prueba diferentes resoluciones y densidades de píxeles
4. Comprueba que no hay desbordamientos horizontales (overflow-x) en ningún viewport
5. Verifica la accesibilidad móvil:
   - Asegúrate de que los elementos táctiles tienen suficiente espacio
   - Comprueba que los textos son legibles sin zoom
   - Verifica que los hover states funcionan correctamente en táctil



Consulta `02-componentes-modulos.solucion.md` solo tras resolver el reto.
