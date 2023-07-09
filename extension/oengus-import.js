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
const lodash_1 = require("lodash");
const needle_1 = __importDefault(require("needle"));
const p_iteration_1 = require("p-iteration");
const uuid_1 = require("uuid");
const srcom_api_1 = require("./srcom-api");
const twitch_api_1 = require("./twitch-api");
const helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = (0, nodecg_1.get)();
const config = nodecg.bundleConfig;
/**
 * Make a GET request to Oengus API.
 * @param endpoint Oengus API endpoint you want to access.
 */
function get(endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            nodecg.log.debug(`[Oengus Import] API request processing on ${endpoint}`);
            const resp = yield (0, needle_1.default)('get', `https://${config.oengus.useSandbox ? 'sandbox.' : ''}oengus.io/api/v1${endpoint}`, null, {
                headers: {
                    'User-Agent': 'nodecg-speedcontrol',
                    Accept: 'application/json',
                    'oengus-version': '1',
                },
            });
            if (resp.statusCode !== 200) {
                throw new Error(`Status Code: ${resp.statusCode} - Body: ${JSON.stringify(resp.body)}`);
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: parser exists but isn't in the typings
            }
            else if (resp.parser !== 'json') {
                throw new Error('Response was not JSON');
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
    digits.push(duration.hours ? (0, helpers_1.padTimeNumber)(duration.hours) : '00');
    digits.push(duration.minutes ? (0, helpers_1.padTimeNumber)(duration.minutes) : '00');
    digits.push(duration.seconds ? (0, helpers_1.padTimeNumber)(duration.seconds) : '00');
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
    replicants_1.oengusImportStatus.value.importing = false;
    replicants_1.oengusImportStatus.value.item = 0;
    replicants_1.oengusImportStatus.value.total = 0;
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
            replicants_1.oengusImportStatus.value.importing = true;
            const marathonResp = yield get(`/marathons/${marathonShort}`);
            const scheduleResp = yield get(`/marathons/${marathonShort}/schedule?withCustomData=true`);
            if (!isOengusMarathon(marathonResp.body)) {
                throw new Error('Did not receive marathon data correctly');
            }
            if (!isOengusSchedule(scheduleResp.body)) {
                throw new Error('Did not receive schedule data correctly');
            }
            replicants_1.defaultSetupTime.value = (0, iso8601_duration_1.toSeconds)((0, iso8601_duration_1.parse)(marathonResp.body.defaultSetupTime));
            const oengusLines = scheduleResp.body.lines;
            // This is updated for every run so we can calculate a scheduled time for each one.
            let scheduledTime = Math.floor(Date.parse(marathonResp.body.startDate) / 1000);
            // Filtering out any games on the ignore list before processing them all.
            const newRunDataArray = yield (0, p_iteration_1.mapSeries)(oengusLines.filter((line) => (!(0, helpers_1.checkGameAgainstIgnoreList)(line.gameName, 'oengus'))), (line, index, arr) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                replicants_1.oengusImportStatus.value.item = index + 1;
                replicants_1.oengusImportStatus.value.total = arr.length;
                // If Oengus ID matches run already imported, re-use our UUID.
                const matchingOldRun = replicants_1.runDataArray.value
                    .find((oldRun) => oldRun.externalID === line.id.toString());
                const runData = {
                    teams: [],
                    customData: {},
                    id: (_a = matchingOldRun === null || matchingOldRun === void 0 ? void 0 : matchingOldRun.id) !== null && _a !== void 0 ? _a : (0, uuid_1.v4)(),
                    externalID: line.id.toString(),
                };
                // General Run Data
                runData.game = line.gameName || undefined;
                runData.system = line.console || undefined;
                runData.category = line.categoryName || undefined;
                const parsedEstimate = (0, iso8601_duration_1.parse)(line.estimate);
                runData.estimate = formatDuration(parsedEstimate);
                runData.estimateS = (0, iso8601_duration_1.toSeconds)(parsedEstimate);
                const parsedSetup = (0, iso8601_duration_1.parse)(line.setupTime);
                runData.setupTime = formatDuration(parsedSetup);
                runData.setupTimeS = (0, iso8601_duration_1.toSeconds)(parsedSetup);
                if (line.setupBlock) {
                    // Game name set to "Setup" if the line is a setup block.
                    runData.game = line.setupBlockText || 'Setup';
                    runData.gameTwitch = 'Just Chatting';
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
                        [, srcomGameTwitch] = yield (0, helpers_1.to)((0, srcom_api_1.searchForTwitchGame)(line.gameName));
                    }
                    let gameTwitch;
                    // Verify some game directory supplied exists on Twitch.
                    for (const str of [srcomGameTwitch, line.gameName]) {
                        if (str) {
                            gameTwitch = (_b = (yield (0, helpers_1.to)((0, twitch_api_1.verifyTwitchDir)(str)))[1]) === null || _b === void 0 ? void 0 : _b.name;
                            if (gameTwitch) {
                                break; // If a directory was successfully found, stop loop early.
                            }
                        }
                    }
                    runData.gameTwitch = gameTwitch;
                }
                // Custom Data
                if (line.customDataDTO) {
                    let parsed;
                    try {
                        parsed = JSON.parse(line.customDataDTO);
                    }
                    catch (err) { /* err */ }
                    if (parsed && (0, lodash_1.isObject)(parsed)) {
                        Object.entries(parsed).forEach(([k, v]) => {
                            if (!v)
                                return;
                            if (typeof v === 'string')
                                runData.customData[k] = v;
                            else
                                runData.customData[k] = JSON.stringify(v);
                        });
                    }
                }
                // Add the scheduled time then update the value above for the next run.
                runData.scheduled = new Date(scheduledTime * 1000).toISOString();
                runData.scheduledS = scheduledTime;
                scheduledTime += runData.estimateS + runData.setupTimeS;
                // Team Data
                runData.teams = yield (0, p_iteration_1.mapSeries)(line.runners, (runner) => __awaiter(this, void 0, void 0, function* () {
                    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    const team = {
                        id: (0, uuid_1.v4)(),
                        players: [],
                    };
                    const playerTwitch = ((_d = (_c = runner.connections) === null || _c === void 0 ? void 0 : _c.find((c) => c.platform === 'TWITCH')) === null || _d === void 0 ? void 0 : _d.username) || runner.twitchName;
                    const playerPronouns = typeof runner.pronouns === 'string'
                        ? runner.pronouns.split(',')
                        : runner.pronouns;
                    const player = {
                        name: (useJapanese && runner.usernameJapanese)
                            ? runner.usernameJapanese : runner.username,
                        id: (0, uuid_1.v4)(),
                        teamID: team.id,
                        social: {
                            twitch: playerTwitch || undefined,
                        },
                        country: ((_e = runner.country) === null || _e === void 0 ? void 0 : _e.toLowerCase()) || undefined,
                        pronouns: (playerPronouns === null || playerPronouns === void 0 ? void 0 : playerPronouns.join(', ')) || undefined,
                        customData: {},
                    };
                    if (!config.oengus.disableSpeedrunComLookup) {
                        const playerTwitter = ((_g = (_f = runner.connections) === null || _f === void 0 ? void 0 : _f.find((c) => c.platform === 'TWITTER')) === null || _g === void 0 ? void 0 : _g.username) || runner.twitterName;
                        const playerSrcom = ((_j = (_h = runner.connections) === null || _h === void 0 ? void 0 : _h.find((c) => c.platform === 'SPEEDRUNCOM')) === null || _j === void 0 ? void 0 : _j.username) || runner.speedruncomName;
                        const data = yield (0, srcom_api_1.searchForUserDataMultiple)({ type: 'srcom', val: playerSrcom }, { type: 'twitch', val: playerTwitch }, { type: 'twitter', val: playerTwitter }, { type: 'name', val: runner.username });
                        if (data) {
                            // Always favour the supplied Twitch username/country/pronouns
                            // from Oengus if available.
                            if (!playerTwitch) {
                                const tURL = ((_k = data.twitch) === null || _k === void 0 ? void 0 : _k.uri) || undefined;
                                player.social.twitch = (0, helpers_1.getTwitchUserFromURL)(tURL);
                            }
                            if (!runner.country)
                                player.country = ((_l = data.location) === null || _l === void 0 ? void 0 : _l.country.code) || undefined;
                            if (!((_m = runner.pronouns) === null || _m === void 0 ? void 0 : _m.length)) {
                                player.pronouns = ((_o = data.pronouns) === null || _o === void 0 ? void 0 : _o.toLowerCase()) || undefined;
                            }
                        }
                    }
                    team.players.push(player);
                    return team;
                }));
                return runData;
            }));
            replicants_1.runDataArray.value = newRunDataArray;
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
        if (replicants_1.oengusImportStatus.value.importing) {
            throw new Error('Already importing schedule');
        }
        nodecg.log.info('[Oengus Import] Started importing schedule');
        yield importSchedule(data.marathonShort, data.useJapanese);
        nodecg.log.info('[Oengus Import] Successfully imported schedule from Oengus');
        (0, helpers_1.processAck)(ack, null);
    }
    catch (err) {
        nodecg.log.warn('[Oengus Import] Error importing schedule:', err);
        (0, helpers_1.processAck)(ack, err);
    }
}));
