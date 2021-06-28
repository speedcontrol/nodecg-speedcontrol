# Schedule Formatting

## Table of Contents

- [General Information](#general-information)
- [Horaro](#horaro)
  - [Default run information that can be imported](#horaro-default-run-info)
  - [Players](#horaro-players)
    - [Examples](#horaro-players-examples)
  - [Custom Data](#horaro-custom-data)
  - [Schedule Examples](#horaro-schedule-examples)
- [Oengus](#oengus)
  - [Custom Data](#oengus-custom-data)


## General Information

Speedcontrol supports importing schedules from both [Horaro](https://horaro.org/) and [Oengus](https://oengus.io/). Oengus schedules are very easy to import, due to how the service is designed, but Horaro schedules need a little more work, although how you format them is still is somewhat flexible.

Below is some more information if you have issues.


## Horaro

The only data that will automatically be imported by the Horaro method is the estimate, the setup time and the scheduled time, as these are identical between all Horaro based schedules.

<a id="horaro-default-run-info"></a>
### Default run information that can be imported

Besides the above, all other information of the run can be formatted differently for different schedules. All of this information is *technically* optional, but you might want the game name at least! You will need to have the appropriate piece of data in a specific column.

- **Game**: The name of the game being ran; this can be a Markdown link to the leaderboard on [speedrun.com](https://www.speedrun.com) to aid getting correct information on import.
- **Game (Twitch)**: You probably don't need this but it's available if you need to override it; the name of the game being ran *in the Twitch directory* which is sometimes different.
- **Category**: The category name for the run.
- **System**: The system the run is being done on.
- **Region**: The region the copy of the game being ran on was released in.
- **Released**: A generic string that can store when the game is released; if you use this, probably just stick to the year.
- **Players**: The player or a list of players involved in this run. Check the *Players* section below for more information.

There is also another selectable information type when you import your Horaro schedules: **External ID**. This is not stored/editable in the normal way, but if you have a column in your schedule that has unique IDs for each run, select it here and re-imports will be a lot smoother. If you don't understand what this means, ignore it!

<a id="horaro-players"></a>
### Players

This part is a bit complicated, but hang tight, hopefully it will all make sense soon! There are some examples below to help you out. In Speedcontrol, runs have `teams`, and they have `players`. For a simple 1 player run, you have 1 team with 1 player, but if you have races, or co-op, or even co-op races, you can do that!

- **Separators**: If you have no co-op runs in your schedule, feel free to use a comma'd (`,`) list for your players, and select the `Comma (,) [No Teams]` option for *Split Players* when you import the schedule. If you *do* have co-op runs, you will need to separate your teams using `vs` or `vs.`, separate the players within those teams with commas (`,`) and select the `vs/vs. [Teams]` option for *Split Players* when you import the schedule.
- **Links**: You can use Markdown links for the players that link to a social media page of theirs (usually Twitch), which will be used to help the import; if [speedrun.com](https://www.speedrun.com) lookup is enabled, this will be queried for information too.
- **Twitch Channel**: If a player's name is also a link to their Twitch channel, that will be used to set the `social.twitch` property. Otherwise, if [speedrun.com](https://www.speedrun.com) lookup is enabled, this will be queried for it.
- **Country Code/Preferred Pronouns**: You cannot currently set these yourself on the import, but if you have [speedrun.com](https://www.speedrun.com) lookup enabled, it will attempt to get these for you.
- **Team Names**: Not used commonly, but still supported; you can give your teams names that are shown in the dashboard and you could use on a layout if you wanted to. To do this, you need to put `TEAM_NAME: ` before the players in the team, where `TEAM_NAME` is what you want to name that team.

You can use a mix of no links/links and no team name/team name safely, if they are only needed for certain players/runs.

<a id="horaro-players-examples"></a>
#### Examples

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

<a id="horaro-custom-data"></a>
### Custom Data

If you need to import any other columns that aren't fulfilled by the default, you can add columns that can then be added as "custom data" that will be stored inside of the run data. See the [relevant part of the configuration documentation](Configuration.md#custom-data) on how to add these and allow them to be selected in the dashboard.

<a id="horaro-schedule-examples"></a>
### Schedule Examples

If you need any good examples of schedules that use correct formatting, here are some:
- [ESA Summer 2018 (Stream One)](https://horaro.org/esa/2018-one) (has a mix of single player, races and co-op runs)
- [ESA Movember](https://horaro.org/esa/2018-movember) (has only single player runs)


## Oengus

Oengus, by design, is a lot simpler in regard to Horaro as the structure is specifically geared towards speedrun marathon usage, and all the player data is stored in their database so can easily be referenced.

The only option available when importing (and also available to set the default in the [configuration](Configuration.md#oengus-schedule)) is `Use Japanese names?` which will import the players using their Japanese names if available, instead of their international ones.

<a id="oengus-custom-data"></a>
### Custom Data

Custom data can also be used on Oengus, but slightly differently than Horaro.

The option to add custom data to a row is available on the `Manage schedule` page on Oengus, as a toggle called `Hide/Show custom data fields`. Toggle this on and every row will gain a freeform text entry box you can use.

For custom data to work with Speedcontrol, you must supply a JSON object, which will then be parsed and used to populate the `customData` property on the run data object.

For example,
```json
{"key":"value"}
```
would result in `customData.key` being available, which would be populated with a string of `value`. 

For compatibility reasons, and so you can edit them in the dashboard easier, all properties are converted to strings if not, including any nested object-likes.

All available custom data will be import regardless of your configuration, but for them to get user friendly names in certain parts of the Speedcontrol UI, you must also specify the name and key combination in the [configuration](Configuration.md#custom-data).
