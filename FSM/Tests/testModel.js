import "babel-polyfill";

/*global require */
/*global describe*/
/*global it*/
/*global before*/

var expect = require("chai").expect;
var model = require("../Source/model.js"); //NB - importing from Source not deploy, may need to be altered later.

describe("Model", function() {
    describe("Test that test has loaded correctly", function () {
        it("should pass if the model.js file has been imported correctly", function () {
            expect(model).to.be.ok;
            expect(model.machines).to.be.ok;
        });
    });

    describe("Model.addMachine()", function () {
        it("should increase the number of machines by one and return a machine", function () {
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

    describe("Model.addMachine()", function () {
        it("should increase the number of machines by one and return a machine", function () {
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

    describe("Model.deleteMachine()", function () {
        it("should decrease the number of machines by one", function () {
            var machine = model.machines[0];
            var id = machine.id;
            var machinesLength = model.machines.length;
            model.deleteMachine(id);
            expect(model.machines.length).to.equal(machinesLength - 1);
        });
    });

    describe("Test machine with single node", function () {
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
        it("machine's initial state should be accepting", function(){expect(machine.isInAcceptingState()).to.be.true;});
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
        it("machine's initial state should not be accepting", function(){expect(machine.isInAcceptingState()).to.be.false;});
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
            expect(machine.isInAcceptingState()).to.be.true;
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
            machine.addLink(node1, node2.id, ["a"], undefined, true);
            machine.addLink(node2.id, node1, ["a,b,c"], {}, false);
            expect(Object.keys(machine.nodes).length).to.equal(2);
        });

        it("machine should now have 2 links", function(){
            expect(Object.keys(machine.links).length).to.equal(2);
        });


        it("machine should now have 1 node", function(){
            machine.deleteNode(node2);
            expect(Object.keys(machine.nodes).length).to.equal(1);
        });

        it("machine should now have 0 links", function(){expect(Object.keys(machine.links).length).to.equal(0);});


        it("machine should now have 0 nodes", function(){
            machine.deleteNode(node1.id);
            expect(Object.keys(machine.nodes).length).to.equal(0);
        });
        it("machine should now have 0 links", function(){expect(Object.keys(machine.links).length).to.equal(0);});


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
            model.question.setUpQuestion(questionObj);
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
            expect(feedbackObj.isCorrectList.reduce((x,y) => x && y, true)).to.be.true; //all isCorrect entries should be true;
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
            expect(feedbackObj.isCorrectList.reduce((x,y) => x || y, false)).to.be.false; //all isCorrect entries should be false;
        });

        it("should reject duplicate entries", function(){
            questionObj = {"type": "give-list",
                           "lengths": [4,4],
                           "splitSymbol": ""
                        };
            model.question.setUpQuestion(questionObj);
            input = ["cdef", "cdef"];
            feedbackObj = model.question.checkAnswer(input);
            expect(feedbackObj).to.be.ok;
            expect(feedbackObj.isCorrectList[0]).to.be.true;
            expect(feedbackObj.allCorrectFlag).to.be.false;
            expect(feedbackObj.messages.reduce((x,y) => x + y, "")).to.not.equal(""); //all message entries should not be empty;
        });


    });

    describe("Test the satisfy-list question type", function(){
        var questionObj, spec,feedbackObj;

        before(function(){
            model.machines = [];
            questionObj = {"type": "satisfy-list",
                           "shouldAccept": ["10p 10p 10p 10p 10p", "20p 20p 10p", "10p 20p 20p 20p", "10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 10p 20p"],
                           "shouldReject": ["10p 20p", "20p 20p", "10p 10p 10p 10p", "", "10p"],
                           "splitSymbol": " "
                        };
            model.question.setUpQuestion(questionObj);
        });

        describe("should approve a correct machine", function(){
            before(function(){
                spec = {"nodes":[{"id":"A","x":61,"y":215,"isInit":true,"name":"0"},{"id":"B","x":150,"y":260,"name":"10"},{"id":"C","x":145,"y":160,"name":"20"},{"id":"D","x":318,"y":152,"isAcc":true,"name":"50+"},{"id":"E","x":234,"y":206,"name":"30"},{"id":"F","x":229,"y":106,"name":"40"}],
                        "links":[{"to":"B","from":"A","input":["10p"]},{"to":"C","from":"A","input":["20p"]},{"to":"C","from":"B","input":["10p"]},{"to":"D","from":"D","input":["10p","20p"]},{"to":"E","from":"C","input":["10p"]},{"to":"E","from":"B","input":["20p"]},{"to":"D","from":"E","input":["20p"]},{"to":"F","from":"E","input":["10p"]},{"to":"F","from":"C","input":["20p"]},{"to":"D","from":"F","input":["10p"]}],
                        "attributes":{"alphabet":["10p","20p"],"allowEpsilon":false,"isTransducer":false}
                    };
                model.addMachine(spec);
                feedbackObj = model.question.checkAnswer();
            });

            it("feedback object should be ok", function(){expect(feedbackObj).to.be.ok;});
            it("feedback object should be correct", function(){
                expect(feedbackObj.allCorrectFlag).to.be.true;
                expect(feedbackObj.acceptList.reduce((x,y) => x && y, true)).to.be.true;
                expect(feedbackObj.rejectList.reduce((x,y) => x && y, true)).to.be.true;
            });
        });

        describe("should reject an incorrect machine", function(){
            before(function(){
                model.machines = [];
                spec = {"nodes":[{"id":"A","x":61,"y":215,"isInit":true,"isAcc": true,"name":"0"},{"id":"B","x":150,"y":260,"name":"10"},{"id":"C","x":145,"y":160,"name":"20"},{"id":"D","x":318,"y":152,"isAcc":true,"name":"50+"},{"id":"E","x":234,"y":206,"name":"30"},{"id":"F","x":229,"y":106,"name":"40"}],
                        "links":[{"to":"B","from":"A","input":["10p"]},{"to":"C","from":"A","input":["20p"]},{"to":"C","from":"B","input":["10p"]},{"to":"D","from":"D","input":["10p","20p"]},{"to":"E","from":"C","input":["10p"]},{"to":"E","from":"B","input":["20p"]},{"to":"D","from":"E","input":["20p"]},{"to":"F","from":"E","input":["10p"]},{"to":"F","from":"C","input":["20p"]},{"to":"D","from":"F","input":["10p"]}],
                        "attributes":{"alphabet":["10p","20p"],"allowEpsilon":false,"isTransducer":false}
                    };
                model.addMachine(spec);
            });
            it("feedback object should be ok", function(){feedbackObj = model.question.checkAnswer();});
            it("allCorrectFlag should be false", function(){expect(feedbackObj.allCorrectFlag).to.be.false;});
            it("all entries in feedbackObj.acceptList should be true", function(){expect(feedbackObj.acceptList.reduce((x,y) => x && y, true)).to.be.true;});
            it("there should be at least one false entry in feedbackObj.rejectList", function(){expect(feedbackObj.rejectList.reduce((x,y) => x && y, true)).to.be.false;});
            it("feedbackObj.rejectList[3] should be false", function(){expect(feedbackObj.rejectList[3]).to.be.false;});

        }).pass;
    });

    describe("Test the give-equivalent question type", function(){
        before(function(){
            model.machines = [];

        });
        describe("test for machine equal to a*a(b|c)a*", function(){
            var targetMachineSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var targetMachine = new model.Machine("tgt");
            targetMachine.build(targetMachineSpec);
            var questionObj = {type:"give-equivalent",
                               splitSymbol: "",
                               targetMachineSpec
                               };
            before(function(){
                model.question.setUpQuestion(questionObj);
            });
            it("should reject incorrect input 1", function(){
                var incorrectSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169,"isAcc":true},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                var machine = model.addMachine(incorrectSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
                expect(feedbackObj.message.length > 0).to.be.true;
                if(feedbackObj.shouldAcceptIncorrect === true){
                    expect(machine.accepts(feedbackObj.incorrectSequence)).to.be.false;
                    expect(targetMachine.accepts(feedbackObj.incorrectSequence)).to.be.true;
                } else {
                    expect(machine.accepts(feedbackObj.incorrectSequence)).to.be.true;
                    expect(targetMachine.accepts(feedbackObj.incorrectSequence)).to.be.false;
                }
            });
            it("should reject incorrect input 2", function(){
                var incorrectSpec = {"nodes":[{"id":"A","x":92,"y":120,"isInit":true,"name":"0"},{"id":"B","x":192,"y":123,"name":"1"},{"id":"C","x":292,"y":125,"isAcc":true,"name":"2"},{"id":"D","x":392,"y":128,"isAcc":true,"name":"3"}],"links":[{"to":"B","from":"A","input":["a","b"]},{"to":"C","from":"B","input":["a"]},{"to":"A","from":"B","input":["b"]},{"to":"B","from":"C","input":["b"]},{"to":"D","from":"C","input":["b"]},{"to":"D","from":"D","input":["a","b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                var machine = model.addMachine(incorrectSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
                expect(feedbackObj.message.length > 0).to.be.true;
                if(feedbackObj.shouldAcceptIncorrect === true){
                    expect(machine.accepts(feedbackObj.incorrectSequence)).to.be.false;
                    expect(targetMachine.accepts(feedbackObj.incorrectSequence)).to.be.true;
                } else {
                    expect(machine.accepts(feedbackObj.incorrectSequence)).to.be.true;
                    expect(targetMachine.accepts(feedbackObj.incorrectSequence)).to.be.false;
                }
            });
            it("should reject a machine with no accepting states", function(){
                var noAccSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169,"isAcc":false},{"id":"C","x":272,"y":164,"isAcc":false}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(noAccSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
                expect(feedbackObj.message.length > 0).to.be.true;
            });
            it("should reject a machine with no initial states", function(){
                var noInitSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":false},{"id":"B","x":172,"y":169,"isAcc":true},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(noInitSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.false;
                expect(feedbackObj.message.length > 0).to.be.true;
            });
            it("should accept a machine identical to the spec", function(){
                var identicalSpec = {"nodes":[{"id":"A","x":72,"y":168,"isInit":true},{"id":"B","x":172,"y":169},{"id":"C","x":272,"y":164,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(identicalSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.true;
            });
            it("should accept a machine equivalent to the spec", function(){
                var equivalentSpec = {"nodes":[{"id":"A","x":75,"y":168,"isInit":true},{"id":"B","x":175,"y":163},{"id":"C","x":275,"y":164,"isAcc":true},{"id":"D","x":255,"y":103,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["c"]},{"to":"C","from":"C","input":["a"]},{"to":"D","from":"B","input":["b"]},{"to":"D","from":"D","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
                model.deleteMachine(model.machines[0].id);
                model.addMachine(equivalentSpec);
                var feedbackObj = model.question.checkAnswer();
                expect(feedbackObj.allCorrectFlag).to.be.true;
            });
        });
    });

    describe("Test the dfa-convert question type", function(){
        var machineLists = [[{"links": [{"input": ["a"], "to": "B", "from": "A"}, {"input": ["a"], "to": "C", "from": "B"}, {"input": ["a"], "to": "D", "from": "A"}, {"input": ["a"], "to": "C", "from": "C"}, {"input": ["b"], "to": "E", "from": "D"}, {"input": ["a"], "to": "D", "from": "D"}], "attributes": {"alphabet": ["a", "b"], "allowEpsilon": true}, "nodes": [{"name": "Q1", "x": 85, "y": 127, "isInit": true, "id": "A"}, {"name": "Q3", "x": 161, "y": 62, "id": "B"}, {"name": "Q4", "x": 250, "y": 108, "isAcc": true, "id": "C"}, {"name": "Q2", "x": 172, "y": 177, "id": "D"}, {"name": "Q5", "x": 272, "y": 175, "isAcc": true, "id": "E"}]}, {"links": [], "attributes": {"alphabet": ["a", "b"], "allowEpsilon": true}, "nodes": [{"name": "{Q1}", "x": 100, "y": 125, "isInit": true, "id": "A"}]}],
                            [{"nodes": [{"id": "A", "isInit": true, "y": 180, "name": "Q1", "x": 104}, {"id": "B", "y": 138, "name": "Q2", "x": 195}, {"id": "C", "y": 38, "name": "Q3", "x": 187}, {"id": "D", "y": 184, "name": "Q4", "x": 283}, {"id": "E", "y": 226, "isAcc": true, "name": "Q5", "x": 192}], "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true}, "links": [{"from": "A", "to": "B", "input": ["a"]}, {"from": "B", "to": "C", "input": ["b"]}, {"from": "C", "to": "B", "input": ["b"]}, {"from": "B", "to": "D", "input": ["b"]}, {"from": "D", "to": "E", "input": ["c"]}, {"hasEps": true, "from": "E", "to": "A"}]}, {"nodes": [{"id": "A", "isInit": true, "y": 125, "name": "{Q1}", "x": 100}], "attributes": {"alphabet": ["a", "b", "c"], "allowEpsilon": true}, "links": []}],
                                       [{"nodes":[{"id":"A","x":81,"y":125,"isInit":true,"name":"Q2"},{"id":"B","x":105,"y":67,"isInit":true,"name":"Q1"},{"id":"C","x":99,"y":193,"isInit":true,"name":"Q3"},{"id":"D","x":204,"y":59,"name":"Q4"},{"id":"E","x":304,"y":57,"name":"Q5"},{"id":"F","x":404,"y":65,"isAcc":true,"name":"Q6"},{"id":"G","x":180,"y":114,"name":"Q7"},{"id":"H","x":197,"y":213,"isAcc":true,"name":"Q8"},{"id":"I","x":274,"y":149,"name":"Q9"}],"links":[{"to":"D","from":"B","input":["a1"]},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"F","input":["a1"]},{"to":"G","from":"A","input":["a2","a3"]},{"to":"H","from":"G","input":["a3"]},{"to":"H","from":"C","input":["a2"]},{"to":"I","from":"H","input":["a2"]},{"to":"G","from":"I"}],"attributes":{"alphabet":["a1","a2","a3"],"allowEpsilon":true}},{"nodes":[{"id":"A","x":100,"y":125,"isInit":true,"name":"{Q1,Q2,Q3}"}],"links":[],"attributes":{"alphabet":["a1","a2","a3"],"allowEpsilon":true}}]];
        machineLists.forEach(function(machineList, i){
            it(`should produce a machine equivalent to m1 for machineList ${i + 1}`, function(){
                model.machines = [];
                var m1 = model.addMachine(machineList[0]);
                var m2 = model.addMachine(machineList[1]);
                var questionObj = {type: "dfa-convert", "allowEpsilon": "true", splitSymbol: ""};
                model.question.setUpQuestion(questionObj);
                var done = false;
                //Use the prompt obj to select the appropriate nodes, until m2 is complete
                while(!done){
                    var promptObj = model.question.getNextDfaPrompt();
                    var m1Nodes = promptObj.m1Nodes;
                    var symbol = promptObj.symbol;
                    m1.getNodeList().forEach(function(node){node.selected = false;});
                    m1.setToState(m1Nodes);
                    m1.followEpsilonTransitions();
                    m1.step(symbol);
                    m1.followEpsilonTransitions();
                    var newStates = m1.getCurrentNodeList();
                    newStates.forEach(function(node){node.selected = true;});

                    var feedbackObj = model.question.checkAnswer();
                    expect(feedbackObj.thisCorrect).to.be.true;
                    expect(feedbackObj.falsePositive).to.equal(undefined);
                    expect(feedbackObj.falseNegative).to.equal(undefined);
                    if(model.question.frontier.length === 0){
                        expect(feedbackObj.allCorrectFlag).to.be.true;
                    }
                    done = feedbackObj.allCorrectFlag;
                }

                //check that m1 is equivilant to m2
                var isEquivalent = m1.isEquivalentTo(m2);
                expect(isEquivalent).to.be.true;
            });
        });
    });

    describe("Test the satisfy-definition question type", function(){
        describe("It should correctly identify a correct machine", function(){
            var questionObj, spec, feedbackObj;

            before(function(){
                questionObj = {
                    type: "satisfy-definition",
                    text: "A formal language is used to precisely define a Finite State Machine. <br>A machine <em>M</em> consists of:<br><em>Q</em>: the set of states,<br>Σ: the alphabet of the machine - all symbols the machine can process,<br><em>s</em><sub>0</sub>: the initial state of the machine<br><em>F</em>: the set of the machine's accepting states.<br>δ: The set of transitions the machine allows, with each transition in the form (source state, input symbol, end state).<br><br>Construct the Finite State Machine defined by<br><br><em>Q</em> = {1,2,3,4}<br><em>Σ</em> = {a,b,c}<br><em>s<sub>0</sub></em> = {1}<br><em>F</em> = {3,4}<br><em>δ</em> = {(1,a,2),(2,b,3),(2,c,4),(3,b,2)}",
                    allowEpsilon: "false",
                    splitSymbol: "",
                    definition: {states: ["1","2","3","4"],
                                alphabet: ["a","b","c"],
                                initialStates: ["1"],
                                acceptingStates: ["3","4"],
                                links: [{to: "2",from: "1",symbol: "a"},{to: "3",from: "2",symbol: "b"},{to: "4",from: "2",symbol: "c"},{to: "2",from: "3",symbol: "b"}]
                                }
                };
                spec = {nodes:[{id:"A",x:105,y:175,isInit:true,name:"1"},{id:"B",x:201,y:148,name:"2"},{id:"C",x:202,y:48,isAcc:true,name:"3"},{id:"D",x:301,y:151,isAcc:true,name:"4"}],links:[{to:"B",from:"A",input:["a"]},{to:"C",from:"B",input:["b"]},{to:"D",from:"B",input:["c"]},{to:"B",from:"C",input:["b"]}],attributes:{alphabet:["a","b","c"],allowEpsilon:false}};
                model.machines = [];
                model.addMachine(spec);
                model.question.setUpQuestion(questionObj);
            });



            it("feedback object should be ok", function(){

                feedbackObj = model.question.checkAnswer();
                expect(feedbackObj).to.be.ok;
            });
            it("feedback object should be correct", function(){
                expect(feedbackObj.allCorrectFlag).to.be.true;
                expect(feedbackObj.message.length).to.equal(0);
            });

        });
        describe("It should correctly reject a machine missing a link", function(){

            var questionObj, spec, feedbackObj;

            before(function(){
                questionObj = {
                    type: "satisfy-definition",
                    text: "A formal language is used to precisely define a Finite State Machine. <br>A machine <em>M</em> consists of:<br><em>Q</em>: the set of states,<br>Σ: the alphabet of the machine - all symbols the machine can process,<br><em>s</em><sub>0</sub>: the initial state of the machine<br><em>F</em>: the set of the machine's accepting states.<br>δ: The set of transitions the machine allows, with each transition in the form (source state, input symbol, end state).<br><br>Construct the Finite State Machine defined by<br><br><em>Q</em> = {1,2,3,4}<br><em>Σ</em> = {a,b,c}<br><em>s<sub>0</sub></em> = {1}<br><em>F</em> = {3,4}<br><em>δ</em> = {(1,a,2),(2,b,3),(2,c,4),(3,b,2)}",
                    allowEpsilon: "false",
                    splitSymbol: "",
                    definition: {states: ["1","2","3","4"],
                                alphabet: ["a","b","c"],
                                initialStates: ["1"],
                                acceptingStates: ["3","4"],
                                links: [{to: "2",from: "1",symbol: "a"},{to: "3",from: "2",symbol: "b"},{to: "4",from: "2",symbol: "c"},{to: "2",from: "3",symbol: "b"}]
                                }
                };

                spec = {nodes:[{id:"A",x:105,y:175,isInit:true,name:"1"},{id:"B",x:201,y:148,name:"2"},{id:"C",x:202,y:48,isAcc:true,name:"3"},{id:"D",x:301,y:151,isAcc:true,name:"4"}],links:[{to:"C",from:"B",input:["b"]},{to:"D",from:"B",input:["c"]},{to:"B",from:"C",input:["b"]}],attributes:{alphabet:["a","b","c"],allowEpsilon:false}};
                model.machines = [];
                model.addMachine(spec);
                model.question.setUpQuestion(questionObj);
            });



            it("feedback object should be ok", function(){

                feedbackObj = model.question.checkAnswer();
                expect(feedbackObj).to.be.ok;
            });
            it("allCorrectFlag should be false", function(){
                expect(feedbackObj.allCorrectFlag).to.be.false;
            });
            it("message should not be empty", function(){
                expect(feedbackObj.message.length).to.not.equal(0);
                expect(feedbackObj.message.includes("link")).to.be.true;
            });

        });
        describe("It should correctly reject a machine with incorrect accepting states", function(){
            var questionObj, spec, feedbackObj;

            before(function(){
                questionObj = {
                    type: "satisfy-definition",
                    text: "A formal language is used to precisely define a Finite State Machine. <br>A machine <em>M</em> consists of:<br><em>Q</em>: the set of states,<br>Σ: the alphabet of the machine - all symbols the machine can process,<br><em>s</em><sub>0</sub>: the initial state of the machine<br><em>F</em>: the set of the machine's accepting states.<br>δ: The set of transitions the machine allows, with each transition in the form (source state, input symbol, end state).<br><br>Construct the Finite State Machine defined by<br><br><em>Q</em> = {1,2,3,4}<br><em>Σ</em> = {a,b,c}<br><em>s<sub>0</sub></em> = {1}<br><em>F</em> = {3,4}<br><em>δ</em> = {(1,a,2),(2,b,3),(2,c,4),(3,b,2)}",
                    allowEpsilon: "false",
                    splitSymbol: "",
                    definition: {states: ["1","2","3","4"],
                                alphabet: ["a","b","c"],
                                initialStates: ["1"],
                                acceptingStates: ["3","4"],
                                links: [{to: "2",from: "1",symbol: "a"},{to: "3",from: "2",symbol: "b"},{to: "4",from: "2",symbol: "c"},{to: "2",from: "3",symbol: "b"}]
                                }
                };

                spec = {nodes:[{id:"A",x:105,y:175,isInit:true,isAcc:true,name:"1"},{id:"B",x:201,y:148,name:"2"},{id:"C",x:202,y:48,name:"3"},{id:"D",x:301,y:151,isAcc:true,name:"4"}],links:[{to:"B",from:"A",input:["a"]},{to:"C",from:"B",input:["b"]},{to:"D",from:"B",input:["c"]},{to:"B",from:"C",input:["b"]}],attributes:{alphabet:["a","b","c"],allowEpsilon:false}};
                model.machines = [];
                model.addMachine(spec);
                model.question.setUpQuestion(questionObj);
            });


            it("feedback object should be ok", function(){
                feedbackObj = model.question.checkAnswer();
                expect(feedbackObj).to.be.ok;
            });
            it("allCorrectFlag should be false", function(){
                expect(feedbackObj.allCorrectFlag).to.be.false;
            });
            it("message should not be empty", function(){
                expect(feedbackObj.message.length).to.not.equal(0);
                expect(feedbackObj.message.includes("state")).to.be.true;
            });

        });
        describe("It should correctly accept a correct machine with epsilon transitions", function(){
            var questionObj, spec, feedbackObj;

            before(function(){
                questionObj = {
                    "type": "satisfy-definition",
                    "text": "<em>Q</em> = {1,2,3,4,5,6,7,8}<br><em>Σ</em> = {1,2}<br><em>s<sub>0</sub></em> = {1}<br><em>F</em> = {8}<br><em>δ</em> = {(1,1,2),(1,1,4),(2,2,2),(2,2,3),(3,1,3),(3,ε,8),(4,1,5),(4,2,6),(5,1,5),(5,2,5),(6,1,4),(6,1,6),(6,2,7),(7,ε,8)}<br>",
                    "allowEpsilon": "true",
                    "splitSymbol": ", ",
                    "definition": {"states": ["1","3","2","4","5","6","7","8"],
                    "alphabet": ["1","2"],
                    "initialStates": ["1"],
                    "acceptingStates": ["8"],
                    "links": [{"to": "2","from": "1","symbol": "1"},{"to": "4","from": "1","symbol": "1"},{"to": "2","from": "2","symbol": "2"},{"to": "3","from": "2","symbol": "2"},{"to": "3","from": "3","symbol": "1"},{"to": "8","from": "3","symbol": "ε","epsilon": true},{"to": "5","from": "4","symbol": "1"},{"to": "5","from": "5","symbol": "1"},{"to": "5","from": "5","symbol": "2"},{"to": "6","from": "4","symbol": "2"},{"to": "4","from": "6","symbol": "1"},{"to": "6","from": "6","symbol": "1"},{"to": "7","from": "6","symbol": "2"},{"to": "8","from": "7","symbol": "ε","epsilon": true}]
                  }
                };

                spec = {"nodes":[{"id":"A","x":119,"y":140,"isInit":true,"name":"1"},{"id":"B","x":195,"y":76,"name":"2"},{"id":"C","x":295,"y":82,"name":"3"},{"id":"D","x":383,"y":129,"isAcc":true,"name":"8"},{"id":"E","x":163,"y":230,"name":"4"},{"id":"F","x":238,"y":164,"name":"6"},{"id":"G","x":255,"y":269,"name":"5"},{"id":"H","x":326,"y":211,"name":"7"}],"links":[{"to":"B","from":"A","input":["1"]},{"to":"E","from":"A","input":["1"]},{"to":"B","from":"B","input":["2"]},{"to":"C","from":"B","input":["2"]},{"to":"C","from":"C","input":["1"]},{"to":"D","from":"C","hasEps":true},{"to":"G","from":"E","input":["1"]},{"to":"F","from":"E","input":["2"]},{"to":"G","from":"G","input":["1","2"]},{"to":"E","from":"F","input":["1"]},{"to":"F","from":"F","input":["1"]},{"to":"H","from":"F","input":["2"]},{"to":"D","from":"H","hasEps":true}],"attributes":{"alphabet":["1","2"],"allowEpsilon":true}};
                model.machines = [];
                model.addMachine(spec);
                model.question.setUpQuestion(questionObj);
            });

            it("feedback object should be ok", function(){
                feedbackObj = model.question.checkAnswer();
                expect(feedbackObj).to.be.ok;
            });
            it("feedback object should be correct", function(){
                expect(feedbackObj.allCorrectFlag).to.be.true;
                expect(feedbackObj.message.length).to.equal(0);
            });
        });

        describe("It should correctly reject an incorrect machine with a misplaced epsilon transition", function(){
            var questionObj, spec, feedbackObj;

            before(function(){
                questionObj = {
                    "type": "satisfy-definition",
                    "text": "<em>Q</em> = {1,2,3,4,5,6,7,8}<br><em>Σ</em> = {1,2}<br><em>s<sub>0</sub></em> = {1}<br><em>F</em> = {8}<br><em>δ</em> = {(1,1,2),(1,1,4),(2,2,2),(2,2,3),(3,1,3),(3,ε,8),(4,1,5),(4,2,6),(5,1,5),(5,2,5),(6,1,4),(6,1,6),(6,2,7),(7,ε,8)}<br>",
                    "allowEpsilon": "true",
                    "splitSymbol": ", ",
                    "definition": {"states": ["1","3","2","4","5","6","7","8"],
                    "alphabet": ["1","2"],
                    "initialStates": ["1"],
                    "acceptingStates": ["8"],
                    "links": [{"to": "2","from": "1","symbol": "1"},{"to": "4","from": "1","symbol": "1"},{"to": "2","from": "2","symbol": "2"},{"to": "3","from": "2","symbol": "2"},{"to": "3","from": "3","symbol": "1"},{"to": "8","from": "3","symbol": "ε","epsilon": true},{"to": "5","from": "4","symbol": "1"},{"to": "5","from": "5","symbol": "1"},{"to": "5","from": "5","symbol": "2"},{"to": "6","from": "4","symbol": "2"},{"to": "4","from": "6","symbol": "1"},{"to": "6","from": "6","symbol": "1"},{"to": "7","from": "6","symbol": "2"},{"to": "8","from": "7","symbol": "ε","epsilon": true}]
                  }
                };

                spec = {"nodes":[{"id":"A","x":119,"y":140,"isInit":true,"name":"1"},{"id":"B","x":195,"y":76,"name":"2"},{"id":"C","x":295,"y":82,"name":"3"},{"id":"D","x":383,"y":129,"isAcc":true,"name":"8"},{"id":"E","x":163,"y":230,"name":"4"},{"id":"F","x":238,"y":164,"name":"6"},{"id":"G","x":255,"y":269,"name":"5"},{"id":"H","x":326,"y":211,"name":"7"}],"links":[{"to":"B","from":"A","input":["1"]},{"to":"E","from":"A","input":["1"]},{"to":"B","from":"B","input":["2"], "hasEps":true},{"to":"C","from":"B","input":["2"]},{"to":"C","from":"C","input":["1"]},{"to":"D","from":"C","hasEps":true},{"to":"G","from":"E","input":["1"]},{"to":"F","from":"E","input":["2"]},{"to":"G","from":"G","input":["1","2"]},{"to":"E","from":"F","input":["1"]},{"to":"F","from":"F","input":["1"]},{"to":"H","from":"F","input":["2"]},{"to":"D","from":"H","hasEps":true}],"attributes":{"alphabet":["1","2"],"allowEpsilon":true}};
                model.machines = [];
                model.addMachine(spec);
                model.question.setUpQuestion(questionObj);
            });

            it("feedback object should be ok", function(){
                feedbackObj = model.question.checkAnswer();
                expect(feedbackObj).to.be.ok;
            });
            it("allCorrectFlag should be false", function(){
                expect(feedbackObj.allCorrectFlag).to.be.false;
            });
            it("message should not be empty", function(){
                expect(feedbackObj.message.length).to.not.equal(0);
                expect(feedbackObj.message.includes("state")).to.be.true;
            });
        });
    });

    describe("Test Machine.getTrace()", function(){
        describe("Test with a simple machine with only 3 states", function(){
            var machine, traceObj;
            before(function(){
                var spec = {"nodes":[{"id":"A","x":91,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],
                            "links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]}],
                            "attributes":{"alphabet":["a","b"],"allowEpsilon":false,"isTransducer":false}};
                machine = model.addMachine(spec);
            });
            it("traceObj should be ok", function(){
                traceObj = machine.getTrace(["a","b"]);
                expect(traceObj).to.be.ok;
            });
            it("The expected properties of traceObj should be present", function(){
                expect(traceObj.states).to.be.ok;
                expect(traceObj.links).to.be.ok;
                expect(traceObj.doesAccept).to.be.ok;
                expect(traceObj.input).to.be.ok;
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
                expect(traceObj.links[1][0].inputIndex).to.equal(0);

                expect(traceObj.links[2].length).to.equal(1);
                expect(traceObj.links[2][0].epsUsed).to.be.false;
                expect(traceObj.links[2][0].inputIndex).to.equal(0);
            });
            it("traceObj.doesAccept should be true", function(){expect(traceObj.doesAccept).to.be.true;});
            it("traceObj.input should be correct", function(){
                expect(traceObj.input.length).to.equal(2);
                expect(traceObj.input[0]).to.equal("a");
                expect(traceObj.input[1]).to.equal("b");
            });
        });
    });

    describe("Test conversion to DFA", function(){
        before(function(){
            model.machines = [];
        });



        describe("test machine 1:", function(){
            var spec = {"nodes":[{"id":"A","x":104,"y":108,"isInit":true},{"id":"B","x":187,"y":164},{"id":"C","x":277,"y":121,"isAcc":true},{"id":"D","x":194,"y":65}],"links":[{"to":"B","from":"A","input":["c"]},{"to":"C","from":"B","input":["c"],"hasEps":true},{"to":"D","from":"A","input":["a"]},{"to":"C","from":"D","input":["b"]},{"to":"A","from":"D","hasEps":true},{"to":"D","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec);
            var shouldAccept = ["ab", "abab", "cc", "c", "ccab", "ccacc", "ccac", "abacab"].map(str => model.parseInput(str, ""));
            var shouldReject = ["b", "a", "cb", "caa"].map(str => model.parseInput(str, ""));

            describe("before conversion", function(){
                shouldAccept.forEach(function(sequence){
                    var displayStr = sequence.reduce((x,y)=>x+y);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });
                shouldReject.forEach(function(sequence){
                    var displayStr = sequence.reduce((x,y)=>x+y);
                    it(`should reject '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.false;
                    });
                });

            });

            describe("after conversion", function(){
                before(function(){machine.convertToDFA();});
                shouldAccept.forEach(function(sequence){
                    var displayStr = sequence.reduce((x,y)=>x+y);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });
                shouldReject.forEach(function(sequence){
                    var displayStr = sequence.reduce((x,y)=>x+y);
                    it(`should reject '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.false;
                    });
                });

            });
        });

        describe("test machine 2:", function(){
            var spec = {"nodes":[{"id":"A","x":57,"y":140,"isAcc":true,"isInit":true,"name":"b"},{"id":"B","x":83,"y":73,"isInit":true,"name":"a"},{"id":"C","x":81,"y":204,"isInit":true,"name":"c"},{"id":"D","x":157,"y":140,"name":"t1"},{"id":"E","x":257,"y":135,"name":"t2"},{"id":"F","x":357,"y":143,"name":"q"},{"id":"G","x":428,"y":73,"isAcc":true,"name":"q`"},{"id":"H","x":449,"y":182,"isAcc":true,"name":"q``"}],"links":[{"to":"D","from":"C","hasEps":true},{"to":"D","from":"A","input":["s1"]},{"to":"D","from":"B","hasEps":true},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"E","input":["s1","s2","s3"]},{"to":"G","from":"F","input":["s1"]},{"to":"H","from":"F","input":["s2","s3"]}],"attributes":{"alphabet":["s1","s2","s3"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec);
            var splitSymbol = " ";
            var shouldAccept = ["s1 s1 s2 s3 s1", "s3", "s2", ""];

            describe("before conversion", function(){
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });

            });

            describe("after conversion", function(){
                before(function(){machine.convertToDFA();});
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });
            });
        });
    });

    describe("Test minimization to DFA:", function(){
        before(function(){
            model.machines = [];
        });
        describe("test machine 1", function(){
            var spec = {"nodes":[{"id":"A","x":57,"y":140,"isAcc":true,"isInit":true,"name":"b"},{"id":"B","x":83,"y":73,"isInit":true,"name":"a"},{"id":"C","x":81,"y":204,"isInit":true,"name":"c"},{"id":"D","x":157,"y":140,"name":"t1"},{"id":"E","x":257,"y":135,"name":"t2"},{"id":"F","x":357,"y":143,"name":"q"},{"id":"G","x":428,"y":73,"isAcc":true,"name":"q`"},{"id":"H","x":449,"y":182,"isAcc":true,"name":"q``"}],"links":[{"to":"D","from":"C","hasEps":true},{"to":"D","from":"A","input":["s1"]},{"to":"D","from":"B","hasEps":true},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"E","input":["s1","s2","s3"]},{"to":"G","from":"F","input":["s1"]},{"to":"H","from":"F","input":["s2","s3"]}],"attributes":{"alphabet":["s1","s2","s3"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec);
            var splitSymbol = " ";
            var shouldAccept = ["s1 s1 s2 s3 s1", "s3", "s2", "", "s1 s2 s1"];

            describe("before minimization", function(){
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });

            });

            describe("after minimization", function(){
                before(function(){machine.minimize();});
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });

            });
        });
        describe("check that minimized machines are equivalent", function(){
            var specs = [{"nodes":[{"id":"A","x":81,"y":125,"isInit":true,"name":"Q2"},{"id":"B","x":105,"y":67,"isInit":true,"name":"Q1"},{"id":"C","x":99,"y":193,"isInit":true,"name":"Q3"},{"id":"D","x":204,"y":59,"name":"Q4"},{"id":"E","x":304,"y":57,"name":"Q5"},{"id":"F","x":404,"y":65,"isAcc":true,"name":"Q6"},{"id":"G","x":180,"y":114,"name":"Q7"},{"id":"H","x":197,"y":213,"isAcc":true,"name":"Q8"},{"id":"I","x":274,"y":149,"name":"Q9"}],"links":[{"to":"D","from":"B","input":["a1"]},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"F","input":["a1"]},{"to":"G","from":"A","input":["a2","a3"]},{"to":"H","from":"G","input":["a3"]},{"to":"H","from":"C","input":["a2"]},{"to":"I","from":"H","input":["a2"]},{"to":"G","from":"I"}],"attributes":{"alphabet":["a1","a2","a3"],"allowEpsilon":true}},
                         {"nodes":[{"id":"A","x":57,"y":140,"isAcc":true,"isInit":true,"name":"b"},{"id":"B","x":83,"y":73,"isInit":true,"name":"a"},{"id":"C","x":81,"y":204,"isInit":true,"name":"c"},{"id":"D","x":157,"y":140,"name":"t1"},{"id":"E","x":257,"y":135,"name":"t2"},{"id":"F","x":357,"y":143,"name":"q"},{"id":"G","x":428,"y":73,"isAcc":true,"name":"q`"},{"id":"H","x":449,"y":182,"isAcc":true,"name":"q``"}],"links":[{"to":"D","from":"C","hasEps":true},{"to":"D","from":"A","input":["s1"]},{"to":"D","from":"B","hasEps":true},{"to":"E","from":"D","hasEps":true},{"to":"F","from":"E","hasEps":true},{"to":"E","from":"E","input":["s1","s2","s3"]},{"to":"G","from":"F","input":["s1"]},{"to":"H","from":"F","input":["s2","s3"]}],"attributes":{"alphabet":["s1","s2","s3"],"allowEpsilon":true,"isTransducer":false}},
                         {"nodes":[{"id":"A","x":114,"y":74,"isInit":true},{"id":"B","x":287,"y":231,"isInit":true},{"id":"C","x":316,"y":136,"isInit":true},{"id":"D","x":191,"y":206},{"id":"E","x":96,"y":173,"isAcc":true},{"id":"F","x":274,"y":45},{"id":"G","x":205,"y":117}],"links":[{"to":"E","from":"A","input":["a"]},{"to":"D","from":"E","input":["b"]},{"to":"B","from":"D","hasEps":true},{"to":"C","from":"B","input":["b"]},{"to":"F","from":"C","input":["a"]},{"to":"F","from":"F","input":["a"]},{"to":"G","from":"F","hasEps":true},{"to":"A","from":"G","input":["a"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}}];
            specs.forEach(function(spec, i){
                it(`machine ${i+1} should be equivilant to itself after minimization`, function(){
                    var machineOrig = model.addMachine(spec);
                    var machineMinimized = model.addMachine(spec);
                    machineMinimized.minimize();
                    expect(machineOrig.isEquivalentTo(machineMinimized)).to.be.true;
                });
            });
        });
    });
    describe("Test Machine.reverse()", function(){
        before(function(){
            model.machines = [];
        });
        describe("simple example", function(){
            var spec = {"nodes":[{"id":"A","x":148,"y":119,"isInit":true},{"id":"B","x":248,"y":125,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"A","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
            var machine = model.addMachine(spec);
            var splitSymbol = "";
            var shouldAccept = ["a", "aba", "ababa"];
            var shouldReject = ["b", "aa", "baba", "abab"];

            describe("before reversing", function(){
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });
                shouldReject.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should reject '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.false;
                    });
                });
            });

            describe("after reversing", function(){
                before(function(){machine.reverse();});
                shouldAccept.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should accept '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.true;
                    });
                });
                shouldReject.forEach(function(displayStr){
                    var sequence = model.parseInput(displayStr, splitSymbol);
                    it(`should reject '${displayStr}'`, function(){
                        expect(machine.accepts(sequence)).to.be.false;
                    });
                });
            });

        });
    });
    describe("Test machine.isEquivalentTo():", function(){
        before(function(){
            model.machines = [];
        });
        describe("simple example", function(){
            var spec1 = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["c"]},{"to":"B","from":"B","input":["a","b"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var spec2 = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]},{"to":"B","from":"B","input":["a","c"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var m1 = model.addMachine(spec1);
            var m2 = model.addMachine(spec2);
            it("m1 should accept 'aabbc' and m2 should not", function(){
                expect(m1.accepts(["a", "a", "b", "b", "c"])).to.be.true;
                expect(m2.accepts(["a", "a", "b", "b", "c"])).to.be.false;
            });
            it("m2 should accept 'aaccb' and m1 should not", function(){
                expect(m2.accepts(["a", "a", "c", "c", "b"])).to.be.true;
                expect(m1.accepts(["a", "a", "c", "c", "b"])).to.be.false;
            });
            it("m1 and m2 should not be equivalent", function(){
                expect(m1.isEquivalentTo(m2)).to.be.false;
                expect(m2.isEquivalentTo(m1)).to.be.false;
            });
            it("m1 should be equivalent to itself", function(){
                expect(m1.isEquivalentTo(m1)).to.be.true;
            });
            it("m2 should be equivalent to itself", function(){
                expect(m2.isEquivalentTo(m2)).to.be.true;
            });
        });
    });

    describe("test machine.getUnionWith()", function(){
        describe("union of a*b* with ab:", function(){
            const m1 = new model.Machine("a*b*");
            const m2 = new model.Machine("ab");

            const m1Spec = {"nodes":[{"id":"A","x":95,"y":131,"isAcc":true,"isInit":true},{"id":"B","x":195,"y":130,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["b"]},{"to":"B","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
            const m2Spec = {"nodes":[{"id":"A","x":90,"y":120,"isInit":true},{"id":"B","x":190,"y":123},{"id":"C","x":290,"y":119,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};

            m1.build(m1Spec);
            m2.build(m2Spec);

            it("m1 should accept a*b*", function(){
                const acceptList = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab"];
                const rejectList = ["ba", "abbba", "bbba", "ababababa"];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.false;
                });
            });

            it("m2 should accept ab", function(){
                const acceptList = ["ab"];
                const rejectList = ["ba", "abbba", "bbba", "ababababa", "", "a", "b", "aab", "aaa", "bbb", "abbbb"];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.false;
                });
            });

            it("union should accept only ab", function(){
                var union = m1.getUnionWith(m2);
                var acceptList = ["ab"];
                var rejectList = ["ba", "abbba", "bbba", "ababababa", "", "a", "b", "aab", "aaa", "bbb", "abbbb"];
                var splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(union.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(union.accepts(sequence)).to.be.false;
                });

            });


        });

        describe("union of (a*b*)*|(ba) with (ab)|(ba*):", function(){
            const m1 = new model.Machine("m1"); //(a*b*)*|(ba)
            const m2 = new model.Machine("m2"); //(ab)|(ba*)

            const m1Spec = {"nodes":[{"id":"A","x":126,"y":77,"isInit":true},{"id":"B","x":226,"y":83},{"id":"C","x":325,"y":76,"isAcc":true},{"id":"D","x":92,"y":157,"isAcc":true,"isInit":true},{"id":"E","x":192,"y":162,"isAcc":true}],"links":[{"to":"B","from":"A","input":["b"]},{"to":"C","from":"B","input":["a"]},{"to":"D","from":"D","input":["a"]},{"to":"E","from":"D","input":["b"]},{"to":"E","from":"E","input":["b"]},{"to":"D","from":"E","input":["a"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};
            const m2Spec = {"nodes":[{"id":"A","x":104,"y":92,"isInit":true},{"id":"B","x":204,"y":92},{"id":"C","x":304,"y":95,"isAcc":true},{"id":"D","x":166,"y":170,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b"]},{"to":"D","from":"A","input":["b"]},{"to":"D","from":"D","input":["a"]}],"attributes":{"alphabet":["a","b"],"allowEpsilon":true,"isTransducer":false}};

            m1.build(m1Spec);
            m2.build(m2Spec);

            it("m1 should accept (a*b*)*|(ba)", function(){
                const acceptList = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab", "ababababbbbbaaa", "bbbbb", "ba"];
                const rejectList = [];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.false;
                });
            });

            it("m2 should accept (ab)|(ba*)", function(){
                const acceptList = ["ab", "ba", "baaa", "b", "baa"];
                const rejectList = ["abb", "a", "bab", "baab", "aba", ""];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.false;
                });
            });

            it("union should accept only sequences accepted by both m1 and m2", function(){
                const union = m1.getUnionWith(m2);
                const list = ["", "a", "b", "aab", "aaa", "bbb", "abbbb", "ab", "ababababbbbbaaa", "bbbbb", "ba", "ab", "ba", "baaa", "b", "baa", "abb", "a", "bab", "baab", "aba"];
                const splitSymbol = "";
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
            const m1 = new model.Machine("m1"); // ac*
            const m2 = new model.Machine("m2"); // a*c*b

            const m1Spec = {"nodes":[{"id":"A","x":101,"y":121,"isInit":true},{"id":"B","x":201,"y":125,"isAcc":true}],"links":[{"to":"B","from":"A","input":["a"]},{"to":"B","from":"B","input":["c"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            const m2Spec = {"nodes":[{"id":"A","x":93,"y":159,"isInit":true},{"id":"B","x":161,"y":86,"isAcc":true},{"id":"C","x":190,"y":181,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["c"]},{"to":"C","from":"A","input":["b"]},{"to":"B","from":"B","input":["c"]},{"to":"C","from":"B","input":["b"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};

            m1.build(m1Spec);
            m2.build(m2Spec);

            it("m1 should accept ac*", function(){
                const acceptList = ["a", "ac", "acc", "accc", "acccc", "acccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"];
                const rejectList = ["", "c", "ab", "cb", "ca", "acccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccca"];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m1.accepts(sequence)).to.be.false;
                });
            });

            it("m2 should accept a*c*b", function(){
                const acceptList = ["b", "acb", "ab", "cb", "aaccb"];
                const rejectList = ["", "ba", "acba", "acab", "abba", "bacca"];
                const splitSymbol = "";
                acceptList.map(x => model.parseInput(x, splitSymbol));
                rejectList.map(x => model.parseInput(x, splitSymbol));
                acceptList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.true;
                });
                rejectList.forEach(function(sequence){
                    expect(m2.accepts(sequence)).to.be.false;
                });
            });

            it("union should accept only sequences accepted by both m1 and m2", function(){
                const union = m1.getUnionWith(m2);
                const list = ["", "a", "aaccb", "ab", "abba", "ac", "acab", "acb", "acba", "acc", "accc", "acccc", "accccccccccc", "accccccccccccccccccccccccccccccccccccccccccccccca", "b", "ba", "bacca", "c", "ca", "cb"];
                const splitSymbol = "";
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
    });

    describe("Test Machine.completelySpecify", function(){
        describe("'Ignore' mode", function(){
            var spec = {"nodes":[{"id":"A","x":157,"y":173,"isInit":true},{"id":"B","x":256,"y":157},{"id":"C","x":168,"y":73,"isAcc":true},{"id":"D","x":356,"y":152}],"links":[{"to":"B","from":"A","input":["open"]},{"to":"C","from":"A","input":["lock"]},{"to":"A","from":"C","input":["unlock"]},{"to":"D","from":"B","input":["lock"]},{"to":"B","from":"D","input":["unlock"]},{"to":"A","from":"B","input":["close"]}],"attributes":{"alphabet":["open","close","lock","unlock"],"allowEpsilon":true,"isTransducer":false}};
            var originalMachine = new model.Machine("orig");
            originalMachine.build(spec);
            var completeMachine = new model.Machine("comp");
            completeMachine.build(spec);
            completeMachine.completelySpecify("ignore");
            describe("Complete machine should accept everything that the original does", function(){
                var accList = ["lock", "open close lock", "open lock unlock close lock", "lock unlock lock"];
                var splitSymbol = " ";
                accList.forEach(function(str){
                    var sequence = model.parseInput(str, splitSymbol);
                    it(`both should accept '${str}'`, function(){
                        expect(originalMachine.accepts(sequence)).to.be.true;
                        expect(completeMachine.accepts(sequence)).to.be.true;
                    });
                });
            });
            describe("Complete machine should ignore unexpected input", function(){
                var accList = ["lock open", "open open close close lock", "open open lock lock close unlock close lock", " lock lock unlock unlock lock"];
                var splitSymbol = " ";
                accList.forEach(function(str){
                    var sequence = model.parseInput(str, splitSymbol);
                    it(`Only the complete machine should accept '${str}'`, function(){
                        expect(originalMachine.accepts(sequence)).to.be.false;
                        expect(completeMachine.accepts(sequence)).to.be.true;
                    });
                });
            });
        });
    });

    describe("Test Machine.mergeNodes", function(){
        describe("machine 1", function(){
            var origMachine, mergeMachine;
            before(function(){
                var spec = {"nodes":[{"id":"A","x":95,"y":110,"isInit":true,"name":"A"},{"id":"B","x":190,"y":140,"name":"B"},{"id":"C","x":285,"y":107,"isAcc":true,"name":"C"},{"id":"D","x":189,"y":77,"name":"D"}],"links":[{"to":"B","from":"A","input":["a1"]},{"to":"C","from":"B","input":["a2"]},{"to":"D","from":"A","input":["a2"]},{"to":"C","from":"D","input":["a2"]}],"attributes":{"alphabet":["a1","a2"],"allowEpsilon":true,"isTransducer":false}};
                origMachine = new model.Machine("t1");
                mergeMachine = new model.Machine("t2");
                origMachine.build(spec);
                mergeMachine.build(spec);
                //Identify nodes to be merged
                mergeMachine.setToInitialState();
                var initNode = mergeMachine.getCurrentNodeList()[0];
                var links = initNode.getOutgoingLinks();
                expect(links.length).to.equal(2);
                var n1 = links[0].target;
                var n2 = links[1].target;
                mergeMachine.mergeNodes(n1,n2);
            });

            it("premerge machine should accept ['a2', 'a2]", function(){
                expect(origMachine.accepts(["a2", "a2"])).to.be.true;
            });
            it("premerge machine should accept ['a1', 'a2]", function(){
                expect(origMachine.accepts(["a1", "a2"])).to.be.true;
            });
            it("merged machine should accept ['a2', 'a2]", function(){
                expect(mergeMachine.accepts(["a2", "a2"])).to.be.true;
            });
            it("merged machine should accept ['a1', 'a2]", function(){
                expect(mergeMachine.accepts(["a1", "a2"])).to.be.true;
            });
        });
        describe("machine 2", function(){
            var origMachine, mergeMachine;
            before(function(){
                var spec = {"nodes":[{"id":"A","x":74,"y":88,"isInit":true,"name":"i1"},{"id":"B","x":74,"y":169,"isInit":true,"name":"i2"},{"id":"C","x":166,"y":128,"name":"C"},{"id":"D","x":257,"y":88,"isAcc":true,"name":"a1"},{"id":"E","x":263,"y":152,"isAcc":true,"name":"a2"}],"links":[{"to":"C","from":"A","input":["1"],"hasEps":true},{"to":"C","from":"B","input":["2"],"hasEps":true},{"to":"D","from":"C","input":["1","2","3"]},{"to":"E","from":"C","hasEps":true}],"attributes":{"alphabet":["1","2","3"],"allowEpsilon":true,"isTransducer":false}};
                origMachine = new model.Machine("t1");
                mergeMachine = new model.Machine("t2");
                origMachine.build(spec);
                mergeMachine.build(spec);
                //Identify nodes to be merged
                mergeMachine.setToInitialState();
                var n1 = mergeMachine.getCurrentNodeList()[0];
                var n2 = mergeMachine.getCurrentNodeList()[1];
                mergeMachine.mergeNodes(n1,n2);

                var acceptingNodes = mergeMachine.getNodeList().filter(node => node.isAccepting);
                var n3 = acceptingNodes[0];
                var n4 = acceptingNodes[1];
                mergeMachine.mergeNodes(n3,n4);
            });

            it("premerge machine should accept []", function(){
                expect(origMachine.accepts([])).to.be.true;
            });
            it("premerge machine should accept ['2', '2]", function(){
                expect(origMachine.accepts(["2", "2"])).to.be.true;
            });
            it("merged machine should accept []", function(){
                expect(mergeMachine.accepts([])).to.be.true;
            });
            it("merged machine should accept ['2', '2]", function(){
                expect(mergeMachine.accepts(["2", "2"])).to.be.true;
            });
        });
    });



    describe("Test Machine.getAcceptedSequence", function(){
        describe("-machine 1-", function(){
            var machine = new model.Machine("t1");
            machine.build({"nodes":[{"id":"A","x":94,"y":162,"isInit":true},{"id":"B","x":170,"y":227},{"id":"C","x":160,"y":87},{"id":"D","x":236,"y":152,"isAcc":true}],"links":[{"to":"B","from":"D","input":["b","c"]},{"to":"D","from":"D","input":["a"]},{"to":"D","from":"C","input":["b","c"]},{"to":"C","from":"C","input":["a"]},{"to":"B","from":"B","input":["a","b","c"]},{"to":"B","from":"A","input":["b","c"]},{"to":"C","from":"A","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}});
            var sequence;
            it("should return a sequence of length 2", function(){
                sequence = machine.getAcceptedSequence();
                expect(sequence).to.not.equal(null);
                expect(sequence.length).to.equal(2);
            });
            it("should return a sequence accepted by the machine", function(){
                expect(machine.accepts(sequence)).to.be.true;
            });
        });
        describe("-machine 2-", function(){
            var spec = {"nodes":[{"id":"A","x":53,"y":134,"isInit":true},{"id":"B","x":136,"y":78},{"id":"C","x":148,"y":165},{"id":"D","x":248,"y":161},{"id":"E","x":236,"y":73},{"id":"F","x":322,"y":124,"isAcc":true}],"links":[{"to":"B","from":"A","hasEps":true},{"to":"C","from":"A","hasEps":true},{"to":"D","from":"C","input":["a"]},{"to":"D","from":"D","input":["b"]},{"to":"E","from":"B","input":["c"]},{"to":"F","from":"E","hasEps":true}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};
            var machine = new model.Machine("t1");
            machine.build(spec);
            var sequence;
            it("should return ['c']", function(){
                sequence = machine.getAcceptedSequence();
                expect(sequence).to.not.equal(null);
                expect(sequence.length).to.equal(1);
                expect(sequence[0]).to.equal("c");
            });
            it("should return a sequence accepted by the machine", function(){
                expect(machine.accepts(sequence)).to.be.true;
            });
        });


    });

    describe("Test Machine.complement", function(){
        describe("Strings that a machine accepts should be rejected by that machine's complement", function(){
            var m1 = new model.Machine("t1");
            var m2 = new model.Machine("t2");
            var spec = {"nodes":[{"id":"A","x":61,"y":78,"isInit":true},{"id":"B","x":160,"y":74,"isAcc":true},{"id":"C","x":260,"y":79,"isAcc":true}],"links":[{"to":"A","from":"A","input":["a"]},{"to":"B","from":"A","input":["a"]},{"to":"C","from":"B","input":["b","c"]},{"to":"C","from":"C","input":["a"]}],"attributes":{"alphabet":["a","b","c"],"allowEpsilon":true,"isTransducer":false}};

            //Strings that m1 should accept
            var accList = ["ab", "a", "aa", "aaab", "aaacaa"];
            var rejList = ["b", "bc", "abba", "acab"];
            //Strings that m2 should reject
            var splitSymbol = "";

            m1.build(spec);
            m2.build(spec);
            m2.complement();
            accList.forEach(function(str){
                var sequence = model.parseInput(str, splitSymbol);
                it(`m1 should accept ${str}`, function(){
                    expect(m1.accepts(sequence)).to.be.true;
                });
                it(`m1.complement() should not accept ${str}`, function(){
                    expect(m2.accepts(sequence)).to.be.false;
                });
            });

            rejList.forEach(function(str){
                var sequence = model.parseInput(str, splitSymbol);
                it(`m1 should not accept ${str}`, function(){
                    expect(m1.accepts(sequence)).to.be.false;
                });
                it(`m1.complement() should accept ${str}`, function(){
                    expect(m2.accepts(sequence)).to.be.true;
                });
            });
        });
    });
});