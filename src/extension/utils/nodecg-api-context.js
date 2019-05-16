// https://github.com/GamesDoneQuick/agdq18-layouts/blob/master/extension/util/nodecg-api-context.js

'use strict';
let context;
module.exports = {
	get() {
		return context;
	},
	set(ctx) {
		context = ctx;
	}
};