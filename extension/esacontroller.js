'use strict';

var app = require('express')();
var request = require('request');
var clone = require('clone');
var nodecg = require('./utils/nodecg-api-context').get();

if (typeof(nodecg.bundleConfig) !== 'undefined' && 
	typeof(nodecg.bundleConfig.api) !== 'undefined' && 
	nodecg.bundleConfig.api.enable) {
		register_api()
}

function register_api() {
	nodecg.log.info("Activating API.");
    var speedcontrolRouter = require('express').Router();

    speedcontrolRouter.use(function(req, res, next) {
        if (req.get('API-Key') !== nodecg.bundleConfig.api.sharedKey) {
            res.status(403).json("Invalid key.");
        } else {
            next();
        }
    });

    speedcontrolRouter.get("/timers", function(req, res) {
        var result = []
        nodecg.readReplicant("runDataActiveRun").teams.forEach(function(team, i) {
            result[i] = {
                name: team.name,
                status: "waiting"
            };
        });

        const stopwatch = nodecg.readReplicant('stopwatch')
        //nodecg.log.info(stopwatch);
        if (stopwatch.state == "running") {
            result.forEach(function(runner) {
                runner.status = "running";
            });
        }

        //Get all finished players
        nodecg.readReplicant("finishedTimers").forEach(function(timer, i) {
            if (timer.time != '00:00:00') {
                result.forEach(function(runner) {
                    if (runner.name == timer.name) {
                        runner.status = "finished";
                    }
                });
            }
                
        })

        res.status(200).json(result);
    });

    speedcontrolRouter.put("/timer/start", function(req, res) {
        nodecg.sendMessage("start_run");
        res.status(200).json(true);
    });

    speedcontrolRouter.put("/timer/:id/split", function(req, res) {
        nodecg.sendMessage("split_timer", req.params.id);
        res.status(200).json(true);
    });

    speedcontrolRouter.put("/timer/reset", function(req, res) {
        nodecg.sendMessage("reset_run");
        res.status(200).json(true);
    });

    var activeRunStartTime = nodecg.Replicant('activeRunStartTime', {defaultValue: 0});
    var lastrundata = nodecg.Replicant("esaRunDataLastRun", {defaultValue: undefined})

    nodecg.listenFor("splitRecording", "nodecg-speedcontrol", function(message) {
        activeRunStartTime.value = getTimeStamp();
        publish({
            event: "runStarted",
            data: getRunData(),
            oldrun: nodecg.readReplicant("esaRunDataLastRun")
		})
		lastrundata.value = undefined;
	});
	
	// Store the currently set run when the timer first starts, which we will use for the upload info.
	var stopwatch = nodecg.Replicant('stopwatch');
	stopwatch.on('change', (newVal, oldVal) => {
		if (!lastrundata.value && oldVal && oldVal.state === 'stopped' && newVal.state === 'running')
			lastrundata.value = clone(getRunData());
	});

    /*nodecg.listenFor("runEnded", "nodecg-speedcontrol", function(message) {
        nodecg.log.info(nodecg.readReplicant("runDataActiveRun"))
        var data = getRunData()
        lastrundata.value = clone(data);

        nodecg.log.info(JSON.stringify(data));
        publish({
            event: "runEnded",
            data: data
        });
    });*/

    app.use('/speedcontrol', speedcontrolRouter);
    nodecg.mount(app);
}

function getRunData() {
	// Some bad code to get the sponsored data if it exists.
	var runCustomData = nodecg.readReplicant("runDataActiveRun").customData;
	var sponsored = false;
	if (runCustomData && runCustomData.info && runCustomData.info.toLowerCase() === 'sponsored')
		sponsored = true;

    return {
        game: nodecg.readReplicant("runDataActiveRun").game,
        category: nodecg.readReplicant("runDataActiveRun").category,
        console: nodecg.readReplicant("runDataActiveRun").console,
        teams: nodecg.readReplicant("runDataActiveRun").teams,
		players: nodecg.readReplicant("runDataActiveRun").players,
		sponsored: sponsored,
        time: nodecg.readReplicant("stopwatch").time,
        start: nodecg.readReplicant("activeRunStartTime"),
        end: getTimeStamp()
    }
}

function getTimeStamp() {
    return Date.now()/1000;
}

function publish(event) {
    if (nodecg.bundleConfig.api.hooks) {
        nodecg.bundleConfig.api.hooks.forEach(function(sub) {
            request.post({
                    uri: sub, 
                    json: event, 
                    timeout: 1500,
                    headers: {
                        'API-Key': nodecg.bundleConfig.api.sharedKey
                    }
                }, 
                function(err) {
                    if (err) {
                        nodecg.log.error(
                            "Error publishing event " + event.event + " to " + sub + ".", 
                            err);
                }
            })
        });
    }
}