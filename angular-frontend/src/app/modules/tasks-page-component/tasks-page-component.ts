import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackToLandingButtonComponent } from '../../shared/components/back-to-landing-button/back-to-landing-button';
import { PageTitleComponent } from '../../shared/components/page-title/page-title';
import { TaskFormComponent } from './components/task-form-component/task-form-component';

interface Task {
  title: string;
  status: 'pendiente' | 'en progreso' | 'completada';
  dueDate: string | null;
}

@Component({
  selector: 'app-tasks-page',
  standalone: true,
  imports: [
    CommonModule,
    BackToLandingButtonComponent,
    PageTitleComponent,
    TaskFormComponent
  ],
  templateUrl: './tasks-page-component.html'
})
export class TasksPageComponent {
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

  onTaskSubmitted(payload: any): void {
    console.log('Tarea guardada', payload);
  }
}