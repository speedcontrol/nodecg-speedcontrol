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
	"oauth": "<twitchoauth>",
	"enableFFZIntegration": true,
	"streamTitle": "Game: {{game}} - Category: {{category}} - Players: {{players}}",
	"defaultGame": "Retro",
	"defaultScheduleURL": "https://horaro.org/esa/2016",
	"ignoreGamesWhileImportingSchedule": ["Setup", "Restream"],
	"enableMarqueePanel": false
}
```

If `"live": true` is defined, editmode divs are stripped from layouts to make it more clean and give better performance, and certain buttons on the dashboard will be disabled that should not be pressed when a marathon is going on. Before you start the actual marathon, 
it's adviced that you add this configuration.

If `"enableTwitchApi": true` is defined, automatical and manual sync to your configured user can be used from the Stream Control dashboard panel, otherwise this panel doesn't do anything!

"user": must be defined if "enableTwitchApi" is defined, otherwise bundle doesn't know which user to update. e.g: `"user": "sethcharleon"`

"oauth": must be defined if "enableTwitchApi" is defined, otherwise the bundle won't have permission to update through the Twitch API. The OAuth has to be for the user specified above, and should have these scopes (otherwise errors may occur): channel_editor, user_read, chat_login, channel_commercial.

If `"enableFFZIntegration": true` is defined, you can automatically and manually sync Twitch channel names to the FrankerFaceZ service as "featured" channels, which will also allow you to use their FFZ emotes in the chat if you have asked an FFZ owner to enable this.

"streamtitle": Set this if you want speedcontrol to update your title on twitch, {{game}} {{category}} and {{players}} are all replaced with data from the current run

"defaultGame": This is used if the twitch game name isn't found on speedrun.com. It's important you always use a directory game on twitch - Retro is a good catch all.

"defaultScheduleURL": This will fill in the URL box in the "Horaro Schedule Import" panel with whatever schedule URL you set this too; you are usually only using one schedule for each marathon so having it pre-filled can be useful.

"ignoreGamesWhileImportingSchedule": This should be an array of strings of any game names on your schedule you do not want while importing. For example, if you have any setup buffers in your schedule, which has no reason to be shown on the layouts. This does partial matches; "Setup Block" will be matched by "Setup".

"enableMarqueePanel": If this is set to `false`, the options in the "Marquee Information" panel will be removed, if you don't have a marquee and don't want to confuse users. Defaults to `true`.