import { atom } from 'jotai';
import type { XRSession } from 'webxr';

export const xrSupportedAtom = atom(false);
export const xrSessionAtom = atom<XRSession | null>(null);
