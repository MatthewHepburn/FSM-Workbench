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
        it("machine should not accept 'aabb'", function() {expect( machine.accepts(["a","a", "b","b"]) ).to.be.false;});


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

        var spec, initialMachinesLength, machine, specCopy, machineCopy;

        before(function(){
            // Machine which accepts the empty string via multiple epsilon steps.
            spec = {"nodes": [{"id":"A", "x": 100, "y": 50, "isInit": true, "name":"foo"}, {"id": "B", "x": 200, "y": 60}, {"id": "C", "x": 300, "y": 60,"name":"bar"},  {"id": "D", "x": 400, "y": 60, "isAcc": true}],
                         "links": [{"to": "B", "from": "A", "hasEps": true}, {"to": "C", "from": "B", "hasEps": true}, {"to": "D", "from": "C", "input": ["b"], "hasEps":true}],
                          "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true, "isTransducer": false}
                    };
            initialMachinesLength = model.machines.length;
            machine = model.addMachine(spec);
        });

        it("machine should be ok", function(){expect(machine).to.be.ok;});
        it("there should be one machine", function(){expect(model.machines.length - initialMachinesLength).to.equal(1);});
        it("machine should allow Epsilon transitiions", function() {expect(machine.allowEpsilon).to.be.true;});
        it("machine should have 4 nodes", function(){expect(Object.keys(machine.nodes).length).to.equal(4);});
        it("machine should have 3 links", function(){expect(Object.keys(machine.links).length).to.equal(3);});

        it("machine's initial state should be accepting", function(){
            machine.setToInitialState();
            expect(machine.isInAcceptingState()).to.be.true
        });

        it("machine should accept []", function() {expect( machine.accepts([]) ).to.be.true;});
        it("machine should accept 'b'", function() {expect( machine.accepts(["b"]) ).to.be.true;});
        it("machine should not accept 'bb'", function() {expect( machine.accepts(["b","b"]) ).to.be.false;});

        it("Spec derived from machine should be equal to original spec", function(){
            specCopy = machine.getSpec();
            expect(specCopy).to.deep.equal(spec);
        });

        it("Machine created from machine's spec should be equal to the original (ignoring IDs)", function(){
            machineCopy = model.addMachine(specCopy);
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

    describe("Construct a machine from scratch", function(){

        var spec, machine, node1, node2, node3, node4, node5, node6;

        before(function(){
            spec = {"nodes": [],
                                 "links": [],
                                  "attributes": {"alphabet": [], "allowEpsilon": true, "isTransducer": false}
                                };
            machine = model.addMachine(spec);
            machine.setAlphabet(["a","b","c"]);

        });

        it("machine should be ok", function(){expect(machine).is.ok;});

        it("machine should now have 2 nodes", function(){
            node1 = machine.addNode(0,0,"foo",true,false);
            node2 = machine.addNode(10,10,"deleteme",true,false);
            machine.addLink(node1, node2.id, ["a"], undefined, true)
            machine.addLink(node2.id, node1, ["a,b,c"], {}, false)
            expect(Object.keys(machine.nodes).length).to.equal(2);
        });

        it("machine should now have 2 links", function(){
            expect(Object.keys(machine.links).length).to.equal(2)
        });


        it("machine should now have 1 node", function(){
            machine.deleteNode(node2);
            expect(Object.keys(machine.nodes).length).to.equal(1)
        });

        it("machine should now have 0 links", function(){expect(Object.keys(machine.links).length).to.equal(0)});


        it("machine should now have 0 nodes", function(){
            machine.deleteNode(node1.id);
            expect(Object.keys(machine.nodes).length).to.equal(0)
        });
        it("machine should now have 0 links", function(){expect(Object.keys(machine.links).length).to.equal(0)});


        it("machine should now have 6 nodes", function(){
            node1 = machine.addNode(0,0,"A",true,false);
            node2 = machine.addNode(0,0,"B",false,false);
            node3 = machine.addNode(0,0,"C",false,false);
            node4 = machine.addNode(0,0,"D",false,false);
            node5 = machine.addNode(0,0,"E",false,false);
            node6 = machine.addNode(0,0,"F",false,false);
            expect(Object.keys(machine.nodes).length).to.equal(6);
        });

        it("toggleInitial should work", function(){
            expect(node6.isInitial).to.be.false;
            expect(node1.isInitial).to.be.true;

            node6.toggleInitial();
            expect(node6.isInitial).to.be.true;

            node6.toggleInitial();
            expect(node6.isInitial).to.be.false;

            node6.toggleInitial();
            expect(node6.isInitial).to.be.true;
        });

        it("toggleAccepting should work", function(){
            expect(node5.isAccepting).to.be.false;

            node5.toggleAccepting();
            expect(node5.isAccepting).to.be.true;

            node5.toggleAccepting();
            expect(node5.isAccepting).to.be.false;

            node5.toggleAccepting();
            expect(node5.isAccepting).to.be.true;

        });

        it("machine should now have 7 links", function(){
            machine.addLink(node1.id, node2.id, ["a"], {}, false);
            machine.addLink(node1, node3, [], undefined, true);
            machine.addLink(node1.id, node4, ["b"], undefined, false);
            machine.addLink(node3, node5, ["b"], undefined, false);
            machine.addLink(node2, node5, ["b"], undefined, false);
            machine.addLink(node4, node5, ["b"], undefined, false);
            machine.addLink(node5, node6, ["c"], undefined, false); //backwards to test reverse functionality

            expect(Object.keys(machine.links).length).to.equal(7);

            //test reverse functionality by using it in the construction.
            var link = node5.getLinkTo(node6);
            expect(node6.hasLinkTo(node5)).to.be.false;
            expect(node6.hasLinkTo(node5.id)).to.be.false;
            link.reverse();
            expect(node6.hasLinkTo(node5)).to.be.true;

            expect(Object.keys(machine.links).length).to.equal(7);
        });

        it("machine should not accept 'bbb'", function(){expect(machine.accepts(["b,","b","b"])).to.be.false;});
        it("machine should accept 'b'", function(){expect(machine.accepts(["b"])).to.be.true;});
        it("machine should accept 'c'", function(){expect(machine.accepts(["c"])).to.be.true;});
        it("machine should accept 'bb'", function(){expect(machine.accepts(["b","b"])).to.be.true;});
        it("machine should accept 'ab'", function(){expect(machine.accepts(["a","b"])).to.be.true;});
        it("machine should not accept 'ba'", function(){expect(machine.accepts(["b","a"])).to.be.false;});
        it("machine should not accept []", function(){expect(machine.accepts([])).to.be.false;});
        it("link.setInput should work", function(){
            var link = node6.getLinkTo(node5.id);
            link.setInput(["a"], true);
            expect(machine.accepts(["a"])).to.be.true;
            expect(machine.accepts([])).to.be.true;
            expect(machine.accepts(["c"])).to.be.false;

        });
    });

    describe("Test Model.getMachineList()", function(){

        it("should correctly handle the case were there are no machines", function(){
            model.machines = [];
            expect(model.getMachineList().length).to.equal(0);
        });

        it("should correctly handle the case where there is one machine", function(){
            var spec1 = {"nodes": [{"id":"A", "x": 100, "y": 50, "isInit": true}, {"id": "B", "x": 200, "y": 60}, {"id": "C", "x": 300, "y": 60, "isAcc": true}],
                         "links": [{"to": "B", "from": "A", "input": ["a", "b"]}, {"to": "A", "from": "A", "input": ["a"]}, {"to": "C", "from": "B", "input": ["c"]}],
                          "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true, "isTransducer": false}
                        };
            model.addMachine(spec1);
            var list = model.getMachineList();
            expect(list).to.be.ok;
            expect(list.length).to.equal(1);
            expect(list[0].attributes.allowEpsilon).to.be.true;
            expect(list[0].attributes.isTransducer).to.be.false;
        });


        it("should correctly handle the case where there are two machines", function(){
            var spec2 = {"nodes": [{"id":"A", "x": 100, "y": 50, "isAcc": true, "isInit": true}],
                         "links": [],
                          "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": false, "isTransducer": false}
                        };

            model.addMachine(spec2);
            var list = model.getMachineList();
            expect(list).to.be.ok;
            expect(list.length).to.equal(2);
            expect(list[0].attributes.allowEpsilon).to.be.true;
            expect(list[0].attributes.isTransducer).to.be.false;
            expect(list[1].attributes.allowEpsilon).to.be.false;
            expect(list[1].attributes.isTransducer).to.be.false;
        });
    });

    describe("test the give-list question type", function(){

        var questionObj, spec, input,feedbackObj;

        before(function(){
            model.machines = [];
            questionObj = {"type": "give-list",
                           "lengths": [2,4,6,8,10],
                           "splitSymbol": ""
                        };
            spec = {nodes: [{id:"A", x:0, y:50, isInit:true},{id:"B", x:50, y:50},{id:"C", x:50, y:100},{id:"D", x:200, y:50, isAcc:true}],
                    links: [{from:"A", to:"B", input:["c"]},{from:"B", to:"C", input:["d"]}, {from:"C", to:"B", input:["e"]},{from:"B", to:"D", input:["f"]}],
                    attributes:{alphabet:["c","d","e","f"], isTransducer: false, allowEpsilon:false}
                   };
            model.addMachine(spec);
            model.question.setUpQuestion(questionObj)
        });

        it("question should be setup correctly", function(){
            expect(model.question.type).to.equal("give-list");
            expect(model.question.lengths).to.be.ok;
            expect(model.question.splitSymbol).to.equal("");
        });

        it("should accept valid input", function(){
            input = ["cf","cdef","cdedef","cdededef","cdedededef"];
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.allCorrectFlag).to.be.true;
            expect(feedbackObj.messages.reduce((x,y) => x + y, "")).to.equal(""); //all message entries should be empty;
            expect(feedbackObj.isCorrectList.reduce((x,y) => x && y, true)).to.be.true //all isCorrect entries should be true;
        });

        it("should reject well formed incorrect input", function(){
            input = ["cf","cdeff","cdedef","cdededef","cdedededef"];
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.allCorrectFlag).to.be.false;
            expect(feedbackObj.messages.reduce((x,y) => x + y, "")).to.not.equal(""); //all message entries should not be empty;
            expect(feedbackObj.isCorrectList[1]).to.be.false;

            input = ["cf","cedf","cdedef","cdededef","cdedededef"];
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.allCorrectFlag).to.be.false;
            expect(feedbackObj.messages.reduce((x,y) => x + y, "")).to.not.equal(""); //all message entries should not be empty;
            expect(feedbackObj.isCorrectList[1]).to.be.false;

            input = ["","","","",""];
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.allCorrectFlag).to.be.false;
            expect(feedbackObj.isCorrectList.reduce((x,y) => x || y, false)).to.be.false //all isCorrect entries should be false;
        });


    });

});

