"use strict";
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
const iso8601_duration_1 = require("iso8601-duration");
const needle_1 = __importDefault(require("needle"));
const p_iteration_1 = require("p-iteration");
const uuid_1 = require("uuid");
const srcom_api_1 = require("./srcom-api");
const twitch_api_1 = require("./twitch-api");
const helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
const nodecg_1 = require("./util/nodecg");
const nodecg = nodecg_1.get();
const config = helpers_1.bundleConfig();
const importStatus = nodecg.Replicant('oengusImportStatus', {
    persistent: false,
});
const runDataArray = nodecg.Replicant('runDataArray');
const defaultSetupTime = nodecg.Replicant('defaultSetupTime');
/**
 * Make a GET request to Oengus API.
 * @param endpoint Oengus API endpoint you want to access.
 */
function get(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            nodecg.log.debug(`[Oengus Import] API request processing on ${endpoint}`);
            const resp = yield needle_1.default('get', `https://oengus.io/api${endpoint}`, null, {
                headers: {
                    'User-Agent': 'nodecg-speedcontrol',
                    Accept: 'application/json',
                },
            });
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: parser exists but isn't in the typings
            if (resp.parser !== 'json') {
                throw new Error('Response was not JSON');
            }
            else if (resp.statusCode !== 200) {
                throw new Error(JSON.stringify(resp.body));
            }
            nodecg.log.debug(`[Oengus Import] API request successful on ${endpoint}`);
            return resp;
        }
        catch (err) {
            nodecg.log.debug(`[Oengus Import] API request error on ${endpoint}:`, err);
            throw err;
        }
    });
}
/**
 * Format to time string from Duration object.
 * @param duration Duration object you want to format.
 */
function formatDuration(duration) {
    const digits = [];
    digits.push(duration.hours ? helpers_1.padTimeNumber(duration.hours) : '00');
    digits.push(duration.minutes ? helpers_1.padTimeNumber(duration.minutes) : '00');
    digits.push(duration.seconds ? helpers_1.padTimeNumber(duration.seconds) : '00');
    return digits.join(':');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusMarathon(source) {
    return (typeof source.id === 'string' && typeof source.name === 'string');
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOengusSchedule(source) {
    return (typeof source.id === 'number' && source.lines !== undefined);
}
/**
 * Resets the replicant's values to default.
 */
function resetImportStatus() {
    importStatus.value.importing = false;
    importStatus.value.item = 0;
    importStatus.value.total = 0;
    nodecg.log.debug('[Oengus Import] Import status restored to default');
}
/**
 * Import schedule data in from Oengus.
 * @param marathonShort Oengus' marathon shortname you want to import.
 * @param useJapanese If you want to use usernameJapanese from the user data.
 */
function importSchedule(marathonShort, useJapanese) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            importStatus.value.importing = true;
            const marathonResp = yield get(`/marathons/${marathonShort}`);
            const scheduleResp = yield get(`/marathons/${marathonShort}/schedule`);
            if (!isOengusMarathon(marathonResp.body)) {
                throw new Error('Did not receive marathon data correctly');
            }
            if (!isOengusSchedule(scheduleResp.body)) {
                throw new Error('Did not receive schedule data correctly');
            }
            defaultSetupTime.value = iso8601_duration_1.toSeconds(iso8601_duration_1.parse(marathonResp.body.defaultSetupTime));
            const oengusLines = scheduleResp.body.lines;
            // This is updated for every run so we can calculate a scheduled time for each one.
            let scheduledTime = Math.floor(Date.parse(marathonResp.body.startDate) / 1000);
            // Filtering out any games on the ignore list before processing them all.
            const newRunDataArray = yield p_iteration_1.mapSeries(oengusLines.filter((line) => (!helpers_1.checkGameAgainstIgnoreList(line.gameName))), (line, index, arr) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b, _c, _d;
                importStatus.value.item = index + 1;
                importStatus.value.total = arr.length;
                // If Oengus ID matches run already imported, re-use our UUID.
                const matchingOldRun = runDataArray.value
                    .find((oldRun) => oldRun.externalID === line.id.toString());
                const runData = {
                    teams: [],
                    customData: {},
                    id: (_a = matchingOldRun === null || matchingOldRun === void 0 ? void 0 : matchingOldRun.id) !== null && _a !== void 0 ? _a : uuid_1.v4(),
                    externalID: line.id.toString(),
                };
                // General Run Data
                runData.game = (_b = line.gameName) !== null && _b !== void 0 ? _b : undefined;
                runData.system = (_c = line.console) !== null && _c !== void 0 ? _c : undefined;
                runData.category = (_d = line.categoryName) !== null && _d !== void 0 ? _d : undefined;
                const parsedEstimate = iso8601_duration_1.parse(line.estimate);
                runData.estimate = formatDuration(parsedEstimate);
                runData.estimateS = iso8601_duration_1.toSeconds(parsedEstimate);
                const parsedSetup = iso8601_duration_1.parse(line.setupTime);
                runData.setupTime = formatDuration(parsedSetup);
                runData.setupTimeS = iso8601_duration_1.toSeconds(parsedSetup);
                if (line.setupBlock) {
                    // Game name set to "Setup" if the line is a setup block.
                    runData.game = 'Setup';
                    // Estimate for a setup block will be the setup time instead.
                    runData.estimate = runData.setupTime;
                    runData.estimateS = runData.setupTimeS;
                    runData.setupTime = formatDuration({ seconds: 0 });
                    runData.setupTimeS = 0;
                }
                else if (line.gameName) {
                    // Attempt to find Twitch directory on speedrun.com if setting is enabled.
                    let srcomGameTwitch;
                    if (!config.oengus.disableSpeedrunComLookup) {
                        [, srcomGameTwitch] = yield helpers_1.to(srcom_api_1.searchForTwitchGame(line.gameName));
                    }
                    let gameTwitch;
                    // Verify some game directory supplied exists on Twitch.
                    for (const str of [srcomGameTwitch, line.gameName]) {
                        if (str) {
                            [, gameTwitch] = yield helpers_1.to(twitch_api_1.verifyTwitchDir(str));
                            if (gameTwitch) {
                                break; // If a directory was successfully found, stop loop early.
                            }
                        }
                    }
                    runData.gameTwitch = gameTwitch;
                }
                // Add the scheduled time then update the value above for the next run.
                runData.scheduled = new Date(scheduledTime * 1000).toISOString();
                runData.scheduledS = scheduledTime;
                scheduledTime += runData.estimateS + runData.setupTimeS;
                // Team Data
                runData.teams = yield p_iteration_1.mapSeries(line.runners, (runner) => __awaiter(this, void 0, void 0, function* () {
                    var _e, _f;
                    const team = {
                        id: uuid_1.v4(),
                        players: [],
                    };
                    const player = {
                        name: (useJapanese && runner.usernameJapanese)
                            ? runner.usernameJapanese : runner.username,
                        id: uuid_1.v4(),
                        teamID: team.id,
                        social: {
                            twitch: (_e = runner.twitchName) !== null && _e !== void 0 ? _e : undefined,
                        },
                        customData: {},
                    };
                    if (!config.oengus.disableSpeedrunComLookup) {
                        const data = yield srcom_api_1.searchForUserDataMultiple({ type: 'name', val: runner.speedruncomName }, { type: 'twitch', val: runner.twitchName }, { type: 'name', val: runner.username });
                        if (data) {
                            // Always favour the supplied Twitch username from schedule if available.
                            if (!runner.twitchName) {
                                const tURL = (data.twitch && data.twitch.uri) ? data.twitch.uri : undefined;
                                player.social.twitch = helpers_1.getTwitchUserFromURL(tURL);
                            }
                            player.country = ((_f = data.location) === null || _f === void 0 ? void 0 : _f.country.code) || undefined;
                            player.pronouns = data.pronouns || undefined;
                        }
                    }
                    team.players.push(player);
                    return team;
                }));
                return runData;
            }));
            runDataArray.value = newRunDataArray;
            resetImportStatus();
        }
        catch (err) {
            resetImportStatus();
            throw err;
        }
    });
}
nodecg.listenFor('importOengusSchedule', (data, ack) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (importStatus.value.importing) {
            throw new Error('Already importing schedule');
        }
        nodecg.log.info('[Oengus Import] Started importing schedule');
        yield importSchedule(data.marathonShort, data.useJapanese);
        nodecg.log.info('[Oengus Import] Successfully imported schedule from Oengus');
        helpers_1.processAck(ack, null);
    }
    catch (err) {
        nodecg.log.warn('[Oengus Import] Error importing schedule:', err);
        helpers_1.processAck(ack, err);
    }
}));
