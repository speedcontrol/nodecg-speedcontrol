'use strict';

module.exports = function(nodecg) {
    try {
        require('./stopwatch')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "stopwatch" lib:', e.stack);
        process.exit(1);
    }
	
    try {
        require('./twitchapi')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "twitchapi" lib:', e.stack);
        process.exit(1);
    }
	
    try {
        require('./csscreater')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "csscreater" lib:', e.stack);
        process.exit(1);
    }
	
    try {
        require('./esacontroller')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "esacontroller" lib:', e.stack);
        process.exit(1);
    }
	
	try {
        require('./ffzws')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "ffzws" lib:', e.stack);
        process.exit(1);
    }
};
