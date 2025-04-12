// Node.js specific type definitions for NT4 client

// Custom CloseEvent for Node.js environment
export interface CloseEvent {
  code?: number;
  reason?: string;
  wasClean?: boolean;
}

// Custom MessageEvent for Node.js environment
export interface MessageEvent {
  data: string | Buffer;
  type?: string;
  target?: any;
}

// Helper function to create a CloseEvent
export function createCloseEvent(reason: string = 'close'): CloseEvent {
  return {
    code: 1000,
    reason,
    wasClean: true
  };
}

// Type for node-fetch Response to avoid type conflicts
export type FetchResponse = any;
