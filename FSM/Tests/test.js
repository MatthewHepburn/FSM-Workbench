import "babel-polyfill";
var expect = require('chai').expect;
var model = require("../Source/model.js") //NB - importing from Source not deploy, may need to be altered later.

describe('Model', function() {
    describe('Test that test has loaded correctly', function () {
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

    describe("Test the give-list question type", function(){

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

        it("should reject duplicate entries", function(){
            questionObj = {"type": "give-list",
                           "lengths": [4,4],
                           "splitSymbol": ""
                        };
            model.question.setUpQuestion(questionObj)
            input = ["cdef", "cdef"]
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.isCorrectList[0]).to.be.true;
            expect(feedbackObj.allCorrectFlag).to.be.false;
            expect(feedbackObj.messages.reduce((x,y) => x + y, "")).to.not.equal(""); //all message entries should not be empty;
        })


    });

    describe("Test the satisfy-list question type", function(){
        var questionObj, spec, input,feedbackObj;

        before(function(){
            model.machines = [];
            questionObj = {"type": "satisfy-list",
                           "shouldAccept": ["10p 10p 10p 10p 10p", "20p 20p 10p", "10p 20p 20p 20p", "10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 20p"],
                           "shouldReject": ["10p 20p", "20p 20p", "10p 10p 10p 10p", "", "10p"],
                           "splitSymbol": " "
                        };
            model.question.setUpQuestion(questionObj)
        });

        describe("should approve a correct machine", function(){
            before(function(){
                spec = {"nodes":[{"id":"A","x":61,"y":215,"isInit":true,"name":"0"},{"id":"B","x":150,"y":260,"name":"10"},{"id":"C","x":145,"y":160,"name":"20"},{"id":"D","x":318,"y":152,"isAcc":true,"name":"50+"},{"id":"E","x":234,"y":206,"name":"30"},{"id":"F","x":229,"y":106,"name":"40"}],
                        "links":[{"to":"B","from":"A","input":["10p"]},{"to":"C","from":"A","input":["20p"]},{"to":"C","from":"B","input":["10p"]},{"to":"D","from":"D","input":["10p","20p"]},{"to":"E","from":"C","input":["10p"]},{"to":"E","from":"B","input":["20p"]},{"to":"D","from":"E","input":["20p"]},{"to":"F","from":"E","input":["10p"]},{"to":"F","from":"C","input":["20p"]},{"to":"D","from":"F","input":["10p"]}],
                        "attributes":{"alphabet":["10p","20p"],"allowEpsilon":false,"isTransducer":false}
                    };
                model.addMachine(spec);
                feedbackObj = model.question.checkAnswer();
            })

            it("feedback object should be ok", function(){expect(feedbackObj).to.be.ok;});
            it("feedback object should be correct", function(){
                expect(feedbackObj.allCorrectFlag).to.be.true;
                expect(feedbackObj.acceptList.reduce((x,y) => x && y, true)).to.be.true;
                expect(feedbackObj.rejectList.reduce((x,y) => x && y, true)).to.be.true;
            });
        })

        describe("should reject an incorrect machine", function(){
            before(function(){
                model.machines = []
                spec = {"nodes":[{"id":"A","x":61,"y":215,"isInit":true,"isAcc": true,"name":"0"},{"id":"B","x":150,"y":260,"name":"10"},{"id":"C","x":145,"y":160,"name":"20"},{"id":"D","x":318,"y":152,"isAcc":true,"name":"50+"},{"id":"E","x":234,"y":206,"name":"30"},{"id":"F","x":229,"y":106,"name":"40"}],
                        "links":[{"to":"B","from":"A","input":["10p"]},{"to":"C","from":"A","input":["20p"]},{"to":"C","from":"B","input":["10p"]},{"to":"D","from":"D","input":["10p","20p"]},{"to":"E","from":"C","input":["10p"]},{"to":"E","from":"B","input":["20p"]},{"to":"D","from":"E","input":["20p"]},{"to":"F","from":"E","input":["10p"]},{"to":"F","from":"C","input":["20p"]},{"to":"D","from":"F","input":["10p"]}],
                        "attributes":{"alphabet":["10p","20p"],"allowEpsilon":false,"isTransducer":false}
                    };
                model.addMachine(spec);
            })
            it("feedback object should be ok", function(){feedbackObj = model.question.checkAnswer();})
            it("allCorrectFlag should be false", function(){expect(feedbackObj.allCorrectFlag).to.be.false;});
            it("all entries in feedbackObj.acceptList should be true", function(){expect(feedbackObj.acceptList.reduce((x,y) => x && y, true)).to.be.true;});
            it("there should be at least one false entry in feedbackObj.rejectList", function(){expect(feedbackObj.rejectList.reduce((x,y) => x && y, true)).to.be.false;});
            it("feedbackObj.rejectList[3] should be false", function(){expect(feedbackObj.rejectList[3]).to.be.false;});

        }).pass
    });

    describe("Test the give-equivalent question type", function(){
        before(function(){
            model.machines = [];

        });
        describe("test for machine equal to a*a(b|c)a*", function(){
            var questionObj = {type:"give-equivalent",
                               splitSymbol: "",
                               targetMachineSpec: {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}}
                               }
            before(function(){
                model.question.setUpQuestion(questionObj)
            })
            it("should reject incorrect input", function(){
                var incorrectSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169,"isAcc":true},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                var machine = model.addMachine(incorrectSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
            })
            it("should reject a machine with no accepting states", function(){
                var noAccSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169,"isAcc":false},{"id":"C","x":272,"y":164,"isAcc":false}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(noAccSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
            })
            it("should reject a machine with no initial states", function(){
                var noInitSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":false},{"id":"B","x":172,"y":169,"isAcc":true},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(noInitSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
            })
            it("should accept a machine identical to the spec", function(){
                var identicalSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(identicalSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.true;
            })
            it("should accept a machine equivalent to the spec", function(){
                var equivalentSpec = {"nodes":[{"id":"A","x":75,"y":168,"isInit":true},{"id":"B","x":175,"y":163},{"id":"C","x":275,"y":164,"isAcc":true},{"id":"D","x":255,"y":103,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["c"]},{"to":"C","from":"C","input":["a"]},{"to":"D","from":"B","input":["b"]},{"to":"D","from":"D","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(equivalentSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.true;
            })
        })
    });

    describe("Test Machine.getTrace()", function(){
        describe("Test with a simple machine with only 3 states", function(){
            var machine, traceObj
            before(function(){
                var spec = {"nodes":[{"id":"A","x":91,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],
                            "links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]}],
                            "attributes":{"alphabet":["a","b"],"allowEpsilon":false,"isTransducer":false}};
                machine = model.addMachine(spec)
            });
            it("traceObj should be ok", function(){
                traceObj = machine.getTrace(["a","b"]);
                expect(traceObj).to.be.ok;
            });
            it("The expected properties of traceObj should be present", function(){
                expect(traceObj.states).to.be.ok;
                expect(traceObj.links).to.be.ok;
                expect(traceObj.doesAccept).to.be.ok;
                expect(traceObj.input).to.be.ok
            });
            it("the traceObj.states array should be correct", function(){
                //traceObj.states should be a list of lists of nodes: [[Node], [Node, Node, Node], [Node]]
                expect(traceObj.states.length).to.equal(3);
                expect(traceObj.states[0][0].isInitial).to.be.true;
                expect(traceObj.states[0].length).to.equal(1);
                expect(traceObj.states[2][0].isAccepting).to.be.true;
            });
            it("the traceObj.links array should be correct",function(){
                //traceObj.links should be a list of lists of objects: [[{link:Link, epsUsed:false, inputIndex:0}, {link:Link, epsUsed:true}],[{}]]
                expect(traceObj.links.length).to.equal(3);
                expect(traceObj.links[0].length).to.equal(0); //As no links taken before first input;

                expect(traceObj.links[1].length).to.equal(1);
                expect(traceObj.links[1][0].epsUsed).to.be.false;
                expect(traceObj.links[1][0].inputIndex).to.equal(0)

                expect(traceObj.links[2].length).to.equal(1);
                expect(traceObj.links[2][0].epsUsed).to.be.false;
                expect(traceObj.links[2][0].inputIndex).to.equal(0)
            });
            it("traceObj.doesAccept should be true", function(){expect(traceObj.doesAccept).to.be.true});
            it("traceObj.input should be correct", function(){
                expect(traceObj.input.length).to.equal(2);
                expect(traceObj.input[0]).to.equal("a");
                expect(traceObj.input[1]).to.equal("b");
            });
        });
    });

    describe("Test conversion to DFA", function(){
        before(function(){
            model.machines = []
        })



        describe("test machine 1:", function(){
            var spec = {"nodes":[{"id":"A","x":104,"y":108,"isInit":true},{"id":"B","x":187,"y":164},{"id":"C","x":277,"y":121,"isAcc":true},{"id":"D","x":194,"y":65}],"links":[{"to":"B","from":"A","input":["c"]},{"to":"C","from":"B","input":["c"],"hasEps":true},{"to":"D","from":"A","input":["a"]},{"to":"C","from":"D","input":["b"]},{"to":"A","from":"D","hasEps":true},{"to":"D","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec);
            var shouldAccept = ["ab", "abab", "cc", "c", "ccab", "ccacc", "ccac", "abacab"].map(str => model.parseInput(str, ""));
            var shouldReject = ["b", "a", "cb", "caa"].map(str => model.parseInput(str, ""));

            describe("before conversion", function(){
                shouldAccept.forEach(function(sequence){
                                var displayStr = sequence.reduce((x,y)=>x+y)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            });
                shouldReject.forEach(function(sequence){
                                var displayStr = sequence.reduce((x,y)=>x+y)
                                it(`should reject '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.false;
                                })
                            });

            });

            describe("after conversion", function(){
                before(function(){machine.convertToDFA();});
                shouldAccept.forEach(function(sequence){
                                var displayStr = sequence.reduce((x,y)=>x+y)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })
                shouldReject.forEach(function(sequence){
                                var displayStr = sequence.reduce((x,y)=>x+y)
                                it(`should reject '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.false;
                                })
                            })

            });
        });

        describe("test machine 2:", function(){
            var spec = {"nodes":[{"id":"A","x":57,"y":140,"isAcc":true,"isInit":true,"name":"b"},{"id":"B","x":83,"y":73,"isInit":true,"name":"a"},{"id":"C","x":81,"y":204,"isInit":true,"name":"c"},{"id":"D","x":157,"y":140,"name":"t1"},{"id":"E","x":257,"y":135,"name":"t2"},{"id":"F","x":357,"y":143,"name":"q"},{"id":"G","x":428,"y":73,"isAcc":true,"name":"q`"},{"id":"H","x":449,"y":182,"isAcc":true,"name":"q``"}],"links":[{"to":"D","from":"C","hasEps":true},{"to":"D","from":"A","input":["s1"]},{"to":"D","from":"B","hasEps":true},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"E","input":["s1","s2","s3"]},{"to":"G","from":"F","input":["s1"]},{"to":"H","from":"F","input":["s2","s3"]}],"attributes":{"alphabet":["s1","s2","s3"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec)
            var splitSymbol = " ";
            var shouldAccept = ["s1 s1 s2 s3 s1", "s3", "s2", ""]

            describe("before conversion", function(){
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })

            })

            describe("after conversion", function(){
                before(function(){machine.convertToDFA();});
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })

            })




        })
    });

    describe("Test minimization to DFA:", function(){
        before(function(){
            model.machines = []
        })
        describe("test machine 1", function(){
            var spec = {"nodes":[{"id":"A","x":57,"y":140,"isAcc":true,"isInit":true,"name":"b"},{"id":"B","x":83,"y":73,"isInit":true,"name":"a"},{"id":"C","x":81,"y":204,"isInit":true,"name":"c"},{"id":"D","x":157,"y":140,"name":"t1"},{"id":"E","x":257,"y":135,"name":"t2"},{"id":"F","x":357,"y":143,"name":"q"},{"id":"G","x":428,"y":73,"isAcc":true,"name":"q`"},{"id":"H","x":449,"y":182,"isAcc":true,"name":"q``"}],"links":[{"to":"D","from":"C","hasEps":true},{"to":"D","from":"A","input":["s1"]},{"to":"D","from":"B","hasEps":true},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"E","input":["s1","s2","s3"]},{"to":"G","from":"F","input":["s1"]},{"to":"H","from":"F","input":["s2","s3"]}],"attributes":{"alphabet":["s1","s2","s3"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec)
            var splitSymbol = " ";
            var shouldAccept = ["s1 s1 s2 s3 s1", "s3", "s2", "", "s1 s2 s1"]

            describe("before minimization", function(){
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })

            })

            describe("after minimization", function(){
                before(function(){machine.minimize();});
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })

            })
        });
    });
    describe("Test Machine.reverse()", function(){
        before(function(){
            model.machines = []
        })
        describe("simple example", function(){
            var spec = {"nodes":[{"id":"A","x":148,"y":119,"isInit":true},{"id":"B","x":248,"y":125,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"A","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}}
            var machine = model.addMachine(spec);
            var splitSymbol = "";
            var shouldAccept = ["a", "aba", "ababa"]
            var shouldReject = ["b", "aa", "baba", "abab"]

            describe("before reversing", function(){
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })
            })

            describe("after reversing", function(){
                before(function(){machine.reverse();});
                shouldAccept.forEach(function(displayStr){
                                var sequence = model.parseInput(displayStr, splitSymbol)
                                it(`should accept '${displayStr}'`, function(){
                                    expect(machine.accepts(sequence)).to.be.true;
                                })
                            })
            })

        })
    })
    describe("Test machine.isEquivalentTo():", function(){
        before(function(){
            model.machines = []
        })
        describe("simple example", function(){
            var spec1 = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["c"]},{"to":"B","from":"B","input":["a","b"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var spec2 = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]},{"to":"B","from":"B","input":["a","c"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var m1 = model.addMachine(spec1)
            var m2 = model.addMachine(spec2)
            it("m1 should accept 'aabbc' and m2 should not", function(){
                expect(m1.accepts(["a", "a", "b", "b", "c"])).to.be.true;
                expect(m2.accepts(["a", "a", "b", "b", "c"])).to.be.false;
            })
            it("m2 should accept 'aaccb' and m1 should not", function(){
                expect(m2.accepts(["a", "a", "c", "c", "b"])).to.be.true;
                expect(m1.accepts(["a", "a", "c", "c", "b"])).to.be.false;
            })
            it("m1 and m2 should not be equivalent", function(){
                expect(m1.isEquivalentTo(m2)).to.be.false;
                expect(m2.isEquivalentTo(m1)).to.be.false;
            })
            it("m1 should be equivalent to itself", function(){
                expect(m1.isEquivalentTo(m1)).to.be.true;
            })
            it("m2 should be equivalent to itself", function(){
                expect(m2.isEquivalentTo(m2)).to.be.true;
            });
        })
    });

    describe("test machine.getUnionWith()", function(){
        describe("union of a*b* with ab:", function(){
            var m1, m2, union;

            var m1 = new model.Machine("a*b*");
            var m2 = new model.Machine("ab");

            var m1Spec = {"nodes":[{"id":"A","x":95,"y":131,"isAcc":true,"isInit":true},{"id":"B","x":195,"y":130,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["b"]},{"to":"B","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
            var m2Spec = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};

            m1.build(m1Spec);
            m2.build(m2Spec);

            it("m1 should accept a*b*", function(){
                var acceptList = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab"]
                var rejectList = ["ba", "abbba", "bbba", "ababababa"]
                var splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.false;
                })
            })

            it("m2 should accept ab", function(){
                var acceptList = ["ab"]
                var rejectList = ["ba", "abbba", "bbba", "ababababa", "", "a", "b", "aab", "aaa", "bbb", "abbbb"]
                var splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.false;
                })
            })

            it("union should accept only ab", function(){
                var union = m1.getUnionWith(m2);
                var acceptList = ["ab"]
                var rejectList = ["ba", "abbba", "bbba", "ababababa", "", "a", "b", "aab", "aaa", "bbb", "abbbb"]
                var splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(union.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(union.accepts(sequence)).to.be.false;
                })

            });


        })

        describe("union of (a*b*)*|(ba) with (ab)|(ba*):", function(){
           var m1, m2, union;

           var m1 = new model.Machine("m1"); //(a*b*)*|(ba)
           var m2 = new model.Machine("m2"); //(ab)|(ba*)

           var m1Spec = {"nodes":[{"id":"A","x":126,"y":77,"isInit":true},{"id":"B","x":226,"y":83},{"id":"C","x":325,"y":76,"isAcc":true},{"id":"D","x":92,"y":157,"isAcc":true,"isInit":true},{"id":"E","x":192,"y":162,"isAcc":true}],"links":[{"to":"B","from":"A","input":["b"]},{"to":"C","from":"B","input":["a"]},{"to":"D","from":"D","input":["a"]},{"to":"E","from":"D","input":["b"]},{"to":"E","from":"E","input":["b"]},{"to":"D","from":"E","input":["a"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
           var m2Spec = {"nodes":[{"id":"A","x":104,"y":92,"isInit":true},{"id":"B","x":204,"y":92},{"id":"C","x":304,"y":95,"isAcc":true},{"id":"D","x":166,"y":170,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]},{"to":"D","from":"A","input":["b"]},{"to":"D","from":"D","input":["a"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};

           m1.build(m1Spec);
           m2.build(m2Spec);

           it("m1 should accept (a*b*)*|(ba)", function(){
               var acceptList = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab", "ababababbbbbaaa", "bbbbb", "ba"]
               var rejectList = []
               var splitSymbol = "";
               acceptList.map(x => model.parseInput(x, splitSymbol));
               rejectList.map(x => model.parseInput(x, splitSymbol));
               acceptList.forEach(function(sequence){
                   expect(m1.accepts(sequence)).to.be.true;
               });
               rejectList.forEach(function(sequence){
                   expect(m1.accepts(sequence)).to.be.false;
               })
           })

           it("m2 should accept (ab)|(ba*)", function(){
               var acceptList = ["ab", "ba", "baaa", "b", "baa"]
               var rejectList = ["abb", "a", "bab", "baab", "aba", ""]
               var splitSymbol = "";
               acceptList.map(x => model.parseInput(x, splitSymbol));
               rejectList.map(x => model.parseInput(x, splitSymbol));
               acceptList.forEach(function(sequence){
                   expect(m2.accepts(sequence)).to.be.true;
               });
               rejectList.forEach(function(sequence){
                   expect(m2.accepts(sequence)).to.be.false;
               })
           })

           it("union should accept only sequences accepted by both m1 and m2", function(){
                var union = m1.getUnionWith(m2);
                var list = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab", "ababababbbbbaaa", "bbbbb", "ba", "ab", "ba", "baaa", "b", "baa", "abb", "a", "bab", "baab", "aba"]
                var splitSymbol = "";
                list.map(x => model.parseInput(x, splitSymbol));
                list.forEach(function(sequence){
                    if(m1.accepts(sequence) && m2.accepts(sequence)){
                        expect(union.accepts(sequence)).to.be.true;
                    } else {
                        expect(union.accepts(sequence)).to.be.false;
                    }
                });

            });

        });

        describe("union of ac* with a*c*b:", function(){
           var m1, m2, union;

           var m1 = new model.Machine("m1"); // ac*
           var m2 = new model.Machine("m2"); // a*c*b

           var m1Spec = {"nodes":[{"id":"A","x":101,"y":121,"isInit":true},{"id":"B","x":201,"y":125,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"B","from":"B","input":["c"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
           var m2Spec = {"nodes":[{"id":"A","x":93,"y":159,"isInit":true},{"id":"B","x":161,"y":86,"isAcc":true},{"id":"C","x":190,"y":181,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["c"]},{"to":"C","from":"A","input":["b"]},{"to":"B","from":"B","input":["c"]},{"to":"C","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};

           m1.build(m1Spec);
           m2.build(m2Spec);

           it("m1 should accept ac*", function(){
               var acceptList = ["a", "ac", "acc", "accc", "acccc", "acccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"]
               var rejectList = ["", "c", "ab", "cb", "ca", "acccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccca"]
               var splitSymbol = "";
               acceptList.map(x => model.parseInput(x, splitSymbol));
               rejectList.map(x => model.parseInput(x, splitSymbol));
               acceptList.forEach(function(sequence){
                   expect(m1.accepts(sequence)).to.be.true;
               });
               rejectList.forEach(function(sequence){
                   expect(m1.accepts(sequence)).to.be.false;
               })
           })

           it("m2 should accept a*c*b", function(){
               var acceptList = ["b", "acb", "ab", "cb", "aaccb"]
               var rejectList = ["", "ba", "acba", "acab", "abba", "bacca"]
               var splitSymbol = "";
               acceptList.map(x => model.parseInput(x, splitSymbol));
               rejectList.map(x => model.parseInput(x, splitSymbol));
               acceptList.forEach(function(sequence){
                   expect(m2.accepts(sequence)).to.be.true;
               });
               rejectList.forEach(function(sequence){
                   expect(m2.accepts(sequence)).to.be.false;
               })
           })

           it("union should accept only sequences accepted by both m1 and m2", function(){
                var union = m1.getUnionWith(m2);
                var list = ["", "a", "aaccb", "ab", "abba", "ac", "acab", "acb", "acba", "acc", "accc", "acccc", "accccccccccc", "accccccccccccccccccccccccccccccccccccccccccccccca", "b", "ba", "bacca", "c", "ca", "cb"];
                var splitSymbol = "";
                list.map(x => model.parseInput(x, splitSymbol));
                list.forEach(function(sequence){
                    if(m1.accepts(sequence) && m2.accepts(sequence)){
                        expect(union.accepts(sequence)).to.be.true;
                    } else {
                        expect(union.accepts(sequence)).to.be.false;
                    }
                });

            });

        });
    })




});

