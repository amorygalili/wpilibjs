# wpilibts Tests

This directory contains unit tests for the wpilibts library.

## Running Tests

To run the tests, use the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The tests are organized to match the structure of the source code:

- `Watchdog.test.ts` - Tests for the Watchdog class
- `DSControlWord.test.ts` - Tests for the DSControlWord class
- `DriverStation.test.ts` - Tests for the DriverStation class
- `Command.test.ts` - Tests for the Command class
- `Subsystem.test.ts` - Tests for the Subsystem class
- `CommandScheduler.test.ts` - Tests for the CommandScheduler class

## Writing Tests

When writing tests, follow these guidelines:

1. Create a test file for each class or module
2. Use descriptive test names that explain what is being tested
3. Use `beforeEach` and `afterEach` to set up and tear down test fixtures
4. Mock dependencies to isolate the code being tested
5. Test both normal and error cases

Example:

```typescript
import { MyClass } from '../src/MyClass';

describe('MyClass', () => {
  let myClass: MyClass;
  
  beforeEach(() => {
    myClass = new MyClass();
  });
  
  test('should do something', () => {
    const result = myClass.doSomething();
    expect(result).toBe(expectedValue);
  });
  
  test('should throw an error when invalid input is provided', () => {
    expect(() => {
      myClass.doSomething(invalidInput);
    }).toThrow();
  });
});
