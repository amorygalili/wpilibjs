/**
 * Minimal driver station implementation.
 * 
 * This class provides a minimal implementation of the driver station that doesn't
 * start a server.
 */
import { EventEmitter } from 'events';
import { DSControlWord } from '../src/DSControlWord';
import { JoystickAxisType, JoystickButtonType, JoystickPOVDirection, Alliance } from '../src/DriverStation';

/**
 * Minimal driver station implementation.
 * 
 * This class provides a minimal implementation of the driver station that doesn't
 * start a server.
 */
export class MinimalDriverStation extends EventEmitter {
  private static instance: MinimalDriverStation;
  private m_controlWord: DSControlWord;
  private m_enabled: boolean = false;
  private m_autonomous: boolean = false;
  private m_test: boolean = false;
  private m_eStop: boolean = false;
  private m_fmsAttached: boolean = false;
  private m_dsAttached: boolean = false;
  private m_alliance: Alliance = Alliance.kInvalid;
  private m_station: number = 0;
  private m_matchTime: number = -1;
  private m_joystickAxes: Map<number, Map<number, number>> = new Map();
  private m_joystickButtons: Map<number, Set<number>> = new Map();
  private m_joystickPOVs: Map<number, number> = new Map();
  private m_newControlData: boolean = false;

  /**
   * Constructor for MinimalDriverStation.
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
   * Get an instance of the MinimalDriverStation.
   *
   * @return The MinimalDriverStation instance
   */
  public static getInstance(): MinimalDriverStation {
    if (!MinimalDriverStation.instance) {
      MinimalDriverStation.instance = new MinimalDriverStation();
    }
    return MinimalDriverStation.instance;
  }

  /**
   * Initialize the driver station communication.
   *
   * This method is a no-op in the minimal implementation.
   *
   * @return True if initialization was successful
   */
  public static initialize(): boolean {
    return true;
  }

  /**
   * Read new data from the driver station.
   *
   * This method is a no-op in the minimal implementation.
   */
  public readData(): void {
    // No-op
  }

  /**
   * Check if the driver station is attached.
   *
   * @return True if the driver station is attached
   */
  public isDSAttached(): boolean {
    return this.m_dsAttached;
  }

  /**
   * Check if the FMS is attached.
   *
   * @return True if the FMS is attached
   */
  public isFMSAttached(): boolean {
    return this.m_fmsAttached;
  }

  /**
   * Check if the robot is enabled.
   *
   * @return True if the robot is enabled
   */
  public isEnabled(): boolean {
    return this.m_enabled;
  }

  /**
   * Check if the robot is disabled.
   *
   * @return True if the robot is disabled
   */
  public isDisabled(): boolean {
    return !this.m_enabled;
  }

  /**
   * Check if the robot is in autonomous mode.
   *
   * @return True if the robot is in autonomous mode
   */
  public isAutonomous(): boolean {
    return this.m_autonomous;
  }

  /**
   * Check if the robot is in teleop mode.
   *
   * @return True if the robot is in teleop mode
   */
  public isTeleop(): boolean {
    return !(this.m_autonomous || this.m_test);
  }

  /**
   * Check if the robot is in test mode.
   *
   * @return True if the robot is in test mode
   */
  public isTest(): boolean {
    return this.m_test;
  }

  /**
   * Check if the robot is emergency stopped.
   *
   * @return True if the robot is emergency stopped
   */
  public isEStopped(): boolean {
    return this.m_eStop;
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
   * Get the driver station location.
   *
   * @return The driver station location
   */
  public getLocation(): number {
    return this.m_station;
  }

  /**
   * Get the match time.
   *
   * @return The match time
   */
  public getMatchTime(): number {
    return this.m_matchTime;
  }

  /**
   * Get the value of a joystick axis.
   *
   * @param stick The joystick index
   * @param axis The axis index
   * @return The axis value
   */
  public getStickAxis(stick: number, axis: number): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    const axes = this.m_joystickAxes.get(stick);
    if (!axes) {
      return 0;
    }

    return axes.get(axis) || 0;
  }

  /**
   * Get the value of a joystick button.
   *
   * @param stick The joystick index
   * @param button The button index
   * @return The button value
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
   * Get the value of a joystick POV.
   *
   * @param stick The joystick index
   * @param pov The POV index
   * @return The POV value
   */
  public getStickPOV(stick: number, pov: number): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (pov < 0) {
      throw new Error(`POV index out of range: ${pov}`);
    }

    if (pov > 0) {
      return JoystickPOVDirection.kCenter;
    }

    return this.m_joystickPOVs.get(stick) || JoystickPOVDirection.kCenter;
  }

  /**
   * Get the number of axes on a joystick.
   *
   * @param stick The joystick index
   * @return The number of axes
   */
  public getStickAxisCount(stick: number): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    const axes = this.m_joystickAxes.get(stick);
    if (!axes) {
      return 0;
    }

    return axes.size;
  }

  /**
   * Get the number of buttons on a joystick.
   *
   * @param stick The joystick index
   * @return The number of buttons
   */
  public getStickButtonCount(stick: number): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    const buttons = this.m_joystickButtons.get(stick);
    if (!buttons) {
      return 0;
    }

    return buttons.size;
  }

  /**
   * Get the number of POVs on a joystick.
   *
   * @param stick The joystick index
   * @return The number of POVs
   */
  public getStickPOVCount(stick: number): number {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickPOVs.has(stick) ? 1 : 0;
  }

  /**
   * Check if a joystick is connected.
   *
   * @param stick The joystick index
   * @return True if the joystick is connected
   */
  public isJoystickConnected(stick: number): boolean {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.getStickAxisCount(stick) > 0 || this.getStickButtonCount(stick) > 0;
  }

  /**
   * Set the enabled state of the robot.
   *
   * @param enabled Whether the robot should be enabled
   */
  public setEnabled(enabled: boolean): void {
    this.m_enabled = enabled;
    this.m_controlWord.setEnabled(enabled);
  }

  /**
   * Set the autonomous mode of the robot.
   *
   * @param autonomous Whether the robot should be in autonomous mode
   */
  public setAutonomous(autonomous: boolean): void {
    this.m_autonomous = autonomous;
    this.m_controlWord.setAutonomous(autonomous);
  }

  /**
   * Set the test mode of the robot.
   *
   * @param test Whether the robot should be in test mode
   */
  public setTest(test: boolean): void {
    this.m_test = test;
    this.m_controlWord.setTest(test);
  }

  /**
   * Set the emergency stop state of the robot.
   *
   * @param eStop Whether the robot should be emergency stopped
   */
  public setEStopped(eStop: boolean): void {
    this.m_eStop = eStop;
    this.m_controlWord.setEStopped(eStop);
  }

  /**
   * Set the FMS attached state.
   *
   * @param fmsAttached Whether the FMS is attached
   */
  public setFMSAttached(fmsAttached: boolean): void {
    this.m_fmsAttached = fmsAttached;
    this.m_controlWord.setFMSAttached(fmsAttached);
  }

  /**
   * Set the driver station attached state.
   *
   * @param dsAttached Whether the driver station is attached
   */
  public setDSAttached(dsAttached: boolean): void {
    this.m_dsAttached = dsAttached;
    this.m_controlWord.setDSAttached(dsAttached);
  }

  /**
   * Set the alliance of the robot.
   *
   * @param alliance The alliance of the robot
   */
  public setAlliance(alliance: Alliance): void {
    this.m_alliance = alliance;
  }

  /**
   * Set the driver station location.
   *
   * @param station The driver station location
   */
  public setLocation(station: number): void {
    this.m_station = station;
  }

  /**
   * Set the match time.
   *
   * @param matchTime The match time
   */
  public setMatchTime(matchTime: number): void {
    this.m_matchTime = matchTime;
  }

  /**
   * Set the value of a joystick axis.
   *
   * @param stick The joystick index
   * @param axis The axis index
   * @param value The axis value
   */
  public setJoystickAxis(stick: number, axis: number, value: number): void {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (axis < 0) {
      throw new Error(`Axis index out of range: ${axis}`);
    }

    let axes = this.m_joystickAxes.get(stick);
    if (!axes) {
      axes = new Map();
      this.m_joystickAxes.set(stick, axes);
    }

    axes.set(axis, value);
    this.m_newControlData = true;
  }

  /**
   * Set the value of a joystick button.
   *
   * @param stick The joystick index
   * @param button The button index
   * @param value The button value
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
   * @param stick The joystick index
   * @param pov The POV index
   * @param value The POV value
   */
  public setJoystickPOV(stick: number, pov: number, value: number): void {
    if (stick < 0 || stick >= 6) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (pov < 0) {
      throw new Error(`POV index out of range: ${pov}`);
    }

    if (pov > 0) {
      return;
    }

    this.m_joystickPOVs.set(stick, value);
    this.m_newControlData = true;
  }

  /**
   * Check if there is new control data.
   *
   * @return True if there is new control data
   */
  public isNewControlData(): boolean {
    const result = this.m_newControlData;
    this.m_newControlData = false;
    return result;
  }

  /**
   * Get the control word.
   *
   * @return The control word
   */
  public getControlWord(): DSControlWord {
    return this.m_controlWord;
  }
}

// Export the Alliance enum
export { Alliance } from '../src/DriverStation';
