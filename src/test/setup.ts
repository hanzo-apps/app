// Test setup file for Vitest
import '@testing-library/jest-dom';

// Mock Tauri API if running in test environment
if (!window.__TAURI__) {
  window.__TAURI__ = {
    invoke: async () => ({}),
    event: {
      listen: async () => ({ unlisten: () => {} }),
      emit: async () => {},
    },
  } as any;
}