export class TextSanitizer {
  public static removeHiddenChars(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\u00A0/g, ' ')
      .normalize('NFC');
  }

  public static cleanWhitespace(text: string): string {
    if (!text) return '';
    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const cleaned: string[] = [];
    for (const line of lines) {
      if (line || (cleaned.length > 0 && cleaned[cleaned.length - 1] !== '')) {
        cleaned.push(line);
      }
    }
    return cleaned.join('\n').trim();
  }

  public static stripUrlTracking(urlStr: string): string {
    if (!urlStr || (!urlStr.startsWith('http://') && !urlStr.startsWith('https://'))) {
      return urlStr;
    }
    try {
      const url = new URL(urlStr);
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_term',
        'utm_content',
        'fbclid',
        'gclid',
        'ref',
      ];
      for (const p of trackingParams) {
        url.searchParams.delete(p);
      }
      return url.toString();
    } catch {
      return urlStr;
    }
  }

  public static sanitize(text: string): string {
    return this.cleanWhitespace(this.removeHiddenChars(text));
  }
}
