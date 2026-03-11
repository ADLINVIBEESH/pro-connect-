import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

class MockIntersectionObserver {
  root: Element | null = null;
  rootMargin = "0px";
  thresholds: ReadonlyArray<number> = [];

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

  disconnect() {}

  observe(_target: Element) {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(_target: Element) {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

class MockResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});
