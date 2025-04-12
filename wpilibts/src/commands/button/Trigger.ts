import { Command } from '../Command';
import { CommandScheduler } from '../CommandScheduler';

/**
 * This class provides an easy way to link commands to conditions.
 *
 * It is very easy to link a condition to a command. For instance, you could link the condition that
 * the robot has a ball to a command that shoots the ball.
 *
 * This class is a base for the Button class, for using joystick buttons to trigger commands.
 */
export class Trigger {
  private m_condition: () => boolean;
  private m_pressedLast: boolean = false;

  /**
   * Creates a new trigger based on the given condition.
   *
   * @param condition The condition that determines whether the trigger is active
   */
  constructor(condition: () => boolean = () => false) {
    this.m_condition = condition;
    CommandScheduler.getInstance().registerButton(this.poll.bind(this));
  }

  /**
   * Returns whether the trigger is active.
   *
   * @return True if the trigger is active
   */
  public get(): boolean {
    return this.m_condition();
  }

  /**
   * Binds a command to start when the trigger becomes active.
   *
   * @param command The command to start
   * @return This trigger, for chaining
   */
  public whenActive(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (pressed && !pressedLast) {
        command.schedule();
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Binds a command to start when the trigger becomes inactive.
   *
   * @param command The command to start
   * @return This trigger, for chaining
   */
  public whenInactive(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (!pressed && pressedLast) {
        command.schedule();
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Binds a command to start when the trigger changes state.
   *
   * @param command The command to start
   * @return This trigger, for chaining
   */
  public toggleWhenActive(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (pressed && !pressedLast) {
        if (command.isScheduled()) {
          command.cancel();
        } else {
          command.schedule();
        }
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Binds a command to run while the trigger is active.
   *
   * @param command The command to run
   * @return This trigger, for chaining
   */
  public whileActiveContinous(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (pressed) {
        command.schedule();
      } else if (pressedLast) {
        command.cancel();
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Binds a command to run once when the trigger becomes active, and then be canceled when it becomes inactive.
   *
   * @param command The command to run
   * @return This trigger, for chaining
   */
  public whileActiveOnce(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (pressed && !pressedLast) {
        command.schedule();
      } else if (!pressed && pressedLast) {
        command.cancel();
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Binds a command to be canceled when the trigger becomes active.
   *
   * @param command The command to cancel
   * @return This trigger, for chaining
   */
  public cancelWhenActive(command: Command): Trigger {
    let pressedLast = false;

    CommandScheduler.getInstance().registerButton(() => {
      const pressed = this.get();

      if (pressed && !pressedLast) {
        command.cancel();
      }

      pressedLast = pressed;
    });

    return this;
  }

  /**
   * Composes this trigger with another trigger, returning a new trigger that is active when both
   * triggers are active.
   *
   * @param trigger The trigger to compose with
   * @return A new trigger that is active when both triggers are active
   */
  public and(trigger: Trigger): Trigger {
    return new Trigger(() => this.get() && trigger.get());
  }

  /**
   * Composes this trigger with another trigger, returning a new trigger that is active when either
   * trigger is active.
   *
   * @param trigger The trigger to compose with
   * @return A new trigger that is active when either trigger is active
   */
  public or(trigger: Trigger): Trigger {
    return new Trigger(() => this.get() || trigger.get());
  }

  /**
   * Creates a new trigger that is active when this trigger is inactive.
   *
   * @return A new trigger that is active when this trigger is inactive
   */
  public negate(): Trigger {
    return new Trigger(() => !this.get());
  }

  /**
   * Polls this trigger. If the trigger state has changed, the appropriate command will be scheduled.
   */
  private poll(): void {
    const pressed = this.get();

    if (pressed && !this.m_pressedLast) {
      // Trigger has just become active
    } else if (!pressed && this.m_pressedLast) {
      // Trigger has just become inactive
    }

    this.m_pressedLast = pressed;
  }
}
