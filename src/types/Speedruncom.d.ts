// Not everything but the relevant things for us so far.
export namespace Speedruncom {
  interface UserData {
    names: {
      international: string;
    };
    pronouns: string | null;
    location: {
      country: {
        code: string;
      };
    } | null;
    twitch: {
      uri: string;
    } | null;
    twitter: {
      uri: string;
    } | null;
  }

  interface GameData {
    names: {
      international: string;
      twitch: string | null;
    };
  }

  interface AjaxSearch {
    label: string;
    url: string;
    category: 'Games';
  }
}
