# API Documentation: runData Object Structure

*Types available in [./src/types/RunData.d.ts](../../src/types/RunData.d.ts)*

Various places in this bundle store information in the format we refer to as the "`runData` object".


### Example object
```javascript
{
  game: "WarioWare: Smooth Moves",
  gameTwitch: "WarioWare: Smooth Moves",
  system: "Wii",
  region: "PAL",
  release: "2006",
  category: "Any%",
  estimate: "00:53:00",
  estimateS: 3180,
  setupTime: "00:10:00",
  setupTimeS: 600,
  scheduled: "2018-07-26T09:29:00+02:00",
  scheduledS: 1532590140,
  teams: [
    {
      name: "Mario",
      id: "f926048c-3527-4d2f-96f6-680b81bf06e6",
      players: [
        {
          name: "pastahelmetclarinet",
          id: "26a6dc65-7f39-4f33-a263-56be74bed783",
          teamID: "f926048c-3527-4d2f-96f6-680b81bf06e6",
          country: "de",
          pronouns: "He/Him",
          social: {
            twitch: "esamarathon"
          },
          customData: {
            otherData: "Some String"
          }
        }
      ]
    },
    {
      name: "Luigi",
      id: "18341eb2-eb45-4184-98f6-e74baafaf71a",
      players: [
        {
          name: "badmintondoughnuts",
          id: "5faa92a1-c3d2-4f4b-8d40-ce5c2ea7a67e",
          teamID: "18341eb2-eb45-4184-98f6-e74baafaf71a",
          country: "nl",
          pronouns: "She/Her",
          social: {
            twitch: "monstercat"
          },
          customData: {
            otherData: "Some String"
          }
        }
      ]
    }
  ],
  customData: {
    gameShort: "WW Smooth Moves"
  },
  id: "f926048c-3527-4d2f-96f6-680b81bf06e6"
}
```

***Note that any of the values below can be undefined, unless specifically mentioned.***

- `game` *[`string`]* The name of the game being ran.
- `gameTwitch` *[`string`]* The name of the game in the Twitch directory.
- `system` *[`string`]* The system/platform/console the run is being done on.
- `region` *[`string`]* Region the copy of the game is from.
- `release` *[`string`]* Stores information on when the game was released.
- `category` *[`string`]* Category that is being ran.
- `estimate` *[`string`]* Run estimate in a human readable string.
- `estimateS` *Number* Same as above but in seconds.
- `setupTime` *[`string`]* Run setup time (to be added to the end of the run) in a human readable string.
- `setupTimeS` *Number* Same as above but in seconds.
- `scheduled` *[`string`]* ISO 8601 timestamp for when the run is scheduled; for Horaro this will also have the timezone, but for Oengus it will always be in UTC.
- `scheduledS` *[`number`]* Same as above but as a unix timestamp in seconds.
- `teams` *[`array`[`object`]]* Teams that are doing this run. Length can be 0 (no teams/players), 1 (single player run or co-op) or 2 or more (race and/or co-op race); this will always be an array even if no teams are contained within it.
- `customData` *[`object`]* Contains keyed strings, with the key(s) from your configuration for custom data; this will always be an object even if no data is contained within it.
- `id` *[`string`]* Unique ID; will always be set.


### `teams` Array: `team` Object

The `teams` array will contain (if anything) "`team` objects".

- `name` *[`string`]* Custom name of the team, if one has been set.
- `id` *[`string`]* Unique ID.
- `players` *[`array`[`object`]]* Players in this team. Length could be 0 (but probably never), 1 (single player run or race, if there are more teams) or 2 or more (co-op and/or co-op race, if there are more teams).


### `players` Array: `player` Object

The `players` array in "`team` objects" will contain (if anything) "`player` objects".

- `name` *[`string`]* Name of the player.
- `id` *[`string`]* Unique player ID.
- `teamID` *[`string`]* Unique ID of the team this player is on.
- `country` *[`string`]* Country code of the country where this player is from, usually pulled from [speedrun.com](https://www.speedrun.com).
- `pronouns` *[`string`]* List of the player's pronouns, usually pulled from [speedrun.com](https://www.speedrun.com), and if so, can also be a comma separated list of each option they allow to be selected.
- `social` *[`object`]* Contains information on this player's social media references.
  - `twitch` *[`string`]* Username of this player on [twitch.tv](https://www.twitch.tv).
- `customData` *[`object`]* Contains keyed strings, with the key(s) from your configuration for *player based* custom data; this will always be an object even if no data is contained within it.
