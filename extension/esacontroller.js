'use strict';

var app = require('express')();
var request = require('request');
var _nodecg;

function register_api(nodecg) {
    var speedcontrolRouter = require('express').Router();

    speedcontrolRouter.use(function(req, res, next) {
        if (req.get('API-Key') !== _nodecg.bundleConfig.api.sharedkey) {
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
        console.log(stopwatch);
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

    nodecg.listenFor("runStarted", "nodecg-speedcontrol", function(message) {
        activeRunStartTime.value = getTimeStamp();
    });

    nodecg.listenFor("runEnded", "nodecg-speedcontrol", function(message) {
        console.log(nodecg.readReplicant("runDataActiveRun"))
        var data = {
                event:"run-ended",
                game: nodecg.readReplicant("runDataActiveRun").game,
                category: nodecg.readReplicant("runDataActiveRun").category,
                console: nodecg.readReplicant("runDataActiveRun").console,
                teams: nodecg.readReplicant("runDataActiveRun").teams,
                players: nodecg.readReplicant("runDataActiveRun").players,
                time: nodecg.readReplicant("stopwatch").time,
                start: nodecg.readReplicant("activeRunStartTime"),
                end: getTimeStamp()
            }

        nodecg.log.info(JSON.stringify(data));
        publish(data);
    });

    app.use('/speedcontrol', speedcontrolRouter);
    nodecg.mount(app);
}



function getTimeStamp() {
    return Date.now()/1000;
}

function publish(event) {
    if (_nodecg.bundleConfig.api.hooks) {
        _nodecg.bundleConfig.api.hooks.forEach(function(sub) {
            request.post({
                    uri: sub, 
                    json: event, 
                    timeout: 1500,
                    headers: {
                        'API-Key': _nodecg.bundleConfig.api.sharedkey
                    }
                }, 
                function(err) {
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
