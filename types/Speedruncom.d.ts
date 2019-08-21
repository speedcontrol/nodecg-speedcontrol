// Not everything but the relevant things for us so far.
export interface UserData {
  location: {
    country: {
      code: string;
    };
  } | null;
  twitch: {
    uri: string;
  } | null;
}
