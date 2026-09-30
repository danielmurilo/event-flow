import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeController } from '@/controllers/theme/ThemeController';

describe('ThemeController', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('deve inicializar com o tema padrão light quando não houver preferência salva', () => {
    const controller = new ThemeController();
    expect(controller.getCurrentTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('deve recuperar tema salvo no localStorage', () => {
    localStorage.setItem('eventflow_theme', 'dark');
    const controller = new ThemeController();
    expect(controller.getCurrentTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('deve alternar entre temas light e dark e persistir a escolha', () => {
    const controller = new ThemeController();
    expect(controller.getCurrentTheme()).toBe('light');

    const nextTheme = controller.toggleTheme();
    expect(nextTheme).toBe('dark');
    expect(controller.getCurrentTheme()).toBe('dark');
    expect(localStorage.getItem('eventflow_theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    const returnedTheme = controller.toggleTheme();
    expect(returnedTheme).toBe('light');
    expect(localStorage.getItem('eventflow_theme')).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('deve notificar listeners quando o tema é modificado', () => {
    const controller = new ThemeController();
    const listener = vi.fn();
    
    controller.subscribe(listener);
    expect(listener).toHaveBeenCalledWith('light');

    controller.setTheme('dark');
    expect(listener).toHaveBeenCalledWith('dark');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
