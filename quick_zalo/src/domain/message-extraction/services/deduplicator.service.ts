/**
 * Deduplicator for Zalo messages.
 * Prevents re-extracting duplicate messages when Zalo virtual scrolling unmounts/remounts items.
 */
export class MessageDeduplicator {
  private seenIds = new Set<string>();
  private maxCapacity: number;

  constructor(maxCapacity = 1000) {
    this.maxCapacity = maxCapacity;
  }

  /**
   * Generates a deterministic hash for a message if no DOM ID is available.
   */
  public generateHash(conversation: string, sender: string, timestamp: string, text: string): string {
    const rawStr = `${conversation}::${sender}::${timestamp}::${text.trim()}`;
    let hash = 0;
    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `msg_hash_${Math.abs(hash).toString(36)}`;
  }

  public isDuplicate(id: string): boolean {
    return this.seenIds.has(id);
  }

  public markSeen(id: string): void {
    if (this.seenIds.size >= this.maxCapacity) {
      // Remove oldest item (first item in Set iterator)
      const oldest = this.seenIds.values().next().value;
      if (oldest !== undefined) {
        this.seenIds.delete(oldest);
      }
    }
    this.seenIds.add(id);
  }

  public clear(): void {
    this.seenIds.clear();
  }

  public get size(): number {
    return this.seenIds.size;
  }
}
