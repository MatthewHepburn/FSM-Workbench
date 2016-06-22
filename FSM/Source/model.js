"use strict";

// This holds the domain model and the functions needed to interact with it. It should not interact with the DOM and
// it should not recquire d3.
var Model = {
    machines: [], // This may be better as an object, with machine IDs as keys.
    addMachine: function(specificationObj){
        //Creates a new machine as specified by specificationObj, adds it to the machinelist and returns the new machine.
        var newID = "m" + (this.machines.length + 1);
        var newMachine = new Model.Machine(newID);
        newMachine.build(specificationObj);
        this.machines.push(newMachine);
        return newMachine;
    },
    deleteMachine: function(machineID){
        this.machines = this.machines.filter(m => m.id !== machineID);
    },
    getMachineList: function(){
        //Returns a list of specifications for the current machine(s)
        var list = [];
        for(var i = 0; i < Model.machines.length; i++){
            list.push(Model.machines[i].getSpec());
        }
        return list;
    },
    parseInput(inputString, splitSymbol){
        //Takes an input string (e.g. "abbbc") and returns a sequence based on the split symbol (e.g. ["a", "b", "b", "b", "c"])
        if(splitSymbol === undefined){
            splitSymbol = this.question.splitSymbol;
        }
        return inputString.split(splitSymbol).map(y => y.replace(/ /g,"")).filter(z => z.length > 0);
    },
    // Constructor for a machine object
    // TODO consider adding functions via the prototype instead of adding them in the constructor for memory efficiency.
    Machine: function(id) {
        this.id = id;
        this.nodes = {};
        this.links = {};
        this.alphabet = [];
        this.allowEpsilon = true;
        this.isTransducer = false;
        this.currentState = [];

        //Track links used on last step
        this.linksUsed = [];
        this.nonEpsLinksUsed = [];
        this.epsilonLinksUsed = [];

        this.addNode = function(x, y, name, isInitial, isAccepting){
            //Adds a node to the machine. Returns the node.
            isInitial = isInitial === undefined? false : isInitial;
            isAccepting = isAccepting === undefined? false : isAccepting;
            name = name === undefined? "" : name;
            var nodeID = this.getNextNodeID();
            var newNode = new Model.Node(this, nodeID, x, y, name, isInitial, isAccepting);
            this.nodes[nodeID] = newNode;
            return newNode;

        };
        this.addLink = function(sourceNode, targetNode, input, output, hasEpsilon){
            //Adds a link to the machine. Returns the id assigned to the link.
            //Accepts either nodeIDs or node references for source and target
            if (sourceNode instanceof Model.Node === false){
                sourceNode = this.nodes[sourceNode];
            }
            if (targetNode instanceof Model.Node === false){
                targetNode = this.nodes[targetNode];
            }
            input = input === undefined? [] : input;
            output = output === undefined? {} : output;
            hasEpsilon = hasEpsilon === undefined? false : hasEpsilon;
            var linkID = this.getNextLinkID();
            var newLink = new Model.Link(this, linkID, sourceNode, targetNode, input, output, hasEpsilon);
            this.links[linkID] = newLink;
            sourceNode.outgoingLinks[linkID] = newLink;
            return newLink;
        };
        this.deleteLink = function(link){
            // Accepts either a Link object or a linkID
            if (link instanceof Model.Link === false){
                link = this.links[link];
            }
            delete this.links[link.id];
            delete link.source.outgoingLinks[link.id];
        };
        this.deleteNode = function(node){
            // Removes a node from the machine, deleting all links to or from it.
            // Accepts either a Node object or a nodeID
            if (node instanceof Model.Node === false){
                node = this.nodes[node];
            }
            delete this.nodes[node.id];
            var context = this;
            Object.keys(node.outgoingLinks).map(function(linkID){
                context.deleteLink(linkID);
            });
            Object.keys(this.links).map(function(linkID){
                if (context.links[linkID].target.id === node.id){
                    context.deleteLink(linkID);
                }
            });
        };
        this.deleteAllNodes = function(){
            for(var nodeID in this.nodes){
                this.deleteNode(nodeID);
            }
        };
        this.build = function(spec){
            //Sets up the machine based on a specification object passed in
            this.nodes = {};
            this.links = {};
            this.alphabet = spec.attributes.alphabet;
            this.allowEpsilon = spec.attributes.allowEpsilon;
            this.isTransducer = spec.attributes.isTransducer;
            var nodes = spec.nodes;
            var nodeIDDict = {}; //Used to map IDs in the spec to machine IDs
            for (var i = 0; i < nodes.length; i++){
                var n = nodes[i];
                var specID = n.id;
                nodeIDDict[specID] = this.addNode(n.x, n.y, n.name, n.isInit, n.isAcc).id;
            }
            var links = spec.links;
            for (i = 0; i < links.length; i++){
                var l = links[i];
                this.addLink(nodeIDDict[l.from], nodeIDDict[l.to], l.input, l.output, l.hasEps);
            }
        };
        this.getNextNodeID = function(){
            // Returns a sequential node id that incorporates the machine id
            if (this.lastNodeID === undefined){
                this.lastNodeID = -1;
            }
            this.lastNodeID += 1;
            return this.id + "-N" + String(this.lastNodeID);
        };
        this.getNextLinkID = function(){
            // Returns a sequential node id that incorporates the machine id
            if (this.lastLinkID === undefined){
                this.lastLinkID = -1;
            }
            this.lastLinkID += 1;
            return this.id + "-L" + String(this.lastLinkID);
        };
        this.getTrace = function(sequence){
            //Returns a traceObj that can be used to display a machine's execution for some input
            //Setup object
            var traceObj = {states:[], links:[], doesAccept: undefined, input: undefined};
            traceObj.input = JSON.parse(JSON.stringify(sequence)); //JSON copy
            traceObj.inputSeparator = JSON.parse(JSON.stringify(Model.question.splitSymbol));
            traceObj.machineID = this.id;

            var linksUsedThisStep = [];
            var machine = this;
            var inputSymbol = undefined;

            //Used to create an object for traceObj.links that also includes the transition used;
            var getLinkUsedObj = function(linkID){
                var link = machine.links[linkID]
                return {
                    "link": link,
                    "epsUsed": false,
                    "inputIndex": link.inputIndexOf(inputSymbol)
                }
            }

            //Used for epsilon links
            var getEpsLinkUsedObj = function(linkID){
                var link = machine.links[linkID]
                return {
                    "link": link,
                    "epsUsed": true
                }
            }

            var getNode = function(nodeID){
                return machine.nodes[nodeID];
            }

            this.setToInitialState();
            traceObj.states.push(this.currentState.map(getNode));
            traceObj.links.push(this.epsilonLinksUsed.map(getEpsLinkUsedObj));

            var i = 0;
            while(i < sequence.length && this.currentState.length > 0){
                //Advance machine
                inputSymbol = sequence[i];
                this.step(inputSymbol);

                //Record new state and links used to get there
                traceObj.states.push(this.currentState.map(getNode));
                linksUsedThisStep = [];
                linksUsedThisStep = linksUsedThisStep.concat(this.epsilonLinksUsed.map(getEpsLinkUsedObj));
                linksUsedThisStep = linksUsedThisStep.concat(this.nonEpsLinksUsed.map(getLinkUsedObj));
                traceObj.links.push(linksUsedThisStep);

                i = i + 1;
            }

            traceObj.doesAccept = this.isInAcceptingState();

            return traceObj;


        };
        this.getSpec = function(){
            //Returns an object that describes the current machine in the form accepted by Machine.build
            var spec = {"nodes": [], "links": [], "attributes":{
                "alphabet": this.alphabet,
                "allowEpsilon": this.allowEpsilon,
                "isTransducer": this.isTransducer
            }};
            var nodeKeys = Object.keys(this.nodes);
            var nodeIDDict = {}; //Used to map from the internal IDs to the externalIDs
            var nextNodeID = 65; // 65 -> "A"
            for (var i = 0; i < nodeKeys.length; i++){
                var nodeIDinternal = nodeKeys[i];
                var nodeIDexternal = String.fromCharCode(nextNodeID);
                nextNodeID += 1;
                nodeIDDict[nodeIDinternal] = nodeIDexternal;
                var intNode = this.nodes[nodeIDinternal];
                // There is an argument for generating the mininal description in the Node object,
                // but decided against it as defaults are imposed by Machine. In any case, tight coupling between
                // Machine and Node is probably harmless (and unavoidable).
                var extNode = {"id": nodeIDexternal, "x":Math.round(intNode.x), "y":Math.round(intNode.y)};
                // Only include non-default properties for brevity:
                if (intNode.isAccepting === true){
                    extNode.isAcc = true;
                }
                if (intNode.isInitial === true){
                    extNode.isInit = true;
                }
                if (intNode.name !== ""){
                    extNode.name = intNode.name;
                }
                spec.nodes.push(extNode);
            }
            var linkKeys = Object.keys(this.links);
            for(i = 0; i < linkKeys.length; i++){
                var intLink = this.links[linkKeys[i]];
                var extLink = {"to": nodeIDDict[intLink.target.id], "from": nodeIDDict[intLink.source.id]};
                // Only include non-default properties for brevity:
                if(intLink.input.length > 0){ // Because JS comparisons are strange: [] === [] -> false
                    extLink.input = intLink.input;
                }
                if(Object.keys(intLink.output).length > 0){ // intLink.output != {}
                    extLink.output = intLink.output;
                }
                if(intLink.hasEpsilon === true){
                    extLink.hasEps = true;
                }
                spec.links.push(extLink);
            }
            return spec;
        };
        this.setToInitialState = function(){
            //Set the list of current states to be all initial states
            var context = this;
            this.currentState = Object.keys(this.nodes).filter(function(nodeID){
                return context.nodes[nodeID].isInitial;
            });
            this.followEpsilonTransitions();
        };
        this.setToState = function(nodeList){
            //Takes an array of nodes and sets them as the currrent state (used in DFA conversion)
            var nodeIDs = nodeList.map(x => x.id);
            this.currentState = nodeIDs;

        };
        this.getCurrentNodeList = function(){
            return this.currentState.map(id => this.nodes[id]);
        }
        this.followEpsilonTransitions = function(){
            var linksUsed = [];
            var visitedStates = [];
            var frontier = this.currentState;
            do {
                var newFrontier = [];
                for(var i = 0; i < frontier.length; i++){
                    var thisNode = this.nodes[frontier[i]];
                    var epsilonLinksFromThisNode = thisNode.getEpsilonLinks();
                    for(var j = 0; j < epsilonLinksFromThisNode.length; j++){
                        var linkID = epsilonLinksFromThisNode[j];
                        var thisLink = this.links[linkID];
                        if (linksUsed.indexOf(linkID) === -1){
                            linksUsed.push(linkID);
                        }
                        var targetNodeID = thisLink.target.id;
                        // Add targetNodeID to newFrontier if it isn't already there and isn't in visitedStates or current frontier
                        if (frontier.indexOf(targetNodeID) === -1 && visitedStates.indexOf(targetNodeID) === -1 && newFrontier.indexOf(targetNodeID) === -1){
                            newFrontier.push(targetNodeID);
                            this.currentState.push(targetNodeID);
                        }
                    }
                    visitedStates.push(frontier[i]);
                }
                frontier = newFrontier;
            }
            while (frontier.length > 0);
            this.linksUsed = this.linksUsed.concat(linksUsed);
            this.epsilonLinksUsed = linksUsed;
        };
        this.step = function(symbol){
            // The machine changes its state based on an input symbol
            // Get an array of nodes from the list of nodeIDs
            var nodes = this.currentState.map(nodeID => this.nodes[nodeID]);
            var newNodes = [];
            var linksUsed = [];
            for (var i = 0; i < nodes.length; i++){
                var thisNode = nodes[i];
                var reachableNodeObj = thisNode.getReachableNodes(symbol);
                // Get nodeIDs of nodes reachable from current node for input = symbol, where the nodeID is not in newNodes
                var newReachableNodeIDs = reachableNodeObj.nodeIDs.filter( nodeID => newNodes.indexOf(nodeID) === -1);
                newNodes = newNodes.concat(newReachableNodeIDs);
                linksUsed = linksUsed.concat(reachableNodeObj.linkIDs);
            }
            this.currentState = newNodes;
            this.linksUsed = linksUsed;
            this.nonEpsLinksUsed = linksUsed.map(x => x); //copy
            this.followEpsilonTransitions();
        };

        this.isInAcceptingState = function(){
            // True if any of the current states is an accepting state.
            if (this.currentState.length === 0){
                return false;
            }
            for (var i = 0; i < this.currentState.length; i++){
                if(this.nodes[this.currentState[i]].isAccepting){
                    return true;
                }
            }
            return false;
        };

        this.accepts = function(sequence){
            // Takes an input sequence and tests if the machine accepts it.
            // This alters the current machine state
            sequence = Array.from(sequence); // Avoid changing the passed in arguement by creating a copy
            this.setToInitialState();
            while(sequence.length > 0){
                if(this.currentState.length === 0){
                    return false;
                }
                this.step(sequence.shift());
            }
            return this.isInAcceptingState();
        };

        this.setAlphabet = function(alphabetArray){
            this.alphabet = alphabetArray;
            //Now enforce this alphabet by removing illegal symbols
            this.enforceAlphabet();

        };

        this.enforceAlphabet = function(){
            //Remove any input symbols in the machine that are not in this.alphabet
            for(var linkID in this.links){
                this.links[linkID].enforceAlphabet();
            }
        };

        this.mergeNodes = function(s1, s2){
            //Takes two states in the machine and combines them

            this.enforceAlphabet(); //Overkill?

            var name = `{${s1.name}, ${s2.name}}`;
            var inboundLinks = this.getLinksTo(s1).concat(this.getLinksTo(s2));
            var outgoingLinks = s1.getOutgoingLinks().concat(s2.getOutgoingLinks());
            var isInitial = s1.isInitial && s2.isInitial;
            var isAccepting = s1.isAccepting && s2.isAccepting;

            var x = (s1.x + s2.x)/2;
            var y = (s1.y + s2.y)/2;

            this.deleteNode(s1);
            this.deleteNode(s2);

            var mergedNode = this.addNode(x, y, name, isInitial, isAccepting)

            //Modify the source/target of the old links as appropriate and merge the lists
            inboundLinks.forEach(l => l.target = mergedNode);
            outgoingLinks.forEach(l => l.source = mergedNode);
            var oldLinks = inboundLinks.concat(outgoingLinks);

            //Add back links to the new node
            for(var i in oldLinks){
                var l = oldLinks[i];
                var source = l.source
                var target = l.target
                //See if link already exists
                var existingLink = source.getLinkTo(target)
                if(existingLink !== null){
                    //Link present, combine input symbols
                    var newInput = existingLink.input.concat(l.input) //Will contain duplicates, but they are removed in Link.setInput
                    var hasEpsilon = l.hasEpsilon || existingLink.hasEpsilon;
                    existingLink.setInput(newInput, hasEpsilon); //TODO refactor to use Link.addInput()
                } else {
                    //No link present, create it
                    var input = l.input;
                    var hasEpsilon = l.hasEpsilon;
                    var output = {};
                    this.addLink(source, target, input, output, hasEpsilon)
                }
            }

            return mergedNode;
        };

        this.minimize = function(){
            this.reverse();
            this.convertToDFA();
            this.reverse();
            this.convertToDFA();
        };

        // this.minimize = function(){
        //     //Minimize the current machine TODO - Brzozowski's algorithm
        //     this.enforceAlphabet() //Need alphabet to be accurate

        //     do{
        //         //Log initial number of states. Repeat minimimisation process until there is no reduction.
        //         var numOfStates = Object.keys(this.nodes).length;

        //         //1 - create an entry for every pair of states
        //         var statePairs = {};
        //         var stateIDs = Object.keys(this.nodes)
        //         for(var i = 0; i < stateIDs.length; i++){
        //             for(var j = i + 1; j < stateIDs.length; j++){
        //                 var pairID = stateIDs[i] + "-" + stateIDs[j];
        //                 var distinguishable = false;
        //                 var state1 = this.nodes[pairID[i]];
        //                 var state2 = this.nodes[pairID[j]];
        //                 if(state1.isAccepting !== state2.isAccepting){
        //                     //States cannot be indistinguisable if one is accepting and one is not
        //                     distinguishable = true;
        //                 }
        //                 if(state1.isInit){
        //                     //States cannot be indistinguisable if one is initial and one is not
        //                     distinguishable = true;
        //                 }
        //                 statePairs[pairID] = {state1, state2, distinguishable}
        //             }
        //         }

        //     } while(numOfStates < Object.keys(this.nodes).length)
        // };

        this.reverse = function(){
            for(var nodeID in this.nodes){
                var node = this.nodes[nodeID]
                var isAccepting = node.isInitial;
                var isInitial = node.isAccepting;
                node.isAccepting = isAccepting;
                node.isInitial = isInitial;
            }
            // Create a list of reversed links to be created
            var newLinks = []
            for(var linkID in this.links){
                //Can't use link.reverse() due to the way that that combines links
                var link = this.links[linkID]
                var source = link.target;
                var target = link.source;
                var input = link.input;
                var output = link.output;
                var hasEpsilon = link.hasEpsilon;
                var newLink = {source, target, input, output, hasEpsilon}
                newLinks.push(newLink);
                this.deleteLink(link); //Delete all links
            }
            //Create new links
            for(var i = 0; i < newLinks.length; i++){
                var link = newLinks[i]
                this.addLink(link.source, link.target, link.input, link.output, link.hasEpsilon)
            }
        }

        this.convertToDFA = function(){
            this.enforceAlphabet();
            //Obj of form {"m1-n1+m1-n2":{
                                        // nodes:[Node, Node],
                                        // reachable: {"a":[Node], "b":[Node, Node]},
                                        // name:"{a, b}"}},
                                        // isInitial:true,
                                        // isAccepting: false,
                                        // x: 210,
                                        // y: 10
            //This will be used to construct the new machine
            var nodeSets = {};
            //Track the nodeSets to be investigated. form: [{"m1-n1+m1n2":[Node, Node]}]

            var newNodeSets = []

            var addToNewNodeSets = function(nodeSet){
                //Takes an array of nodes, and add it to the newNodeSets array
                //Sort the nodeSet, to ensure that each nodeSet has only one ID:
                nodeSet.sort(function(x,y){
                    if(x.id < y.id){
                        return -1;
                    }
                    return 1;
                })
                var id = nodeSet.map(node => node.id).reduce((x,y)=> `${x}+${y}`);
                var obj = {id, nodes:nodeSet};
                newNodeSets.push(obj)
                return id;
            }

            var nameNodeSet = function(nodeSet){
                //Creates a name for a nodeSet, based on the names of the consitituent nodes
                if(nodeSet.length === 1){
                    return nodeSet[0].name
                }
                if(nodeSet.filter(node => node.name === "").length > 0){
                    //if any node is unnamed, return ""
                    return ""
                }
                return "{" + nodeSet.map(node=>node.name).reduce((x,y) => `${x}, ${y}`) + "}"
            }

            //Start with the initial nodeSet of the machine
            this.setToInitialState();
            var initialNodeSet = this.getCurrentNodeList()
            addToNewNodeSets(initialNodeSet)
            var firstNodeSet = true

            //Populate nodeSets, adding to newNodeSets as new reachable combinations are discovered.
            while(newNodeSets.length > 0){
                var nodeSet = newNodeSets.pop();
                if(nodeSets[nodeSet.id]){
                    continue;
                }
                //First nodeSet is inital, all others are not
                if(firstNodeSet){
                    var isInitial = true;
                    firstNodeSet = false;
                } else {
                    isInitial = false;
                }

                this.setToState(nodeSet.nodes)
                var isAccepting = this.isInAcceptingState();
                var reachable = {};
                var name = nameNodeSet(nodeSet.nodes)
                var x = nodeSet.nodes.map(node => node.x).reduce((x1,x2)=> x1 + x2)/nodeSet.nodes.length //set x to mean value of nodes in set
                var y = nodeSet.nodes.map(node => node.y).reduce((y1,y2)=> y1 + y2)/nodeSet.nodes.length //set x to mean value of nodes in set
                for(var i = 0; i < this.alphabet.length; i++){
                    var symbol = this.alphabet[i];
                    this.setToState(nodeSet.nodes);
                    this.step(symbol)
                    var reachableNodes = this.getCurrentNodeList();
                    if(reachableNodes.length > 0){
                        var id = addToNewNodeSets(reachableNodes)
                        reachable[symbol] = id
                    } else {
                        reachable[symbol] = "none"
                    }

                }
                var obj = {nodes:nodeSet.nodes, reachable, name, isInitial, isAccepting, x, y}
                nodeSets[nodeSet.id] = obj;
            }

            //Now, clear the current machine
            this.deleteAllNodes();
            //And recreate from nodeSets, first create nodes for each nodeSet;
            for(var nodeSetID in nodeSets){
                var nodeSet = nodeSets[nodeSetID];
                var newNode = this.addNode(nodeSet.x, nodeSet.y, nodeSet.name, nodeSet.isInitial, nodeSet.isAccepting)
                nodeSet.newNode = newNode;
            }
            //And then create links as needed
            for(var nodeSetID in nodeSets){
                var nodeSet = nodeSets[nodeSetID];
                var sourceNode = nodeSet.newNode;
                for(symbol in nodeSet.reachable){
                    var targetNodeID = nodeSet.reachable[symbol]
                    if(targetNodeID === "none"){
                        continue;
                    }
                    var targetNode = nodeSets[targetNodeID].newNode;
                    var linkExists = sourceNode.hasLinkTo(targetNode);
                    if(linkExists){
                        var link = sourceNode.getLinkTo(targetNode);
                        link.addInput([symbol], false);
                    } else {
                        this.addLink(sourceNode, targetNode, [symbol], undefined, false);
                    }

                }
            }


        };

        this.getLinksTo = function(targetNode){
            //Returns an array containing all links to targetNode
            if (targetNode instanceof Model.Node === false){
                targetNode = this.nodes[targetNode];
            }
            var links = []
            for(var nodeID in this.nodes){
                var node = this.nodes[nodeID]
                var linkToTarget = node.getLinkTo(targetNode);
                if(linkToTarget !== null){
                    links.push(linkToTarget)
                }
            }
            return links;

        }
    },
    // Constructor for a node object
    Node: function(machine, nodeID, x, y, name, isInitial, isAccepting){
        this.name = name;
        this.machine = machine;
        this.id = nodeID;
        this.isAccepting = isAccepting;
        this.isInitial = isInitial;
        this.outgoingLinks = {};
        this.x = x;
        this.y = y;

        this.toggleAccepting = function(){
            this.isAccepting = ! this.isAccepting;
        };
        this.toggleInitial = function(){
            this.isInitial = ! this.isInitial;
        };
        this.getEpsilonLinks = function(){
            //Return a list of the linkIDs of all outgoing links which take an epsilon transition
            var context = this,
                keys = Object.keys(this.outgoingLinks);
            return keys.filter(function(linkID){
                return context.outgoingLinks[linkID].hasEpsilon;
            });
        };
        this.getReachableNodes = function(symbol){
            //Return an object containing nodeIDs of nodes reachable from this node for the given input symbol
            //and the linkIDs of links used
            var keys = Object.keys(this.outgoingLinks);
            var nodeIDs = [];
            var linkIDs = [];
            for(var i = 0; i < keys.length; i++){
                var linkID = keys[i];
                var link = this.outgoingLinks[linkID];
                if(link.input.indexOf(symbol) != -1){
                    nodeIDs.push(link.target.id);
                    linkIDs.push(linkID);
                }
            }
            return {"nodeIDs": nodeIDs, "linkIDs": linkIDs};
        };
        this.hasLinkTo = function(node){
            if (node instanceof Model.Node === false){
                node = this.machine.nodes[node];
            }
            // Function that returns true iff this node has a direct link to the input node
            for (var linkID in this.outgoingLinks){
                if (this.outgoingLinks[linkID].target.id == node.id){
                    return true;
                }
            }
            return false;
        };
        this.getLinkTo = function(node){
            if (node instanceof Model.Node === false){
                node = this.machine.nodes[node];
            }
            // Function that returns a link from this node to the input node if one exists, or null otherwise
            for (var linkID in this.outgoingLinks){
                if (this.outgoingLinks[linkID].target.id == node.id){
                    return this.outgoingLinks[linkID];
                }
            }
            return null;
        };
        this.getOutgoingLinks = function(){
            //Returns an array of all links starting from this node
            return Object.keys(this.outgoingLinks).map(id => this.outgoingLinks[id])
        }

    },
    // Constructor for a link object
    Link: function(machine, linkID, sourceNode, targetNode, input, output, hasEpsilon){
        this.machine = machine;
        this.id = linkID;
        this.input = input;
        this.output = output;
        this.source = sourceNode;
        this.target = targetNode;
        this.hasEpsilon = hasEpsilon;

        this.reverse = function(){
            // Test if the link is from a node to itself
            if(this.source.id === this.target.id){
                return;
            }
            // Test if a link exists in the opposite direction:
            var reverseLink = this.target.getLinkTo(this.source);
            if (reverseLink !== null){
                // If the reverse link already exists then combine this link into that
                var newInput = this.input.concat(reverseLink.input);
                var newHasEpsilon = this.hasEpsilon || reverseLink.hasEpsilon;
                reverseLink.setInput(newInput, newHasEpsilon);
                this.machine.deleteLink(this);
            } else {
                //If the reverse link does not exist, delete this link and create a new one with source and target reversed
                this.machine.addLink(this.target, this.source, this.input, this.output, this.hasEpsilon);
                this.machine.deleteLink(this);
            }
        };

        this.addInput = function(inputList, hasEpsilon){
            //Adds to the existing allowed input
            inputList = inputList.concat(this.input)
            hasEpsilon = this.hasEpsilon || hasEpsilon;
            this.setInput(inputList, hasEpsilon);
        }

        this.setInput = function(inputList, hasEpsilon){
            // First, strip out duplicates in inputlist
            if (inputList.length > 1){
                inputList = inputList.sort(); // Sort list, then record all items that are not the same as the previous item.
                var newList = [inputList[0]];
                for (var i = 1; i < inputList.length; i++){
                    if (inputList[i] !== inputList[i-1]){
                        newList.push(inputList[i]);
                    }
                }
                inputList = newList;
            }

            this.input = inputList;
            this.hasEpsilon = hasEpsilon;
        };

        this.enforceAlphabet = function(){
            //Remove any inputs prohibited by the machine alphabet.
            var alphabet = this.machine.alphabet;
            var allowEpsilon = this.machine.allowEpsilon;
            this.input = this.input.filter(x => alphabet.indexOf(x) !== -1);
            this.hasEpsilon = this.hasEpsilon && allowEpsilon;
        }

        this.inputIndexOf = function(symbol){
            //Given an input symbol, return the index of that symbol in this.input
            var index = this.input.indexOf(symbol)
            if(index < 0){
                throw new Error(`Symbol:'${symbol}' not found in link ${this.id}`);
            } else {
                return index;
            }
        }
    },
    //Holds the question logic and the variables that govern the current question.
    question: {
        type: "none",
        splitSymbol:"",
        allowEditing: true,
        setUpQuestion: function(questionObj){
            // Assign properties from the question object to this object
            for(var property in questionObj){
                this[property] = questionObj[property];
            }
            if(["give-list", "select-states", "does-accept", "give-input"].indexOf(Model.question.type) == -1){
                this.allowEditing = true;
            } else {
                this.allowEditing = false;
            }
            if(Model.question.type === "give-input"){
                Model.question.currentInput = [];
            }

        },
        checkAnswer: function(input){
            //Input other than the machine only recquired for some question types
            if (Model.question.type === "give-list"){
                return Model.question.checkGiveList(input);
            }
            if(Model.question.type === "satisfy-list"){
                return Model.question.checkSatisfyList();
            }
            if(Model.question.type === "give-input"){
                return Model.question.checkGiveInput();
            }
        },
        checkGiveInput: function(){
            var feedbackObj = {allCorrectFlag: false};
            if (Model.question.target === "none"){
                return feedbackObj;
            }
            if (Model.question.target === "accept"){
                feedbackObj.allCorrectFlag = Model.machines.filter(m => m.isInAcceptingState()).length === Model.machines.length; //All machines should be in an accepting state.
                return feedbackObj;
            }
        },
        checkGiveList: function(input){
            // Input received as list of strings.
            var machine = Model.machines[0];

            var allCorrectFlag = true;
            var messages = new Array(Model.question.lengths.length).fill(""); // feedback messages to show the user for each question
            var isCorrectList = new Array(Model.question.lengths.length).fill(true); // Tracks whether each answer is correct
            var seen = [] //Use to catch duplicates. Not an efficient algorithm but the dataset is tiny.

            input.forEach(function(string, index){
                var sequence = Model.parseInput(string)
                var thisLength = sequence.length;
                var expectedLength = Model.question.lengths[index];
                if (thisLength !== expectedLength){
                    allCorrectFlag = false;
                    isCorrectList[index] = false;
                    messages[index] = `Incorrect length – expected ${expectedLength} but got ${thisLength}.`;
                    return;
                }
                // Correct length – check if duplicate
                if(seen.indexOf(string)!== -1){
                    allCorrectFlag = false
                    isCorrectList[index] = false;
                    messages[index] = `Incorrect – duplicate entry.`;
                    return;
                }
                seen.push(string)

                //Not duplicate – check if all symbols are in the machine's alphabet
                var nonAlphabetSymbols = sequence.filter(x => machine.alphabet.indexOf(x) === -1)
                if(nonAlphabetSymbols.length > 0){
                    allCorrectFlag = false
                    isCorrectList[index] = false;
                    messages[index] = `Incorrect – '${nonAlphabetSymbols[0]}' is not in the machine's alphabet.`;
                    return;
                }

                //Sequence is within alphabet – check if the machine accepts it
                if (!machine.accepts(sequence)){
                    allCorrectFlag = false;
                    isCorrectList[index] = false;
                    messages[index] = "Incorrect – not accepted by machine.";
                    return;
                }
            });

            return {input, messages, allCorrectFlag, isCorrectList};
        },
        checkSatisfyList(){
            var machine = Model.machines[0];
            var feedbackObj = {allCorrectFlag: true, acceptList:[], rejectList:[]}
            var splitSymbol = Model.question.splitSymbol;
            var acceptList = Model.question.shouldAccept;
            var rejectList = Model.question.shouldReject;

            //Check the acceptList
            for(var i = 0; i < acceptList.length; i++){
                //Split the input into individual tokens based on the split symbol.
                var input = acceptList[i].split(splitSymbol).map(y => y.replace(/ /g,"")).filter(z => z.length > 0);
                if(machine.accepts(input)){
                    feedbackObj.acceptList[i] = true;
                } else {
                    feedbackObj.acceptList[i] = false;
                    feedbackObj.allCorrectFlag = false;
                }
            }

            for(var i = 0; i < rejectList.length; i++){
                var input = rejectList[i].split(splitSymbol).map(y => y.replace(/ /g,"")).filter(z => z.length > 0);
                if(!machine.accepts(input)){
                    feedbackObj.rejectList[i] = true;
                } else {
                    feedbackObj.rejectList[i] = false;
                    feedbackObj.allCorrectFlag = false;
                }
            }

            return feedbackObj;
        }
    }
};


// For use by node during testing - set Model as the export if module is defined.
if (typeof module !== "undefined"){
    module.exports = Model;
}
