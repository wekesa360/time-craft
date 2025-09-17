/**
 * MSW Server Setup
 * Mock service worker server for testing
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup mock server with default handlers
export const server = setupServer(...handlers);

// Start server
export const startServer = () => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
};

// Stop server
export const stopServer = () => {
  server.close();
};

// Reset handlers between tests
export const resetServer = () => {
  server.resetHandlers();
};

// Use specific handlers for a test
export const useHandlers = (newHandlers: Parameters<typeof server.use>) => {
  server.use(...newHandlers);
};