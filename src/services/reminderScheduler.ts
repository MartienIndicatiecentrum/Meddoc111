import { emailService } from './emailService';

/**
 * Scheduler service for processing appointment reminders
 */
export class ReminderScheduler {
  private static instance: ReminderScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  public static getInstance(): ReminderScheduler {
    if (!ReminderScheduler.instance) {
      ReminderScheduler.instance = new ReminderScheduler();
    }
    return ReminderScheduler.instance;
  }

  /**
   * Start the reminder scheduler
   * @param intervalMinutes - How often to check for reminders (default: 5 minutes)
   */
  public start(intervalMinutes: number = 5): void {
    if (this.isRunning) {
      console.log('Reminder scheduler is already running');
      return;
    }

    console.log(`Starting reminder scheduler with ${intervalMinutes} minute intervals`);
    
    // Run immediately on start
    this.processReminders();
    
    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.processReminders();
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
  }

  /**
   * Stop the reminder scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Reminder scheduler stopped');
  }

  /**
   * Check if the scheduler is running
   */
  public getStatus(): { isRunning: boolean; intervalId: NodeJS.Timeout | null } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId
    };
  }

  /**
   * Process appointment reminders
   */
  private async processReminders(): Promise<void> {
    try {
      console.log('Processing appointment reminders...');
      await emailService.processAppointmentReminders();
      console.log('Appointment reminders processed successfully');
    } catch (error) {
      console.error('Error processing appointment reminders:', error);
    }
  }

  /**
   * Manually trigger reminder processing (for testing or manual runs)
   */
  public async triggerManualRun(): Promise<void> {
    console.log('Manually triggering reminder processing...');
    await this.processReminders();
  }
}

export const reminderScheduler = ReminderScheduler.getInstance();
