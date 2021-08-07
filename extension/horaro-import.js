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
const crypto_1 = __importDefault(require("crypto"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const needle_1 = __importDefault(require("needle"));
const p_iteration_1 = require("p-iteration");
const parse_duration_1 = __importDefault(require("parse-duration"));
const remove_markdown_1 = __importDefault(require("remove-markdown"));
const uuid_1 = require("uuid");
const srcom_api_1 = require("./srcom-api");
const twitch_api_1 = require("./twitch-api");
const helpers_1 = require("./util/helpers"); // eslint-disable-line object-curly-newline, max-len
const nodecg_1 = require("./util/nodecg");
const replicants_1 = require("./util/replicants");
const nodecg = nodecg_1.get();
const config = helpers_1.bundleConfig();
const md = new markdown_it_1.default();
const scheduleDataCache = {};
/**
 * Used to parse Markdown from schedules.
 * Returns URL of first link and a string with all formatting removed.
 * Will return both undefined if nothing is supplied.
 * @param str Markdowned string you wish to parse.
 */
function parseMarkdown(str) {
    const results = {};
    if (str) {
        // Some stuff can break this, so try/catching it if needed.
        try {
            const res = md.parseInline(str, {});
            let url;
            if (res[0] && res[0].children) {
                url = res[0].children.find((child) => (child.type === 'link_open' && child.attrs
                    && child.attrs[0] && child.attrs[0][0] === 'href'));
            }
            results.url = (url && url.attrs) ? url.attrs[0][1] : undefined;
            results.str = remove_markdown_1.default(str);
        }
        catch (err) {
            // return nothing
        }
    }
    return results;
}
/**
 * Generates a hash based on the contents of the string based run data from Horaro.
 * @param colData Array of strings (or nulls), obtained from the Horaro JSON data.
 */
function generateRunHash(colData) {
    return crypto_1.default.createHash('sha1').update(colData.join(), 'utf8').digest('hex');
}
/**
 * Resets the replicant's values to default.
 */
function resetImportStatus() {
    replicants_1.horaroImportStatus.value.importing = false;
    replicants_1.horaroImportStatus.value.item = 0;
    replicants_1.horaroImportStatus.value.total = 0;
    nodecg.log.debug('[Horaro Import] Import status restored to default');
}
/**
 * Load schedule data in from Horaro, store in a temporary cache and return it.
 * @param url URL of Horaro schedule.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
function loadSchedule(url, dashID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let jsonURL = `${url}.json`;
            if (url.match((/\?key=/))) { // If schedule URL has a key in it, extract it correctly.
                const urlMatch = url.match(/(.*?)(?=(\?key=))/)[0];
                const keyMatch = url.match(/(?<=(\?key=))(.*?)$/)[0];
                jsonURL = `${urlMatch}.json?key=${keyMatch}`;
            }
            const resp = yield needle_1.default('get', encodeURI(jsonURL));
            if (resp.statusCode !== 200) {
                throw new Error(`HTTP status code was ${resp.statusCode}`);
            }
            scheduleDataCache[dashID] = resp.body;
            nodecg.log.debug('[Horaro Import] Schedule successfully loaded');
            return resp.body;
        }
        catch (err) {
            nodecg.log.debug('[Horaro Import] Schedule could not be loaded:', err);
            throw err;
        }
    });
}
/**
 * Imports schedule data loaded in above function.
 * @param opts Options on how the schedule data should be parsed, including column numbers.
 * @param dashID UUID of dashboard element, generated on panel load and passed here.
 */
function importSchedule(optsO, dashID) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            replicants_1.horaroImportStatus.value.importing = true;
            const data = scheduleDataCache[dashID];
            const runItems = data.schedule.items;
            const setupTime = data.schedule.setup_t;
            replicants_1.defaultSetupTime.value = setupTime;
            // Sanitizing import option inputs with this "mess".
            const opts = {
                columns: {
                    game: (optsO.columns.game === null) ? -1 : optsO.columns.game,
                    gameTwitch: (optsO.columns.gameTwitch === null) ? -1 : optsO.columns.gameTwitch,
                    category: (optsO.columns.category === null) ? -1 : optsO.columns.category,
                    system: (optsO.columns.system === null) ? -1 : optsO.columns.system,
                    region: (optsO.columns.region === null) ? -1 : optsO.columns.region,
                    release: (optsO.columns.release === null) ? -1 : optsO.columns.release,
                    player: (optsO.columns.player === null) ? -1 : optsO.columns.player,
                    externalID: (optsO.columns.externalID === null) ? -1 : optsO.columns.externalID,
                    custom: {},
                },
                split: optsO.split,
            };
            Object.keys(optsO.columns.custom).forEach((col) => {
                const val = optsO.columns.custom[col];
                opts.columns.custom[col] = (val === null) ? -1 : val;
            });
            const externalIDsSeen = [];
            // Filtering out any games on the ignore list before processing them all.
            const newRunDataArray = yield p_iteration_1.mapSeries(runItems.filter((run) => (!helpers_1.checkGameAgainstIgnoreList(run.data[opts.columns.game], 'horaro'))), (run, index, arr) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                replicants_1.horaroImportStatus.value.item = index + 1;
                replicants_1.horaroImportStatus.value.total = arr.length;
                // If a run with the same external ID exists already, use the same UUID.
                // This will only work for the first instance of an external ID; for hashes, this is usually
                // only an issue if the same "run" happens twice in a schedule (for example a Setup block),
                // and for actual defined IDs from a column should never happen, but idiot proofing it.
                const externalID = run.data[opts.columns.externalID] || generateRunHash(run.data);
                let matchingOldRun;
                if (!externalIDsSeen.includes(externalID)) {
                    matchingOldRun = replicants_1.runDataArray.value.find((oldRun) => oldRun.externalID === externalID);
                    externalIDsSeen.push(externalID);
                }
                const runData = {
                    teams: [],
                    customData: {},
                    id: (matchingOldRun === null || matchingOldRun === void 0 ? void 0 : matchingOldRun.id) || uuid_1.v4(),
                    externalID,
                };
                // General Run Data
                runData.game = parseMarkdown(run.data[opts.columns.game]).str;
                runData.system = parseMarkdown(run.data[opts.columns.system]).str;
                runData.category = parseMarkdown(run.data[opts.columns.category]).str;
                runData.region = parseMarkdown(run.data[opts.columns.region]).str;
                runData.release = parseMarkdown(run.data[opts.columns.release]).str;
                // Attempts to find the correct Twitch game directory.
                const game = parseMarkdown(run.data[opts.columns.game]);
                let gameTwitch = parseMarkdown(run.data[opts.columns.gameTwitch]).str;
                let srcomGameTwitch;
                if (!(config.schedule || config.horaro).disableSpeedrunComLookup && !gameTwitch) {
                    if (game.url && game.url.includes('speedrun.com')) {
                        const gameAbbr = game.url
                            .split('speedrun.com/')[game.url.split('speedrun.com/').length - 1]
                            .split('/')[0]
                            .split('#')[0];
                        [, srcomGameTwitch] = yield helpers_1.to(srcom_api_1.searchForTwitchGame(gameAbbr, true));
                    }
                    if (!srcomGameTwitch && game.str) {
                        [, srcomGameTwitch] = yield helpers_1.to(srcom_api_1.searchForTwitchGame(game.str));
                    }
                }
                // Verify some game directory supplied exists on Twitch.
                for (const str of [gameTwitch, srcomGameTwitch, game.str]) {
                    if (str) {
                        gameTwitch = (_a = (yield helpers_1.to(twitch_api_1.verifyTwitchDir(str)))[1]) === null || _a === void 0 ? void 0 : _a.name;
                        if (gameTwitch) {
                            break; // If a directory was successfully found, stop loop early.
                        }
                    }
                }
                runData.gameTwitch = gameTwitch;
                // Scheduled Date/Time
                runData.scheduledS = run.scheduled_t;
                runData.scheduled = run.scheduled;
                // Estimate
                runData.estimateS = run.length_t;
                runData.estimate = helpers_1.msToTimeStr(run.length_t * 1000);
                // Setup Time
                let runSetupTime = setupTime * 1000;
                if (run.options && run.options.setup) {
                    const duration = parse_duration_1.default(run.options.setup);
                    if (duration > 0) {
                        runSetupTime = duration;
                    }
                }
                runData.setupTime = helpers_1.msToTimeStr(runSetupTime);
                runData.setupTimeS = runSetupTime / 1000;
                // Custom Data
                Object.keys(opts.columns.custom).forEach((col) => {
                    var _a, _b;
                    const customDataConfig = ((_a = config.customData) === null || _a === void 0 ? void 0 : _a.run)
                        || ((_b = config.schedule) === null || _b === void 0 ? void 0 : _b.customData)
                        || config.horaro.customData;
                    if (!customDataConfig) {
                        return;
                    }
                    const colSetting = customDataConfig.find((setting) => setting.key === col);
                    if (!colSetting) {
                        return;
                    }
                    const colData = run.data[opts.columns.custom[col]];
                    const str = (!colSetting.ignoreMarkdown) ? parseMarkdown(colData).str : colData;
                    if (str) {
                        runData.customData[col] = str;
                    }
                });
                // Players
                const playerList = run.data[opts.columns.player];
                if (playerList) {
                    // Mapping team string into something more manageable.
                    const teamSplittingRegex = [
                        /\s+vs\.?\s+/,
                        /\s*,\s*/, // Comma (,)
                    ];
                    const teamsRaw = yield p_iteration_1.mapSeries(playerList.split(teamSplittingRegex[opts.split]), (team) => {
                        const nameMatch = team.match(/^(.+)(?=:\s)/);
                        return {
                            name: (nameMatch) ? nameMatch[0] : undefined,
                            players: (opts.split === 0)
                                ? team.replace(/^(.+)(:\s)/, '').split(/\s*,\s*/)
                                : [team.replace(/^(.+)(:\s)/, '')],
                        };
                    });
                    // Mapping team information from above into needed format.
                    runData.teams = yield p_iteration_1.mapSeries(teamsRaw, (rawTeam) => __awaiter(this, void 0, void 0, function* () {
                        const team = {
                            id: uuid_1.v4(),
                            name: parseMarkdown(rawTeam.name).str,
                            players: [],
                        };
                        // Mapping player information into needed format.
                        team.players = yield p_iteration_1.mapSeries(rawTeam.players, (rawPlayer) => __awaiter(this, void 0, void 0, function* () {
                            var _b, _c;
                            const { str, url } = parseMarkdown(rawPlayer);
                            const twitchUsername = helpers_1.getTwitchUserFromURL(url);
                            const player = {
                                name: str || '',
                                id: uuid_1.v4(),
                                teamID: team.id,
                                social: {
                                    twitch: twitchUsername,
                                },
                                customData: {},
                            };
                            if (!(config.schedule || config.horaro).disableSpeedrunComLookup) {
                                const sData = yield srcom_api_1.searchForUserDataMultiple({ type: 'twitch', val: twitchUsername }, { type: 'name', val: str }, { type: 'twitch', val: str }, { type: 'twitter', val: str });
                                if (sData) {
                                    // Always favour the supplied Twitch username from schedule if available.
                                    if (!twitchUsername) {
                                        const tURL = (sData.twitch && sData.twitch.uri)
                                            ? sData.twitch.uri : undefined;
                                        player.social.twitch = helpers_1.getTwitchUserFromURL(tURL);
                                    }
                                    player.country = ((_b = sData.location) === null || _b === void 0 ? void 0 : _b.country.code) || undefined;
                                    player.pronouns = ((_c = sData.pronouns) === null || _c === void 0 ? void 0 : _c.toLowerCase()) || undefined;
                                }
                            }
                            return player;
                        }));
                        return team;
                    }));
                }
                nodecg.log.debug(`[Horaro Import] Successfully imported ${index + 1}/${runItems.length}`);
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
nodecg.listenFor('loadSchedule', (data, ack) => {
    loadSchedule(data.url, data.dashID)
        .then((data_) => helpers_1.processAck(ack, null, data_))
        .catch((err) => helpers_1.processAck(ack, err));
});
nodecg.listenFor('importSchedule', (data, ack) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (replicants_1.horaroImportStatus.value.importing) {
            throw new Error('Already importing schedule');
        }
        nodecg.log.info('[Horaro Import] Started importing schedule');
        yield importSchedule(data.opts, data.dashID);
        nodecg.log.info('[Horaro Import] Successfully imported schedule');
        helpers_1.processAck(ack, null);
    }
    catch (err) {
        nodecg.log.warn('[Horaro Import] Error importing schedule:', err);
        helpers_1.processAck(ack, err);
    }
}));
