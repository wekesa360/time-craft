// Jest setup file for mobile testing

// Global test utilities
global.alert = jest.fn();
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};