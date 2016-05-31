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

    describe('Model.deleteMachine()', function () {
        it('should decrease the number of machines by one', function () {
            var machine = model.machines[0];
            var id = machine.id;
            var machinesLength = model.machines.length;
            model.deleteMachine(id);
            expect(model.machines.length).to.equal(machinesLength - 1);
        });
    });

    describe('Test machine with single node', function () {
            // Simple machine consisting of a single accepting node.
            var spec = {"nodes": [{"id":"A", "x": 100, "y": 50, "isAcc": true, "isInit": true}],
                         "links": [],
                          "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": false, "isTransducer": false}
                        };


            var initialMachinesLength = model.machines.length;
            var machine = model.addMachine(spec);
            expect(model.machines.length - initialMachinesLength).to.equal(1);


            it("machine should be ok", function(){expect(machine).to.be.ok;});
            it("machine should not allow Epsilon transitiions", function() {expect(machine.allowEpsilon).to.be.false;});
            it("machine should have 1 node", function(){expect(Object.keys(machine.nodes).length).to.equal(1);});
            it("machine should have 0 links", function(){expect(Object.keys(machine.links).length).to.equal(0);});

            machine.setToInitialState();
            it("machine's initial state should be accepting", function(){expect(machine.isInAcceptingState()).to.be.true;})
            it("machine should accept []", function() {expect( machine.accepts([]) ).to.be.true;});

            var specCopy = machine.getSpec();
            it("Spec derived from machine should be equal to original spec", function(){expect(specCopy).to.deep.equal(spec);});

            var machineCopy = model.addMachine(specCopy);
            it("Machine created from machine's spec should be equal to the original (ignoring IDs)", function(){
                var machineNodesLength = Object.keys(machine.nodes).length;
                var CopyNodesLength = Object.keys(machineCopy.nodes).length;
                expect(machineNodesLength).to.equal(CopyNodesLength);

                var machineLinksLength = Object.keys(machine.links).length;
                var CopyLinksLength = Object.keys(machineCopy.links).length;
                expect(machineLinksLength).to.equal(CopyLinksLength);

                expect(machine.isTransducer).to.equal(machine.isTransducer);
                expect(machine.alphabet).to.equal(machine.alphabet);
                expect(machine.allowEpsilon).to.equal(machine.allowEpsilon);
            });


        });

    describe("simple machine with 3 nodes", function(){
        // Three nodes, one of which is accepting.
        var spec = {"nodes": [{"id":"A", "x": 100, "y": 50, "isInit": true}, {"id": "B", "x": 200, "y": 60}, {"id": "C", "x": 300, "y": 60, "isAcc": true}],
                     "links": [{"to": "B", "from": "A", "input": ["a", "b"]}, {"to": "A", "from": "A", "input": ["a"]}, {"to": "C", "from": "B", "input": ["c"]}],
                      "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true, "isTransducer": false}
                    };

        var initialMachinesLength = model.machines.length;
        var machine = model.addMachine(spec);
        expect(model.machines.length - initialMachinesLength).to.equal(1);

        it("machine should be ok", function(){expect(machine).to.be.ok;});
        it("machine should allow Epsilon transitiions", function() {expect(machine.allowEpsilon).to.be.true;});
        it("machine should have 3 nodes", function(){expect(Object.keys(machine.nodes).length).to.equal(3);});
        it("machine should have 3 links", function(){expect(Object.keys(machine.links).length).to.equal(3);});

        machine.setToInitialState();
        it("machine's initial state should not be accepting", function(){expect(machine.isInAcceptingState()).to.be.false;})
        it("machine should not accept []", function() {expect( machine.accepts([]) ).to.be.false;});
        it("machine should accept 'aaaaaaaabc'", function() {expect( machine.accepts(["a","a","a","a","a","a","a","a","b","c"]) ).to.be.true;});
        it("machine should not accept 'aaaaaaaabca'", function() {expect( machine.accepts(["a","a","a","a","a","a","a","a","b","c", "a"]) ).to.be.false;});

        var specCopy = machine.getSpec();
        it("Spec derived from machine should be equal to original spec", function(){expect(specCopy).to.deep.equal(spec);});

        var machineCopy = model.addMachine(specCopy);
        it("Machine created from machine's spec should be equal to the original (ignoring IDs)", function(){
            var machineNodesLength = Object.keys(machine.nodes).length;
            var CopyNodesLength = Object.keys(machineCopy.nodes).length;
            expect(machineNodesLength).to.equal(CopyNodesLength);

            var machineLinksLength = Object.keys(machine.links).length;
            var CopyLinksLength = Object.keys(machineCopy.links).length;
            expect(machineLinksLength).to.equal(CopyLinksLength);

            expect(machine.isTransducer).to.equal(machine.isTransducer);
            expect(machine.alphabet).to.equal(machine.alphabet);
            expect(machine.allowEpsilon).to.equal(machine.allowEpsilon);
        });
    });

    describe("Machine using epsilon transitiions", function(){
        // Machine which accepts the empty string via multiple epsilon steps.
        var spec = {"nodes": [{"id":"A", "x": 100, "y": 50, "isInit": true, "name":"foo"}, {"id": "B", "x": 200, "y": 60}, {"id": "C", "x": 300, "y": 60,"name":"bar"},  {"id": "D", "x": 400, "y": 60, "isAcc": true}],
                     "links": [{"to": "B", "from": "A", "hasEps": true}, {"to": "C", "from": "B", "hasEps": true}, {"to": "D", "from": "C", "input": ["b"], "hasEps":true}],
                      "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true, "isTransducer": false}
                    };

        var initialMachinesLength = model.machines.length;
        var machine = model.addMachine(spec);
        expect(model.machines.length - initialMachinesLength).to.equal(1);

        it("machine should be ok", function(){expect(machine).to.be.ok;});
        it("machine should allow Epsilon transitiions", function() {expect(machine.allowEpsilon).to.be.true;});
        it("machine should have 4 nodes", function(){expect(Object.keys(machine.nodes).length).to.equal(4);});
        it("machine should have 3 links", function(){expect(Object.keys(machine.links).length).to.equal(3);});

        machine.setToInitialState();
        it("machine's initial state should be accepting", function(){expect(machine.isInAcceptingState()).to.be.true});
        it("machine should accept []", function() {expect( machine.accepts([]) ).to.be.true;});
        it("machine should accept 'b'", function() {expect( machine.accepts(["b"]) ).to.be.true;});
        it("machine should not accept 'bb'", function() {expect( machine.accepts(["b","b"]) ).to.be.false;});

        var specCopy = machine.getSpec();
        it("Spec derived from machine should be equal to original spec", function(){expect(specCopy).to.deep.equal(spec);});

        var machineCopy = model.addMachine(specCopy);
        it("Machine created from machine's spec should be equal to the original (ignoring IDs)", function(){
            var machineNodesLength = Object.keys(machine.nodes).length;
            var CopyNodesLength = Object.keys(machineCopy.nodes).length;
            expect(machineNodesLength).to.equal(CopyNodesLength);

            var machineLinksLength = Object.keys(machine.links).length;
            var CopyLinksLength = Object.keys(machineCopy.links).length;
            expect(machineLinksLength).to.equal(CopyLinksLength);

            expect(machine.isTransducer).to.equal(machine.isTransducer);
            expect(machine.alphabet).to.equal(machine.alphabet);
            expect(machine.allowEpsilon).to.equal(machine.allowEpsilon);
        });


    });

});

