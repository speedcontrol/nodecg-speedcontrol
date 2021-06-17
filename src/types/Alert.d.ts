import { RunData } from './RunData';

export namespace Alert {
  type Name =
    'ImportConfirm' |
    'ReturnToStartConfirm' |
    'RemoveAllRunsConfirm' |
    'RemoveRunConfirm' |
    'TwitchLogoutConfirm' |
    'NoTwitchGame';

  interface Dialog extends Window {
    openDialog: (
      opts: { name: Name, data?: { runData?: RunData }, func?: (confirm: boolean) => void }
    ) => void;
  }
}
