import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./config/firebase', () => ({
  auth: {},
  db: {},
  storage: {},
}));

// Mock window.matchMedia
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

 // Suppress only known noisy console warnings/errors in tests while preserving unexpected ones
 const originalConsoleError = console.error;
 const originalConsoleWarn = console.warn;
 
 const KNOWN_NOISY_PATTERNS = [
   /ReactDOMTestUtils\.act/,
   /Warning: An update to .* inside a test was not wrapped in act/,
   /DeprecationWarning:/,
 ];
 
 function shouldSuppress(message?: any): boolean {
   const msg = typeof message === 'string' ? message : String(message);
   return KNOWN_NOISY_PATTERNS.some((pattern) => pattern.test(msg));
 }
 
global.console = {
  ...console,
  error: (...args: any[]) => {
     if (shouldSuppress(args[0])) return;
     originalConsoleError(...args);
     // Optionally fail the test on unexpected errors:
     // throw new Error(`Unexpected console.error: ${args[0]}`);
   },
   warn: (...args: any[]) => {
     if (shouldSuppress(args[0])) return;
     originalConsoleWarn(...args);
     // Optionally fail the test on unexpected warnings:
     // throw new Error(`Unexpected console.warn: ${args[0]}`);
   },
};
