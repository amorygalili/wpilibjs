/**
 * Custom port driver station implementation.
 *
 * This is a modified version of the DriverStation class that uses a different port
 * to avoid conflicts with other processes.
 */
import { EventEmitter } from 'events';
import { DSControlWord } from '../src/DSControlWord';
import { DSWebSocketServer, DSMessageType } from '../src/network/DSWebSocketServer';

/**
 * Joystick axis types.
 */
export enum JoystickAxisType {
  kX = 0,
  kY = 1,
  kZ = 2,
  kTwist = 3,
  kThrottle = 4
}

/**
 * Joystick button types.
 */
export enum JoystickButtonType {
  kTrigger = 1,
  kTop = 2
}

/**
 * Joystick POV directions.
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
 * Alliance types.
 */
export enum Alliance {
  kRed = 0,
  kBlue = 1,
  kInvalid = 2
}

/**
 * Match types.
 */
export enum MatchType {
  kNone = 0,
  kPractice = 1,
  kQualification = 2,
  kElimination = 3
}

/**
 * Joystick values.
 */
export interface JoystickValues {
  axes: number[];
  buttons: boolean[];
  povs: number[];
}

/**
 * Match info.
 */
export interface MatchInfo {
  eventName: string;
  gameSpecificMessage: string;
  matchNumber: number;
  replayNumber: number;
  matchType: MatchType;
}

/**
 * Custom port driver station implementation.
 */
export class CustomPortDriverStation extends EventEmitter {
  private static instance: CustomPortDriverStation;
  private static initialized: boolean = false;
  private static readonly MAX_JOYSTICKS = 6;
  private static readonly DEFAULT_PORT = 8735; // Use a different port to avoid conflicts

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
  private m_matchInfo: MatchInfo = {
    eventName: '',
    gameSpecificMessage: '',
    matchNumber: 0,
    replayNumber: 0,
    matchType: MatchType.kNone
  };
  private m_joystickAxes: Map<number, Map<number, number>> = new Map();
  private m_joystickButtons: Map<number, Set<number>> = new Map();
  private m_joystickPOVs: Map<number, Map<number, number>> = new Map();
  private m_joystickDescriptions: Map<number, string> = new Map();
  private m_joystickIsXbox: Map<number, boolean> = new Map();
  private m_joystickTypes: Map<number, number> = new Map();
  private m_joystickButtonCounts: Map<number, number> = new Map();
  private m_joystickAxisCounts: Map<number, number> = new Map();
  private m_joystickPOVCounts: Map<number, number> = new Map();
  private m_newControlData: boolean = false;
  private m_thread: NodeJS.Timeout | null = null;
  private m_threadPeriod: number = 20;
  private m_dsServer: DSWebSocketServer | null = null;

  /**
   * Constructor for CustomPortDriverStation.
   */
  private constructor() {
    super();
    this.m_controlWord = new DSControlWord();

    // Initialize joystick data
    for (let i = 0; i < CustomPortDriverStation.MAX_JOYSTICKS; i++) {
      this.m_joystickAxes.set(i, new Map());
      this.m_joystickButtons.set(i, new Set());
      this.m_joystickPOVs.set(i, new Map());
      this.m_joystickDescriptions.set(i, '');
      this.m_joystickIsXbox.set(i, false);
      this.m_joystickTypes.set(i, 0);
      this.m_joystickButtonCounts.set(i, 0);
      this.m_joystickAxisCounts.set(i, 0);
      this.m_joystickPOVCounts.set(i, 0);
    }
  }

  /**
   * Get an instance of the CustomPortDriverStation.
   *
   * @return The CustomPortDriverStation instance
   */
  public static getInstance(): CustomPortDriverStation {
    if (!CustomPortDriverStation.instance) {
      CustomPortDriverStation.instance = new CustomPortDriverStation();
    }
    return CustomPortDriverStation.instance;
  }

  /**
   * Initialize the driver station communication.
   *
   * @return True if initialization was successful
   */
  public static initialize(): boolean {
    if (CustomPortDriverStation.initialized) {
      return true;
    }

    const ds = CustomPortDriverStation.getInstance();
    ds.startDSThread();

    CustomPortDriverStation.initialized = true;
    return true;
  }

  /**
   * Start the driver station thread.
   */
  private startDSThread(): void {
    if (this.m_thread) {
      return;
    }

    // Start the WebSocket server
    this.m_dsServer = DSWebSocketServer.getInstance(CustomPortDriverStation.DEFAULT_PORT);
    this.m_dsServer.start();

    // Set up event listeners
    this.m_dsServer.on('joystick_data', (data: any) => {
      const joystickIndex = data.joystick;
      const axes = data.axes;
      const buttons = data.buttons;
      const povs = data.povs;

      this.setJoystickValues(joystickIndex, axes, buttons, povs);
    });

    this.m_dsServer.on('control_word', (data: any) => {
      this.m_enabled = data.enabled;
      this.m_autonomous = data.autonomous;
      this.m_test = data.test;
      this.m_eStop = data.eStop;
      this.m_fmsAttached = data.fmsAttached;
      this.m_dsAttached = data.dsAttached;

      this.m_controlWord.setEnabled(this.m_enabled);
      this.m_controlWord.setAutonomous(this.m_autonomous);
      this.m_controlWord.setTest(this.m_test);
      this.m_controlWord.setEStopped(this.m_eStop);
      this.m_controlWord.setFMSAttached(this.m_fmsAttached);
      this.m_controlWord.setDSAttached(this.m_dsAttached);

      this.emit('control_word', {
        enabled: this.m_enabled,
        autonomous: this.m_autonomous,
        test: this.m_test,
        eStop: this.m_eStop,
        fmsAttached: this.m_fmsAttached,
        dsAttached: this.m_dsAttached
      });
    });

    this.m_dsServer.on('match_info', (data: any) => {
      this.m_matchInfo = data;
      this.emit('match_info', this.m_matchInfo);
    });

    // Start the thread
    this.m_thread = setInterval(() => {
      this.readData();
    }, this.m_threadPeriod);
  }

  /**
   * Stop the driver station thread.
   */
  private stopDSThread(): void {
    if (!this.m_thread) {
      return;
    }

    clearInterval(this.m_thread);
    this.m_thread = null;

    if (this.m_dsServer) {
      this.m_dsServer.stop();
      this.m_dsServer = null;
    }
  }

  /**
   * Read new data from the driver station.
   */
  public readData(): void {
    // Send robot state to clients
    if (this.m_dsServer) {
      this.m_dsServer.broadcast({
        type: DSMessageType.ROBOT_STATE,
        data: {
          enabled: this.m_enabled,
          autonomous: this.m_autonomous,
          test: this.m_test,
          eStop: this.m_eStop,
          fmsAttached: this.m_fmsAttached,
          dsAttached: this.m_dsAttached,
          alliance: this.m_alliance,
          station: this.m_station,
          matchTime: this.m_matchTime
        }
      });
    }
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
   * Get the match info.
   *
   * @return The match info
   */
  public getMatchInfo(): MatchInfo {
    return this.m_matchInfo;
  }

  /**
   * Get the value of a joystick axis.
   *
   * @param stick The joystick index
   * @param axis The axis index
   * @return The axis value
   */
  public getStickAxis(stick: number, axis: number): number {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
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
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
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
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    if (pov < 0) {
      throw new Error(`POV index out of range: ${pov}`);
    }

    const povs = this.m_joystickPOVs.get(stick);
    if (!povs) {
      return JoystickPOVDirection.kCenter;
    }

    return povs.get(pov) || JoystickPOVDirection.kCenter;
  }

  /**
   * Get the number of axes on a joystick.
   *
   * @param stick The joystick index
   * @return The number of axes
   */
  public getStickAxisCount(stick: number): number {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickAxisCounts.get(stick) || 0;
  }

  /**
   * Get the number of buttons on a joystick.
   *
   * @param stick The joystick index
   * @return The number of buttons
   */
  public getStickButtonCount(stick: number): number {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickButtonCounts.get(stick) || 0;
  }

  /**
   * Get the number of POVs on a joystick.
   *
   * @param stick The joystick index
   * @return The number of POVs
   */
  public getStickPOVCount(stick: number): number {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickPOVCounts.get(stick) || 0;
  }

  /**
   * Get the joystick type.
   *
   * @param stick The joystick index
   * @return The joystick type
   */
  public getJoystickType(stick: number): number {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickTypes.get(stick) || 0;
  }

  /**
   * Check if a joystick is an Xbox controller.
   *
   * @param stick The joystick index
   * @return True if the joystick is an Xbox controller
   */
  public getJoystickIsXbox(stick: number): boolean {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickIsXbox.get(stick) || false;
  }

  /**
   * Get the joystick name.
   *
   * @param stick The joystick index
   * @return The joystick name
   */
  public getJoystickName(stick: number): string {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    return this.m_joystickDescriptions.get(stick) || '';
  }

  /**
   * Get the values for a joystick.
   *
   * @param stick The joystick index
   * @return The joystick values
   */
  public getStickValues(stick: number): JoystickValues {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    const axes: number[] = [];
    const buttons: boolean[] = [];
    const povs: number[] = [];

    const axesMap = this.m_joystickAxes.get(stick);
    if (axesMap) {
      for (let i = 0; i < this.getStickAxisCount(stick); i++) {
        axes.push(axesMap.get(i) || 0);
      }
    }

    const buttonsSet = this.m_joystickButtons.get(stick);
    if (buttonsSet) {
      for (let i = 1; i <= this.getStickButtonCount(stick); i++) {
        buttons.push(buttonsSet.has(i));
      }
    }

    const povsMap = this.m_joystickPOVs.get(stick);
    if (povsMap) {
      for (let i = 0; i < this.getStickPOVCount(stick); i++) {
        povs.push(povsMap.get(i) || JoystickPOVDirection.kCenter);
      }
    }

    return { axes, buttons, povs };
  }

  /**
   * Set the joystick values.
   *
   * @param joystickIndex The joystick index
   * @param axes The joystick axes values
   * @param buttons The joystick button values
   * @param povs The joystick POV values
   */
  public setJoystickValues(joystickIndex: number, axes: number[], buttons: boolean[], povs: number[]): void {
    if (joystickIndex < 0 || joystickIndex >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${joystickIndex}`);
    }

    // Set joystick axes
    const axesMap = this.m_joystickAxes.get(joystickIndex) || new Map();
    for (let i = 0; i < axes.length; i++) {
      axesMap.set(i, axes[i]);
    }
    this.m_joystickAxes.set(joystickIndex, axesMap);
    this.m_joystickAxisCounts.set(joystickIndex, axes.length);

    // Set joystick buttons
    const buttonsSet = this.m_joystickButtons.get(joystickIndex) || new Set();
    buttonsSet.clear();
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i]) {
        buttonsSet.add(i + 1);
      }
    }
    this.m_joystickButtons.set(joystickIndex, buttonsSet);
    this.m_joystickButtonCounts.set(joystickIndex, buttons.length);

    // Set joystick POVs
    const povsMap = this.m_joystickPOVs.get(joystickIndex) || new Map();
    for (let i = 0; i < povs.length; i++) {
      povsMap.set(i, povs[i]);
    }
    this.m_joystickPOVs.set(joystickIndex, povsMap);
    this.m_joystickPOVCounts.set(joystickIndex, povs.length);

    this.m_newControlData = true;
  }

  /**
   * Set the joystick description.
   *
   * @param stick The joystick index
   * @param isXbox Whether the joystick is an Xbox controller
   * @param type The joystick type
   * @param name The joystick name
   * @param axisCount The number of axes
   * @param buttonCount The number of buttons
   * @param povCount The number of POVs
   */
  public setJoystickDescription(stick: number, isXbox: boolean, type: number, name: string, axisCount: number, buttonCount: number, povCount: number): void {
    if (stick < 0 || stick >= CustomPortDriverStation.MAX_JOYSTICKS) {
      throw new Error(`Joystick index out of range: ${stick}`);
    }

    this.m_joystickIsXbox.set(stick, isXbox);
    this.m_joystickTypes.set(stick, type);
    this.m_joystickDescriptions.set(stick, name);
    this.m_joystickAxisCounts.set(stick, axisCount);
    this.m_joystickButtonCounts.set(stick, buttonCount);
    this.m_joystickPOVCounts.set(stick, povCount);
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
   * Set the match info.
   *
   * @param matchInfo The match info
   */
  public setMatchInfo(matchInfo: MatchInfo): void {
    this.m_matchInfo = matchInfo;
  }
}
