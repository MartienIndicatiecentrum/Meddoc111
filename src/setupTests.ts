import '@testing-library/jest-dom';

// TypeScript-compatible IntersectionObserver mock
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

// Assign to global with proper typing
(global as any).IntersectionObserver = mockIntersectionObserver;
(global as any).IntersectionObserverEntry = {};
(global as any).IntersectionObserverInit = {};

// ResizeObserver mock
const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
(global as any).ResizeObserver = mockResizeObserver;

// matchMedia mock
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

// scrollIntoView mock
Element.prototype.scrollIntoView = jest.fn();

// fetch mock (if needed)
(global as any).fetch = jest.fn();
