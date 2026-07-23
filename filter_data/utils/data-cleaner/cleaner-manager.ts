import type {
  RawRecord,
  CleanRecord,
  CleaningOptions,
  CleaningReport,
  ICleaningStep,
  StepLog,
} from './types';

/**
 * DataCleanerManager - Core Manager / Orchestrator
 * Quản lý luồng xử lý và phối hợp các bước chuyển đổi dữ liệu từ thô (Raw) sang sạch (Clean).
 */
export class DataCleanerManager {
  private pipeline: ICleaningStep<any, any>[] = [];

  constructor(initialSteps: ICleaningStep<any, any>[] = []) {
    this.pipeline = initialSteps;
  }

  /**
   * Thêm một bước xử lý vào cuối pipeline
   */
  public addStep(step: ICleaningStep<any, any>): this {
    this.pipeline.push(step);
    return this;
  }

  /**
   * Xóa một bước xử lý khỏi pipeline theo tên
   */
  public removeStep(stepName: string): boolean {
    const initialLength = this.pipeline.length;
    this.pipeline = this.pipeline.filter((step) => step.name !== stepName);
    return this.pipeline.length < initialLength;
  }

  /**
   * Lấy danh sách các bước xử lý hiện tại
   */
  public getSteps(): readonly ICleaningStep<any, any>[] {
    return [...this.pipeline];
  }

  /**
   * Xóa toàn bộ pipeline
   */
  public clearSteps(): void {
    this.pipeline = [];
  }

  /**
   * Thực thi toàn bộ pipeline biến đổi dữ liệu thô thành dữ liệu sạch
   */
  public async process(
    rawData: RawRecord[],
    options: CleaningOptions = {}
  ): Promise<{ data: CleanRecord[]; report: CleaningReport }> {
    const startTime = performance.now();
    const stepLogs: StepLog[] = [];
    const errors: CleaningReport['errors'] = [];

    let currentData: any = rawData;
    const initialCount = rawData.length;

    for (const step of this.pipeline) {
      if (!step.enabled) continue;

      const stepStartTime = performance.now();
      const countBefore = Array.isArray(currentData) ? currentData.length : 0;

      try {
        currentData = await step.execute(currentData, options);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({
          stepName: step.name,
          error: errorMsg,
        });
      }

      const stepEndTime = performance.now();
      const countAfter = Array.isArray(currentData) ? currentData.length : 0;

      stepLogs.push({
        stepName: step.name,
        processedCount: countBefore,
        filteredCount: Math.max(0, countBefore - countAfter),
        executionTimeMs: Math.round(stepEndTime - stepStartTime),
      });
    }

    const endTime = performance.now();
    const finalData = Array.isArray(currentData) ? (currentData as CleanRecord[]) : [];

    const report: CleaningReport = {
      timestamp: new Date().toISOString(),
      totalInputRecords: initialCount,
      totalOutputRecords: finalData.length,
      droppedRecordsCount: Math.max(0, initialCount - finalData.length),
      totalExecutionTimeMs: Math.round(endTime - startTime),
      stepLogs,
      errors,
    };

    return {
      data: finalData,
      report,
    };
  }
}
