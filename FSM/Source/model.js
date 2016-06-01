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
        this.linksUsed = [];

        this.addNode = function(x, y, name, isInitial, isAccepting){
            //Adds a node to the machine. Returns the id assigned to the node.
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
        };
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
            // Function that returns true iff this node has a direct link to the input node
            for (var linkID in this.outgoingLinks){
                if (this.outgoingLinks[linkID].target.id == node.id){
                    return true;
                }
            }
            return false;
        };
        this.getLinkTo = function(node){
            // Function that returns a link from this node to the input node if one exists, or null otherwise
            for (var linkID in this.outgoingLinks){
                if (this.outgoingLinks[linkID].target.id == node.id){
                    return this.outgoingLinks[linkID];
                }
            }
            return null;
        };
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
    }
};


// For use by node during testing - set Model as the export if module is defined.
if (typeof module !== "undefined"){
    module.exports = Model;
}
