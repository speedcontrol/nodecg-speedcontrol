NODE_BIN = ./node_modules/.bin/
TESTS = test/*.js
SRC = lib/twitch.core.js \
	lib/twitch.storage.js \
	lib/twitch.init.js \
	lib/twitch.auth.js \
	lib/twitch.events.js

all: twitch.min.js docs

test: twitch.js
	node test/server.js

docs: twitch.js
	$(NODE_BIN)docco twitch.js
	mv docs docco

twitch.js: $(SRC)
	cat $^ > $@

twitch.min.js: twitch.js
	$(NODE_BIN)uglifyjs --no-mangle $< > $@

clean:
	rm -f twitch{,.min}.js

.PHONY: test docs
