import { Button } from './Button';
import { DriverStation, JoystickPOVDirection } from '../../DriverStation';

/**
 * A Button that gets its state from a POV (hat) on a joystick.
 */
export class POVButton extends Button {
  private m_joystick: number;
  private m_pov: number;
  private m_angle: JoystickPOVDirection;

  /**
   * Creates a POV button for triggering commands.
   *
   * @param joystick The joystick number
   * @param angle The angle of the POV that triggers this button
   * @param pov The POV number (default: 0)
   */
  constructor(joystick: number, angle: JoystickPOVDirection, pov: number = 0) {
    super();
    this.m_joystick = joystick;
    this.m_pov = pov;
    this.m_angle = angle;
  }

  /**
   * Gets the value of the POV button.
   *
   * @return The value of the POV button
   */
  public override get(): boolean {
    return DriverStation.getInstance().getStickPOV(this.m_joystick, this.m_pov) === this.m_angle;
  }
}
