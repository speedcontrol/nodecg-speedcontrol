export namespace Alert {
  interface Dialog extends Window {
    openDialog: (
      opts: { name: string, data?: { [k: string ]: unknown }, func?: (confirm: boolean) => void }
    ) => void;
  }
}
