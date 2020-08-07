import { RunData } from './RunData';

export namespace RunModification {
  type Mode = 'New' | 'EditActive' | 'EditOther' | 'Duplicate';

  interface Dialog extends Window {
    openDialog: (opts: { mode: Mode, runData?: RunData, prevID?: string }) => void;
  }
}
