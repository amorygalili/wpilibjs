import { Matrix } from '../../util/Matrix';

/**
 * Runge-Kutta 4th order integration method
 *
 * @param f Function that returns the derivative of the state
 * @param x Current state
 * @param u Input vector
 * @param dt Time step
 * @returns New state after integration
 */
function rungeKutta4(
  f: (x: number[], u: number[]) => number[],
  x: number[],
  u: number[],
  dt: number
): number[] {
  const k1 = f(x, u);

  const xk2 = x.map((xi, i) => xi + k1[i] * dt / 2);
  const k2 = f(xk2, u);

  const xk3 = x.map((xi, i) => xi + k2[i] * dt / 2);
  const k3 = f(xk3, u);

  const xk4 = x.map((xi, i) => xi + k3[i] * dt);
  const k4 = f(xk4, u);

  return x.map((xi, i) => xi + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}

/**
 * Motor model for a differential drivetrain
 */
export interface DCMotor {
  /**
   * Nominal voltage of the motor
   */
  nominalVoltage: number;

  /**
   * Free current of the motor
   */
  freeCurrent: number;

  /**
   * Stall current of the motor
   */
  stallCurrent: number;

  /**
   * Free speed of the motor
   */
  freeSpeed: number;

  /**
   * Stall torque of the motor
   */
  stallTorque: number;

  /**
   * Number of motors
   */
  numMotors: number;
}

/**
 * Standard DC motors
 */
export const DCMotors = {
  /**
   * CIM motor
   */
  CIM: (numMotors: number = 1): DCMotor => ({
    nominalVoltage: 12,
    freeCurrent: 2.7 * numMotors,
    stallCurrent: 131 * numMotors,
    freeSpeed: 5310 * (2 * Math.PI / 60),
    stallTorque: 2.42 * numMotors,
    numMotors
  }),

  /**
   * Mini CIM motor
   */
  MiniCIM: (numMotors: number = 1): DCMotor => ({
    nominalVoltage: 12,
    freeCurrent: 3 * numMotors,
    stallCurrent: 89 * numMotors,
    freeSpeed: 5840 * (2 * Math.PI / 60),
    stallTorque: 1.41 * numMotors,
    numMotors
  }),

  /**
   * NEO motor
   */
  NEO: (numMotors: number = 1): DCMotor => ({
    nominalVoltage: 12,
    freeCurrent: 1.3 * numMotors,
    stallCurrent: 105 * numMotors,
    freeSpeed: 5676 * (2 * Math.PI / 60),
    stallTorque: 2.6 * numMotors,
    numMotors
  }),

  /**
   * NEO 550 motor
   */
  NEO550: (numMotors: number = 1): DCMotor => ({
    nominalVoltage: 12,
    freeCurrent: 1.4 * numMotors,
    stallCurrent: 100 * numMotors,
    freeSpeed: 11000 * (2 * Math.PI / 60),
    stallTorque: 0.97 * numMotors,
    numMotors
  }),

  /**
   * Falcon 500 motor
   */
  Falcon500: (numMotors: number = 1): DCMotor => ({
    nominalVoltage: 12,
    freeCurrent: 1.5 * numMotors,
    stallCurrent: 257 * numMotors,
    freeSpeed: 6380 * (2 * Math.PI / 60),
    stallTorque: 4.69 * numMotors,
    numMotors
  })
};

/**
 * Standard kitbot wheel sizes
 */
export enum KitbotWheelSize {
  /**
   * 6 inch diameter wheels
   */
  kSixInch = 0.1524,

  /**
   * 8 inch diameter wheels
   */
  kEightInch = 0.2032,

  /**
   * 10 inch diameter wheels
   */
  kTenInch = 0.254
}

/**
 * Standard kitbot gearing options
 */
export enum KitbotGearing {
  /**
   * Standard gearing (10.71:1)
   */
  kStandard = 10.71,

  /**
   * High speed gearing (7.31:1)
   */
  kHighSpeed = 7.31,

  /**
   * Super high speed gearing (5.95:1)
   */
  kSuperHighSpeed = 5.95
}

/**
 * Standard kitbot motor options
 */
export enum KitbotMotor {
  /**
   * Single CIM motor per side
   */
  kSingleCIM = 1,

  /**
   * Dual CIM motor per side
   */
  kDualCIM = 2,

  /**
   * Single mini CIM motor per side
   */
  kSingleMiniCIM = 3,

  /**
   * Dual mini CIM motor per side
   */
  kDualMiniCIM = 4,

  /**
   * Single NEO motor per side
   */
  kSingleNEO = 5,

  /**
   * Dual NEO motor per side
   */
  kDualNEO = 6,

  /**
   * Single Falcon 500 motor per side
   */
  kSingleFalcon500 = 7,

  /**
   * Dual Falcon 500 motor per side
   */
  kDualFalcon500 = 8
}

/**
 * This class simulates the state of the drivetrain. In simulationPeriodic, users should first set
 * inputs from motors with {@link #setInputs(double, double)}, call {@link #update(double)} to
 * update the simulation, and set estimated encoder and gyro positions, as well as estimated
 * odometry pose. Teams can use {@link edu.wpi.first.wpilibj.smartdashboard.Field2d} to visualize
 * their robot on the Sim GUI's field.
 *
 * <p>Our state-space system is:
 *
 * <p>x = [[x, y, theta, vel_l, vel_r, dist_l, dist_r]]ᵀ in the field coordinate system (dist_* are
 * wheel distances.)
 *
 * <p>u = [[voltage_l, voltage_r]]ᵀ This is typically the control input of the last timestep from a
 * LTVDiffDriveController.
 *
 * <p>y = x
 */
export class DifferentialDrivetrainSim {
  // State vector x = [x, y, theta, vel_l, vel_r, dist_l, dist_r]ᵀ
  private x: number[] = [0, 0, 0, 0, 0, 0, 0];

  // Input vector u = [voltage_l, voltage_r]ᵀ
  private u: number[] = [0, 0];

  // Output vector y = x
  private y: number[] = [0, 0, 0, 0, 0, 0, 0];

  // Drivetrain parameters
  private readonly motor: DCMotor;
  private readonly gearing: number;
  private readonly wheelRadiusMeters: number;
  private readonly trackWidthMeters: number;
  private readonly momentOfInertiaKgMetersSquared: number;
  private readonly massKg: number;

  // Measurement noise standard deviations
  private readonly measurementStdDevs: number[] | null;

  // Calculated parameters
  private readonly wheelGearboxInertia: number;
  private readonly kA_angularVelocity: number;
  private readonly kA_velocity: number;
  private readonly kV_angularVelocity: number;
  private readonly kV_velocity: number;

  /**
   * Creates a simulated differential drivetrain.
   *
   * @param driveMotor The motor on the drivetrain.
   * @param gearing The gearing ratio of the drivetrain.
   * @param jKgMetersSquared The moment of inertia of the drivetrain.
   * @param massKg The mass of the robot.
   * @param wheelRadiusMeters The radius of the wheels on the drivetrain.
   * @param trackWidthMeters The robot's track width.
   * @param measurementStdDevs Standard deviations for measurements, in the form [x, y, heading,
   *     left velocity, right velocity, left distance, right distance]ᵀ. Can be null if no noise is
   *     desired.
   */
  constructor(
    driveMotor: DCMotor,
    gearing: number,
    jKgMetersSquared: number,
    massKg: number,
    wheelRadiusMeters: number,
    trackWidthMeters: number,
    measurementStdDevs: number[] | null = null
  ) {
    this.motor = driveMotor;
    this.gearing = gearing;
    this.wheelRadiusMeters = wheelRadiusMeters;
    this.trackWidthMeters = trackWidthMeters;
    this.momentOfInertiaKgMetersSquared = jKgMetersSquared;
    this.massKg = massKg;
    this.measurementStdDevs = measurementStdDevs;

    // Calculate derived parameters
    // Wheel gearbox inertia
    // I = mr² for a cylinder rotating around its axis
    // Assume wheel mass is 1/40 of robot mass (common rule of thumb)
    const wheelMassKg = massKg / 40;
    const wheelInertia = wheelMassKg * wheelRadiusMeters * wheelRadiusMeters / 2;

    // Motor inertia
    // Use approximation based on motor stall torque and free speed
    const motorInertia = driveMotor.stallTorque / driveMotor.freeSpeed * 0.05;

    // Total wheel + gearbox inertia
    this.wheelGearboxInertia = wheelInertia + motorInertia * gearing * gearing;

    // Calculate feedforward parameters
    // kV represents the voltage needed per unit velocity
    // kA represents the voltage needed per unit acceleration

    // For linear motion
    this.kV_velocity = driveMotor.nominalVoltage / (driveMotor.freeSpeed / gearing * wheelRadiusMeters);
    this.kA_velocity = this.wheelGearboxInertia * gearing / (wheelRadiusMeters * wheelRadiusMeters * driveMotor.stallTorque);

    // For angular motion
    this.kV_angularVelocity = this.kV_velocity * trackWidthMeters / 2;
    this.kA_angularVelocity = this.kA_velocity * trackWidthMeters / 2;


  }

  /**
   * Sets the applied voltage to the drivetrain. Note that positive voltage must make that side of
   * the drivetrain travel forward (+X).
   *
   * @param leftVoltageVolts The left voltage.
   * @param rightVoltageVolts The right voltage.
   */
  setInputs(leftVoltageVolts: number, rightVoltageVolts: number): void {
    // Clamp the input voltages
    this.u[0] = Math.max(-12, Math.min(12, leftVoltageVolts));
    this.u[1] = Math.max(-12, Math.min(12, rightVoltageVolts));
  }

  /**
   * Calculate the system dynamics (derivatives of the state vector)
   *
   * @param state The current state vector [x, y, theta, velL, velR, distL, distR]
   * @param input The input vector [voltageL, voltageR]
   * @returns The derivatives of the state vector
   */
  private calculateSystemDynamics(state: number[], input: number[]): number[] {
    // Extract the state
    const [x, y, theta, velL, velR, distL, distR] = state;

    // Extract the inputs
    const [voltageL, voltageR] = input;

    // Calculate the motor torques using a more accurate model
    // T = Kt * I where I = (V - Kv * w) / R
    // Kt = stallTorque / stallCurrent
    // Kv = nominalVoltage / freeSpeed
    // R = nominalVoltage / stallCurrent
    const Kt = this.motor.stallTorque / this.motor.stallCurrent;
    const Kv = this.motor.nominalVoltage / this.motor.freeSpeed;
    const R = this.motor.nominalVoltage / this.motor.stallCurrent;

    // Calculate the motor angular velocities
    const motorVelL = velL * this.gearing / this.wheelRadiusMeters;
    const motorVelR = velR * this.gearing / this.wheelRadiusMeters;

    // Calculate the back-EMF
    const backEmfL = Kv * motorVelL;
    const backEmfR = Kv * motorVelR;

    // Calculate the current
    const currentL = (voltageL - backEmfL) / R;
    const currentR = (voltageR - backEmfR) / R;

    // Calculate the motor torques
    const motorTorqueL = Kt * currentL;
    const motorTorqueR = Kt * currentR;

    // Calculate the wheel torques
    const wheelTorqueL = motorTorqueL * this.gearing;
    const wheelTorqueR = motorTorqueR * this.gearing;

    // Calculate the forces at the wheels
    const forceL = wheelTorqueL / this.wheelRadiusMeters;
    const forceR = wheelTorqueR / this.wheelRadiusMeters;

    // Calculate the linear and angular accelerations
    // For a differential drive, we can model it as a system with two degrees of freedom:
    // 1. Linear acceleration along the robot's heading
    // 2. Angular acceleration around the robot's center of rotation

    // Total force and torque
    const totalForce = forceL + forceR;
    const totalTorque = (forceR - forceL) * this.trackWidthMeters / 2;

    // Linear acceleration
    const linearAccel = totalForce / this.massKg;

    // Angular acceleration
    const angularAccel = totalTorque / this.momentOfInertiaKgMetersSquared;

    // Calculate the derivatives of the state vector
    // dx/dt = v * cos(theta)
    // dy/dt = v * sin(theta)
    // dtheta/dt = omega
    // dvelL/dt = accelL
    // dvelR/dt = accelR
    // ddistL/dt = velL
    // ddistR/dt = velR

    // Current velocity and angular velocity
    const v = (velL + velR) / 2;
    const omega = (velR - velL) / this.trackWidthMeters;

    // Calculate the wheel accelerations from the linear and angular accelerations
    const accelL = linearAccel - angularAccel * this.trackWidthMeters / 2;
    const accelR = linearAccel + angularAccel * this.trackWidthMeters / 2;

    // Return the derivatives
    return [
      v * Math.cos(theta),      // dx/dt
      v * Math.sin(theta),      // dy/dt
      omega,                    // dtheta/dt
      accelL,                   // dvelL/dt
      accelR,                   // dvelR/dt
      velL,                     // ddistL/dt
      velR                      // ddistR/dt
    ];
  }

  /**
   * Update the drivetrain states with the current time difference.
   *
   * @param dtSeconds the time difference
   */
  update(dtSeconds: number): void {
    // Use Runge-Kutta 4th order integration for more accurate simulation
    this.x = rungeKutta4(
      (x, u) => this.calculateSystemDynamics(x, u),
      this.x,
      this.u,
      dtSeconds
    );

    // Update the output
    this.y = [...this.x];

    // Add measurement noise if specified
    if (this.measurementStdDevs) {
      for (let i = 0; i < this.y.length; i++) {
        this.y[i] += this.measurementStdDevs[i] * (Math.random() * 2 - 1);
      }
    }
  }

  /**
   * Returns the current pose of the robot.
   *
   * @return The current pose of the robot.
   */
  getPose(): { x: number; y: number; rotation: number } {
    return {
      x: this.y[0],
      y: this.y[1],
      rotation: this.y[2]
    };
  }

  /**
   * Returns the current wheel speeds.
   *
   * @return The current wheel speeds.
   */
  getWheelSpeeds(): { left: number; right: number } {
    return {
      left: this.y[3],
      right: this.y[4]
    };
  }

  /**
   * Returns the current wheel positions in meters.
   *
   * @return The current wheel positions.
   */
  getWheelPositions(): { left: number; right: number } {
    return {
      left: this.y[5],
      right: this.y[6]
    };
  }

  /**
   * Returns the heading of the robot.
   *
   * @return The heading of the robot.
   */
  getHeading(): number {
    return this.y[2];
  }

  /**
   * Returns the current draw of the drivetrain in amperes.
   *
   * @return The current draw of the drivetrain in amperes.
   */
  getCurrentDrawAmps(): number {
    const [voltageL, voltageR] = this.u;
    const [_, __, ___, velL, velR, ____, _____] = this.x;

    // Calculate the motor angular velocities
    const motorVelL = velL * this.gearing / this.wheelRadiusMeters;
    const motorVelR = velR * this.gearing / this.wheelRadiusMeters;

    // Use the more accurate motor model from calculateSystemDynamics
    const Kt = this.motor.stallTorque / this.motor.stallCurrent;
    const Kv = this.motor.nominalVoltage / this.motor.freeSpeed;
    const R = this.motor.nominalVoltage / this.motor.stallCurrent;

    // Calculate the back-EMF
    const backEmfL = Kv * motorVelL;
    const backEmfR = Kv * motorVelR;

    // Calculate the current for each motor
    const currentL = (voltageL - backEmfL) / R;
    const currentR = (voltageR - backEmfR) / R;

    // Return the total current (absolute value since current can be negative)
    return Math.abs(currentL) * this.motor.numMotors + Math.abs(currentR) * this.motor.numMotors;
  }

  /**
   * Create a sim for the standard FRC kitbot.
   *
   * @param motor The motors installed in the bot.
   * @param gearing The gearing reduction used.
   * @param wheelSize The wheel size.
   * @param jKgMetersSquared The moment of inertia of the drivebase. This can be calculated using
   *     SysId.
   * @param measurementStdDevs Standard deviations for measurements, in the form [x, y, heading,
   *     left velocity, right velocity, left distance, right distance]ᵀ. Can be null if no noise is
   *     desired.
   * @return A sim for the standard FRC kitbot.
   */
  static createKitbotSim(
    motor: KitbotMotor,
    gearing: KitbotGearing,
    wheelSize: KitbotWheelSize,
    jKgMetersSquared: number,
    measurementStdDevs: number[] | null = null
  ): DifferentialDrivetrainSim {
    // Convert the motor enum to a DCMotor
    let dcMotor: DCMotor;
    switch (motor) {
      case KitbotMotor.kSingleCIM:
        dcMotor = DCMotors.CIM(1);
        break;
      case KitbotMotor.kDualCIM:
        dcMotor = DCMotors.CIM(2);
        break;
      case KitbotMotor.kSingleMiniCIM:
        dcMotor = DCMotors.MiniCIM(1);
        break;
      case KitbotMotor.kDualMiniCIM:
        dcMotor = DCMotors.MiniCIM(2);
        break;
      case KitbotMotor.kSingleNEO:
        dcMotor = DCMotors.NEO(1);
        break;
      case KitbotMotor.kDualNEO:
        dcMotor = DCMotors.NEO(2);
        break;
      case KitbotMotor.kSingleFalcon500:
        dcMotor = DCMotors.Falcon500(1);
        break;
      case KitbotMotor.kDualFalcon500:
        dcMotor = DCMotors.Falcon500(2);
        break;
      default:
        dcMotor = DCMotors.CIM(2);
        break;
    }

    // Create the sim
    return new DifferentialDrivetrainSim(
      dcMotor,
      gearing,
      jKgMetersSquared,
      60, // 60 lbs
      wheelSize / 2.0, // Wheel radius
      0.66, // Track width in meters (26 inches)
      measurementStdDevs
    );
  }
}
