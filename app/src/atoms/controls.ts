import { atom } from 'jotai';
import type { Format, Layout } from '@vr-viewer/player';

export const autoPlayAtom = atom(false);
export const autoDetectAtom = atom(true);
export const detectingAtom = atom(false);

export const layoutAtom = atom<Layout>('mono');
export const formatAtom = atom<Format>('screen');

export const debugAtom = atom(false);
