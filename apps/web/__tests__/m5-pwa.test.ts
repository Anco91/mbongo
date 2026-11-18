/**
 * Tests for the M5 PWA layer — manifest, viewport/iOS metadata, and the
 * service-worker registration guard (design D2/D3).
 *
 * @module Tests/M5/Pwa
 */

import manifest from '@/app/manifest';
import { APP_METADATA, APP_VIEWPORT, THEME_COLOR } from '@/lib/pwa';
import { registerServiceWorker } from '@/lib/service-worker';

describe('Web app manifest', () => {
  const app = manifest();

  it('is installable: standalone, scoped, named and themed', () => {
    expect(app.name).toBe('Mbongo — Gestion financière');
    expect(app.short_name).toBe('Mbongo');
    expect(app.display).toBe('standalone');
    expect(app.start_url).toBe('/');
    expect(app.theme_color).toBe(THEME_COLOR);
    expect(app.lang).toBe('fr');
  });

  it('exposes the 192, 512 and maskable icons', () => {
    const icons = app.icons ?? [];
    const sizes = icons.map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
});

describe('Viewport and iOS metadata', () => {
  it('covers the device width and safe areas', () => {
    expect(APP_VIEWPORT.width).toBe('device-width');
    expect(APP_VIEWPORT.initialScale).toBe(1);
    expect(APP_VIEWPORT.viewportFit).toBe('cover');
    expect(APP_VIEWPORT.themeColor).toBe(THEME_COLOR);
  });

  it('declares the iOS standalone metadata', () => {
    expect(APP_METADATA.appleWebApp).toEqual(
      expect.objectContaining({ capable: true, title: 'Mbongo' })
    );
    expect(APP_METADATA.icons).toEqual(
      expect.objectContaining({ apple: '/icons/apple-touch-icon.png' })
    );
    expect(APP_METADATA.other).toEqual(
      expect.objectContaining({ 'apple-mobile-web-app-capable': 'yes' })
    );
  });
});

describe('Service worker registration', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalEnv = env.NODE_ENV;
  const register = jest.fn();

  beforeEach(() => {
    register.mockReset();
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
  });

  afterEach(() => {
    env.NODE_ENV = originalEnv;
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });

  it('does not register in development', () => {
    env.NODE_ENV = 'development';
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers /sw.js in production', () => {
    env.NODE_ENV = 'production';
    register.mockResolvedValue({});
    registerServiceWorker();
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});
