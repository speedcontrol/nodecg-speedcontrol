var Rieussec = require('../index.js');
var should = require('chai').should();
var NanoTimer = require('nanotimer');

var ACCEPTABLE_MARGIN = 32;

describe('Rieussec', function () {
    it('should keep time correctly after a pause', function(done) {
        var timer = new NanoTimer();
        var rieussec = new Rieussec();
        rieussec.start();
        timer.setTimeout(function() {
            rieussec.pause();
            rieussec._milliseconds.should.be.within(100, 100 + ACCEPTABLE_MARGIN);

            timer.setTimeout(function() {
                rieussec.start();

                timer.setTimeout(function() {
                    rieussec.pause();
                    rieussec._milliseconds.should.be.within(200, 200 + ACCEPTABLE_MARGIN);
                    done();
                }, null, '100m');
            }, null, '100m');
        }, null, '100m');
    });

    describe('#reset()', function () {
        beforeEach(function (done) {
            this.rieussec = new Rieussec();
            this.rieussec.start();
            setTimeout(function() { done(); }, 10)
        });

        it('should clear the interval', function () {
            should.not.equal(this.rieussec._timer.intervalT1, null);
            this.rieussec.reset();
            should.equal(this.rieussec._timer.intervalT1, null);
        });

        it('should set the state to "stopped"', function () {
            this.rieussec.reset();
            this.rieussec._state.should.equal('stopped');
        });

        it('should emit a tick', function (done) {
            this.rieussec.once('tick', function () { done(); });
            this.rieussec.reset();
        });

        it('should set #_milliseconds to 0', function () {
            this.rieussec.reset();
            this.rieussec._milliseconds.should.equal(0);
        });
    });

    context('when stopped', function () {
        beforeEach(function () {
            this.rieussec = new Rieussec();
        });

        afterEach(function () {
            this.rieussec.reset();
        });

        it('should not tick', function (done) {
            var self = this;
            this.rieussec.on('tick', onTick);

            setTimeout(function() {
                self.rieussec.removeListener('tick', onTick);
                done();
            }, self.rieussec.tickRate * 2);

            function onTick() {
                throw new Error('Rieussec should not tick when stopped');
            }
        });

        describe('#start()', function () {
            it('should set the interval', function () {
                should.equal(this.rieussec._timer.intervalT1, null);
                this.rieussec.start();
                should.not.equal(this.rieussec._timer.intervalT1, null);
            });

            it('should set the state to "running"', function () {
                this.rieussec.start();
                this.rieussec._state.should.equal('running');
            });
        });

        describe('#pause()', function () {
            it('should return "false"', function () {
                this.rieussec.pause().should.be.false;
            });
        });

        describe('#setMilliseconds()', function () {
            it('should set the milliseconds', function () {
                this.rieussec.setMilliseconds(100);
                this.rieussec._milliseconds.should.equal(100);
            });
        });
    });

    context('when started', function () {
        beforeEach(function () {
            this.rieussec = new Rieussec();
            this.rieussec.start();
        });

        afterEach(function () {
            this.rieussec.reset();
        });

        it('should tick', function (done) {
            var self = this;
            var ticksHeard = 0;
            this.rieussec.on('tick', onTick);
            this.rieussec.start();

            function onTick() {
                ticksHeard++;
                if (ticksHeard >= 2) {
                    self.rieussec.removeListener('tick', onTick);
                    self.rieussec.reset();
                    done();
                }
            }
        });

        it('should be accurate to within 32ms for a 100ms timer', function (done) {
            var self = this;
            var TEST_DURATION = 100;
            var timer = new NanoTimer();
            self.rieussec.start();
            timer.setTimeout(function() {
                self.rieussec.pause();
                self.rieussec._milliseconds.should.be.within(TEST_DURATION, TEST_DURATION + ACCEPTABLE_MARGIN);
                self.rieussec.reset();
                done();
            }, null, '100m');
        });

        it('should be accurate to within 32ms for a 1s timer', function (done) {
            var self = this;
            var TEST_DURATION = 1000;
            var timer = new NanoTimer();
            self.rieussec.start();
            timer.setTimeout(function() {
                self.rieussec.pause();
                self.rieussec._milliseconds.should.be.within(TEST_DURATION, TEST_DURATION + ACCEPTABLE_MARGIN);
                self.rieussec.reset();
                done();
            }, null, '1s');
        });

        it('should be accurate to within 32ms for a 10s timer', function (done) {
            this.timeout(11000);

            var self = this;
            var TEST_DURATION = 10000;
            var timer = new NanoTimer();
            self.rieussec.start();
            timer.setTimeout(function() {
                self.rieussec.pause();
                self.rieussec._milliseconds.should.be.within(TEST_DURATION, TEST_DURATION + ACCEPTABLE_MARGIN);
                self.rieussec.reset();
                done();
            }, null, '10s');
        });

        it('should keep time accurate to 32ms', function (done) {
            this.timeout(22000);

            var self = this;
            var timer = new NanoTimer();
            var i = 1;
            var TEST_DURATION = 10;
            var NUM_TESTS = 2000;

            testTimer(i);
            function testTimer(pass) {
                self.rieussec.start();
                timer.setTimeout(function() {
                    self.rieussec.pause();
                    self.rieussec._milliseconds.should.be.within(TEST_DURATION, TEST_DURATION + ACCEPTABLE_MARGIN);
                    self.rieussec.reset();
                    if (pass === NUM_TESTS) {
                        timer.clearTimeout();
                        done();
                    }
                }, null, TEST_DURATION + 'm', function() {
                    if (i <= NUM_TESTS) testTimer(i++);
                });
            }
        });

        describe('#start()', function () {
            it('should return "false"', function () {
                this.rieussec.start().should.be.false;
            });
        });

        describe('#pause()', function () {
            it('should emit a tick', function (done) {
                this.rieussec.once('tick', function () {
                    done();
                });
                this.rieussec.pause();
            });

            it('should clear the interval', function () {
                should.not.equal(this.rieussec._timer.intervalT1, null);
                this.rieussec.pause();
                should.equal(this.rieussec._timer.intervalT1, null);
            });

            it('should set the state to "paused"', function () {
                this.rieussec.pause();
                this.rieussec._state.should.equal('paused');
            });
        });

        describe('#setMilliseconds()', function () {
            it('should set the milliseconds', function () {
                this.rieussec.setMilliseconds(100);
                this.rieussec._milliseconds.should.equal(100);
            });

            context('when "keepCycle" is "true"', function () {
                it('should retain the seconds cycle', function (done) {
                    var self = this;
                    setTimeout(function() {
                        self.rieussec.pause();
                        var pauseModThou = self.rieussec._milliseconds % 1000;
                        self.rieussec.setMilliseconds(1000, true);
                        self.rieussec._milliseconds.should.equal(1000 + pauseModThou);
                        done();
                    }, 1051);
                });
            });
        });
    });

    context('when paused', function () {
        beforeEach(function (done) {
            var self = this;
            this.rieussec = new Rieussec();
            this.rieussec.start();
            setTimeout(function () {
                self.rieussec.pause();
                done();
            }, 10)
        });

        afterEach(function () {
            this.rieussec.reset();
        });

        it('should not tick', function (done) {
            var self = this;
            this.rieussec.on('tick', onTick);

            setTimeout(function() {
                self.rieussec.removeListener('tick', onTick);
                done();
            }, self.rieussec.tickRate * 2);

            function onTick() {
                throw new Error('Rieussec should not tick when paused');
            }
        });

        describe('#start()', function () {
            it('should set the interval', function () {
                should.equal(this.rieussec._timer.intervalT1, null);
                this.rieussec.start();
                should.not.equal(this.rieussec._timer.intervalT1, null);
            });

            it('should set the state to "running"', function () {
                this.rieussec.start();
                this.rieussec._state.should.equal('running');
            });
        });

        describe('#pause()', function () {
            it('should return "false"', function () {
                this.rieussec.pause().should.be.false;
            });
        });
    });
});
