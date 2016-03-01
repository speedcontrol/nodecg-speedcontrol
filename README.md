# Speedcontrol

## Introduction

Speedcontrol is a nodecg bundle developed for the speedrunning scene which helps the people organizing the stream for marathons greatly by automating tasks
that would before would have meant manual work for people working with the overlay / stream side of things. Features include, but are not limited to:
* Twitch Integration (Upon starting a new run it automatically changes the played game on twitch). You can also specify and update the stream title directly from the dashboard! this way you won't ahve any need to keep a twitch window open for managing stream title / game played
* Horaro schedule import; paste a horaro schedule link and press import, and VOILAH! There will be no need to manually change any text fields on the overlay at all, Estimates, runners, game information will be pulled from horaro and put into a local database, so the only thing you'd need to do is press "Play next game" to update all the information on the overlay
* Optionally you can add runs manually which comes in two flavors; 
  1. The first alternative is to use an automatic sync with speedrun.com. All information is pulled from speedrun.com, which means when you add a runnername and choose it based on the runners speedrun.com name, you automatically get all the information such as twitch link, etc. This also works for games, getting the correct name, and cathegories for said game.
  2. Add games and runners by using free text (manual input for runner names and their twitch handles, if speedrun.com integration is not preferred)
* Support for custom animations; in Pre-esa marathon we faded in an animated finish-flag with the finish-time whenever a person in the race finished. Also a twitchicon faded in and the runner name was exchanged to his twitchhandle every now and then (look at pre-esa twitch vods ( https://www.youtube.com/playlist?list=PLkd2f6JAHslJPSQ5a9zYL09Ie-LugT8eB)  for reference).
* Once the schedule is improted from horaro, you can drag around the run items as you'd like, to reposition runs in the list/ remove runs from the list, in case there are any schedule updates.
* Everything is handled from a dashboard that runs in google chrome by surfing to http://localhost:9090, and it can also be accessible from external computers if you give other co-hosts your IP (this has not been tested yet though, and might mean further configration steps to your nodecg instance)
* Timer is built into the dashboard, and contains separate split-buttons for all runners, dynamically changing if a 2, 3 or 4p race is currently playing, to remove the need of a third party timer like LiveSplit, providing a tailormade interface having online marathons in mind
* All Items on the overlay is fully configurable during run-time, but should really be configured before the marathon, which means that you can change positions of the game-capture cutout of the background, moving timers, moving player nameplates, game information, etc, etc.
* Oh no! Runner X and Runner Y nameplates are under the wrong gamefeed! No problem, the "Player Layout" element of speedcontrol lets you click and drag the player to the correct gamefeed.

## Installation (including installation of NodeCG)

There are two prerequisites to get SpeedControl and NodeCG working.
* Download and install git (https://git-scm.com/)
* Download and install nodejs (v 4.2.4 or later) (https://nodejs.org/)
* Make a folder anywhere named nodecg (or whatever you want)
*In the actual folder, rightclick and choose “open git bash”

To install NodeCG: type, in this order: 
```
‘npm install nodecg-cli -g’
’nodecg setup’
‘npm install’ 
‘npm install -g bower’
‘bower install’
```

for the tech-savy, know that ’nodecg setup’ runs ’git clone’ under the hood, which means that the ’nodecg setup’ command needs to be executed from a fresh folder not containing anything.

To install speedcontrol, do the following:
In the prompt, type 
```
‘nodecg install charleon/nodecg-speedcontrol’
```

Whenever you want to start NodeCG open the git bash prompt in the nodecg folder and type `nodecg start` (or `node index.js`). You can minimize the prompt if you'd like but it has to be running for NodeCG to work. If you get tired of doing this each time you want to start the server, you can make a shortcut to nodejs.exe in the nodejs installation folder and then in the properties of the shortcut, throw in the full path to nodecg/index.js. This will enable you to start the server with just a doubleclick!

The above step set up a local server on your computer so you can now test it out! either in your browser (Chrome is the only one that gives the CORRECT result), or in xSplit or OBS For OBS you need the CLR Browser Plugin, but the latest xSplit version already has support to add web url:s using the "Add page URL.." option. 

If I make an update to speedcontrol, or whenever you want to be sure you have the latest version installed, open the git bash window in `nodecg/bundles/nodecg-speedcontrol` and type in “git pull” to fetch all the newest changes! (yes, it’s that easy)

## bundle configuration
in nodecg/cfg create a nodecg-speedcontrol.json file optionally and fill with the following:
```
{
    "live": true,
    "enableTwitchApi": true,
    "user": <twitchchannel>
}
```

If "live" is true, editmode divs are stripped from layouts to make it more clean and give better performance, and certain buttons on the dashboard will be disabled that should not be pressed when a marathon is going on. 

If "enableTwitchApi": true is defined, automatical and manual sync to your configured user can be used
from the Stream Control dashboard panel, otherwise this panel doesn't do anything!

"user": <twitchchannel> must be defined if "enableTwitchApi" is defined, otherwise bundle doesn't know which
user to update. e.g: "user": sethcharleon

## Instructional Videos / Introduction

https://www.youtube.com/watch?v=K7jTpFYiWNA&list=PLUCcl7X553EBMHRQWTmHwkX3z2QszIOD-

## Used at marathons
[Pre-ESA Marathon](https://www.youtube.com/watch?v=uQbREedGbhU&list=PLkd2f6JAHslJPSQ5a9zYL09Ie-LugT8eB)

[BSG Monthly #1](http://www.twitch.tv/nlg_organisation/v/51152532)

### Credits
Developed by [Charleon](https://twitter.com/CharleonChan)

Contributions by:
- btrim
- With suggestions and feedback from the speedrunning community <3

