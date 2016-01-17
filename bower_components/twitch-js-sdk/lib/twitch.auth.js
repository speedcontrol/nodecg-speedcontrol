/*jshint expr:true*/
/*global Twitch*/
// ## Authentication
(function() {
  // Key of the sessionStorage object or cookie.
  var SESSION_KEY = 'twitch_oauth_session',
    $ = Twitch.$;
  var parseFragment = function(hash) {
    var match,
      session;

    hash = hash || document.location.hash;

    var hashMatch = function(expr) {
      var match = hash.match(expr);
      return match ? match[1] : null;
    };

    session = {
      token: hashMatch(/access_token=(\w+)/),
      scope: hashMatch(/scope=([\w+]+)/) ? hashMatch(/scope=([\w+]+)/).split('+') : null,
      state: hashMatch(/state=(\w+)/),
      error: hashMatch(/error=(\w+)/),
      errorDescription: hashMatch(/error_description=(\w+)/)
    };

    return session;
  };

  // Update session info from API and store.
  var updateSession = function(callback) {
    Twitch.api({method: '/'}, function(err, response) {
      var session;
      if (err) {
        Twitch.log('error encountered updating session:', err);
        callback && callback(err, null);
        return;
      }

      if (!response.token.valid) {
        // Invalid token. Either it has expired or the user has
        // revoked permission, so clear out our stored data.
        Twitch.logout(callback);
        return;
      }

      callback && callback(null, session);
    });
  };

  // Get the currently stored OAuth token.
  // Useful for sending OAuth tokens to your backend.
  var getToken = function() {
    return Twitch._config.session && Twitch._config.session.token;
  };

  // Get the current authentication status. Will try to use the stored session
  // if possible for speed.
  // The `force` property will trigger an API request to update session data.
  var getStatus = function(options, callback) {
    if (typeof options === 'function') {
        callback = options;
    }
    if (typeof callback !== 'function') {
        callback = function() {};
    }
    if (!Twitch._config.session) {
      throw new Error('You must call init() before getStatus()');
    }

    var makeSession = function(session) {
      // Make a session object for the client.
      return {
        authenticated: !!session.token,
        token: session.token,
        scope: session.scope,
        error: session.error,
        errorDescription: session.errorDescription
      };
    };

    if (options && options.force) {
      updateSession(function(err, session) {
        callback(err, makeSession(session || Twitch._config.session));
      });
    } else {
      callback(null, makeSession(Twitch._config.session));
    }
  };

  // Login and redirect back to current page with an access token
  // The popup parameter can be used to authorize users without
  // leaving your page, as described [here](http://stackoverflow.com/a/3602045/100296).
  // **TODO**: description about setting URI
  //
  // Usage:
  //
  //     Twitch.login({
  //       redirect_uri: 'http://myappurl.com/myoauthreturn',
  //       popup: false,
  //       scope: ['user_read', 'channel_read']
  //     });
  var login = function(options) {
    if (!options.scope) {
      throw new Error('Must specify list of requested scopes');
    }
    var params = {
      response_type: 'token',
      client_id: Twitch._config.clientId,
      // Redirecting to a fragment is forbidden by the OAuth spec,
      // but we might be on a page with one.
      redirect_uri: options.redirect_uri || window.location.href.replace(/#.*$/, ''),
      scope: options.scope.join(' ')
    };

    if (!params.client_id) {
      throw new Error('You must call init() before login()');
    }
    
    var url = Twitch.baseUrl + 'oauth2/authorize?' + $.param(params);

    if (options.popup) {
      Twitch._config.loginPopup = window.open(url,
                          "Login with TwitchTV",
                          "height=600,width=660,resizable=yes,status=yes");
    } else {
      window.location = url;
    }
  };

  // Reset the session and delete from persistent storage, which is
  // akin to logging out. This does not deactivate the access token
  // given to your app, so you can continue to perform actions if
  // your server stored the token.
  //
  // Usage:
  //
  //     Twitch.logout(function(error) {
  //       // the user is now logged out
  //     });
  var logout = function(callback) {
    // Reset the current session
    Twitch._config.session = {};
    // Remove from persistent storage.
    Twitch._storage.removeItem(SESSION_KEY);

    Twitch.events.emit('auth.logout');
    if (typeof callback === 'function') {
      callback(null);
    }
  };

  // Retrieve sessions from persistent storage and
  // persist new ones.
  var initSession = function() {
    var storedSession;

    Twitch._config.session = {};
    // For browsers that do not have the JSON native object,
    // [JSON.js](http://bestiejs.github.com/json3) will work
    // as a drop-in implementation.
    if (window.JSON) {
      storedSession = Twitch._storage.getItem(SESSION_KEY);
      if (storedSession) {
        try {
          Twitch._config.session = JSON.parse(storedSession);
        } catch (e) {
          //
        }
      }
    }

    // If we're on a page with an access token, it's probably a
    // return uri for an authorization attempt. Overwrite with
    // the new params if page has them.
    if (document.location.hash.match(/access_token=(\w+)/)) {
      Twitch._config.session = parseFragment();

      // Persist to session storage on browsers that support it
      // and cookies otherwise.
      if (window.JSON) {
        Twitch._storage.setItem(SESSION_KEY, JSON.stringify(Twitch._config.session));
      }
    }

    getStatus(function(err, status) {
      if (status.authenticated) {
        Twitch.events.emit('auth.login');
      }
    });
  };

  Twitch.extend({
    _initSession: initSession,
    _parseFragment: parseFragment,
    getToken: getToken,
    getStatus: getStatus,
    login: login,
    logout: logout
  });
})();