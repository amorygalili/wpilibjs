import { Button } from './Button';
import { DriverStation, JoystickButtonType } from '../../DriverStation';

/**
 * A Button that gets its state from a joystick button.
 */
export class JoystickButton extends Button {
  private m_joystick: number;
  private m_buttonNumber: number;

  /**
   * Creates a joystick button for triggering commands.
   *
   * @param joystick The joystick number
   * @param buttonNumber The button number (starting at 1)
   */
  constructor(joystick: number, buttonNumber: number) {
    super();
    this.m_joystick = joystick;
    this.m_buttonNumber = buttonNumber;
  }

  /**
   * Gets the value of the joystick button.
   *
   * @return The value of the joystick button
   */
  public override get(): boolean {
    return DriverStation.getInstance().getStickButton(this.m_joystick, this.m_buttonNumber);
  }
}
