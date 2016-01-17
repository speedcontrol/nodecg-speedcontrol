/*jshint expr:true undef:false*/
describe('Core', function() {
  before(function() {
    document.location.hash = '';
  });

  it('should set base configuration', function() {
    Twitch.should.have.property('baseUrl', 'https://api.twitch.tv/kraken/');
    // Trailing slash
    Twitch.baseUrl.should.match(/\/$/);
    Twitch.should.have.property('_config');
    Twitch._config.should.eql({});
    Twitch.should.have.property('extend');
    Twitch.should.have.property('api');
  });

  describe('#api()', function() {
    beforeEach(function() {
      Twitch.logout();
      Twitch._config = {};
      sinon.stub(jQuery, 'ajax', function(opts) {
        opts = JSON.stringify(opts);
        Twitch.log('ajax called with:', opts);
        return {
          done: function() {return this;},
          fail: function() {return this;}
        };
      });
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('requires initialization', function() {
      (function() {
        Twitch.api({});
      }).should['throw']('init() before api()');
    });

    it('sends unauthenticated requests', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.session = {};
      Twitch.api({});

      sinon.assert.calledWith($.ajax, {
        dataType: 'jsonp',
        timeout: 5000,
        url: Twitch.baseUrl + '?'
      });
    });

    it('sends authenticated requests', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.session = {
        token: 'abc'
      };
      Twitch.api({});

      sinon.assert.calledWith($.ajax, {
        dataType: 'jsonp',
        timeout: 5000,
        url: Twitch.baseUrl + '?oauth_token=abc'
      });
    });

    it('sets url on requests', function() {
      Twitch.init({clientId: 'myclientid'});

      Twitch.api({url: 'user'});
      $.ajax.lastCall.calledWith({
        dataType: 'jsonp',
        timeout: 5000,
        url: Twitch.baseUrl + 'user?'
      }).should.be.ok;
    });

    it('sets http verb on requests', function() {
      Twitch.init({clientId: 'myclientid'});

      Twitch.api({url: 'user', verb: 'POST'});
      sinon.assert.calledWith($.ajax, {
        dataType: 'jsonp',
        timeout: 5000,
        url: Twitch.baseUrl + 'user?_method=POST'
      });
    });

    it('logs out on unauthorized request', function(done) {
      jQuery.ajax.restore();
      sinon.stub(jQuery, 'ajax', function(opts) {
        opts = JSON.stringify(opts);
        Twitch.log('ajax called with:', opts);
        return {
          done: function(cb) {
            setTimeout(function() {
              cb({
                "status":401,
                "message":"Invalid Token",
                "error":"Unauthorized"
              });
            }, 0);
            return this;
          },
          fail: function() {return this;}
        };
      });

      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read+channel_read&state=user_dayjay";
      document.location.hash = hash;
      Twitch.init({clientId: 'myclientid'});

      Twitch.events.on('auth.logout', function() {
        // should be triggered by api response
        done();
      });

      Twitch.api({method: 'user'}, function(err, data) {
        console.log(err, data);
      });
    });

  });
});
