var expect = require('chai').expect;
var model = require("../Source/model.js") //NB - importing from Source not deploy, may need to be altered later.

describe('FSM', function() {
    describe('Testing test', function () {
        it('should pass if the model.js file has been imported correctly', function () {
            console.log(model)
            expect(model).to.be.ok;
        });
    });
});