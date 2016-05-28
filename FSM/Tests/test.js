var jsdom = require('jsdom');
global.document = jsdom.jsdom('<!doctype html><html><body data-iconaddress="img/icons/"></body></html>', null, {
  features: {
    QuerySelector: true
  }
})

var expect = require('chai').expect;
global.d3 = require("d3");
var fsm = require("../Source/fsm2.js") //NB - importing from Source not deploy, may need to be altered later.

describe('FSM', function() {
    describe('simpleTest1', function () {
        it('should pass if the fsm file has been imported correctly', function () {
            console.log(fsm)
            expect(fsm).to.be.ok;
            expect(fsm.Display).to.be.ok;
            expect(fsm.Controller).to.be.ok;
expect(fsm.Display).to.be.ok;
        });
    });
});