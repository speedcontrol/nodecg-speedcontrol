# Schedule Formatting

**If you were developing bundles that relied on this bundle before v1.x was released, please check [Migrating from v0.9 to v1.x](Migrating-from-v0.9-to-v1.x.md).**

Speedcontrol supports importing schedules from [Horaro](https://horaro.org/). How you format your schedules is somewhat flexible, but here is some information if you have issues.


## Default run information that can be imported

On top of the automatic importing of the estimate, the setup time and the scheduled time (which is the same on all Horaro schedules), the other information of the run can be formatted differently for different schedules. All of this information is *technically* optional, but you might want the game name at least!

- **Game**: The name of the game being ran; this can be a Markdown link to the leaderboard on [speedrun.com](https://www.speedrun.com) to aid getting correct information on import.
- **Game (Twitch)**: You probably don't need this but it's available if you need to override it; the name of the game being ran *in the Twitch directory* which is sometimes different.
- **Category**: The category name for the run.
- **System**: The system the run is being done on.
- **Region**: The region the copy of the game being ran on was released in.
- **Released**: A generic string that can store when the game is released; if you use this, probably just stick to the year.
- **Players**: The player or a list of players involved in this run. Check the *Players* section below for more information.


## Players

This part is a bit complicated, but hang tight, hopefully it will all make sense soon! There are some examples below to help you out. In Speedcontrol, runs have `teams`, and they have `players`. For a simple 1 player run, you have 1 team with 1 player, but if you have races, or co-op, or even co-op races, you can do that!

- **Separators**: If you have no co-op runs in your schedule, feel free to use a comma'd (`,`) list for your players, and select the `Comma (,) [No Teams]` option for *Split Players* when you import the schedule. If you *do* have co-op runs, you will need to separate your teams using `vs` or `vs.`, separate the players within those teams with commas (`,`) and select the `vs/vs. [Teams]` option for *Split Players* when you import the schedule.
- **Links**: You can use Markdown links for the players that link to a social media page of theirs (usually Twitch), which will be used to help the import; if [speedrun.com](https://www.speedrun.com) lookup is enabled, this will be queried for information too.
- **Country Code**: You cannot currectly set this yourself on the import, but if you have [speedrun.com](https://www.speedrun.com) lookup enabled, it will attempt to get this for you.
- **Team Names**: Not used commonly, but still supported; you can give your teams names that are shown in the dashboard and you could use on a layout if you wanted to. To do this, you need to put `TEAM_NAME: ` before the players in the team, where `TEAM_NAME` is what you want to name that team.

You can use a mix of no links/links and no team name/team name safely, if they are only needed for certain players/runs.

### Examples
- **1 Player**:
  -  (without link) `btrim`
  -  (with link) `[btrim](https://twitch.tv/btrim)`
- **Race (with vs. separation)**:
  - (without links) `btrim vs. charleon`
  - (with links) `[btrim](https://twitch.tv/btrim) vs. [charleon](https://twitch.tv/sethcharleon)`
- **Co-op/Race (with comma separation)**:
  - (without links) `btrim, charleon`
  - (with links) `[btrim](https://twitch.tv/btrim), [charleon](https://twitch.tv/sethcharleon)`
- **Co-op Race**:
  - (without links) `btrim, charleon vs. zoton2, zephyyrr`
  - (with links) `[btrim](https://twitch.tv/btrim), [charleon](https://twitch.tv/sethcharleon) vs. [zoton2](https://twitch.tv/zoton2), [zephyyrr](http://twitch.tv/zephyyrr)`
- **Co-op Race with Team Names**: 
  - (without links) `Mickeyvania: btrim, charleon vs. GTAHorns: zoton2, zephyyrr`
  - (with links) `Mickeyvania: [btrim](https://twitch.tv/btrim), [charleon](https://twitch.tv/sethcharleon) vs. GTAHorns: [zoton2](https://twitch.tv/zoton2), [zephyyrr](http://twitch.tv/zephyyrr)`


## Schedule Examples

If you need any good examples of schedules that use correct formatting, here are some:
- [ESA Summer 2018 (Stream One)](https://horaro.org/esa/2018-one) (has a mix of single player, races and co-op runs)
- [ESA Movember](https://horaro.org/esa/2018-movember) (has only single player runs)