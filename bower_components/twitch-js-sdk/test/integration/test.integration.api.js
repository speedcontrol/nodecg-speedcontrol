/*jshint expr:true undef:false*/

// We need to wrap jsonp to get mocha to know about assertion errors
// since we're in a new call stack
window.wrap = function(done, fn) {
  try {
    fn();
  } catch (e) {
    done(e);
  }
};

describe('API', function() {
  it('should confirm positive authentication', function(done) {
    Twitch.getStatus(function(err, status) {
      should.not.exist(err);
      status.should.have.property('authenticated', true);
      status.scope.should.be.an['instanceof'](Array);
      done();
    });
  });

  describe('#api()', function() {
    describe('methods', function() {
      it('can retrieve /user', function(done) {
        Twitch.api({method: 'user'}, function(err, user) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(user);
            user.should.have.property('display_name');
            user.display_name.should.be.a('String');
            done();
          });
        });
      });
    });

    describe('channels', function() {
      it('can retrieve /channel', function(done) {
        Twitch.api({method: 'channel'}, function(err, channel) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(channel);
            channel.should.have.property('stream_key');
            channel.stream_key.should.include('live_');
            channel.should.have.property('_links');
            done();
          });
        });
      });

      it('can retrieve /channels/username', function(done) {
        Twitch.api({method: 'channels/hebo'}, function(err, channel) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(channel);
            channel.should.not.have.property('stream_key');
            channel.should.have.deep.property('_links.commercial',
              Twitch.baseUrl + 'channels/hebo/commercial'
            );
            done();
          });
        });
      });

      it('can retrieve /channel', function(done) {
        Twitch.api({method: 'channel'}, function(err, channel) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(channel);
            channel.should.have.property('stream_key');
            channel.stream_key.should.include('live_');
            done();
          });
        });
      });

      it('can trigger a commercial', function(done) {
        Twitch.api({url: 'user'}, function(err, user) {
          should.not.exist(err);
          Twitch.api({url: 'channels/' + user.name + '/commercial', verb: 'POST'}, function(err, res) {
            wrap(done, function() {
              should.not.exist(err);
              done();
            });
          });
        });
      });
    });

    describe('chat', function() {
      it('can retrieve /chat/username', function(done) {
        Twitch.api({method: 'chat/kraken_test_user'}, function(err, chat) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(chat);

            chat.should.have.deep.property('_links.emoticons',
              Twitch.baseUrl + 'chat/kraken_test_user/emoticons'
            );

            chat.should.have.deep.property('_links.self',
              Twitch.baseUrl + 'chat/kraken_test_user'
            );

            done();
          });
        });
      });

      it('can retrieve /chat/username/emoticons', function(done) {
        Twitch.api({method: 'chat/kraken_test_user/emoticons'}, function(err, response) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(response);

            response.should.have.property('emoticons');
            response.emoticons.should.be.a('Array').and.not.empty;

            an_emoticon = response.emoticons[0];
            an_emoticon.should.have.property('regex').and.be.a('string');
            an_emoticon.should.have.property('subscriber_only').and.be.a('boolean');
            an_emoticon.should.have.property('url').and.be.a('string');
            an_emoticon.should.have.property('height').and.be.a('number');
            an_emoticon.should.have.property('width').and.be.a('number');

            response.should.have.deep.property('_links.self',
              Twitch.baseUrl + 'chat/kraken_test_user/emoticons'
            );

            done();
          });
        });
      });

      it('can retrieve /chat/username/badges', function(done) {
        Twitch.api({method: 'chat/kraken_test_user/badges'}, function(err, response) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(response);

            response.should.have.property('badges');
            response.badges.should.be.a('Array').and.not.empty;

            badge = response.badges[0];
            badge.should.have.property('type').and.be.a('string');
            badge.should.have.property('title').and.be.a('string');
            badge.should.have.property('url').and.be.a('string');

            response.should.have.deep.property('_links.self',
              Twitch.baseUrl + 'chat/kraken_test_user/badges'
            );

            done();
          });
        });
      });
    });

    describe('responses', function() {
      it('TODO: handle nonexistent method', function(done) {
        done();
        // Twitch.api({method: 'fakeresource'}, function(err, channel) {
        // });
      });

      it('handle nonexistent user', function(done) {
        Twitch.api({method: 'users/4y8yyjcju3p'}, function(err, user) {
          wrap(done, function() {
            should.not.exist(user);
            err.should.have.property('error', 'Not Found');
            err.should.have.property('status', 404);
            done();
          });
        });
      });

      it('handle unauthorized response', function(done) {
        Twitch._config = {session: {}};

        Twitch.api({method: 'user'}, function(err, user) {
          wrap(done, function() {
            should.not.exist(user);
            err.should.have.property('error', 'Unauthorized');
            err.should.have.property('status', 401);
            done();
          });
        });
      });
    });
  });
});
