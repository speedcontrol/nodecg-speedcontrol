import { RunData } from './RunData';

export namespace RunModification {
  enum Mode {
    New = 'New',
    EditActive = 'EditActive',
    EditOther = 'EditOther',
    Duplicate = 'Duplicate',
  }

  interface Dialog extends Window {
    openDialog: (opts: { mode: Mode, runData?: RunData, prevID?: string }) => void;
  }
}
