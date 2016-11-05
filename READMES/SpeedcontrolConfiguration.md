# Configuration

There are a couple of features in speedcontrol that needs predefined configuration to work.
This README will go through how to create the configuration and how it should look like.

## Creating the configuration file

Firstly, make sure that the nodecg server is not running, you will need to restart it otherwise to load
the speedcontrol configuration.

In your nodecg root folder, locate the `cfg` folder and navigate inside. Create a nodecg-speedcontrol.json file here
which will contain your information. Be wary that the filename NEEDS to be exactly this, otherwise configuration won't work.
Some people has for instance forgotten to disable the windows function to hide filenames, so their configurationfiles was actually 
named the erroneous name of "nodecg-speedcontrol.json.txt". The file should contain the following:

```
{
    "live": true,
    "enableTwitchApi": true,
    "user": "<twitchchannel>",
	"streamTitle": "Game: {{game}} - Category: {{category}} - Players: {{players}}",
	"defaultGame": "Retro"
}
```

If `"live": true` is defined, editmode divs are stripped from layouts to make it more clean and give better performance, and certain buttons on the dashboard will be disabled that should not be pressed when a marathon is going on. Before you start the actual marathon, 
it's adviced that you add this configuration.

If `"enableTwitchApi": true` is defined, automatical and manual sync to your configured user can be used from the Stream Control dashboard panel, otherwise this panel doesn't do anything!

"user": must be defined if "enableTwitchApi" is defined, otherwise bundle doesn't know which user to update. e.g: `"user": "sethcharleon"`

"streamtitle": Set this if you want speedcontrol to update your title on twitch, {{game}} {{category}} and {{players}} are all replaced with data from the current run

"defaultGame": This is used if the twitch game name isn't found on speedrun.com. It's important you always use a directory game on twitch - Retro is a good catch all.