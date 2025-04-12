export * from './time';
export * from './topic';

/**
 * Generates a unique ID
 * @returns A unique ID
 */
export function generateId(): number {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}
