import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TestDemoComponent } from './components/test-demo/test-demo.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, TestDemoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Employee Management - CI/CD Test');
}
