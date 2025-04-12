import { DSControlWord } from './DSControlWord';
import { EventEmitter } from 'events';
import { DSWebSocketServer } from './network/DSWebSocketServer';
import { DriverStationThread } from './DriverStationThread';

/**
 * Joystick axis types.
 */
export enum JoystickAxisType {
  kX,
  kY,
  kZ,
  kTwist,
  kThrottle
}

/**
 * Joystick button types.
 */
export enum JoystickButtonType {
  kTrigger = 1,
  kTop = 2
}

/**
 * Joystick POV (hat) directions.
 */
export enum JoystickPOVDirection {
  kCenter = -1,
  kUp = 0,
  kUpRight = 45,
  kRight = 90,
  kDownRight = 135,
  kDown = 180,
  kDownLeft = 225,
  kLeft = 270,
  kUpLeft = 315
}

/**
 * Robot alliance types.
 */
export enum Alliance {
  kRed,
  kBlue,
  kInvalid
}

/**
 * The location of the team's driver station controls.
 */
export enum Location {
  kRed1,
  kRed2,
  kRed3,
  kBlue1,
  kBlue2,
  kBlue3,
  kInvalid
}

/**
 * The match type being played.
 */
export enum MatchType {
  kNone,
  kPractice,
  kQualification,
  kElimination
}

/**
 * Information about a match.
 */
export interface MatchInfo {
  eventName: string;
  gameSpecificMessage: string;
  matchNumber: number;
  replayNumber: number;
  matchType: MatchType;
}

/**
 * Provide access to the network communication data to / from the Driver Station.
 */
export class DriverStation extends EventEmitter {
  private static instance: DriverStation;
  private m_controlWord: DSControlWord;
  private m_joystickAxes: Map<number, Map<JoystickAxisType, number>> = new Map();
  private m_joystickButtons: Map<number, Set<number>> = new Map();
  private m_joystickPOVs: Map<number, JoystickPOVDirection> = new Map();
  private m_alliance: Alliance = Alliance.kInvalid;
  private m_location: Location = Location.kInvalid;
  private m_matchInfo: MatchInfo = {
    eventName: '',
    gameSpecificMessage: '',
    matchNumber: 0,
    replayNumber: 0,
    matchType: MatchType.kNone
  };
  private m_newControlData: boolean = false;

  /**
   * Constructor for DriverStation.
   */
  private constructor() {
    super();
    this.m_controlWord = new DSControlWord();

    // Initialize joystick data
    for (let i = 0; i < 6; i++) {
      this.m_joystickAxes.set(i, new Map());
      this.m_joystickButtons.set(i, new Set());
      this.m_joystickPOVs.set(i, JoystickPOVDirection.kCenter);
    }
  }

  /**
   * Initialize the driver station communication.
   *
   * This method starts the WebSocket server and the driver station thread.
   * It should be called once when the robot program starts.
   *
   * @return True if initialization was successful
   */
  public static initialize(): boolean {
    const ds = DriverStation.getInstance();
    const thread = DriverStationThread.getInstance();

    // Start the driver station thread
    return thread.start();
  }

  /**
   * Get an instance of the DriverStation.
   *
   * @return The DriverStation instance
   */
  public static getInstance(): DriverStation {
    if (!DriverStation.instance) {
      DriverStation.instance = new DriverStation();
    }
    return DriverStation.instance;
  }

  /**
   * Read new data from the driver station.
   *
   * This method is called periodically by the DriverStationThread to update
   * the robot state based on data received from the driver station.
   * It refreshes the control word and emits events for state changes.
   */
  public refreshData(): void {
    const wasEnabled = this.isEnabled();
    const wasAutonomous = this.isAutonomous();
    const wasTest = this.isTest();

    // Refresh the control word
    this.m_controlWord.refresh();
    this.m_newControlData = true;

    // Emit events for state changes
    if (this.isEnabled() !== wasEnabled) {
      this.emit(this.isEnabled() ? 'enabled' : 'disabled');
    }

    if (this.isAutonomous() !== wasAutonomous) {
      if (this.isAutonomous()) {
        this.emit('autonomous');
      }
    }

    if (this.isTest() !== wasTest) {
      if (this.isTest()) {
        this.emit('test');
      }
    }

    // If not in autonomous or test, we're in teleop
    if (!this.isAutonomous() && !this.isTest() &&
        (wasAutonomous || wasTest)) {
      this.emit('teleop');
    }

    // Emit a general update event
    this.emit('update');
  }

  /**
   * Is the driver station attached to the robot?
   *
   * @return True if the driver station is attached
   */
  public isDSAttached(): boolean {
    return this.m_controlWord.isDSAttached();
  }

  /**
   * Is the driver station attached to a Field Management System?
   *
   * @return True if the driver station is attached to an FMS
   */
  public isFMSAttached(): boolean {
    return this.m_controlWord.isFMSAttached();
  }

  /**
   * Is the robot enabled?
   *
   * @return True if the robot is enabled
   */
  public isEnabled(): boolean {
    return this.m_controlWord.isEnabled();
  }

  /**
   * Is the robot disabled?
   *
   * @return True if the robot is disabled
   */
  public isDisabled(): boolean {
    return this.m_controlWord.isDisabled();
  }

  /**
   * Is the robot in autonomous mode?
   *
   * @return True if the robot is in autonomous mode
   */
  public isAutonomous(): boolean {
    return this.m_controlWord.isAutonomous();
  }

  /**
   * Is the robot in teleop mode?
   *
   * @return True if the robot is in teleop mode
   */
  public isTeleop(): boolean {
    return this.m_controlWord.isTeleop();
  }

  /**
   * Is the robot in test mode?
   *
   * @return True if the robot is in test mode
   */
  public isTest(): boolean {
    return this.m_controlWord.isTest();
  }

  /**
   * Is the robot emergency stopped?
   *
   * @return True if the robot is emergency stopped
   */
  public isEStopped(): boolean {
    return this.m_controlWord.isEStopped();
  }

  /**
   * Get the alliance the robot is on.
   *
   * @return The alliance the robot is on
   */
  public getAlliance(): Alliance {
    return this.m_alliance;
  }

  /**
   * Get the location of the team's driver station controls.
   *
   * @return The location of the team's driver station controls
   */
  public getLocation(): Location {
    return this.m_location;
  }

  /**
   * Get the match information.
   *
   * @return The match information
   */
  public getMatchInfo(): MatchInfo {
    return { ...this.m_matchInfo };
  }

  /**
   * Get the game specific message.
   *
   * @return The game specific message
   */
  public getGameSpecificMessage(): string {
    return this.m_matchInfo.gameSpecificMessage;
  }

  /**
   * Get the value of a joystick axis.
   *
   * @param stick The joystick port number
   * @param axis The axis to get the value of
   * @return The value of the axis (-1 to 1)
   */
  public getStickAxis(stick: number, axis: JoystickAxisType): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    const axes = this.m_joystickAxes.get(stick);
    if (!axes) {
      return 0;
    }

    return axes.get(axis) ?? 0;
  }

  /**
   * Get the button value of a joystick.
   *
   * @param stick The joystick port number
   * @param button The button number to get the value of (starting at 1)
   * @return The state of the button
   */
  public getStickButton(stick: number, button: number): boolean {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (button <= 0) {
      throw new Error(`Button index out of range: ${button}`);
    }

    const buttons = this.m_joystickButtons.get(stick);
    if (!buttons) {
      return false;
    }

    return buttons.has(button);
  }

  /**
   * Get the POV value of a joystick.
   *
   * @param stick The joystick port number
   * @param pov The POV number (usually 0)
   * @return The value of the POV
   */
  public getStickPOV(stick: number, pov: number = 0): JoystickPOVDirection {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (pov < 0) {
      throw new Error(`POV index out of range: ${pov}`);
    }

    // For now, we only support one POV per joystick
    if (pov > 0) {
      return JoystickPOVDirection.kCenter;
    }

    return this.m_joystickPOVs.get(stick) ?? JoystickPOVDirection.kCenter;
  }

  /**
   * Set the value of a joystick axis.
   *
   * This is used for simulation.
   *
   * @param stick The joystick port number
   * @param axis The axis to set the value of
   * @param value The value to set the axis to (-1 to 1)
   */
  public setJoystickAxis(stick: number, axis: JoystickAxisType, value: number): void {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    let axes = this.m_joystickAxes.get(stick);
    if (!axes) {
      axes = new Map();
      this.m_joystickAxes.set(stick, axes);
    }

    axes.set(axis, Math.max(-1, Math.min(1, value)));
    this.m_newControlData = true;
  }

  /**
   * Set the value of a joystick button.
   *
   * This is used for simulation.
   *
   * @param stick The joystick port number
   * @param button The button number to set the value of (starting at 1)
   * @param value The state of the button
   */
  public setJoystickButton(stick: number, button: number, value: boolean): void {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (button <= 0) {
      throw new Error(`Button index out of range: ${button}`);
    }

    let buttons = this.m_joystickButtons.get(stick);
    if (!buttons) {
      buttons = new Set();
      this.m_joystickButtons.set(stick, buttons);
    }

    if (value) {
      buttons.add(button);
    } else {
      buttons.delete(button);
    }

    this.m_newControlData = true;
  }

  /**
   * Set the value of a joystick POV.
   *
   * This is used for simulation.
   *
   * @param stick The joystick port number
   * @param pov The POV number (usually 0)
   * @param value The value of the POV
   */
  public setJoystickPOV(stick: number, pov: number, value: JoystickPOVDirection): void {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (pov < 0) {
      throw new Error(`POV index out of range: ${pov}`);
    }

    // For now, we only support one POV per joystick
    if (pov > 0) {
      return;
    }

    this.m_joystickPOVs.set(stick, value);
    this.m_newControlData = true;
  }

  /**
   * Set the enabled state of the robot.
   *
   * This is used for simulation.
   *
   * @param enabled Whether the robot is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.m_controlWord.setEnabled(enabled);
    this.m_newControlData = true;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Set the autonomous mode of the robot.
   *
   * This is used for simulation.
   *
   * @param autonomous Whether the robot is in autonomous mode
   */
  public setAutonomous(autonomous: boolean): void {
    this.m_controlWord.setAutonomous(autonomous);
    this.m_newControlData = true;
    this.emit('autonomousChanged', autonomous);
  }

  /**
   * Set the test mode of the robot.
   *
   * This is used for simulation.
   *
   * @param test Whether the robot is in test mode
   */
  public setTest(test: boolean): void {
    this.m_controlWord.setTest(test);
    this.m_newControlData = true;
    this.emit('testChanged', test);
  }

  /**
   * Set the emergency stop state of the robot.
   *
   * This is used for simulation.
   *
   * @param estopped Whether the robot is emergency stopped
   */
  public setEStopped(estopped: boolean): void {
    this.m_controlWord.setEStopped(estopped);
    this.m_newControlData = true;
    this.emit('eStoppedChanged', estopped);
  }

  /**
   * Set the FMS attached state of the robot.
   *
   * This is used for simulation.
   *
   * @param attached Whether the robot is connected to the FMS
   */
  public setFMSAttached(attached: boolean): void {
    this.m_controlWord.setFMSAttached(attached);
    this.m_newControlData = true;
    this.emit('fmsAttachedChanged', attached);
  }

  /**
   * Set the DS attached state of the robot.
   *
   * This is used for simulation.
   *
   * @param attached Whether the robot is connected to the DS
   */
  public setDSAttached(attached: boolean): void {
    this.m_controlWord.setDSAttached(attached);
    this.m_newControlData = true;
    this.emit('dsAttachedChanged', attached);
  }

  /**
   * Set the alliance of the robot.
   *
   * This is used for simulation.
   *
   * @param alliance The alliance of the robot
   */
  public setAlliance(alliance: Alliance): void {
    this.m_alliance = alliance;
    this.m_newControlData = true;
    this.emit('allianceChanged', alliance);
  }

  /**
   * Set the location of the team's driver station controls.
   *
   * This is used for simulation.
   *
   * @param location The location of the team's driver station controls
   */
  public setLocation(location: Location): void {
    this.m_location = location;
    this.m_newControlData = true;
    this.emit('locationChanged', location);
  }

  /**
   * Set the match information.
   *
   * This is used for simulation.
   *
   * @param matchInfo The match information
   */
  public setMatchInfo(matchInfo: MatchInfo): void {
    this.m_matchInfo = { ...matchInfo };
    this.m_newControlData = true;
    this.emit('matchInfoChanged', this.m_matchInfo);
  }

  /**
   * Set the game specific message.
   *
   * This is used for simulation.
   *
   * @param message The game specific message
   */
  public setGameSpecificMessage(message: string): void {
    this.m_matchInfo.gameSpecificMessage = message;
    this.m_newControlData = true;
    this.emit('gameSpecificMessageChanged', message);
  }

  /**
   * Notify the driver station that the user program has started.
   */
  public static observeUserProgramStarting(): void {
    // In a real implementation, this would notify the DS
    console.log('User program starting');
  }

  /**
   * Notify the driver station that the user program is disabled.
   */
  public static observeUserProgramDisabled(): void {
    // In a real implementation, this would notify the DS
    console.log('User program disabled');
  }

  /**
   * Notify the driver station that the user program is autonomous.
   */
  public static observeUserProgramAutonomous(): void {
    // In a real implementation, this would notify the DS
    console.log('User program autonomous');
  }

  /**
   * Notify the driver station that the user program is teleop.
   */
  public static observeUserProgramTeleop(): void {
    // In a real implementation, this would notify the DS
    console.log('User program teleop');
  }

  /**
   * Notify the driver station that the user program is test.
   */
  public static observeUserProgramTest(): void {
    // In a real implementation, this would notify the DS
    console.log('User program test');
  }
}
