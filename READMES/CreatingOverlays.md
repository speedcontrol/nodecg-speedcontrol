# Creating New Overlays

So! You have some basic template files in your speedcontrol directory, but you want to 
make some custom overlays for your Marathon! All overlays are created with HTML, which 
is a prerequisite to create a customized look & feel. If you don't know HTML, know that 
you can still switch out all the pictures in graphics/images to change the look of the overlay
somewhat.

A rule of thumb would be to do one overlay page per aspectratio and use, for instance:
* 2 Player Race, 4:3 aspect ratio gamefeeds
* Single Player, 4:3 aspect ratio gamefeed
* Intermission screen (provided with speedcontrol, with custom functionality)
* 3 Player race, 3:2 aspect ratio gamefeeds

## If you want to add a new overlay..
Start by creating a new HTML file in `nodecg-speedcontrol/graphics`, then
in `nodecg-speedcontrol/package.json` you need to add a new entry to
the "graphics:[]" area. If it looked like this before:
```
"graphics": [
    {
        "file": "Intermission.html",
        "width": 1280,
        "height": 720
    }
]
```
and we added a "Single_4_3.html" overlay to graphics/, it will then look like this:
```
"graphics": [
    {
        "file": "Intermission.html",
        "width": 1280,
        "height": 720
    },
    {
        "file": "Single_4_3.html",
        "width": 1280,
        "height": 720
    }
]
```
!!Please note that you will need to restart the server everytime you add a new overlay, otherwise you will not be able to access it by URL!!

## What your overlay HAS to contain

```
<html data-sceneid="SCENEID">
<head>
    <link href="css/common.css" rel="stylesheet"/>
    <script src="components/gsap/src/minified/TweenMax.min.js"></script>
    <script src="components/jquery/dist/jquery.min.js"></script>
    <script src="js/speedcontrol.js"></script>
    <script src="js/editmode.js"></script>
    <script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
    <link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/themes/cupertino/jquery-ui.css" />
</head>
<body>
<div id="window-container">
</div>
</body>
</html>
```

Above describes a fully viable overlay, only that it's well.. blank! but there are a couple of things we need to bring to
light even here.
```
<html data-sceneid="SCENEID">
```
the `html` head NEEDS to contain `data-sceneid` for any changes in edit mode to be saved. the data-sceneid MUST
correspond to the HTML overlay filename, minus the html. So for instance, if the Html file is `Single_3_2.html`
the tag should look like this: `<html data-sceneid="Single_3_2">`, NO exceptions.

The `<div id="window-container"></div>` is mandatory as well, which is the top container of your overlay.
It will contain the background that you'll choose, and is also responsible for the resolution of the overlay.
Please refer to `.window-container` in `common.css`

### common.css
the `<link href="css/common.css" rel="stylesheet"/>` links in the common.css file which is where you should define
the look & feel of every component that will be reused in the overlay. For instance in the default package the player
panels are split up like this:

```
<div id="player1Container" class="playerContainer positionable">
    <div class="runnerLogo">
        <img class="twitchLogo" src="/graphics/nodecg-speedcontrol/images/twitchlogo.png">
    </div>
    <div class="runnerInfo"> </div>
</div>
```
And you'll be able to locate `.playerContainer` in the `common.css` file. So in every overlay you want a player panel
in you should paste above code. If you want two playerpanels just paste the code twice between `<div id="window-container">` and the corresponding `</div>`.
Please be adviced that the top container, in this case the div with id="player1container" must have a uniqe id, so if you want more than 1 player container
(nameplate), you should copy, paste, and then alter the ID's of the rest to e.g `player2container`, `player3container`, etc. This applies for everything 
that might have more than one instance, e.g Gamefeeds, Race finishtimers and Player Nameplates.

### speedcontrol.js

the `speedcontrol.js` file contains all the logic for dynamically filling your fields with stuff for the currently
active run. It also handles logic such as animations (display twitch logo, animate the switch of text). Without
this include your overlay will not be dynamic at all. A table of what `speedcontrol.js` updates is found here below:

### Notable classes/id's for which content will be altered dynamically by speedcontrol
**class="runnerInfo"**:
for every div with class = "runnerinfo", speedcontrol will subsitute the html inside with the player
names / twitch handles. If there is a 4 player race going on, the first found class of .runnerInfo will take the first
player's nick, the second found will take the second player in the race, and so forth, which means that the following:
```
<div class="runnerInfo" id="runnerinfo1"></div>
<div class="runnerInfo" id="runnerinfo2"></div>
<div class="runnerInfo" id="runnerinfo3"></div>
<div class="runnerInfo" id="runnerinfo4"></div>
```
would be suited for a 4 player race. If a single player run would be active from the dashboard, speedcontrol would only substitute the text
in the FIRST of the above `div`s.

**id="timer"**
As we only are interested in one timer, the element tagged with `id="timer"` will be dynamically updated
with the current time. The timer is started and stopped from the dashboard

**id="runInformationGameEstimate"**
As we only have one estimate per run, the element tagged with `id="runInformationGameEstimate"` will be filled
with the estimated time to complete the run. This estimate is held per run and updates whenever you choose a new run
as active from the dashboard

**id="runInformationGameEstimate"**
As we only have one estimate per run, the element tagged with `id="runInformationGameEstimate"` will be filled
with the estimated time to complete the run. This estimate is held per run and updates whenever you choose a new run
as active from the dashboard

**class="runnerTimerFinishedContainer"**
Every element tagged with `class="runnerTimerFinished` will be hidden by default. When a specific player finishes
triggable through the timer panel dashboard, this content will show, along with the finishtime of said player. This
element should ONLY be used for overlays with more than 1 Player

**class="runnerTimerFinished"**
For every element tagged with `class="runnerTimerFinished"`, speedcontrol will update this field when a specific player
finishes his run. The content switch is triggered from the dashboard when the button for said player is pressed in the
timer dashboard panel. The content is by default nothing, but when triggered, it will contain the final time for the
player, e.g `00:01:36`, 1 mintue, 36 seconds. The element with this tag SHOULD ONLY be contained in an element
with `class="runnerTimerFinishedContainer"`, otherwise the text will be visible all the time

**id="runInformationGameSystem"**
As we only have one System (e.g SNES, NES) per run, the element tagged with `id="runInformationGameSystem"` will be filled
with the system for the run. This information is held per run and updates whenever you choose a new run
becomes active from the dashboard

**id="runInformationGameCategory"**
As we only have one Category (e.g Any%, 100%) per run, the element tagged with `id="runInformationGameCategory"` will be filled
with the category for the run. This information is held per run and updates whenever you choose a new run
becomes active from the dashboard

**id="runInformationGameName"**
As we only have one Game name per run (e.g Castlevania, Metroid) per run, the element tagged with `id="runInformationGameName"` will be filled
with the game name for the run. This information is held per run and updates whenever you choose a new run
becomes active from the dashboard

**class="twitchLogo"**
In the current speedcontrol overlays, every playerpanel has a twitch logo `<img>`attached to it. When it's time
to display the Twitch info for a player, `.runnerInfo` is exchanged for their twitch handle, and every element
with the tag `class="twitchLogo"` will fade in (previously invisible).

Also please note that the rest of the includes are mandatory as well.

As a final note, if you want to refer to an image in a css-file (as a background, or as an image in the html), you should 
use the following path: `/graphics/nodecg-speedcontrol/images/<image>`
e.g:  `<img class="twitchLogo" src="/graphics/nodecg-speedcontrol/images/twitchlogo.png">`
