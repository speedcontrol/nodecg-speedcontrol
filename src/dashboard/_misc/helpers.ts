export default class Helpers {
  /**
   * Checks if number needs a 0 adding to the start and does so if needed.
   * @param num Number which you want to turn into a padded string.
   */
  static padTimeNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  /**
   * Converts a time string (HH:MM:SS) into milliseconds.
   * @param time Time string you wish to convert.
   */
  static timeStrToMS(time: string): number {
    const ts = time.split(':');
    if (ts.length === 2) {
      ts.unshift('00'); // Adds 0 hours if they are not specified.
    }
    return Date.UTC(1970, 0, 1, Number(ts[0]), Number(ts[1]), Number(ts[2]));
  }

  /**
   * Converts milliseconds into a time string (HH:MM:SS).
   * @param ms Milliseconds you wish to convert.
   */
  static msToTimeStr(ms: number): string {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${Helpers.padTimeNumber(hours)}:${Helpers.padTimeNumber(minutes)}:${Helpers.padTimeNumber(seconds)}`;
  }
}
