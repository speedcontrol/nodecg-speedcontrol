# nodecg-speedcontrol

![Screenshot](README-screenshot.png)

*This is a bundle for [NodeCG](https://nodecg.com/); if you do not understand what that is, we advise you read their website first for more information.*

nodecg-speedcontrol, usually known as just "Speedcontrol", is a bundle for the [NodeCG](https://nodecg.com/) broadcast graphics framework/application developed for automating tasks for speedrunning marathons, mainly changing information on overlays and updating the Twitch information.

Some basic information:
- Import schedules from [Horaro](https://horaro.org/).
- By default, can store information on the run and the players, but can also be customised to store more if needed by advanced users.
- Automatically change Twitch title and/or game directory if needed.
- Automatically feature the current player(s) on the [FrankerFaceZ](https://www.frankerfacez.com/) featured channels function below the stream.
- Has an inbuilt timer (powered by [livesplit-core](https://github.com/LiveSplit/livesplit-core)); no need to have a seperate application open.
- Support for some donations trackers can be added with extra bundles (see below).

This bundle doesn't come with any graphics, you will need to create them yourself in another bundle. We currently have no READMEs for this but you can check out [speedcontrol-simpletext](https://github.com/speedcontrol/speedcontrol-simpletext) for an simple example bundle.

## Installation

You will need [Node.js](https://nodejs.org) (10.x LTS tested) and [git](https://git-scm.com/) installed to install NodeCG, then see the [NodeCG documentation](http://nodecg.com/) on how to install that. I also suggest installing `nodecg-cli`; information on that is also on the documentation just linked.

- `nodecg install speedcontrol/nodecg-speedcontrol` to install the latest version of nodecg-speedcontrol

This bundle can run without any extra configuration, but it's needed to use all of the functionality. Please see [Configuration.md](READMES/Configuration.md) for more information.

### tl;dr installation

Install [Node.js](https://nodejs.org) (10.x LTS tested) and [git](https://git-scm.com/), then make a folder anywhere and open a command prompt/shell/bash window, then run these commands in order:

```
npm install bower -g
npm install nodecg-cli -g
nodecg setup
nodecg install speedcontrol/nodecg-speedcontrol
nodecg start
```

## Extra Support Bundles

Alongside the main bundle, there are some extra bundles that we maintain that you may also want to use for speedrunning marathons. See their GitHub pages for more detailed information on how to use them. Be warned they are somewhat undocumented as of now.

To easily install: `nodecg install speedcontrol/BUNDLE-NAME`
- [speedcontrol-tiltify](https://github.com/speedcontrol/speedcontrol-tiltify): Adds a frequently updating donation total amount for a Tiltify campaign you can use in layouts.
- [speedcontrol-srcomtracker](https://github.com/speedcontrol/speedcontrol-srcomtracker): Adds frequently updating donation total/goals/bidwars and messages for new donations for a marathon on [speedrun.com](https://www.speedrun.com) if they are enabled, that you can use in your layouts.

## Where has this bundle been used before?

- All [European Speedrunner Assembly](https://www.esamarathon.com/) marathons starting from the Pre-ESA Marathon 2016, including the ESA ran Dreamhack speedrunning events in Sweden
- All [GTA Marathons](https://www.twitch.tv/gtamarathon) starting from GTA Marathon 2016
- [SpeedSouls Charity Marathon 2017 and 2018](https://www.twitch.tv/speedsouls)
- [Themeathon Pre-Marathon 2018](https://www.twitch.tv/themeathon)
- Several [Voltathon](https://www.twitch.tv/voltagegg) marathons
- Several [DegenDash](https://www.twitch.tv/degendash) marathons
- Some marathons on [The Fast Force](https://www.twitch.tv/thefastforce) Twitch channel
- [A Race Against Time 3](https://www.twitch.tv/araceagainsttime) marathon
- [Power Up With Pride: Winter Pride 2018](https://www.twitch.tv/powerupwithpride) marathon

## Authors/Contributors

Originally developed by Charleon, now mainly developed by zoton2.

With help from:
- btrim
- Zephyyrr
- Planks

## Contribution/Development

The `master` branch will always be the most recent stable release, while all development work is done in the `dev` branch; if you want to use experimental unfinished features or contribute, use that branch.

If you need to report an issue, you can [do that on GitHub](https://github.com/speedcontrol/nodecg-speedcontrol/issues).

Feel free to raise an issue/Pull Request if you have used our bundle(s) for a marathon and would like to be linked above.