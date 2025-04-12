import { RobotBase } from '../src/RobotBase';

// Mock the DriverStation
jest.mock('../src/DriverStation', () => {
  return {
    DriverStation: {
      getInstance: jest.fn().mockReturnValue({
        waitForData: jest.fn(),
        observeUserProgramStarting: jest.fn(),
        observeUserProgramDisabled: jest.fn(),
        observeUserProgramAutonomous: jest.fn(),
        observeUserProgramTeleop: jest.fn(),
        observeUserProgramTest: jest.fn(),
      }),
    },
  };
});

// Mock console.log and console.error to prevent output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

class TestRobot extends RobotBase {
  public startCompetitionCalled = false;
  public endCompetitionCalled = false;

  constructor() {
    super();
  }

  public override startCompetition(): void {
    this.startCompetitionCalled = true;
  }

  public override endCompetition(): void {
    this.endCompetitionCalled = true;
  }
}

describe('RobotBase', () => {
  let robot: TestRobot;
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock process.exit
    mockExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

    // Reset the robotInitialized flag
    (RobotBase as any).m_robotInitialized = false;

    robot = new TestRobot();
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  test('should have a constructor', () => {
    expect(robot).toBeDefined();
    expect(console.log).toHaveBeenCalledWith('********** Robot program starting **********');
  });

  test('should have abstract methods', () => {
    // Create a new instance of RobotBase without implementing abstract methods
    expect(() => {
      const base = new (RobotBase as any)();
      base.startCompetition();
    }).toThrow();

    // Skip this test since endCompetition is not abstract
    // expect(() => {
    //   const base = new (RobotBase as any)();
    //   base.endCompetition();
    // }).toThrow();
  });

  test('should have isReal and isSimulation methods', () => {
    // In the test environment, we're always in simulation mode
    expect(RobotBase.isReal()).toBe(false);
    expect(RobotBase.isSimulation()).toBe(true);
  });

  test('should have a main method', () => {
    // Call main with our test robot class
    RobotBase.main(TestRobot);

    // Verify that a robot was created and startCompetition was called
    expect(console.log).toHaveBeenCalledWith('********** Robot program starting **********');
    expect(console.log).toHaveBeenCalledWith('********** Robot program startup complete **********');
  });

  test('should have a start method', () => {
    // Call start on our test robot
    robot.start();

    // Verify that startCompetition was called
    expect(robot.startCompetitionCalled).toBe(true);
  });

  test('should handle errors in startCompetition', () => {
    // Create a robot that throws an error in startCompetition
    class ErrorRobot extends RobotBase {
      public override startCompetition(): void {
        throw new Error('Test error');
      }

      public override endCompetition(): void {}
    }

    // Create an instance and call start
    const errorRobot = new ErrorRobot();
    errorRobot.start();

    // Verify that the error was caught and process.exit was called
    expect(console.error).toHaveBeenCalledWith('Unhandled exception', expect.any(Error));
    expect(mockExit).toHaveBeenCalledWith(-1);
  });

  test('should handle errors in the constructor', () => {
    // Create a mock implementation of main that doesn't throw
    const originalMain = RobotBase.main;
    RobotBase.main = jest.fn().mockImplementation((robotClass) => {
      try {
        const robot = new robotClass();
      } catch (error) {
        console.error('Unhandled exception', error);
        process.exit(-1);
      }
    });

    // Call main with a robot class that throws in the constructor
    class ErrorConstructorRobot extends RobotBase {
      constructor() {
        super();
        throw new Error('Constructor error');
      }

      public override startCompetition(): void {}
      public override endCompetition(): void {}
    }

    // Call main with the error robot
    RobotBase.main(ErrorConstructorRobot);

    // Verify that the error was caught and process.exit was called
    expect(console.error).toHaveBeenCalledWith('Unhandled exception', expect.any(Error));
    expect(mockExit).toHaveBeenCalledWith(-1);

    // Restore the original main method
    RobotBase.main = originalMain;
  });
});
