# Known Issues in NetworkTables TypeScript Implementation

This document tracks known issues in the TypeScript implementation of NetworkTables.

## Protocol Implementation Issues

### Serialization/Deserialization

- **Unsupported value type warnings**: The deserializer frequently reports "Unsupported value type: 0, defaulting to Double" warnings, indicating potential issues with type encoding or decoding.
- **Invalid value type errors**: Messages like "Received invalid value type: 153, defaulting to Double" appear frequently during client-server communication.
- **Buffer size errors**: "Buffer too small" errors occur during deserialization, suggesting potential issues with message framing or buffer management. Particularly common with double values: "Buffer too small for double: 7 bytes".
- **Type mismatch errors**: When updating values, type mismatch errors can occur, indicating inconsistencies in how types are handled between client and server.
- **Array type handling**: There are issues with array type handling, particularly when setting initial values for array topics. The error "Value type mismatch" is common when trying to update array values. Boolean arrays seem to work partially, but number arrays and string arrays often fail to update properly.

### Data Corruption

- **Protocol corruption**: The high frequency of invalid value types and buffer size errors suggests that there may be data corruption or misalignment in the protocol implementation.
- **Message framing**: There appear to be issues with message framing, where the deserializer cannot properly determine the boundaries of messages or the types of values within them.

### Communication Flow

- **Infinite recursion risk**: There was a risk of infinite recursion in the event notification system when updates from clients trigger server updates which trigger client updates. This has been partially addressed but may still occur in some edge cases.
- **Sequence number handling**: The sequence number system for tracking updates may not be fully robust, leading to missed or duplicate updates.

## Test Failures

- **Integration tests**: Several integration tests fail due to communication issues between client and server:
  - `client updates propagate to server`
  - `server updates propagate to client`
  - `entry deletion propagates`
  - `flag changes propagate`
  - `reconnection works`

## UI/UX Issues

- **Delayed feedback**: Updates may not be immediately reflected in the UI due to asynchronous communication.
- **Inconsistent updates**: Due to protocol issues, some updates may not be properly propagated between client and server.
- **Error handling**: The current error handling approach (try-catch blocks) allows the examples to run but masks underlying issues that need to be fixed.
- **Dashboard functionality**: The dashboard example shows the basic structure but has limited functionality due to protocol issues.

## Next Steps

- **Protocol Implementation**: Conduct a systematic review of the protocol implementation, focusing on serialization/deserialization and message framing.
- **Array Type Handling**: Fix the issues with array type handling to ensure all data types work correctly.
- **Error Handling**: Improve error handling and recovery mechanisms to make the system more robust.
- **Logging**: Enhance logging to better diagnose communication issues.
- **Testing**: Develop more comprehensive tests to verify protocol correctness.
- **Examples**: Continue developing examples to demonstrate different aspects of the NetworkTables functionality.
- **Documentation**: Improve documentation to help users understand how to use the library effectively.

This document will be updated as issues are resolved or new issues are discovered.
