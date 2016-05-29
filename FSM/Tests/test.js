var expect = require('chai').expect;
var model = require("../Source/model.js") //NB - importing from Source not deploy, may need to be altered later.

describe('Model', function() {
    describe('Testing test', function () {
        it('should pass if the model.js file has been imported correctly', function () {
            expect(model).to.be.ok;
            expect(model.machines).to.be.ok;
        });
    });

    describe('Model.addMachine()', function () {
        it('should increase the number of machines by one and return a machine', function () {
            var machineCount = model.machines.length;
            var specObj = {
                "nodes":[{"id":"A","x":206,"y":46,"isAcc":true,"name":"TIM"},{"id":"B","x":57,"y":60,"isInit":true},{"id":"C","x":337,"y":120,"isAcc":true}],
                "links":[{"to":"B","from":"A"},{"to":"A","from":"B","hasEps":true},{"to":"C","from":"A","hasEps":true},{"to":"A","from":"A","hasEps":true}],
                "attributes":{"alphabet":["a","b","c"],"allowEpsilon":true}
            };
            var machine = model.addMachine(specObj);
            expect(machine).to.be.ok;
            expect(model.machines.length).to.equal(1 + machineCount);
        });
    });
});

