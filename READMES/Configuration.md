# Configuration

Speedcontrol can be used without any configuration, but you will need to do this to get most features to work, such as Twitch integration.

We use the normal [NodeCG bundle configuration](https://nodecg.com/tutorial-bundle-configuration.html) so see that page for some basic details on where the configuration file should go. *tl;dr:* put a JSON file called `nodecg-speedcontrol.json` in your NodeCG installation's `cfg` folder.

If you haven't, I would recommend installing [nodecg-cli](https://github.com/nodecg/nodecg-cli), then you can do either do `nodecg defaultconfig` in the bundle's directory or `nodecg defaultconfig nodecg-speedcontrol` in the NodeCG installation folder and this will create a default configuration file in the correct place with *some* of the settings you can configure already partially filled out, although you will still need to tweak this. See below for what can go in this file in more detail.

As normal with NodeCG, you will need to restart your instance of the NodeCG server when you change the config for them to be applied.

If you are experienced you can also check out the [configschema.json here](../configschema.json).

Below is an example configuration file contents with everything that is available (*do **not** copy this and put it in directly without any modifications; it won't work, sorry*):

```
{
	"twitch": {
		"enable": true,
		"clientID": "CLIENT_ID",
		"clientSecret": "CLIENT_SECRET",
		"redirectURI": "http://localhost:9090/nodecg-speedcontrol/twitchauth",
		"ffzIntegration": false,
		"streamTitle": "Game: {{game}} - Category: {{category}} - Players: {{players}}",
		"streamDefaultGame": "Games + Demos"
	},
	"schedule": {
		"defaultURL": "https://horaro.org/event/schedule",
		"ignoreGamesWhileImporting": ["Setup"],
		"disableSpeedrunComLookup": false,
		"customData": [
			{
				"name": "Game (Short)",
				"key": "gameShort"
			}
		]
	}
}
```


## Breakdown

### Twitch

```
"twitch": {
	"enable": true,
	"clientID": "CLIENT_ID",
	"clientSecret": "CLIENT_SECRET",
	"redirectURI": "http://localhost:9090/nodecg-speedcontrol/twitchauth",
	"ffzIntegration": false,
	"streamTitle": "Game: {{game}} - Category: {{category}} - Players: {{players}}",
	"streamDefaultGame": "Games + Demos"
}
```

This is the part where the Twitch integration configuration is set up. Make sure `enable` is true (it defaults to false), and then you will need to [create a Twitch API app yourself from their developer site](https://glass.twitch.tv/console/apps/create) and put in the supplied client ID and client secret. The redirect URI should be the same as the one above unless you are **not** running your NodeCG server locally and/or you changed the port it uses.

- `streamTitle` is a string that specifies what the title will be updated to when a run is switched. There are some wildcards as seen above that will be replaced with the relevant data if they're specified. Leave it blank if you don't want to have the title updated.
- `streamDefaultGame` is the game in the Twitch directory that will be used if the game name from your schedule cannot be found in the directory.

FrankerFaceZ integration can also be enabled with `ffzIntegration`, this will make it so people who use the browser extension see the runner(s) as a "featured" channel for easy following, and if enabled on your channel, will also add their FrankerFaceZ emoticons for use during their run (you will need to ask the devs of the extension to enable this for you).

Once the Twitch integration settings are fully set up and your NodeCG server has been (re)started, you will see a "Connect with Twitch" button on the dashboard, which can be used to authorise nodecg-speedcontrol with Twitch. Currently, you must login with the channel you wish to have the information updated for.

### Schedule

```
"schedule": {
	"defaultURL": "https://horaro.org/event/schedule",
	"ignoreGamesWhileImporting": ["Setup"],
	"disableSpeedrunComLookup": false,
	"customData": [
		{
			"name": "Game (Short)",
			"key": "gameShort"
		}
	]
}
```

- `defaultURL` is a URL to the schedule on Horaro that will be pre-filled on the dashboard; usually you will only be using your setup for 1 marathon so this means you don't need to keep entering it every time you want to do a (re)import.
- `ignoreGamesWhileImporting` is an array of strings of games on your schedule that will be ignored on import; for example you may have setup blocks you don't want importing. This does partial matches ("Setup Block" will be matched by "Setup").
 - `disableSpeedrunComLookup` is a boolean (defaults to false) that can be enabled, which will skip the speedrun.com look-ups during schedule import; by default the import will try to find the runner's Twitch username and country from speedrun.com, but if you do not need this you can disable it to speed up the import.
- `customData` (*for advanced users*) is an array of objects; this is for adding custom data to the run data on import. Once set here, you will be able to select an appropriate column on import for where this data is stored in your schedule. All of this is stored within an objected called `customData` within the run's data object.