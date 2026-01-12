import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/test-demo/test-demo.component')
      .then(m => m.TestDemoComponent)
  },
  {
    path: 'test-demo',
    loadComponent: () => import('./components/test-demo/test-demo.component')
      .then(m => m.TestDemoComponent)
  }
];
