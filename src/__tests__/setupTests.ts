import '@testing-library/jest-dom';

// TypeScript-compatible IntersectionObserver mock
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});

(global as any).IntersectionObserver = mockIntersectionObserver;
(global as any).ResizeObserver = mockIntersectionObserver;

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

Element.prototype.scrollIntoView = jest.fn();