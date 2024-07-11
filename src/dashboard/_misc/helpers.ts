import { Alert } from "@nodecg-speedcontrol/types";

/**
 * Checks if number needs a 0 adding to the start and does so if needed.
 * @param num Number which you want to turn into a padded string.
 */
export function padTimeNumber(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Converts milliseconds into a time string (HH:MM:SS).
 * @param ms Milliseconds you wish to convert.
 */
export function msToTimeStr(ms: number): string {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${padTimeNumber(hours)
  }:${padTimeNumber(minutes)
  }:${padTimeNumber(seconds)}`;
}

/**
 * Check if a dialog is "loaded" or not (due to NodeCG v2.2.2 changes with lazy iframes).
 * If it's not, will quickly open and close it to load it.
 * @param name Name of dialog.
 */
export function checkDialog(name: string): Promise<void> {
  return new Promise<void>((res) => {
    const dialog = nodecg.getDialog(name);
    const iframe = dialog?.querySelector('iframe');
    if (iframe && dialog) {
      // We check if it's loaded or not if our custom "openDialog" function exists.
      const openDialog = (iframe.contentWindow as Alert.Dialog | null)?.openDialog;
      if (openDialog) {
        res();
      } else {
        iframe.addEventListener('load', () => {
          dialog.close();
          res();
        }, { once: true });
        dialog.open();
      }
    } else {
      res();
    }
  });
}

/**
 * Gets dialog's contentWindow based on name, if possible.
 * @param name Name of dialog.
 */
export function getDialog(name: string): Window | null {
  try {
    const dialog = nodecg.getDialog(name);
    const iframe = dialog?.querySelector('iframe')?.contentWindow || null;
    if (!iframe) {
      throw new Error('Could not find the iFrame');
    }
    return iframe;
  } catch (err) {
    nodecg.log.error(`getDialog could not successfully find dialog "${name}":`, err);
    // eslint-disable-next-line no-alert
    window.alert('Attempted to open a NodeCG dialog but failed (if you'
      + ' are using a standalone version of a dashboard panel, this is not yet supported).');
  }
  return null;
}
