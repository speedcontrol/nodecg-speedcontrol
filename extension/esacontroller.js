'use strict';

var app = require('express')();
var request = require('request');
var _nodecg;

function register_api(nodecg) {
    app.get("/speedcontrol/timers", function(req, res) {
        var result = []
        nodecg.readReplicant("runDataActiveRunRunnerList").forEach(function(runner, i) {
            result[i] = {
                name: runner.names.international,
                status: "running"
            };
        });

        //Get all finished players
        nodecg.readReplicant("finishedTimers").forEach(function(timer, i) {
            if (timer.time != '00:00:00')
                result[i].status = "finished";
        })

        res.status(200).json(result);
    });

    app.put("/speedcontrol/timer/start", function(req, res) {
        nodecg.sendMessage("start_run");
        res.status(200).json(true);
    });

    app.put("/speedcontrol/timer/:id/split", function(req, res) {
        nodecg.sendMessage("split_timer", req.params.id);
        res.status(200).json(true);
    });

    app.put("/speedcontrol/timer/reset", function(req, res) {
        nodecg.sendMessage("reset_run");
        res.status(200).json(true);
    });

    var activeRunStartTime = nodecg.Replicant('activeRunStartTime', {defaultValue: 0});

    nodecg.listenFor("runStarted", "nodecg-speedcontrol", function(message) {
        activeRunStartTime.value = getTimeStamp();
    });

    nodecg.listenFor("runEnded", "nodecg-speedcontrol", function(message) {
        var data = {
                event:"run-ended",
                game: nodecg.readReplicant("runDataActiveRun").game,
                category: nodecg.readReplicant("runDataActiveRun").category,
                console: nodecg.readReplicant("runDataActiveRun").console,
                players: nodecg.readReplicant("runDataActiveRunRunnerList"),
                time: nodecg.readReplicant("stopwatches")[0].time,
                start: nodecg.readReplicant("activeRunStartTime"),
                end: getTimeStamp()
            }

        nodecg.log.info(JSON.stringify(data));
        publish(data);
    });

    nodecg.mount(app);
}

function getTimeStamp() {
    return Date.now()/1000;
}

function publish(event) {
    if (_nodecg.bundleConfig.api.hooks) {
        _nodecg.bundleConfig.api.hooks.forEach(function(sub) {
            request.post(sub, {json: event, timeout: 1500}, function(err) {
                if (err) {
                    _nodecg.log.error(
                        "Error publishing event " + event.event + " to " + sub + ".", 
                        err);
                }
            })
        });
    }
}

module.exports = function (nodecg) {
    _nodecg = nodecg;
    
    if (typeof(nodecg.bundleConfig) !== 'undefined' && 
        typeof(nodecg.bundleConfig.api) !== 'undefined' && 
        nodecg.bundleConfig.api.enable) {
        register_api(nodecg)
    }
}
