// Shim for nativewind to work with React Native Web
// This provides a no-op implementation for web builds

export const styled = (component: any) => component;

export const useColorScheme = () => 'light';

export const withExpoSnack = (component: any) => component;

export const cssInterop = (component: any, mapping?: any) => component;

export default {
  styled,
  useColorScheme,
  withExpoSnack,
  cssInterop
};