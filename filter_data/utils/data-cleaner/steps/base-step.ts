import type { ICleaningStep, CleaningOptions } from '../types';

/**
 * Base abstract class cho các bước xử lý dữ liệu trong Pipeline
 */
export abstract class BaseCleaningStep<TIn = any, TOut = any> implements ICleaningStep<TIn, TOut> {
  public abstract readonly name: string;
  public enabled: boolean = true;

  /**
   * Phương thức thực thi bước xử lý. Logic chi tiết sẽ được ghi đè ở các lớp con kế thừa.
   */
  public abstract execute(input: TIn, options?: CleaningOptions): TOut | Promise<TOut>;

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }
}
