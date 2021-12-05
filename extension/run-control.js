"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const lodash_1 = __importDefault(require("lodash"));
const ffz_ws_1 = require("./ffz-ws");
const srcom_api_1 = require("./srcom-api");
const timer_1 = require("./timer");
const twitch_api_1 = require("./twitch-api");
const events = __importStar(require("./util/events"));
const helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
/**
 * Used to update the replicant that stores ID references to previous/current/next runs.
 */
function changeSurroundingRuns() {
    let previous;
    let current;
    let next;
    if (!replicants_1.runDataActiveRun.value) {
        // No current run set, we must be at the start, only set that one.
        [next] = replicants_1.runDataArray.value;
    }
    else {
        current = replicants_1.runDataActiveRun.value; // Current will always be the active one.
        // Try to find currently set runs in the run data array.
        const currentIndex = (0, helpers_1.findRunIndexFromId)(current.id);
        const previousIndex = (0, helpers_1.findRunIndexFromId)(replicants_1.runDataActiveRunSurrounding.value.previous);
        const nextIndex = (0, helpers_1.findRunIndexFromId)(replicants_1.runDataActiveRunSurrounding.value.next);
        if (currentIndex >= 0) { // Found current run in array.
            if (currentIndex > 0) {
                [previous, , next] = replicants_1.runDataArray.value.slice(currentIndex - 1);
            }
            else { // We're at the start and can't splice -1.
                [, next] = replicants_1.runDataArray.value.slice(0);
            }
        }
        else if (previousIndex >= 0) { // Found previous run in array, use for reference.
            [previous, , next] = replicants_1.runDataArray.value.slice(previousIndex);
        }
        else if (nextIndex >= 0) { // Found next run in array, use for reference.
            [previous, , next] = replicants_1.runDataArray.value.slice(nextIndex - 2);
        }
    }
    replicants_1.runDataActiveRunSurrounding.value = {
        previous: (previous) ? previous.id : undefined,
        current: (current) ? current.id : undefined,
        next: (next) ? next.id : undefined,
    };
    nodecg.log.debug('[Run Control] Recalculated surrounding runs');
}
/**
 * Used to update the Twitch information, used by functions in this file.
 * @param runData Run Data object.
 */
function updateTwitchInformation(runData) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (!replicants_1.twitchAPIData.value.sync) {
            return false;
        }
        // Constructing Twitch title and game to send off.
        const status = (0, helpers_1.bundleConfig)().twitch.streamTitle
            .replace(new RegExp('{{game}}', 'g'), runData.game || '')
            .replace(new RegExp('{{players}}', 'g'), (0, helpers_1.formPlayerNamesStr)(runData))
            .replace(new RegExp('{{category}}', 'g'), runData.category || '');
        // Attempts to find the correct Twitch game directory.
        let { gameTwitch } = runData;
        if (!gameTwitch && runData.game) {
            const [, srcomGameTwitch] = yield (0, helpers_1.to)((0, srcom_api_1.searchForTwitchGame)(runData.game));
            gameTwitch = srcomGameTwitch || runData.game;
        }
        // TDO: Is this extra lookup needed if the next one just kinda does it anyway?
        if (gameTwitch) { // Verify game directory supplied exists on Twitch.
            gameTwitch = (_a = (yield (0, helpers_1.to)((0, twitch_api_1.verifyTwitchDir)(gameTwitch)))[1]) === null || _a === void 0 ? void 0 : _a.name;
        }
        (0, helpers_1.to)((0, twitch_api_1.updateChannelInfo)(status, gameTwitch || (0, helpers_1.bundleConfig)().twitch.streamDefaultGame));
        // Construct/send featured channels if enabled.
        if ((0, helpers_1.bundleConfig)().twitch.ffzIntegration) {
            (0, helpers_1.to)((0, ffz_ws_1.setChannels)((0, helpers_1.getTwitchChannels)(runData)));
        }
        return !gameTwitch;
    });
}
/**
 * Change the active run to the one specified if it exists.
 * @param id The unique ID of the run you wish to change to.
 */
function changeActiveRun(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (['running', 'paused'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            if (!id) {
                throw new Error('No run ID was supplied');
            }
            const runData = replicants_1.runDataArray.value.find((run) => run.id === id);
            if (!runData) {
                throw new Error(`Run with ID ${id} was not found`);
            }
            else {
                const noTwitchGame = yield updateTwitchInformation(runData);
                replicants_1.runDataActiveRun.value = (0, clone_1.default)(runData);
                (0, helpers_1.to)((0, timer_1.resetTimer)(true));
                nodecg.log.debug(`[Run Control] Active run changed to ${id}`);
                return noTwitchGame;
            }
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully change active run:', err);
            throw err;
        }
    });
}
/**
 * Deletes a run from the run data array.
 * @param id The unique ID of the run you wish to delete.
 */
function removeRun(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!id) {
                throw new Error('No run ID was supplied');
            }
            const runIndex = replicants_1.runDataArray.value.findIndex((run) => run.id === id);
            if (runIndex < 0) {
                throw new Error(`Run with ID ${id} was not found`);
            }
            else {
                replicants_1.runDataArray.value.splice(runIndex, 1);
                nodecg.log.debug(`[Run Control] Successfully removed run ${id}`);
                return;
            }
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully remove run:', err);
            throw err;
        }
    });
}
/**
 * Either edits a run (if we currently have it) or adds it.
 * @param runData Run Data object.
 * @param prevID ID of the run that this run will be inserted after if applicable.
 * @param twitch Whether to update the Twitch information as well.
 */
function modifyRun(runData, prevID, twitch = false) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Loops through data, removes any keys that are falsey.
            const data = lodash_1.default.pickBy(runData, lodash_1.default.identity);
            data.customData = lodash_1.default.pickBy(data.customData, lodash_1.default.identity);
            data.teams = data.teams.map((team) => {
                const teamData = lodash_1.default.pickBy(team, lodash_1.default.identity);
                teamData.players = teamData.players.map((player) => {
                    const playerData = lodash_1.default.pickBy(player, lodash_1.default.identity);
                    playerData.social = lodash_1.default.pickBy(playerData.social, lodash_1.default.identity);
                    playerData.customData = lodash_1.default.pickBy(playerData.customData, lodash_1.default.identity);
                    return playerData;
                });
                return teamData;
            });
            // Check all teams have players, if not throw an error.
            if (!data.teams.every((team) => !!team.players.length)) {
                throw new Error('Team(s) are missing player(s)');
            }
            // Check all players have names, if not throw an error.
            const allNamesAdded = data.teams.every((team) => (team.players.every((player) => !!player.name)));
            if (!allNamesAdded) {
                throw new Error('Player(s) are missing name(s)');
            }
            // If set as relay, set any missing indexes if needed. If the opposite, delete them.
            if (runData.relay) {
                data.teams = data.teams.map((team) => { var _a; return (Object.assign({ relayPlayerID: (_a = team.players[0]) === null || _a === void 0 ? void 0 : _a.id }, team)); });
            }
            else {
                for (const team of data.teams) {
                    delete team.relayPlayerID;
                }
            }
            // Verify and convert estimate.
            if (data.estimate) {
                if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    const ms = (0, helpers_1.timeStrToMS)(data.estimate);
                    data.estimate = (0, helpers_1.msToTimeStr)(ms);
                    data.estimateS = ms / 1000;
                }
                else { // Throw error if format is incorrect.
                    throw new Error('Estimate is in incorrect format');
                }
            }
            else {
                delete data.estimate;
                delete data.estimateS;
            }
            // Verify and convert setup time.
            if (data.setupTime) {
                if (data.setupTime.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    const ms = (0, helpers_1.timeStrToMS)(data.setupTime);
                    data.setupTime = (0, helpers_1.msToTimeStr)(ms);
                    data.setupTimeS = ms / 1000;
                }
                else { // Throw error if format is incorrect.
                    throw new Error('Setup time is in incorrect format');
                }
            }
            else {
                delete data.setupTime;
                delete data.setupTimeS;
            }
            const index = (0, helpers_1.findRunIndexFromId)(data.id);
            if (index >= 0) { // Run already exists, edit it.
                if (replicants_1.runDataActiveRun.value && data.id === replicants_1.runDataActiveRun.value.id) {
                    replicants_1.runDataActiveRun.value = (0, clone_1.default)(data);
                }
                replicants_1.runDataArray.value[index] = (0, clone_1.default)(data);
            }
            else { // Run is new, add it.
                const prevIndex = (0, helpers_1.findRunIndexFromId)(prevID);
                replicants_1.runDataArray.value.splice(prevIndex + 1 || replicants_1.runDataArray.value.length, 0, (0, clone_1.default)(data));
            }
            const noTwitchGame = (twitch) ? yield updateTwitchInformation(runData) : false;
            return noTwitchGame;
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully modify run:', err);
            throw err;
        }
    });
}
/**
 * Modifies the relay player ID of a team inside of a run.
 * @param runID ID of the run you wish to modify.
 * @param teamID ID of the team inside of the run you wish to modify.
 * @param playerID ID of the player you wish to set as the one currently playing.
 */
function modifyRelayPlayerID(runID, teamID, playerID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const run = (0, clone_1.default)(replicants_1.runDataArray.value.find((r) => r.id === runID));
            if (!run) {
                throw new Error(`Run with ID ${runID} was not found`);
            }
            if (!run.relay) {
                throw new Error(`Run with ID ${runID} is not set as a relay`);
            }
            const teamIndex = run.teams.findIndex((t) => t.id === teamID);
            if (teamIndex < 0) {
                throw new Error(`Team with ID ${runID} was not found`);
            }
            const player = run.teams[teamIndex].players.find((p) => p.id === playerID);
            if (!player) {
                throw new Error(`Player with ID ${playerID} was not found`);
            }
            run.teams[teamIndex].relayPlayerID = player.id;
            yield modifyRun(run);
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully modify relay player ID:', err);
            throw err;
        }
    });
}
/**
 * Removes the active run from the relevant replicant.
 */
function removeActiveRun() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (['running', 'paused'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            replicants_1.runDataActiveRun.value = undefined;
            (0, helpers_1.to)((0, timer_1.resetTimer)(true));
            nodecg.log.debug('[Run Control] Successfully removed active run');
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully remove active run:', err);
        }
    });
}
/**
 * Removes all runs in the array and the currently active run.
 */
function removeAllRuns() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (['running', 'paused'].includes(replicants_1.timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            replicants_1.runDataArray.value.length = 0;
            removeActiveRun();
            (0, helpers_1.to)((0, timer_1.resetTimer)(true));
            nodecg.log.debug('[Run Control] Successfully removed all runs');
        }
        catch (err) {
            nodecg.log.debug('[Run Control] Could not successfully remove all runs:', err);
            throw err;
        }
    });
}
// NodeCG messaging system.
nodecg.listenFor('changeActiveRun', (id, ack) => {
    changeActiveRun(id)
        .then((noTwitchGame) => (0, helpers_1.processAck)(ack, null, noTwitchGame))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('removeRun', (id, ack) => {
    removeRun(id)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('modifyRun', (data, ack) => {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then((noTwitchGame) => (0, helpers_1.processAck)(ack, null, noTwitchGame))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('modifyRelayPlayerID', (data, ack) => {
    modifyRelayPlayerID(data.runID, data.teamID, data.playerID)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('changeToNextRun', (data, ack) => {
    changeActiveRun(replicants_1.runDataActiveRunSurrounding.value.next)
        .then((noTwitchGame) => (0, helpers_1.processAck)(ack, null, noTwitchGame))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('returnToStart', (data, ack) => {
    removeActiveRun()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
nodecg.listenFor('removeAllRuns', (data, ack) => {
    removeAllRuns()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
// Our messaging system.
events.listenFor('changeActiveRun', (id, ack) => {
    changeActiveRun(id)
        .then((noTwitchGame) => {
        (0, helpers_1.processAck)(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('removeRun', (id, ack) => {
    removeRun(id)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('modifyRun', (data, ack) => {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then((noTwitchGame) => (0, helpers_1.processAck)(ack, null, noTwitchGame))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('modifyRelayPlayerID', (data, ack) => {
    modifyRelayPlayerID(data.runID, data.teamID, data.playerID)
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('changeToNextRun', (data, ack) => {
    changeActiveRun(replicants_1.runDataActiveRunSurrounding.value.next)
        .then((noTwitchGame) => {
        (0, helpers_1.processAck)(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('returnToStart', (data, ack) => {
    removeActiveRun()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
events.listenFor('removeAllRuns', (data, ack) => {
    removeAllRuns()
        .then(() => (0, helpers_1.processAck)(ack, null))
        .catch((err) => (0, helpers_1.processAck)(ack, err));
});
replicants_1.runDataActiveRun.on('change', changeSurroundingRuns);
replicants_1.runDataArray.on('change', changeSurroundingRuns);
