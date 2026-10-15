import { Capacitor } from '@capacitor/core';

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();
export const getPlatform = (): string => Capacitor.getPlatform();
export const isAndroid = (): boolean => Capacitor.getPlatform() === 'android';
export const isIos = (): boolean => Capacitor.getPlatform() === 'ios';
export const isWeb = (): boolean => Capacitor.getPlatform() === 'web';

