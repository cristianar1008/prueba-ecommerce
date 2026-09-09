import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the app title in the topbar', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Core E-Commerce');
  });

  it('el boton de inicio llama a goHome() y vuelve a la vista de catalogo', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    let currentView: string | undefined;
    component.view$.subscribe((value) => (currentView = value));

    const homeButton = fixture.nativeElement.querySelector('.home-button') as HTMLButtonElement;
    expect(homeButton).toBeTruthy();

    homeButton.click();

    expect(currentView).toBe('catalog');
  });
});
