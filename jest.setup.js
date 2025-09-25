// Jest setup file
import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Set test environment
process.env.NODE_ENV = 'test';

// Mock environment variables for tests
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Setup MSW server for API mocking
export const server = setupServer();

// Enable API mocking before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after tests
afterAll(() => server.close());

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Add custom matchers
expect.extend({
  toBeValidUrl(received) {
    try {
      new URL(received);
      return {
        pass: true,
        message: () => `expected ${received} not to be a valid URL`,
      };
    } catch {
      return {
        pass: false,
        message: () => `expected ${received} to be a valid URL`,
      };
    }
  },
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Performance monitoring setup
if (typeof performance !== 'undefined') {
  global.performance = performance;
}