'use strict';
$(function () {
// JQuery selectors..
	var $addRunButton = $('#playerControlAddRunButton');
    var $removeRunsButton = $('#playerControlRemoveRunsButton');
    var $randomizeRunsButton = $('#playerControlRandomizeRunsButton');

// Initialize replicants we will use
    var runDataArrayReplicant = nodecg.Replicant("runDataArray");
	var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");

    var runDataLastIDReplicant = nodecg.Replicant("runDataLastID");
    runDataLastIDReplicant.on("change", function (newValue, oldValue) {
        if (typeof newValue === 'undefined') {
            runDataLastIDReplicant.value = 1;
        }
    });
	
	// Returns an empty run object
    function playerControl_CreateRunData() {
        var theRun = {};
        theRun.players = [];
		theRun.teams = [];
        theRun.game = "";
        theRun.estimate = "";
        theRun.system = "";
        theRun.region = "";
        theRun.category = "";
        return theRun;
    }
	
	// Initializes logic for buttons, fields, and validation
    function playerControl_InitializeElements() {
		$addRunButton.button({});
        $removeRunsButton.button({});
        $randomizeRunsButton.button({});
		
		$addRunButton.click(() => {
			nodecg.getDialog('run-info').querySelector('iframe').contentWindow.loadRun();
			nodecg.getDialog('run-info').open();
		});

        $removeRunsButton.click(function () {
            if (confirm("Really remove all runs?")) {
                runDataArrayReplicant.value = undefined;
                runDataLastIDReplicant.value = undefined;
                runDataActiveRunReplicant.value = undefined;
            }
        });

        $randomizeRunsButton.click(function () {
            var runs = [];
            var runID = runDataLastIDReplicant.value;
            for (var i = 0; i < 10; i++) {
                var runData = playerControl_CreateRunData();
                var numRunners = Math.floor(Math.random() * 4) + 1;
                var players = [];
                var runnerNames = ["Charleon", "Grukk", "Edenal", "Planks", "Therio", "Thiefbug", "kaizer", "Morningstar", "Kallepluffs", "010_Vargas", "Xemnas10"];
                var gameNames = ["Castlevania", "Megaman", "Megaman X", "Castlevania: Aria Of Sorrow", "Castle of Illusion Starring Donald duck and Mickey Mouse", "Undertale", "Halo", "World of Warcraft", "Minecraft", "Metal Gear Solid"];
                var categories = ["100%", "Any%", "All Powerups", "Any% Glitchless", "100% Glitchless", "All Keys"];
                var systems = ["NES", "SNES", "SMS", "Playstation", "Playstation 2", "XBOX", "XBOXOne", "Amiga", "PC"];

                for (var j = 0; j < numRunners; j++) {
                    var player = {};
                    player.names = {};
                    player.names.international = runnerNames[Math.floor(Math.random() * runnerNames.length)];
                    player.twitch = {};
                    player.twitch.uri = "https://www.twitch.tv/" + player.names.international + "Chan";
                    players.push(player);
                }

                runData.game = gameNames[Math.floor(Math.random() * gameNames.length)];
                runData.estimate = "01:45";
                runData.category = categories[Math.floor(Math.random() * categories.length)];
                runData.system = systems[Math.floor(Math.random() * systems.length)];
                runData.runID = runID;
                runData.region = "Japan";
                $.each(players, function (index, runner) {
                    runData.players.push(runner);
					runData.teams.push({"name":runner.names.international,"custom":false,"members":[runner]});
                });
				
                runs.push(runData);
                runID++;
				runDataLastIDReplicant.value = runID;
            }

            var runContainer = runDataArrayReplicant.value;
            runContainer = runs;
            runDataArrayReplicant.value = runContainer;

        });
    }

    // Initialize dashboard panel, only runs once
    playerControl_InitializeElements();

    if (nodecg.bundleConfig && (typeof nodecg.bundleConfig.live !== 'undefined' && nodecg.bundleConfig.live === true)) {
        $randomizeRunsButton.button({disabled: true});
    }
});
