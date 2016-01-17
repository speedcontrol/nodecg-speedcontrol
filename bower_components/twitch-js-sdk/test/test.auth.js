/*jshint expr:true undef:false*/
var reset = function() {
  document.location.hash = '';
  Twitch._config = {};
};

describe('Authentication', function() {
  describe('#_parseFragment()', function() {
    before(reset);

    it('should extract params from location hash', function() {
      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read+channel_read&state=user_dayjay";

      document.location.hash = hash;
      Twitch._parseFragment().should.eql({
        token: 'ew35h4pk0xg7iy1',
        scope: ['user_read', 'channel_read'],
        state: 'user_dayjay',
        error: null,
        errorDescription: null
      });
    });

    it('should handle various parameter combinations', function() {
      Twitch._parseFragment('access_token=ew35h42d').should.eql({
        token: 'ew35h42d',
        scope: null,
        state: null,
        error: null,
        errorDescription: null
      });
      Twitch._parseFragment('scope=user_read&state=wootles').should.eql({
        token: null,
        scope: ['user_read'],
        state: 'wootles',
        error: null,
        errorDescription: null
      });
    });

    it('TODO: should handle oauth errors', function() {
    });
  });

  describe('#getToken()', function() {
    before(reset);

    before(function() {
      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read";

      document.location.hash = hash;
    });

    it('should be null before init', function() {
      should.not.exist(Twitch.getToken());
    });

    it('should return oauth token', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch.getToken().should.equal('ew35h4pk0xg7iy1');
    });
  });

  describe('#getStatus()', function() {
    before(reset);

    before(function() {
      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read";

      document.location.hash = hash;
    });

    beforeEach(function() {
      sinon.stub(Twitch, 'api');
    });

    afterEach(function() {
      Twitch.api.restore();
    });


    it('should ensure init has been called', function() {
      (function() {
        Twitch.getStatus();
      }).should['throw']('init() before getStatus()');
    });

    it('should have the correct structure', function(done) {
      Twitch.init({clientId: 'myclientid'});
      var props = ['authenticated', 'token', 'scope', 'error', 'errorDescription'];

      Twitch.getStatus(function(err, status) {
        should.not.exist(err);
        for (var i = 0, len = props.length; i < len; i++) {
          status.should.have.property(props[i]);
        }
        done();
      });
    });

    it('handles forced updates', function(done) {
      Twitch.init({clientId: 'myclientid'});

      Twitch.api.yields(null, {
        token: {
          valid: true
        }
      });

      var props = ['authenticated', 'token', 'scope', 'error', 'errorDescription'];
      Twitch.getStatus({force: true}, function(err, status) {
        should.not.exist(err);
        for (var i = 0, len = props.length; i < len; i++) {
          status.should.have.property(props[i]);
        }

        sinon.assert.calledWith(Twitch.api, {method: '/'});

        done();
      });
    });
  });

  describe('#login()', function() {
    before(reset);

    beforeEach(function() {
      sinon.stub(window, 'open');
      Twitch.init({clientId: 'myclientid'});
    });

    afterEach(function() {
      window.open.restore();
    });

    it('should ensure init has been called', function() {
      Twitch._config = {};

      (function() {
        Twitch.login({
          redirect_uri: 'http://myappurl',
          popup: false,
          scope: []
        });
      }).should['throw']('init() before login()');
    });

    it('should enforce arguments', function() {
      (function() {
        Twitch.login({
          redirect_uri: 'http://myappurl',
          popup: false
        });
      }).should['throw']('list of requested scopes');
    });

    it('should open a window', function() {
      Twitch.login({
        redirect_uri: 'http://myappurl',
        popup: true,
        scope: []
      });

      sinon.assert.calledOnce(window.open);
    });

    it('should create valid urls', function() {
      var lastShouldMatch = function(params) {
        var baseUrl = Twitch.baseUrl + 'oauth2/authorize?',
          lastCall = window.open.lastCall;
        lastCall.args[0].should.eql(baseUrl + params);
      };

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: []
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=');

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: ['user_read']
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=user_read');

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: ['user_read', 'channel_read']
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=user_read+channel_read');
    });
  });

  describe('#logout()', function() {
    before(reset);

    beforeEach(function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.session = {
        token: 'abcdef'
      };
    });

    it('should reset session', function(done) {
      Twitch.logout(function(err) {
        should.not.exist(err);
        Twitch._config.session.should.eql({});
        done();
      });
    });

    it('should reset storage', function(done) {
      Twitch._storage = { removeItem: sinon.stub() };
      Twitch.logout(function(err) {
        should.not.exist(err);
        sinon.assert.calledWith(Twitch._storage.removeItem, 'twitch_oauth_session');
        done();
      });
    });

    it('should emit event', function(done) {
      var spy = sinon.spy();
      Twitch.events.on('auth.logout', spy);
      Twitch.logout(function(err) {
        should.not.exist(err);
        sinon.assert.calledOnce(spy);
        done();
      });
    });
  });

  describe('#initSession()', function() {
    before(reset);

    before(function() {
      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read+channel_read&state=user_dayjay";

      document.location.hash = hash;
    });

    it('TODO: should set session', function() {
    });

    it('should emit login event', function() {
      var spy = sinon.spy();
      Twitch.events.on('auth.login', spy);
      Twitch._initSession();
      sinon.assert.calledOnce(spy);
    });

    it('TODO: should handle invalid json', function() {
    });

    it('TODO: should handle missing window.JSON', function() {
    });

    it('TODO: should set new session if this page is a redirect_uri', function() {
    });

  });
});