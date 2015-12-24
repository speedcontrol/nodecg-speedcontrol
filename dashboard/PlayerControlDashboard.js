'use strict';

// JQuery selectors..
var $panel = $bundle.filter('#player-control');
var $addRunButton = $('#playerControlAddRunButton');
var $removeRunsButton = $('#playerControlRemoveRunsButton');
var $randomizeRunsButton =$('#playerControlRandomizeRunsButton');
var $addPlayerButton = $('#playerControlAddPlayerButton');
var $estimateInputField = $('#playerControlEstimate');
var $panelLayout = $('#player-control');

// Local variables..
// Used to keep track of data in a http response from speedrun.com
var cachedRunnerSearch = [];
var cachedRunner = [];
var cachedGameSearch = undefined;
var cachedGame = undefined;
var cachedGameCathegories = undefined;

var runnerNumberIterator = 1;
var runnerContainerHTML = $("#player-control-run-container").html();

// Initialize replicants we will use
var runDataArrayReplicant = nodecg.Replicant("runDataArray");
runDataArrayReplicant.on("change", function (oldValue, newValue) {

});

var runDataLastIDReplicant = nodecg.Replicant("runDataLastID");
runDataLastIDReplicant.on("change", function (oldValue, newValue) {
    if(typeof newValue === 'undefined') {
        runDataLastIDReplicant.value = 1;
    }
});

var runDataActiveRunReplicant = nodecg.Replicant("runDataActiveRun");
runDataActiveRunReplicant.on("change", function (oldValue, newValue) {
});

// Initialize dashboard
playerControl_InitializeFieldAutoCompletion();
playerControl_InitializeElements();
playerControl_ClearAllFields();

// Used for input field validation (the "nice" tooltips you get when something is wrong
$.verify({
    hideErrorOnChange: true,
    debug: false,
    beforeSubmit: function(form, result) {
        // Happens when you click the "add run" button. If something is wrong then we don't create e new run
        if(result != false) {
            var runData = playerControl_CreateRunData();
            runData.game = $('#playerControlGame').val();
            runData.estimate = $('#playerControlEstimate').val();
            runData.category = $('#playerControlCategory').val();
            runData.system = $('#playerControlSystem').val();
            runData.region = $('#playerControlRegion').find('option:selected').val();

            // Go through all the player name input fields and lookup cached player data for each one,
            // should never fail.
            $('.playerControlRunnerClass').each(function () {
                var selectedRunner = $(this).val();
                var found = false;
                $.each(cachedRunner, function (i, v) {
                    if (v.names.international == selectedRunner && found != true) {
                        runData.players.push(v);
                        found = true;
                    }
                });
                if (found == false) {
                    console.error("Did not find cached player data when adding run. Should NEVER happen");
                }
            });

            playerControl_AddRun(runData);
            playerControl_ClearAllFields();
        }
        else {
        }
    }
});

// Empties all the fields of the form
function playerControl_ClearAllFields() {
    cachedRunnerSearch = [];
    cachedRunner = [];
    cachedGameSearch = undefined;
    cachedGame = undefined;
    cachedGameCathegories = undefined;
    runnerNumberIterator = 1;
    $('#playerControlGame').val("");
    $('#playerControlEstimate').val("");
    $('#playerControlCategory').val("");
    $('#playerControlSystem').val("");
    $("#player-control-run-container").html(runnerContainerHTML);
    playerControl_InitializePlayerElements();
}

// Called as a process when pushing the "add run" button
function playerControl_AddRun(runData) {
    if(typeof runDataArrayReplicant.value !== 'undefined') {
        var runContainer = runDataArrayReplicant.value;
        runData.runID = playerControl_GetSetLastID();
        runContainer.push(runData);
        runDataArrayReplicant.value = runContainer;
    }
    else {
        var runContainer = [];
        runData.runID = playerControl_GetSetLastID();
        runContainer.push(runData);
        runDataArrayReplicant.value = runContainer;
    }
}

// All the runs have a uniqe ID attached to them
function playerControl_GetSetLastID() {
    var runID = runDataLastIDReplicant.value;
    var runIDIncremented = Number(runDataLastIDReplicant.value);
    runIDIncremented++;
    runDataLastIDReplicant.value = runIDIncremented;
    return runID;
}

// Returns an empty run object
function playerControl_CreateRunData() {
    var theRun = {};
    theRun.players = [];
    theRun.game = "";
    theRun.estimate = "";
    theRun.system = "";
    theRun.region= "";
    theRun.category = "";
    return theRun;
}

// Function that sets up autocompletion
function playerControl_InitializeFieldAutoCompletion() {
    $addRunButton = $('#playerControlAddRunButton');
    $panelLayout = $('#player-control');

    $( "#playerControlGame" ).autocomplete({
        source: function( request, response ) {
            var urlRequest = "http://www.speedrun.com/api/v1/games?name=" + request.term;
            $.ajax({
                url: urlRequest,
                dataType: "jsonp",
                data: {
                    q: request.term
                },
                success: function( data ) {
                    cachedGameSearch = data;
                    var result = data;
                    var gameArray = [];
                    for(var i = 0; i < result.data.length; i++) {
                        gameArray.push(result.data[i].names.international);
                    }
                    response( gameArray );
                }
            });
        },
        minLength: 3,
        delay: 500,
        select: function( event, ui ) {
            $.each(cachedGameSearch.data, function(i, v) {
                if (v.names.international == ui.item.label) {
                    cachedGame = v;
                    var urlRequest = "http://www.speedrun.com/api/v1/games/" + v.id + "/categories";
                    $.ajax({
                        url: urlRequest,
                        dataType: "jsonp",
                        data: {
                            q: '{"some":"json"}'
                        },
                        success: function( data ) {
                            cachedGameCathegories = data;
                            var cathegoryArray = [];
                            for(var i = 0; i < cachedGameCathegories.data.length; i++) {
                                cathegoryArray.push(cachedGameCathegories.data[i].name);
                            }
                            $( "#playerControlCategory" ).autocomplete({
                                source: cathegoryArray
                            });
                        }
                    });
                }
            });
        },
        open: function() {
            $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
        },
        close: function() {
            $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
        }
    });
}

// Initializes logic for buttons, fields, and validation
function playerControl_InitializeElements() {
    $addRunButton.button({});
    $removeRunsButton.button({});;
    $randomizeRunsButton.button({});
    $estimateInputField = $('#playerControlEstimate');
    $( "#playerControlRegion" ).selectmenu();
    $randomizeRunsButton = $('#playerControlRandomizeRunsButton');
    $removeRunsButton = $('#playerControlRemoveRunsButton');

    $removeRunsButton.click(function() {
        if(confirm("Really remove all runs?")) {
            runDataArrayReplicant.value = undefined;
            runDataLastIDReplicant.value = undefined;
            runDataActiveRunReplicant.value = undefined;
        }
    });

    $randomizeRunsButton.click(function() {
        for(var i = 0; i < 10; i++) {
            var runData = playerControl_CreateRunData();
            var numRunners = Math.floor(Math.random() * 4) + 1;
            var players = [];
            var runnerNames = ["Charleon", "Grukk", "Edenal", "Planks", "Therio", "Thiefbug", "kaizer", "Morningstar", "Kallepluffs", "010_Vargas", "Xemnas10"];
            var gameNames = ["Castlevania", "Megaman", "Megaman X", "Castlevania: Aria Of Sorrow", "Castle of Illusion Starring Donald duck and Mickey Mouse", "Undertale", "Halo", "World of Warcraft", "Minecraft", "Metal Gear Solid"];
            var categories = ["100%", "Any%", "All Powerups", "Any% Glitchless", "100% Glitchless", "All Keys"];
            var systems = ["NES", "SNES", "SMS", "Playstation", "Playstation 2", "XBOX", "XBOXOne", "Amiga", "PC"];

            for(var j = 0; j < numRunners; j++) {
                var player = {};
                player.names = {};
                player.names.international = runnerNames[Math.floor(Math.random() * runnerNames.length)];
                player.twitch = {};
                player.twitch.uri = "http://www.twitch.tv/" + player.names.international+"Chan";
                players.push(player);
            }

            runData.game = gameNames[Math.floor(Math.random() * gameNames.length)];
            runData.estimate = "01:45";
            runData.category = categories[Math.floor(Math.random() * categories.length)];
            runData.system = systems[Math.floor(Math.random() * systems.length)];;
            runData.region = "Japan";
            $.each(players,function(index, runner) {
                runData.players.push(runner);
            });
            playerControl_AddRun(runData);
        }
    });
    $estimateInputField.on('input',function(e){
        if($(this).val().length == 4) {
            var formattedString = $(this).val().substr(0,2) + ":" + $(this).val().substr(2,3)
            $(this).val(formattedString);
        }
    });

    $.verify.addRules({
        runnerValidation: function(r) {
            var foundPlayer = jQuery.grep(cachedRunner, function( a ) {
                return a.names.international == r.field.context.value;
            });

            if(foundPlayer.length > 0) {
                return true;
            }

            var urlRequest = "http://www.speedrun.com/api/v1/users?name=" + r.field.context.value;
            $.ajax({
                url: urlRequest,
                dataType: "jsonp",
                data: {
                    q: ""
                },
                success: function( players ) {
                    r.prompt(r.field, "Checking user on Speedrun.com..", "blue");
                    cachedRunnerSearch = players;
                    var playerFound = "Player not found on Speedrun.com! please enter a valid user";
                    for(var i = 0; i < players.data.length; i++) {
                        if (players.data[i].names.international == r.field.context.value) {
                            playerFound = true;
                            cachedRunner.push(players.data[i]);
                        }
                    }
                    r.callback(playerFound);
                }
            });
        }
    });
}

function playerControl_InitializePlayerElements() {
    $addPlayerButton = $('#playerControlAddPlayerButton');

    $addPlayerButton.button({
        icons: {
            primary: "ui-icon-plusthick"
        },
        text: false
    })

    $addPlayerButton.click(function() {
        runnerNumberIterator++;
        var newInputHtmlText = '<input id="playerControlRunner'+ runnerNumberIterator + '" class="playerControlRunnerClass" placeholder="Player ' + runnerNumberIterator +' Nick" data-validate="runnerValidation,required">';
        $('#runnerContainer').append(newInputHtmlText);

        $( "#playerControlRunner"+runnerNumberIterator).autocomplete({
            source: function( request, response ) {
                var urlRequest = "http://www.speedrun.com/api/v1/users?name=" + request.term;
                $.ajax({
                    url: urlRequest,
                    dataType: "jsonp",
                    data: {
                        q: request.term
                    },
                    success: function( data ) {
                        cachedRunnerSearch = data;
                        var result = data;
                        var playerArray = [];
                        for(var i = 0; i < result.data.length; i++) {
                            playerArray.push(result.data[i].names.international);
                        }
                        response( playerArray );
                    }
                });
            },
            minLength: 3,
            delay: 500,
            select: function( event, ui ) {
                $.each(cachedRunnerSearch.data, function(i, v) {
                    if (v.names.international == ui.item.label) {
                        cachedRunner.push(v);
                    }
                });
            },
            open: function() {
                $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
            },
            close: function() {
                $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
            }
        });
    });

    $( "#playerControlRunner1" ).autocomplete({
        source: function( request, response ) {
            var urlRequest = "http://www.speedrun.com/api/v1/users?name=" + request.term;
            $.ajax({
                url: urlRequest,
                dataType: "jsonp",
                data: {
                    q: request.term
                },
                success: function( data ) {
                    cachedRunnerSearch = data;
                    var result = data;
                    var playerArray = [];
                    for(var i = 0; i < result.data.length; i++) {
                        playerArray.push(result.data[i].names.international);
                    }
                    response( playerArray );
                }
            });
        },
        minLength: 3,
        delay: 500,
        select: function( event, ui ) {
            $.each(cachedRunnerSearch.data, function(i, v) {
                if (v.names.international == ui.item.label) {
                    cachedRunner.push(v);
                }
            });
        },
        open: function() {
            $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
        },
        close: function() {
            $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
        }
    });
}
