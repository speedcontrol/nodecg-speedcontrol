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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const nodecg = nodecg_1.get();
const array = nodecg.Replicant('runDataArray');
const activeRun = nodecg.Replicant('runDataActiveRun');
const activeRunSurr = nodecg.Replicant('runDataActiveRunSurrounding');
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: persistenceInterval not typed yet
const timer = nodecg.Replicant('timer', { persistenceInterval: 1000 });
const twitchAPIData = nodecg.Replicant('twitchAPIData');
/**
 * Used to update the replicant that stores ID references to previous/current/next runs.
 */
function changeSurroundingRuns() {
    let previous;
    let current;
    let next;
    if (!activeRun.value) {
        // No current run set, we must be at the start, only set that one.
        [next] = array.value;
    }
    else {
        current = activeRun.value; // Current will always be the active one.
        // Try to find currently set runs in the run data array.
        const currentIndex = helpers_1.findRunIndexFromId(current.id);
        const previousIndex = helpers_1.findRunIndexFromId(activeRunSurr.value.previous);
        const nextIndex = helpers_1.findRunIndexFromId(activeRunSurr.value.next);
        if (currentIndex >= 0) { // Found current run in array.
            if (currentIndex > 0) {
                [previous, , next] = array.value.slice(currentIndex - 1);
            }
            else { // We're at the start and can't splice -1.
                [, next] = array.value.slice(0);
            }
        }
        else if (previousIndex >= 0) { // Found previous run in array, use for reference.
            [previous, , next] = array.value.slice(previousIndex);
        }
        else if (nextIndex >= 0) { // Found next run in array, use for reference.
            [previous, , next] = array.value.slice(nextIndex - 2);
        }
    }
    activeRunSurr.value = {
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
    return __awaiter(this, void 0, void 0, function* () {
        if (!twitchAPIData.value.sync) {
            return false;
        }
        // Constructing Twitch title and game to send off.
        const status = helpers_1.bundleConfig().twitch.streamTitle
            .replace(new RegExp('{{game}}', 'g'), runData.game || '')
            .replace(new RegExp('{{players}}', 'g'), helpers_1.formPlayerNamesStr(runData))
            .replace(new RegExp('{{category}}', 'g'), runData.category || '');
        // Attempts to find the correct Twitch game directory.
        let { gameTwitch } = runData;
        if (!gameTwitch && runData.game) {
            const [, srcomGameTwitch] = yield helpers_1.to(srcom_api_1.searchForTwitchGame(runData.game));
            gameTwitch = srcomGameTwitch || runData.game;
        }
        if (gameTwitch) { // Verify game directory supplied exists on Twitch.
            [, gameTwitch] = yield helpers_1.to(twitch_api_1.verifyTwitchDir(gameTwitch));
        }
        helpers_1.to(twitch_api_1.updateChannelInfo(status, gameTwitch || helpers_1.bundleConfig().twitch.streamDefaultGame));
        // Construct/send featured channels if enabled.
        if (helpers_1.bundleConfig().twitch.ffzIntegration) {
            helpers_1.to(ffz_ws_1.setChannels(helpers_1.getTwitchChannels(runData)));
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
            if (['running', 'paused'].includes(timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            if (!id) {
                throw new Error('No run ID was supplied');
            }
            const runData = array.value.find((run) => run.id === id);
            if (!runData) {
                throw new Error(`Run with ID ${id} was not found`);
            }
            else {
                const noTwitchGame = yield updateTwitchInformation(runData);
                activeRun.value = clone_1.default(runData);
                helpers_1.to(timer_1.resetTimer(true));
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
            const runIndex = array.value.findIndex((run) => run.id === id);
            if (runIndex < 0) {
                throw new Error(`Run with ID ${id} was not found`);
            }
            else {
                array.value.splice(runIndex, 1);
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
            // Verify and convert estimate.
            if (data.estimate) {
                if (data.estimate.match(/^(\d+:)?(?:\d{1}|\d{2}):\d{2}$/)) {
                    const ms = helpers_1.timeStrToMS(data.estimate);
                    data.estimate = helpers_1.msToTimeStr(ms);
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
                    const ms = helpers_1.timeStrToMS(data.setupTime);
                    data.setupTime = helpers_1.msToTimeStr(ms);
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
            const index = helpers_1.findRunIndexFromId(data.id);
            if (index >= 0) { // Run already exists, edit it.
                if (activeRun.value && data.id === activeRun.value.id) {
                    activeRun.value = clone_1.default(data);
                }
                array.value[index] = clone_1.default(data);
            }
            else { // Run is new, add it.
                const prevIndex = helpers_1.findRunIndexFromId(prevID);
                array.value.splice(prevIndex + 1 || array.value.length, 0, clone_1.default(data));
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
 * Removes the active run from the relevant replicant.
 */
function removeActiveRun() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (['running', 'paused'].includes(timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            activeRun.value = undefined;
            helpers_1.to(timer_1.resetTimer(true));
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
            if (['running', 'paused'].includes(timer.value.state)) {
                throw new Error('Timer is running/paused');
            }
            array.value.length = 0;
            removeActiveRun();
            helpers_1.to(timer_1.resetTimer(true));
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
        .then((noTwitchGame) => helpers_1.processAck(ack, null, noTwitchGame))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('removeRun', (id, ack) => {
    removeRun(id)
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('modifyRun', (data, ack) => {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then((noTwitchGame) => helpers_1.processAck(ack, null, noTwitchGame))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('changeToNextRun', (data, ack) => {
    changeActiveRun(activeRunSurr.value.next)
        .then((noTwitchGame) => helpers_1.processAck(ack, null, noTwitchGame))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('returnToStart', (data, ack) => {
    removeActiveRun()
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('removeAllRuns', (data, ack) => {
    removeAllRuns()
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
// Our messaging system.
events.listenFor('changeActiveRun', (id, ack) => {
    changeActiveRun(id)
        .then((noTwitchGame) => {
        helpers_1.processAck(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch((err) => helpers_1.processAck(ack, err));
});
events.listenFor('removeRun', (id, ack) => {
    removeRun(id)
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
events.listenFor('modifyRun', (data, ack) => {
    modifyRun(data.runData, data.prevID, data.updateTwitch)
        .then((noTwitchGame) => helpers_1.processAck(ack, null, noTwitchGame))
        .catch((err) => helpers_1.processAck(ack, err));
});
events.listenFor('changeToNextRun', (data, ack) => {
    changeActiveRun(activeRunSurr.value.next)
        .then((noTwitchGame) => {
        helpers_1.processAck(ack, null, noTwitchGame);
        if (noTwitchGame) {
            nodecg.sendMessage('triggerAlert', 'NoTwitchGame');
        }
    })
        .catch((err) => helpers_1.processAck(ack, err));
});
events.listenFor('returnToStart', (data, ack) => {
    removeActiveRun()
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
events.listenFor('removeAllRuns', (data, ack) => {
    removeAllRuns()
        .then(() => helpers_1.processAck(ack, null))
        .catch((err) => helpers_1.processAck(ack, err));
});
activeRun.on('change', changeSurroundingRuns);
array.on('change', changeSurroundingRuns);
