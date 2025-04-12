import { Command } from '../Command';
import { CommandScheduler } from '../CommandScheduler';
import { Trigger } from './Trigger';

/**
 * This class provides an easy way to link commands to inputs.
 *
 * It is very easy to link a button to a command. For instance, you could link the trigger button
 * of a joystick to a "score" command.
 *
 * This class represents a subclass of Trigger that is specifically aimed at buttons on a joystick.
 */
export abstract class Button extends Trigger {
  /**
   * Returns whether the button is pressed.
   *
   * @return True if the button is pressed
   */
  public abstract get(): boolean;

  /**
   * Binds a command to start when the button is pressed.
   *
   * @param command The command to start
   * @return This button, for chaining
   */
  public whenPressed(command: Command): Button {
    this.whenActive(command);
    return this;
  }

  /**
   * Binds a command to start when the button is released.
   *
   * @param command The command to start
   * @return This button, for chaining
   */
  public whenReleased(command: Command): Button {
    this.whenInactive(command);
    return this;
  }

  /**
   * Binds a command to start when the button is held.
   *
   * @param command The command to start
   * @return This button, for chaining
   */
  public whileHeld(command: Command): Button {
    this.whileActiveContinous(command);
    return this;
  }

  /**
   * Binds a command to start when the button is pressed and cancel when it is released.
   *
   * @param command The command to start
   * @return This button, for chaining
   */
  public toggleWhenPressed(command: Command): Button {
    this.toggleWhenActive(command);
    return this;
  }

  /**
   * Binds a command to cancel when the button is pressed.
   *
   * @param command The command to cancel
   * @return This button, for chaining
   */
  public cancelWhenPressed(command: Command): Button {
    this.cancelWhenActive(command);
    return this;
  }
}
