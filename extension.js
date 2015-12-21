'use strict';

module.exports = function(nodecg) {
    try {
        require('./extension/stopwatch')(nodecg);
    } catch (e) {
        nodecg.log.error('Failed to load "stopwatches" lib:', e.stack);
        process.exit(1);
    }
};
