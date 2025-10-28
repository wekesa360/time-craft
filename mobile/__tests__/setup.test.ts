// Simple test to verify Jest setup
describe('Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should handle basic TypeScript', () => {
    const message: string = 'Hello, TypeScript!';
    expect(message).toBe('Hello, TypeScript!');
  });

  it('should mock modules correctly', () => {
    // Test that our mocks are working
    expect(jest.isMockFunction(global.alert)).toBe(true);
  });
});