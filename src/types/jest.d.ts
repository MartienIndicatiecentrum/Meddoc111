// Global test types to avoid TypeScript conflicts
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveTextContent(text: string): R;
      toHaveDisplayValue(value: string): R;
      toBeDisabled(): R;
      toHaveFocus(): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}

export {};
