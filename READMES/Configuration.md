# Configuration

Speedcontrol can be used without an configuration, but you will need to do this to get most features to work, such as Twitch integration.

We use the normal [NodeCG bundle configuraiton](https://nodecg.com/tutorial-bundle-configuration.html) so see that page for some basic details on where the configuration file should go. *tl;dr:* put a JSON file called `nodecg-speedcontrol.json` in your NodeCG installation's `cfg` folder.

If you haven't, I would recommend installing [nodecg-cli](https://github.com/nodecg/nodecg-cli), then you can do either do `nodecg defaultconfig` in the bundle's directory or `nodecg defaultconfig nodecg-speedcontrol` in the NodeCG installation folder and this will create a default configuration file in the correct place with *some* of the settings you can configure already partially filled out, although you will still need to tweak this. See below for what can go in this file in more detail.

As normal with NodeCG, you will need to restart your instance of the NodeCG server when you change the config for them to be applied.

If you are experienced you can also check out the [configschema.json here](https://github.com/speedcontrol/nodecg-speedcontrol/blob/master/configschema.json).

Below is an example configuration file contents with everything that is available:

```
{
	"live": false,
	"twitch": {
		"enable": false,
		"clientID": "CLIENT_ID",
		"clientSecret": "CLIENT_SECRET",
		"redirectURI": "http://localhost:9090/nodecg-speedcontrol/twitchauth",
		"ffzIntegration": false,
		"streamTitle": "Game: {{game}} - Category: {{category}} - Players: {{players}}",
		"streamDefaultGame": "Retro"
	},
	"schedule": {
		"defaultURL": "https://horaro.org/event/schedule",
		"ignoreGamesWhileImporting": ["Setup"],
		"customData": [
			{
				"name": "Game (Short)",
				"key": "gameShort"
			}
		]
	},
	"tiltify": {
		"enable": false,
		"key": "API_KEY"
	},
	"speedrunComMarathon": {
		"enable": false,
		"slug": "SRC_SLUG"
	},
	"gaming4Good": {
		"enable": false,
		"twitchChannelID": "TWITCH_ID"
	},
	"api": {
		"enable": false,
		"sharedKey": "TWITCH_ID",
		"hooks": ["HOOK_URL"]
	}
}
```
