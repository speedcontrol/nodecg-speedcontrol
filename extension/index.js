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
};