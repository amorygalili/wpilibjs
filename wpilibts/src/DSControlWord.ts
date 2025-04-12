/**
 * Control word for the DS to control the robot state.
 *
 * This class is used to determine the state of the robot, including
 * whether it is enabled, autonomous, test, emergency stopped, etc.
 */
export class DSControlWord {
  private m_enabled: boolean = false;
  private m_autonomous: boolean = false;
  private m_test: boolean = false;
  private m_emergencyStop: boolean = false;
  private m_fmsAttached: boolean = false;
  private m_dsAttached: boolean = false;

  /**
   * Constructor for DSControlWord.
   *
   * @param enabled Whether the robot is enabled
   * @param autonomous Whether the robot is in autonomous mode
   * @param test Whether the robot is in test mode
   * @param emergencyStop Whether the robot is emergency stopped
   * @param fmsAttached Whether the robot is connected to the FMS
   * @param dsAttached Whether the robot is connected to the DS
   */
  constructor(
    enabled: boolean = false,
    autonomous: boolean = false,
    test: boolean = false,
    emergencyStop: boolean = false,
    fmsAttached: boolean = false,
    dsAttached: boolean = false
  ) {
    this.m_enabled = enabled;
    this.m_autonomous = autonomous;
    this.m_test = test;
    this.m_emergencyStop = emergencyStop;
    this.m_fmsAttached = fmsAttached;
    this.m_dsAttached = dsAttached;
  }

  /**
   * Refresh the control word data.
   *
   * This method updates the control word with the latest data.
   * In a real implementation, this would fetch data from the HAL.
   * For our implementation, this is called by the DriverStation class
   * when new data is received from the WebSocket server.
   */
  public refresh(): void {
    // This method is now a no-op as the values are set directly
    // by the DriverStation class when it receives updates from
    // the WebSocket server or simulation controls.
  }

  /**
   * Update the control word with new values.
   *
   * @param enabled Whether the robot is enabled
   * @param autonomous Whether the robot is in autonomous mode
   * @param test Whether the robot is in test mode
   * @param emergencyStop Whether the robot is emergency stopped
   * @param fmsAttached Whether the robot is connected to the FMS
   * @param dsAttached Whether the robot is connected to the DS
   */
  public update(
    enabled: boolean,
    autonomous: boolean,
    test: boolean,
    emergencyStop: boolean,
    fmsAttached: boolean,
    dsAttached: boolean
  ): void {
    this.m_enabled = enabled;
    this.m_autonomous = autonomous;
    this.m_test = test;
    this.m_emergencyStop = emergencyStop;
    this.m_fmsAttached = fmsAttached;
    this.m_dsAttached = dsAttached;
  }

  /**
   * Get if the robot is enabled.
   *
   * @return True if the robot is enabled
   */
  public isEnabled(): boolean {
    return this.m_enabled;
  }

  /**
   * Get if the robot is disabled.
   *
   * @return True if the robot is disabled
   */
  public isDisabled(): boolean {
    return !this.m_enabled;
  }

  /**
   * Get if the robot is in autonomous mode.
   *
   * @return True if the robot is in autonomous mode
   */
  public isAutonomous(): boolean {
    return this.m_autonomous;
  }

  /**
   * Get if the robot is in teleop mode.
   *
   * @return True if the robot is in teleop mode
   */
  public isTeleop(): boolean {
    return !(this.m_autonomous || this.m_test);
  }

  /**
   * Get if the robot is in test mode.
   *
   * @return True if the robot is in test mode
   */
  public isTest(): boolean {
    return this.m_test;
  }

  /**
   * Get if the robot is emergency stopped.
   *
   * @return True if the robot is emergency stopped
   */
  public isEStopped(): boolean {
    return this.m_emergencyStop;
  }

  /**
   * Get if the robot is connected to the FMS.
   *
   * @return True if the robot is connected to the FMS
   */
  public isFMSAttached(): boolean {
    return this.m_fmsAttached;
  }

  /**
   * Get if the robot is connected to the DS.
   *
   * @return True if the robot is connected to the DS
   */
  public isDSAttached(): boolean {
    return this.m_dsAttached;
  }

  /**
   * Set the enabled state of the robot.
   *
   * @param enabled Whether the robot is enabled
   */
  public setEnabled(enabled: boolean): void {
    this.m_enabled = enabled;
  }

  /**
   * Set the autonomous mode of the robot.
   *
   * @param autonomous Whether the robot is in autonomous mode
   */
  public setAutonomous(autonomous: boolean): void {
    this.m_autonomous = autonomous;
    if (autonomous) {
      this.m_test = false;
    }
  }

  /**
   * Set the test mode of the robot.
   *
   * @param test Whether the robot is in test mode
   */
  public setTest(test: boolean): void {
    this.m_test = test;
    if (test) {
      this.m_autonomous = false;
    }
  }

  /**
   * Set the emergency stop state of the robot.
   *
   * @param emergencyStop Whether the robot is emergency stopped
   */
  public setEStopped(emergencyStop: boolean): void {
    this.m_emergencyStop = emergencyStop;
  }

  /**
   * Set the FMS attached state of the robot.
   *
   * @param fmsAttached Whether the robot is connected to the FMS
   */
  public setFMSAttached(fmsAttached: boolean): void {
    this.m_fmsAttached = fmsAttached;
  }

  /**
   * Set the DS attached state of the robot.
   *
   * @param dsAttached Whether the robot is connected to the DS
   */
  public setDSAttached(dsAttached: boolean): void {
    this.m_dsAttached = dsAttached;
  }
}
