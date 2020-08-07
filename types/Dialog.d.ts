export interface Dialog extends Element {
  open: () => void;
  close: () => void;
  _updateClosingReasonConfirmed: (confirm?: boolean) => void;
}
