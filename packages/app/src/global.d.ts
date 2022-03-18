import type { XRSystem } from 'webxr';

declare global {
  interface Navigator extends Navigator {
    xr: XRSystem;
  }
}

export {};
