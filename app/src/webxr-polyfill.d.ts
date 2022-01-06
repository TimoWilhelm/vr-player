import type { XRSystem } from 'webxr';

declare module 'webxr-polyfill' {
  declare class WebXRPolyfill {
    xr: XRSystem;
  }
  export = WebXRPolyfill;
}

export {};
