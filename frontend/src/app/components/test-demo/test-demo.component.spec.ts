import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestDemoComponent } from './test-demo.component';

describe('TestDemoComponent', () => {
  let component: TestDemoComponent;
  let fixture: ComponentFixture<TestDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Counter functionality', () => {
    it('should have initial counter value of 0', () => {
      expect(component.counter()).toBe(0);
    });

    it('should increment counter', () => {
      component.increment();
      expect(component.counter()).toBe(1);
    });

    it('should decrement counter', () => {
      component.decrement();
      expect(component.counter()).toBe(-1);
    });

    it('should reset counter to 0', () => {
      component.counter.set(10);
      component.reset();
      expect(component.counter()).toBe(0);
    });

    it('should increment multiple times', () => {
      component.increment();
      component.increment();
      component.increment();
      expect(component.counter()).toBe(3);
    });
  });

  describe('Computed values', () => {
    it('should calculate doubled value correctly', () => {
      component.counter.set(5);
      expect(component.doubled()).toBe(10);
    });

    it('should return "Zero" status when counter is 0', () => {
      component.counter.set(0);
      expect(component.status()).toBe('Zero');
    });

    it('should return "Negative" status when counter is less than 0', () => {
      component.counter.set(-5);
      expect(component.status()).toBe('Negative');
    });

    it('should return "Low" status when counter is between 1-9', () => {
      component.counter.set(5);
      expect(component.status()).toBe('Low');
    });

    it('should return "Medium" status when counter is between 10-49', () => {
      component.counter.set(25);
      expect(component.status()).toBe('Medium');
    });

    it('should return "High" status when counter is 50 or more', () => {
      component.counter.set(100);
      expect(component.status()).toBe('High');
    });
  });

  describe('Items management', () => {
    it('should have initial items', () => {
      expect(component.items().length).toBe(2);
      expect(component.items()[0].name).toBe('Item 1');
    });

    it('should add new item', () => {
      const initialLength = component.items().length;
      component.addItem();
      expect(component.items().length).toBe(initialLength + 1);
    });

    it('should remove item by id', () => {
      const initialLength = component.items().length;
      component.removeItem(1);
      expect(component.items().length).toBe(initialLength - 1);
      expect(component.items().find(item => item.id === 1)).toBeUndefined();
    });

    it('should generate unique ids when adding items', () => {
      component.addItem();
      component.addItem();
      const ids = component.items().map(item => item.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('DOM rendering', () => {
    it('should display counter value', () => {
      component.counter.set(42);
      fixture.detectChanges();
      const counterElement = fixture.nativeElement.querySelector('.counter-value');
      expect(counterElement?.textContent).toContain('42');
    });

    it('should display doubled value', () => {
      component.counter.set(5);
      fixture.detectChanges();
      const doubleElement = fixture.nativeElement.querySelector('.double-value');
      expect(doubleElement?.textContent).toContain('10');
    });

    it('should render increment button', () => {
      const button = fixture.nativeElement.querySelector('.btn-increment');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('Increment');
    });

    it('should render all items in list', () => {
      fixture.detectChanges();
      const listItems = fixture.nativeElement.querySelectorAll('li');
      expect(listItems.length).toBe(component.items().length);
    });
  });

  describe('Button interactions', () => {
    it('should increment when button clicked', () => {
      const button = fixture.nativeElement.querySelector('.btn-increment');
      button?.click();
      expect(component.counter()).toBe(1);
    });

    it('should decrement when button clicked', () => {
      const button = fixture.nativeElement.querySelector('.btn-decrement');
      button?.click();
      expect(component.counter()).toBe(-1);
    });

    it('should reset when button clicked', () => {
      component.counter.set(100);
      const button = fixture.nativeElement.querySelector('.btn-reset');
      button?.click();
      expect(component.counter()).toBe(0);
    });

    it('should add item when button clicked', () => {
      const initialLength = component.items().length;
      const button = fixture.nativeElement.querySelector('.btn-add-item');
      button?.click();
      expect(component.items().length).toBe(initialLength + 1);
    });
  });
});
