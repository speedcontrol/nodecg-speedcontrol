/*jshint expr:true*/
describe('Initialization', function() {
  before(function() {
    document.location.hash = '';
  });

  after(function() {
    Twitch._config = {};
  });

  describe('#_init()', function() {
    beforeEach(function(){
      Twitch._config = {};
    });

    it('should throw if no client id', function() {
      (function() {
        Twitch.init({}, function() {});
      }).should['throw']('client id');
    });

    it('should set client id', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.clientId.should.eql('myclientid');
    });

    it('should callback without error', function(done) {
      Twitch.init({clientId: 'myclientid'}, function(err, status) {
        should.not.exist(null);
        done();
      });
    });

    it('should callback with status', function(done) {
      Twitch.init({clientId: 'myclientid'}, function(err, status) {
        should.not.exist(null);
        should.exist(status);
        status.should.have.property('authenticated', false);
        done();
      });
    });
  });
});
