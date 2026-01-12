import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-demo">
      <h2>CI/CD Test Demo Component</h2>
      
      <div class="counter-section">
        <p>Counter: <span class="counter-value">{{ counter() }}</span></p>
        <button class="btn-increment" (click)="increment()">Increment</button>
        <button class="btn-decrement" (click)="decrement()">Decrement</button>
        <button class="btn-reset" (click)="reset()">Reset</button>
      </div>

      <div class="computed-section">
        <p>Double: <span class="double-value">{{ doubled() }}</span></p>
        <p>Status: <span class="status">{{ status() }}</span></p>
      </div>

      <div class="list-section">
        <p>Items count: {{ items().length }}</p>
        <button class="btn-add-item" (click)="addItem()">Add Item</button>
        <ul>
          @for (item of items(); track item.id) {
            <li>
              {{ item.name }}
              <button class="btn-remove" (click)="removeItem(item.id)">Remove</button>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .test-demo {
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .counter-section,
    .computed-section,
    .list-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    button {
      padding: 8px 16px;
      margin: 0 5px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      transition: opacity 0.2s;
    }

    button:hover {
      opacity: 0.8;
    }

    .btn-increment {
      background: #4caf50;
      color: white;
    }

    .btn-decrement {
      background: #f44336;
      color: white;
    }

    .btn-reset {
      background: #2196f3;
      color: white;
    }

    .btn-add-item {
      background: #ff9800;
      color: white;
    }

    .btn-remove {
      background: #e91e63;
      color: white;
      padding: 4px 8px;
      font-size: 12px;
    }

    .counter-value,
    .double-value,
    .status {
      font-weight: bold;
      color: #2196f3;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      padding: 8px;
      margin: 5px 0;
      background: white;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  `]
})
export class TestDemoComponent {
  // Signals
  counter = signal(0);
  items = signal<Array<{ id: number; name: string }>>([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' }
  ]);

  // Computed values
  doubled = computed(() => this.counter() * 2);
  
  status = computed(() => {
    const count = this.counter();
    if (count < 0) return 'Negative';
    if (count === 0) return 'Zero';
    if (count < 10) return 'Low';
    if (count < 50) return 'Medium';
    return 'High';
  });

  // Actions
  increment(): void {
    this.counter.update(val => val + 1);
  }

  decrement(): void {
    this.counter.update(val => val - 1);
  }

  reset(): void {
    this.counter.set(0);
  }

  addItem(): void {
    const newId = Math.max(...this.items().map(i => i.id), 0) + 1;
    this.items.update(items => [
      ...items,
      { id: newId, name: `Item ${newId}` }
    ]);
  }

  removeItem(id: number): void {
    this.items.update(items => items.filter(item => item.id !== id));
  }
}
