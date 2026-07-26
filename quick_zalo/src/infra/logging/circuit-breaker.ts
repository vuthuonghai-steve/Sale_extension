import type { CircuitState, CircuitBreakerMetrics } from '../../shared/types/evlog.types';

export class LoggingCircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private timestamps: number[] = [];
  private readonly maxCallsPerSec: number;
  private readonly windowMs: number = 1000;
  private trippedCount: number = 0;
  private lastTrippedAt: string | null = null;
  private hasWarnedThisTrip: boolean = false;

  constructor(maxCallsPerSec: number = 30) {
    this.maxCallsPerSec = maxCallsPerSec;
  }

  /**
   * Records a log attempt and checks if execution is allowed.
   * Returns true if allowed, false if blocked by Circuit Breaker.
   */
  public allowCall(now: number = Date.now()): boolean {
    // Clean up timestamps outside 1s window
    this.timestamps = this.timestamps.filter((ts) => now - ts <= this.windowMs);

    if (this.timestamps.length >= this.maxCallsPerSec) {
      if (this.state === 'CLOSED') {
        this.state = 'OPEN';
        this.trippedCount++;
        this.lastTrippedAt = new Date(now).toISOString();
        if (!this.hasWarnedThisTrip) {
          console.warn(
            `[Evlog Circuit Breaker] TRIPPED: Log rate exceeded ${this.maxCallsPerSec} calls/sec limit. Suppressing log emission.`
          );
          this.hasWarnedThisTrip = true;
        }
      }
      return false;
    }

    // Rate is below threshold
    if (this.state === 'OPEN') {
      this.state = 'CLOSED';
      this.hasWarnedThisTrip = false;
      console.info('[Evlog Circuit Breaker] RESET: Log rate returned to normal.');
    }

    this.timestamps.push(now);
    return true;
  }

  public getState(): CircuitState {
    // Refresh window status
    const now = Date.now();
    this.timestamps = this.timestamps.filter((ts) => now - ts <= this.windowMs);
    if (this.state === 'OPEN' && this.timestamps.length < this.maxCallsPerSec) {
      this.state = 'CLOSED';
      this.hasWarnedThisTrip = false;
    }
    return this.state;
  }

  public getMetrics(): CircuitBreakerMetrics {
    const now = Date.now();
    const activeTimestamps = this.timestamps.filter((ts) => now - ts <= this.windowMs);
    return {
      state: this.state,
      currentRate: activeTimestamps.length,
      trippedCount: this.trippedCount,
      lastTrippedAt: this.lastTrippedAt,
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.timestamps = [];
    this.hasWarnedThisTrip = false;
  }
}
