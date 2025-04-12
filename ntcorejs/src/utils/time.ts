/**
 * Gets the current time in microseconds
 * @returns The current time in microseconds
 */
export function getCurrentTimeMicros(): number {
  return Math.floor(Date.now() * 1000);
}

/**
 * Calculates the server time offset using Cristian's algorithm
 * @param clientSendTime The client send time in microseconds
 * @param serverTime The server time in microseconds
 * @param clientReceiveTime The client receive time in microseconds
 * @returns The server time offset in microseconds
 */
export function calculateServerTimeOffset(
  clientSendTime: number,
  serverTime: number,
  clientReceiveTime: number
): number {
  // Calculate round-trip time
  const rtt = clientReceiveTime - clientSendTime;
  
  // Estimate one-way delay (half of RTT)
  const oneWayDelay = Math.floor(rtt / 2);
  
  // Calculate server time offset
  return serverTime - (clientSendTime + oneWayDelay);
}

/**
 * Converts a client time to server time
 * @param clientTime The client time in microseconds
 * @param serverTimeOffset The server time offset in microseconds
 * @returns The server time in microseconds
 */
export function clientTimeToServerTime(
  clientTime: number,
  serverTimeOffset: number
): number {
  return clientTime + serverTimeOffset;
}

/**
 * Converts a server time to client time
 * @param serverTime The server time in microseconds
 * @param serverTimeOffset The server time offset in microseconds
 * @returns The client time in microseconds
 */
export function serverTimeToClientTime(
  serverTime: number,
  serverTimeOffset: number
): number {
  return serverTime - serverTimeOffset;
}
