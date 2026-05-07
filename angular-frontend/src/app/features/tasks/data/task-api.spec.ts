import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskApiService } from './task-api';

describe('TaskApiService', () => {
  let service: TaskApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });

    service = TestBed.inject(TaskApiService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });
});