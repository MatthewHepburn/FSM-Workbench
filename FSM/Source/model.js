"use strict";

// This holds the domain model and the functions needed to interact with it. It should not interact with the DOM and
// it should not require d3.
const Model = {
    machines: [], // This may be better as an object, with machine IDs as keys.
    addMachine(specificationObj){
        //Creates a new machine as specified by specificationObj, adds it to the machinelist and returns the new machine.
        const newID = "m" + (this.machines.length + 1);
        const newMachine = new Model.Machine(newID);
        newMachine.build(specificationObj);
        this.machines.push(newMachine);
        return newMachine;
    },
    deleteMachine(machineID){
        this.machines = this.machines.filter(m => m.id !== machineID);
    },
    getMachineList(){
        // Returns a list of specifications for the current machine(s)
        const list = [];
        for(let i = 0; i < Model.machines.length; i++){
            list.push(Model.machines[i].getSpec());
        }
        return list;
    },
    setMachineList(savedMachineList){
        // Restores the model to the state it was in when getMachineList() was called.
        savedMachineList.forEach((spec, i) => Model.machines[i].build(spec))
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
        this.outputAlphabet = [];
        this.allowEpsilon = true;
        this.isMealy = false;
        this.currentOutput = [];
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
            const nodeID = this.getNextNodeID();
            const newNode = new Model.Node(this, nodeID, x, y, name, isInitial, isAccepting);
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
            const linkID = this.getNextLinkID();
            const newLink = new Model.Link(this, linkID, sourceNode, targetNode, input, output, hasEpsilon);
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
            for(let nodeID in this.nodes){
                this.deleteNode(nodeID);
            }
        };
        this.build = function(spec){
            //Sets up the machine based on a specification object passed in
            this.nodes = {};
            this.links = {};
            this.alphabet = spec.attributes.alphabet;
            this.allowEpsilon = spec.attributes.allowEpsilon;
            this.isMealy = spec.attributes.isMealy;

            this._nodeIDGenerator = undefined; //Reset identifiers
            this._linkIDGenerator = undefined;

            if(spec.attributes.outputAlphabet){
                this.outputAlphabet = spec.attributes.outputAlphabet;
            } else {
                this.outputAlphabet = [];
            }

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
            // Uses a generator function to returns a sequential node id that incorporates the machine id

            const thisMachine = this;

            // Initialise the generator function if it does not exist.
            if(! this._nodeIDGenerator){
                this._nodeIDGenerator = function*(){
                    let i = 0;
                    while(true){
                        yield thisMachine.id + "-N" + String(i);
                        i += 1;
                    }
                }();
            }
            return this._nodeIDGenerator.next().value;
        };
        this.getNextLinkID = function(){
            const thisMachine = this;

            // Initialise the generator function if it does not exist.
            if(! this._linkIDGenerator){
                this._linkIDGenerator = function*(){
                    let i = 0;
                    while(true){
                        yield thisMachine.id + "-L" + String(i);
                        i += 1;
                    }
                }();
            }
            return this._linkIDGenerator.next().value;
        };
        this.getAcceptingNodeCount = function(){
            var acceptingNodes = Object.keys(this.nodes).map(nodeID => this.nodes[nodeID]).filter(node => node.isAccepting);
            return acceptingNodes.length;
        };
        this.getInitialNodeCount = function(){
            //Returns the number of nodes where node.isInitial == true;
            var initialNodes = Object.keys(this.nodes).map(nodeID => this.nodes[nodeID]).filter(node => node.isInitial);
            return initialNodes.length;
        };
        this.getNodeCount = function(){
            //returns the number of nodes in the machine
            return Object.keys(this.nodes).length;
        };
        this.getLinkCount = function(){
            //returns the number of links in the machine
            return Object.keys(this.nodes).length;
        };
        this.getTrace = function(sequence){
            //Returns a traceObj that can be used to display a machine's execution for some input
            //Setup object
            var traceObj = {states:[], links:[], doesAccept: undefined, input: undefined};
            traceObj.input = JSON.parse(JSON.stringify(sequence)); //JSON copy
            traceObj.inputSeparator = JSON.parse(JSON.stringify(Model.question.splitSymbol));
            traceObj.machineID = this.id;

            if(this.isMealy){
                if(!this.isDeterministic()){
                    throw new Error("Mealy machines must be deterministic");
                }
                traceObj.output = [];
            }




            //Run loop once with no input to get initial state
            let inputSymbol = null;
            let i = 0;
            do{
                // Step machine
                const stepObj = this.getTraceStep(inputSymbol, this.currentState);

                //Record new state and links used to get there
                traceObj.states.push(stepObj.states);
                traceObj.links.push(stepObj.links);

                if(this.isMealy){
                    traceObj.output.push(stepObj.output);
                }

                // Advance input
                inputSymbol = sequence[i];
                i = i + 1;


            } while(i <= sequence.length && this.currentState.length > 0);

            traceObj.doesAccept = this.isInAcceptingState();

            return traceObj;
        };
        this.getTraceStep = function(inputSymbol, state){
            // Pull out the trace functionality for a single step here, as it is useful for other things
            // such as visualising the subset procedure.

            // Helper functions. TODO: unfactor these perhaps?
            // Used to create an object for traceObj.links that also includes the transition used;
            const machine = this;
            if(!state){
                state = this.currentState;
            }
            const getLinkUsedObj = function(linkID){
                const link = machine.links[linkID];
                return {
                    "link": link,
                    "epsUsed": false,
                    "inputIndex": link.inputIndexOf(inputSymbol)
                };
            };

            //Used for epsilon links
            const getEpsLinkUsedObj = function(linkID){
                const link = machine.links[linkID];
                return {
                    "link": link,
                    "epsUsed": true
                };
            };

            const getNode = function(nodeID){
                return machine.nodes[nodeID];
            };

            this.currentState = state;
            if(inputSymbol){
                this.step(inputSymbol);
            } else {
                // TODO - properly clear these in a systematic way.
                this.linksUsed = [];
                this.nonEpsLinksUsed = [];
                this.epsilonLinksUsed = [];
                this.setToInitialState();
            }
            const stepObj = {states: this.currentState.map(getNode), links: undefined, output: undefined};

            let linksUsedThisStep = [];
            linksUsedThisStep = linksUsedThisStep.concat(this.epsilonLinksUsed.map(getEpsLinkUsedObj));
            linksUsedThisStep = linksUsedThisStep.concat(this.nonEpsLinksUsed.map(getLinkUsedObj));

            stepObj.links = (linksUsedThisStep);

            if(this.isMealy){
                const currentOutput = this.currentOutput.map(x => x); //copy
                stepObj.output = currentOutput;
            }

            return stepObj;


        };
        this.getSpec = function(){
            //Returns an object that describes the current machine in the form accepted by Machine.build
            const spec = {"nodes": [], "links": [], "attributes":{
                "alphabet": this.alphabet,
                "allowEpsilon": this.allowEpsilon,
                "isMealy": this.isMealy
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
                if(intLink.input.length > 0){
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
        this.getInitialState = function(){
            const savedState = this.currentState;
            this.setToInitialState();
            const state = this.currentState;
            this.currentState = savedState;
            return state;
        };
        this.setToInitialState = function(){
            //Set the list of current states to be all initial states
            var context = this;
            this.currentState = Object.keys(this.nodes).filter(function(nodeID){
                return context.nodes[nodeID].isInitial;
            });
            this.currentOutput = [];
            this.followEpsilonTransitions();
        };
        this.setToState = function(nodeList){
            //Takes an array of nodes and sets them as the currrent state (used in DFA conversion)
            var nodeIDs = nodeList.map(x => x.id);
            this.currentState = nodeIDs;

        };
        this.getNodeList = function(){
            //Returns an array of all nodes in the machine
            return Object.keys(this.nodes).map(nodeID => this.nodes[nodeID]);

        };
        this.getNodeListNameSorted = function(){
            const nodeList = this.getNodeList();
            nodeList.sort((a,b) => a.name.localeCompare(b.name));
            return nodeList;
        };

        this.getLinkList = function(){
            //returns an array of all links in the machine
            return Object.keys(this.links).map(linkID => this.links[linkID]);
        };
        this.getCurrentNodeList = function(){
            //Returns an array of the nodes that the machine is currently in
            return this.currentState.map(id => this.nodes[id]);
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
            if(this.isMealy && linksUsed.length === 1){
                const outputSymbol = this.links[linksUsed[0]].output[symbol];
                if(outputSymbol){
                    //Push the output symbol if one is defined.
                    this.currentOutput.push(outputSymbol);
                }

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

        this.setAlphabet = function(alphabetArray, allowEpsilon){
            if(allowEpsilon !== undefined){
                this.allowEpsilon = allowEpsilon;
            }
            this.alphabet = alphabetArray;
            //Now enforce this alphabet by removing illegal symbols
            this.enforceAlphabet();
        };

        this.setOutputAlphabet = function(outputAlphabetArray){
            this.outputAlphabet = outputAlphabetArray;
            this.enforceAlphabet();
        };

        this.setMealy = function(isMealy){
            this.isMealy = isMealy;
            if(!isMealy){
                this.outputAlphabet = [];
                this.enforceAlphabet();
            }
        };

        this.enforceAlphabet = function(){
            //Remove any input symbols in the machine that are not in this.alphabet
            for(var linkID in this.links){
                this.links[linkID].enforceAlphabet();
            }
        };

        this.mergeNodes = function(s1, s2, useShortNames){
            //Takes two states in the machine and combines them

            this.enforceAlphabet(); //Overkill?
            if(!useShortNames){
                useShortNames = false;
            }

            let name;
            if(useShortNames){
                //For short names, assume that nodes are named in form Q1, Q2 or similar and combine as Q1 + Q2 = Q12
                const digits = s1.name.split("").concat(s2.name.split("")).filter(x => ["0","1","2","3","4","5","6","7","8","9"].includes(x)).sort().reduce((x,y) => x + y, "");
                const prefix = s1.name.split(/\d/)[0];
                name = prefix + digits;

            } else{
                name = `{${s1.name}, ${s2.name}}`;
            }
            const inboundLinks = this.getLinksTo(s1).concat(this.getLinksTo(s2));
            const outgoingLinks = s1.getOutgoingLinks().concat(s2.getOutgoingLinks());
            const isInitial = s1.isInitial || s2.isInitial;
            const isAccepting = s1.isAccepting || s2.isAccepting;

            const x = (s1.x + s2.x)/2;
            const y = (s1.y + s2.y)/2;

            this.deleteNode(s1);
            this.deleteNode(s2);

            const mergedNode = this.addNode(x, y, name, isInitial, isAccepting);

            //Modify the source/target of the old links as appropriate and merge the lists
            inboundLinks.forEach(l => l.target = mergedNode);
            outgoingLinks.forEach(l => l.source = mergedNode);
            var oldLinks = inboundLinks.concat(outgoingLinks);

            //Add back links to the new node
            for(let i in oldLinks){
                var l = oldLinks[i];
                var source = l.source;
                var target = l.target;
                //See if link already exists
                var existingLink = source.getLinkTo(target);
                if(existingLink !== null){
                    //Link present, combine input symbols
                    var newInput = existingLink.input.concat(l.input); //Will contain duplicates, but they are removed in Link.setInput
                    let hasEpsilon = l.hasEpsilon || existingLink.hasEpsilon;
                    existingLink.setInput(newInput, hasEpsilon); //TODO refactor to use Link.addInput()
                } else {
                    //No link present, create it
                    var input = l.input;
                    let hasEpsilon = l.hasEpsilon;
                    var output = {};
                    this.addLink(source, target, input, output, hasEpsilon);
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

        this.isEquivalentTo = function(machine){
            //Compares this to machine and returns true if both machines are isomorphic after minimization.
            //Create copies to avoid altering orginal machines:
            var m1 = new Model.Machine("temp1");
            var m2 = new Model.Machine("temp2");
            m1.build(this.getSpec());
            m2.build(machine.getSpec());
            m1.minimize();
            m2.minimize();

            //Perform simple tests to rule out equivilance first:
            if(m1.getNodeCount() !== m2.getNodeCount()){
                return false;
            }
            if(m1.getLinkCount() !== m2.getLinkCount()){
                return false;
            }
            if(m1.getAcceptingNodeCount() !== m2.getAcceptingNodeCount()){
                return false;
            }
            //Must have same alphabet
            if(m1.alphabet.filter(symbol => m2.alphabet.indexOf(symbol) === -1).length !== 0){
                return false;
            }

            var alphabet = m1.alphabet;
            var m1Nodes = Object.keys(m1.nodes).map(nodeID => m1.nodes[nodeID]);
            var m2Nodes = Object.keys(m2.nodes).map(nodeID => m2.nodes[nodeID]);

            var m1InitialNodes = m1Nodes.filter(node => node.isInitial);
            var m2InitialNodes = m2Nodes.filter(node => node.isInitial);

            if(m1InitialNodes.length !== 1 || m2InitialNodes.length !== 1){
                throw new Error("Minimized DFAs should only have one initial state");
            }

            var m1Initial = m1InitialNodes[0];
            var m2Initial = m2InitialNodes[0];

            //Find a mapping from nodes in m1 to m2, starting with the initial states
            //Start by checking that each node has the correct outgoing links
            var mapping = {};
            var frontier = [[m1Initial.id, m2Initial.id]];
            while(frontier.length > 0){
                var nodePair = frontier.pop();

                if(mapping[nodePair[0]]){ //If a mapping exists, it must be the same as the current pair
                    if(mapping[nodePair[0]] !== nodePair[1]){
                        return false;
                    } else {
                        continue; //If the pair is the same, then continue as no need to recheck.
                    }
                }
                var m1Node = m1.nodes[nodePair[0]];
                var m2Node = m2.nodes[nodePair[1]];

                var m1Outgoing = m1Node.getOutgoingLinks();
                var m2Outgoing = m2Node.getOutgoingLinks();

                if(m1Outgoing.length != m2Outgoing.length){ //Nodes must have same number of outgoing links. Only need to  consider outgoing links, as all nodes (and so all links) will be considered.
                    return false;
                }

                for(var i = 0; i < alphabet.length; i++){
                    var symbol = alphabet[i];
                    var m1Link = m1Outgoing.find(link => link.input.indexOf(symbol) !== -1);
                    var m2Link = m2Outgoing.find(link => link.input.indexOf(symbol) !== -1);
                    if(!(m1Link && m2Link)){ //If either node does not have a link for this symbol, then both must not have a link.
                        if(m1Link || m2Link){
                            return false;
                        } else {
                            continue; //both undefined => neither has a link for that symbol. Continue to next symbol.
                        }
                    }
                    //Link exists, so the target nodes must be equivilant.
                    var m1Target = m1Link.target;
                    var m2Target = m2Link.target;
                    //Check for reflexive links
                    if(m1Link.isReflexive() || m2Link.isReflexive()){
                        //if either is reflexive, both must be
                        if(!(m1Link.isReflexive() && m2Link.isReflexive())){
                            return false;
                        }
                    } else{
                        //Only need to add to the frontier if not reflexive
                        frontier.push([m1Target.id, m2Target.id]);
                    }
                }

                //Add node pair to mapping:
                mapping[m1Node.id] = m2Node.id;

            }

            //All checks passed, so equivilant
            return true;

        };

        this.getAcceptedSequence = function(){
            //Returns a sequence that the machine accepts, or null if no strings are accepted.
            //Uses a breadth-first search so should return one of the shortest strings.
            if(this.getAcceptingNodeCount() === 0){
                return null;
            }

            this.setToInitialState();
            if(this.isInAcceptingState()){
                return [];
            }

            var frontierLinks = [];
            var pathToNode = {};

            this.getCurrentNodeList().forEach(function(node){
                pathToNode[node.id] = [];
                var outgoingLinks = node.getOutgoingLinks();
                outgoingLinks.filter(link => !pathToNode[link.target]).filter(link => link.input.length > 0 || link.hasEpsilon).forEach(link => frontierLinks.push(link));
            });

            while(frontierLinks.length > 0){
                var link = frontierLinks.pop();
                var symbol = link.hasEpsilon ? [] : [link.input[0]];
                var sourceNode = link.source;
                var targetNode = link.target;
                if(targetNode.isAccepting){
                    return pathToNode[sourceNode.id].concat(symbol);
                } else{
                    pathToNode[targetNode.id] = pathToNode[sourceNode.id].concat(symbol);
                    var outgoingLinks = targetNode.getOutgoingLinks().filter(link => !pathToNode[link.target.id]).filter(link => link.input.length > 0 || link.hasEpsilon);
                    //We want to the return the shortest string possible, so add link to the front of the queue if it contains an epsilon link (as this does not add length to the sequence)
                    outgoingLinks.filter(l => l.hasEpsilon).forEach(l => frontierLinks.unshift(l));
                    //Add to the back instead
                    outgoingLinks.filter(l => !l.hasEpsilon).forEach(l => frontierLinks.push(l));

                }
            }
            return null;
        };

        this.complement = function(){
            //Changes the machine to accept the complement of its current languge
            //This is done by making the blackhole state explicit and making each accepting state non-accepting and vice versa.
            this.convertToDFA();
            this.completelySpecify("blackhole");
            var nodes = this.getNodeList();
            nodes.forEach(node => node.isAccepting = !node.isAccepting);
        };


        this.getIntersectionWith = function(machine){
            // Returns a machine that accepts L = L(this) ∩ L(machine)
            // Ie the intersection machine accepts a sequence iff both of the original machines accept it.
            // Create copies to avoid altering original machines
            var m1 = new Model.Machine("temp1");
            m1.build(this.getSpec());
            var m2 = new Model.Machine("temp2");
            m2.build(machine.getSpec());

            m1.minimize();
            m1.completelySpecify("blackhole"); //Machines must be fully specified - an implicit sink state for unspecified input is not enough for this process.
            m2.minimize();
            m2.completelySpecify("blackhole");


            var intersectionMachine = new Model.Machine("u1");

            var alphabet = m1.alphabet.filter(symbol => m2.alphabet.indexOf(symbol) !== -1);
            intersectionMachine.setAlphabet(alphabet);

            var m1Initial = m1.getNodeList().find(node => node.isInitial);
            var m2Initial = m2.getNodeList().find(node => node.isInitial);

            var getPairID = (pair => pair[0].id + "-" + pair[1].id);

            var nodeFrontier = [[m1Initial, m2Initial]];
            var linksToAdd = [];
            var addedNodes = {}; //Will map a pairID to a Node oject

            while(nodeFrontier.length > 0){
                var pair = nodeFrontier.pop();
                var pairID = getPairID(pair);

                //See if this node pair has already been added.
                if(addedNodes[pairID]){
                    continue;
                }

                var n1 = pair[0];
                var n2 = pair[1];

                var isAccepting = n1.isAccepting && n2.isAccepting;
                var isInitial = n1.isInitial && n2.isInitial;

                addedNodes[pairID] = intersectionMachine.addNode(0, 0, "", isInitial, isAccepting);

                alphabet.forEach(function(symbol){
                    //For the pair of nodes, get the state that they will move to for this symbol
                    var m1Target = m1.nodes[n1.getReachableNodes(symbol).nodeIDs[0]];
                    var m2Target = m2.nodes[n2.getReachableNodes(symbol).nodeIDs[0]];
                    //And add it to the frontier
                    var newPair = [m1Target, m2Target];
                    nodeFrontier.push(newPair);
                    //Noting the link that must be created
                    var target = getPairID(newPair);
                    linksToAdd.push({source:pairID, target, symbol});
                });

            }

            //All nodes created, now add the links:
            while(linksToAdd.length > 0){
                var link = linksToAdd.pop();
                var sourceNode = addedNodes[link.source];
                var targetNode = addedNodes[link.target];
                var input = [link.symbol];
                //Test if link exists
                //See if link already exists
                var existingLink = sourceNode.getLinkTo(targetNode);
                if(existingLink !== null){
                    //Link present, combine input symbols
                    existingLink.addInput(input, false);
                } else {
                    //No link present, create it
                    var hasEpsilon = false;
                    var output = {};
                    intersectionMachine.addLink(sourceNode, targetNode, input, output, hasEpsilon);
                }
            }

            return intersectionMachine;

        };

        this.reverse = function(){
            for(let nodeID in this.nodes){
                const node = this.nodes[nodeID];
                const isAccepting = node.isInitial;
                const isInitial = node.isAccepting;
                node.isAccepting = isAccepting;
                node.isInitial = isInitial;
            }
            // Create a list of reversed links to be created
            const newLinks = [];
            for(let linkID in this.links){
                //Can't use link.reverse() due to the way that that combines links
                const link = this.links[linkID];
                const source = link.target;
                const target = link.source;
                const input = link.input;
                const output = link.output;
                const hasEpsilon = link.hasEpsilon;
                const newLink = {source, target, input, output, hasEpsilon};
                newLinks.push(newLink);
                this.deleteLink(link); //Delete all links
            }
            //Create new links
            for(let i = 0; i < newLinks.length; i++){
                const link = newLinks[i];
                this.addLink(link.source, link.target, link.input, link.output, link.hasEpsilon);
            }
        };

        this.completelySpecify = function(type){
            //Completely specifies the machine by ensuring that every state has a transition for every symbol
            //Can be done in two ways:
            //For type = "blackhole" all unspecified transitions are sent to an explicit blackhole state
            //For type = "ignore" all unspecifed input is ignored using reflexive links (ie unspecified input does not change machine state)

            if(!["blackhole", "ignore"].includes(type)){
                throw new Error(`Unexpected type: '${type}' in Model.Machine.completelySpecify.`);
            }

            //Check that action is needed:
            if(this.isCompletelySpecified()){
                return null;
            }
            let blackholeNode;
            if(type === "blackhole"){
                //See if a blackhole node exists (ie one with no transitions except to itself, that is not accepting)
                const blackholeCandidates = this.getNodeList().filter(n => !n.isAccepting).filter(n => n.getOutgoingLinks().filter(l => l.target !== n).length === 0);
                if(blackholeCandidates.length > 0){
                    blackholeNode = blackholeCandidates[0];
                } else{
                    //Add a new node to be the black-hole state
                    const blackholeName = "{ }"; //Also 🗑 or 🚮 could work
                    blackholeNode = this.addNode(150, 150, blackholeName, false, false);
                }

            }

            var nodes = this.getNodeList();
            var alphabet = this.alphabet;

            //For every node, find the symbols without input
            for(var i = 0; i < nodes.length; i++){
                var node = nodes[i];
                //Test every symbol in the alphabet
                var unspecifiedInput = []; //All symbols that the node does not have a link for.
                for(var j = 0; j < alphabet.length; j++){
                    var symbol = alphabet[j];
                    var reachableNodes = node.getReachableNodes(symbol);
                    if(reachableNodes.nodeIDs.length === 0){
                        unspecifiedInput.push(symbol);
                    }
                }
                if(unspecifiedInput.length > 0){
                    var targetNode = type === "blackhole"? blackholeNode : node; //Add link to either blackhole or current node as needed
                    this.addLink(node, targetNode, unspecifiedInput, undefined, false);
                }
            }

            if(type === "blackhole"){
                return blackholeNode;
            }


        };

        this.isCompletelySpecified = function(){
            //Returns true if every node has at least one link for every input to every state
            var nodes = this.getNodeList();
            var alphabet = this.alphabet;
            for(var i = 0; i < nodes.length; i++){
                var node = nodes[i];
                //Test every symbol in the alphabet
                for(var j = 0; j < alphabet.length; j++){
                    var symbol = alphabet[j];
                    var reachableNodes = node.getReachableNodes(symbol);
                    if(reachableNodes.nodeIDs.length === 0){
                        return false;
                    }
                }
            }
            return true;
        };

        this.getTransitionTable = function(){
            const m = this; // Save this so we can refer to it from within the forEach function.
            const savedState = this.currentState;
            const nodes = m.getNodeListNameSorted();
            const table = {};
            const alphabet = m.alphabet.sort();

            nodes.forEach(function(node){
                const tableEntry = {node, transitions:[], id:node.id};
                for(let i = 0; i < alphabet.length; i++){
                    m.setToState([node]);
                    m.followEpsilonTransitions();
                    m.step(alphabet[i]);
                    m.followEpsilonTransitions();
                    const state = m.currentState;
                    const nodeObjs = state.map(id => m.nodes[id]);
                    const names = nodeObjs.map(node => node.name).sort();
                    const linksUsed = m.linksUsed.map(id => m.links[id]);
                    let id = null;
                    if(state.length > 0){
                        id =  state.sort().reduce((a,b) => `${a}_${b}`);
                    }
                    tableEntry.transitions.push({names, id, nodes: nodeObjs, linksUsed});
                }
                table[node.id] = tableEntry;
            });
            m.currentState = savedState;
            return table;
        };

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

            var newNodeSets = [];

            // Return this object at the end to allow visualisation of the process
            // Will an obj which maps reachable state-set IDs to
            // {ID, nodes:[Node, Node,..],
            //  transitions:{"a": {nodes:[Node, Node,...], ID, linkUsageObj}}
            // }
            const steps = [];
            const transitionTable = {}; //maps stateIDs to transition step objects.

            var addToNewNodeSets = function(nodeSet){
                //Takes an array of nodes, and add it to the newNodeSets array
                //Sort the nodeSet, to ensure that each nodeSet has only one ID:
                nodeSet.sort(function(x,y){
                    if(x.id < y.id){
                        return -1;
                    }
                    return 1;
                });
                if(nodeSet.length > 0){
                    var id = nodeSet.map(node => node.id).reduce((x,y)=> `${x}_${y}`);
                    var obj = {id, nodes:nodeSet};
                    newNodeSets.push(obj);
                    if(nodeSet.length > 1){
                        steps.push({type:"setAdded", id, names:nodeSet.map(node => node.name)});
                    }
                    return id;
                }

            };

            var nameNodeSet = function(nodeSet){
                //Creates a name for a nodeSet, based on the names of the consitituent nodes
                if(nodeSet.length === 1){
                    return nodeSet[0].name;
                }
                if(nodeSet.filter(node => node.name === "").length > 0){
                    //if any node is unnamed, return ""
                    return "";
                }
                return "{" + nodeSet.map(node=>node.name).sort().reduce((x,y) => `${x}, ${y}`) + "}";
            };

            //Start with the initial nodeSet of the machine
            this.setToInitialState();
            var initialNodeSet = this.getCurrentNodeList();
            addToNewNodeSets(initialNodeSet);
            var firstNodeSet = true;

            //Populate nodeSets, adding to newNodeSets as new reachable combinations are discovered.
            while(newNodeSets.length > 0){
                const nodeSet = newNodeSets.pop();
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

                this.setToState(nodeSet.nodes);
                var isAccepting = this.isInAcceptingState();
                var reachable = {};
                var name = nameNodeSet(nodeSet.nodes);
                var x = nodeSet.nodes.map(node => node.x).reduce((x1,x2)=> x1 + x2)/nodeSet.nodes.length; //set x to mean value of nodes in set
                var y = nodeSet.nodes.map(node => node.y).reduce((y1,y2)=> y1 + y2)/nodeSet.nodes.length; //set x to mean value of nodes in set

                const transitions = [];

                //Add this nodeSet to the transition table
                transitionTable[nodeSet.id] = {id: nodeSet.id, nodes: nodeSet.nodes, transitions:{}};

                for(var i = 0; i < this.alphabet.length; i++){
                    const symbol = this.alphabet[i];
                    this.setToState(nodeSet.nodes);
                    const stepObj = this.getTraceStep(symbol);
                    const reachableNodes = this.getCurrentNodeList();
                    if(reachableNodes.length > 0){
                        const id = addToNewNodeSets(reachableNodes);
                        reachable[symbol] = id;
                        transitions.push({id, names: reachableNodes.map(node => node.name).sort()});
                        transitionTable[nodeSet.id].transitions[symbol] = {nodes: reachableNodes, id, linkUsageObj: stepObj.links};
                    } else {
                        reachable[symbol] = "none";
                        transitions.push({id:null, names:[]});
                        transitionTable[nodeSet.id].transitions[symbol] = {nodes: [], id: null};
                    }
                }
                const obj = {nodes:nodeSet.nodes, reachable, name, isInitial, isAccepting, x, y};
                nodeSets[nodeSet.id] = obj;
            }

            //Now, clear the current machine
            this.deleteAllNodes();
            //And recreate from nodeSets, first create nodes for each nodeSet;
            const nodeSetMap = {}; // Maps nodeSetIDs to the new nodes
            const nfaNodeMap = {}; // Maps nodeIDs from the original machine to a list of nodes in the new machine.
            for(let nodeSetID in nodeSets){
                const nodeSet = nodeSets[nodeSetID];
                const newNode = this.addNode(nodeSet.x, nodeSet.y, nodeSet.name, nodeSet.isInitial, nodeSet.isAccepting);
                nodeSetMap[nodeSetID] = newNode;
                nodeSet.newNode = newNode;
                nodeSet.nodes.forEach(function(node){
                    if(nfaNodeMap[node.id]){
                        nfaNodeMap[node.id].push(newNode);
                    } else {
                        nfaNodeMap[node.id] = [newNode];
                    }
                });
            }
            //And then create links as needed
            for(let nodeSetID in nodeSets){
                const nodeSet = nodeSets[nodeSetID];
                const sourceNode = nodeSet.newNode;
                for(let symbol in nodeSet.reachable){
                    const targetNodeID = nodeSet.reachable[symbol];
                    if(targetNodeID === "none"){
                        continue;
                    }
                    const targetNode = nodeSets[targetNodeID].newNode;
                    const linkExists = sourceNode.hasLinkTo(targetNode);
                    if(linkExists){
                        const link = sourceNode.getLinkTo(targetNode);
                        link.addInput([symbol], false);
                    } else {
                        this.addLink(sourceNode, targetNode, [symbol], undefined, false);
                    }
                }
            }
            return [transitionTable, nodeSetMap, nfaNodeMap];
        };

        this.getLinksTo = function(targetNode){
            //Returns an array containing all links to targetNode
            if (targetNode instanceof Model.Node === false){
                targetNode = this.nodes[targetNode];
            }
            var links = [];
            for(var nodeID in this.nodes){
                var node = this.nodes[nodeID];
                var linkToTarget = node.getLinkTo(targetNode);
                if(linkToTarget !== null){
                    links.push(linkToTarget);
                }
            }
            return links;

        };

        this.isDeterministic = function(){
            const nodes = this.getNodeList();
            //For each node in the machine
            for(let n of nodes){
                //Ensure that there there is at most one outgoing link for each symbol
                const symbolsSeen = [];
                const outgoingLinks = n.getOutgoingLinks();
                for(let l of outgoingLinks){
                    if(l.hasEpsilon){
                        return false;
                    }
                    for(let symbol of l.input){
                        if(symbolsSeen.includes(symbol)){
                            return false;
                        } else {
                            symbolsSeen.push(symbol);
                        }
                    }
                }
            }
            return true;
        };

        this.testRegex = function(str){
            //Tests the given regex string on the machine, using the inefficient but serviceable approach from v1
            const m = this;
            const alphabet = m.alphabet;
            if(m.getAcceptingNodeCount() === 0){
                return "Machine has no accepting states.";
            }
            var toString = x => x.reduce((x,y) => x + y, "");
            var nStates = m.getNodeCount();
            var sequences = [[]];
            var regex = new RegExp(str);
            while(sequences[0].length <= 2 * nStates){
                var newSequences = [];
                for(var i = 0; i < sequences.length; i++){
                    var thisSequence = sequences[i];
                    var string = toString(thisSequence);
                    let printableString = "'" + string + "'";
                    if(printableString.length == 2){
                        printableString = "the empty string";
                    }
                    var regexAccepts = true;
                    if (regex.exec(string) == null || regex.exec(string)[0] != string){
                        regexAccepts = false;
                    }
                    var machineAccepts = m.accepts(thisSequence);
                    if(regexAccepts && !machineAccepts){
                        return `Machine rejects ${printableString} which regex accepts.`;
                    }
                    if(!regexAccepts && machineAccepts){
                        return `Regex rejects ${printableString} which machine accepts.`;
                    }

                    //Populate newSequences
                    for(var j = 0; j< alphabet.length; j++){
                        var symbol = alphabet[j];
                        var newSequence = thisSequence.concat([symbol]);
                        newSequences.push(newSequence);
                    }
                }
                sequences = newSequences;
            }
            return "Regex and FSM are equivalent.";

        };

        this.issueNodeNames = function(){
            //Give any unnamed nodes a name -- try to be clever and follow any existing naming convention
            const nodes = this.getNodeList();
            //Ensure node name is defined.
            nodes.map(function(node){
                if(!node.name){
                    node.name = "";
                }
            });
            const namedNodes = nodes.filter(node => node.name.length > 0);
            if(namedNodes.length == nodes.length){
                return; //All nodes are already named.
            }
            let namingScheme;
            // A generator to produce strings A, B,..AA,AB,..
            // A surprisingly difficult problem!
            const upperAlphabeticalGen = function*(){
                yield "A";
                let i = 1;
                while(true){
                    let t = i;
                    let str = "";
                    str = String.fromCharCode((t % 26) + 65) + str;
                    t = (t / 26) >> 0;
                    while(t > 0){
                        if(t > 25){
                            str = String.fromCharCode((t % 25) + 64) + str;
                        }
                        else{
                            str = String.fromCharCode((t % 26) + 64) + str;
                        }
                        t = (t / 26) >> 0;
                    }
                    yield str;
                    i = i + 1;
                }
            }();

            //Generate strings in form 1,2,3,...
            const numericalGen = function*(){
                let i = 1;
                while(true){
                    yield String(i);
                    i = i + 1;
                }
            }();

            const names = namedNodes.map(node => String(node.name));

            //Now we chose a naming scheme
            if(namedNodes.length == 0){
                //No nodes are named, we can choose a naming scheme:
                namingScheme = upperAlphabeticalGen;
            } else if(names.filter(name => /^[0-9]*$/.test(name)).length == names.length){
                //All names are numeric
                namingScheme = numericalGen;
            } else {
                namingScheme = upperAlphabeticalGen;
            }

            //Naming scheme chosen, now we must rename nodes.
            const unnamedNodes = nodes.filter(node => node.name.length == 0);
            //sort into left-to-right order
            unnamedNodes.sort((a,b) => a.x - b.x);
            for(let i = 0; i < unnamedNodes.length; i++){
                let newName = namingScheme.next().value;
                while(names.indexOf(newName) !== -1){
                    newName = namingScheme.next().value;
                }
                unnamedNodes[i].name = newName;
            }
        };

        this.clone = function(newID){
            //Return a copy of this machine
            if(!newID){
                newID = this.id;
            }
            const spec = this.getSpec();
            const newMachine = new Model.Machine(newID);
            newMachine.build(spec);
            return newMachine;
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
        this.selected = false;

        this.toggleSelected = function(){
            this.selected = !this.selected;
        };

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
        this.getEpsilonReachableNodes = function(){
            //Returns an array of nodes reachable from this node via 1 or more epsilon transitions
            const allReachableNodes = [];
            const frontier = [this];
            while(frontier.length > 0){
                const node = frontier.pop();
                const reachableNodes = node.getEpsilonLinks().map(linkID => this.machine.links[linkID]).map(link => link.target);
                reachableNodes.forEach(function(node){
                    if(!allReachableNodes.includes(node)){
                        allReachableNodes.push(node);
                        frontier.push(node);
                    }
                });
            }
            return allReachableNodes;
        };
        this.getReachableNodes = function(symbol){
            //Return an object containing nodeIDs of nodes reachable from this node for the given input symbol
            //and the linkIDs of links used
            //Form {nodeIDs: ["m1-n1"], linkIDS: ["m1-L1"]}
            var keys = Object.keys(this.outgoingLinks);
            var nodeIDs = [];
            var linkIDs = [];
            for(var i = 0; i < keys.length; i++){
                var linkID = keys[i];
                var link = this.outgoingLinks[linkID];
                if(link.input.indexOf(symbol) !== -1){
                    nodeIDs.push(link.target.id);
                    linkIDs.push(linkID);
                }
            }
            return {"nodeIDs": nodeIDs, "linkIDs": linkIDs};
        };
        this.getReachableNodesWithEpsilon = function(symbol){
            //Return an array containing nodes reachable from this node for the given input symbol
            //making use of epsilon transitions before and after the symbol.
            const savedState = this.machine.currentState;
            this.machine.setToState([this]);
            this.machine.followEpsilonTransitions();
            this.machine.step(symbol);
            const reachableStates = this.machine.getCurrentNodeList();
            this.machine.currentState = savedState;
            return reachableStates;

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
            return Object.keys(this.outgoingLinks).map(id => this.outgoingLinks[id]);
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

        this.addInput = function(inputList, hasEpsilon){
            //Adds to the existing allowed input
            inputList = inputList.concat(this.input);
            hasEpsilon = this.hasEpsilon || hasEpsilon;
            this.setInput(inputList, hasEpsilon);
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

        this.enforceAlphabet = function(){
            //Remove any inputs prohibited by the machine alphabet.
            var alphabet = this.machine.alphabet;
            var allowEpsilon = this.machine.allowEpsilon;
            this.input = this.input.filter(x => alphabet.indexOf(x) !== -1);
            this.hasEpsilon = this.hasEpsilon && allowEpsilon;
            //Enforce restrictions on outputs also:
            if(!this.machine.isMealy){
                this.output = {};
            } else {
                //Ensure that all keys (inputs) in this.output are allowed
                Object.keys(this.output).filter(symbol => !alphabet.includes(symbol)).forEach(invalidSymbol => delete this.output[invalidSymbol]);
                //Ensure that all keys (inputs) in this.output are in this.input
                Object.keys(this.output).filter(symbol => !this.input.includes(symbol)).forEach(invalidSymbol => delete this.output[invalidSymbol]);
                //Ensure that all values (outputs) in this.outputs are allowed
                Object.keys(this.output).filter(symbol => !this.machine.outputAlphabet.includes[this.output[symbol]]).forEach(invalidSymbol => delete this.output[invalidSymbol]);
            }
        };

        this.hasOpposite = function(){
            // True if there is a link in the opposite direction (for any input)
            // False if link is reflexive
            if(this.isReflexive()){
                return false;
            }
            return this.target.hasLinkTo(this.source);
        };

        this.inputIndexOf = function(symbol){
            //Given an input symbol, return the index of that symbol in this.input
            var index = this.input.indexOf(symbol);
            if(index < 0){
                throw new Error(`Symbol:'${symbol}' not found in link ${this.id}`);
            } else {
                return index;
            }
        };

        this.setOutput = function(outputObj, epsilonOutput){
            this.output = outputObj;
            // If a symbol has output, it must be in the input array
            this.addInput(Object.keys(outputObj));
            if(epsilonOutput){
                this.hasEpsilon = true;
            }
            this.epsilonOutput = epsilonOutput;
        };

        this.isReflexive = function(){
            return this.source.id === this.target.id;
        };
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
            if(["give-list", "select-states", "does-accept", "give-input", "dfa-convert", "minimize-table"].indexOf(Model.question.type) == -1){
                this.allowEditing = true;
            } else {
                this.allowEditing = false;
            }
            if(Model.question.type === "give-input"){
                Model.question.currentInput = [];
            }
            if(Model.question.type === "dfa-convert"){
                const m1 = Model.machines[0];
                const m2 = Model.machines[1];

                //Set up a mapping from nodes in m2 in sets of nodes in m1
                const m1InitialNodes = m1.getNodeList().filter(node => node.isInitial);
                const m2InitialNode = m2.getNodeList().filter(node => node.isInitial)[0];
                Model.question.m2tom1 = {};
                Model.question.m2tom1[m2InitialNode.id] = m1InitialNodes;

                //Keep track of which m2Node / symbol pairs must be investiagated
                Model.question.frontier = [];
                Model.machines[0].alphabet.reverse().forEach(function(symbol){
                    //Add pair to frontier if any of the m1Initial nodes have a reachable node
                    Model.question.DfaAddToFrontier(m2InitialNode.id, symbol);
                });

                //Setup a mapping from nodeset names to m2Nodes (eg "{q1, q2, q3}" -> Node)
                Model.question.nodeSetNameToM2Node = {};
                const initialNodesSetName = "{" + m1InitialNodes.map(node => node.name).sort().reduce((x,y) => `${x}, ${y}`) + "}";
                Model.question.nodeSetNameToM2Node[initialNodesSetName] = m2InitialNode;
            }
            if(Model.question.type === "minimize-table"){
                //Save the machine spec, so that the machine can be reset later
                Model.question.machineSpec = Model.machines[0].getSpec();
            }

        },
        checkAnswer: function(input){
            //Input other than the machine only recquired for some question types (but always passed along anyway for simplicity)
            var checkFunctions = {
                "dfa-convert": this.checkDfaConvert,
                "does-accept": this.checkDoesAccept,
                "give-equivalent": this.checkGiveEquivalent,
                "give-input": this.checkGiveInput,
                "give-list": this.checkGiveList,
                "minimize-table": this.checkMinimizeTable,
                "satisfy-definition": this.checkSatisfyDefintion,
                "satisfy-list": this.checkSatisfyList,
                "select-states": this.checkSelectStates
            };
            if(!checkFunctions[this.type]){
                throw new Error(`No check function for type '${this.type}'`);
            }else{
                return checkFunctions[this.type](input);
            }
        },
        checkDfaConvert: function(){
            const promptObj = Model.question.lastPromptObj;
            const feedbackObj = {
                allCorrectFlag: false,
                falsePositiveNode: undefined,
                falseNegativeNode: undefined,
                symbol: promptObj.symbol,
                newNode: false,
                sourceNode: false,
                thisCorrect: false
            };
            const m1 = Model.machines[0];
            const m2 = Model.machines[1];
            const selectedNodes = m1.getNodeList().filter(node => node.selected);
            const m2Node = promptObj.m2Node;
            const symbol = promptObj.symbol;

            const m1Nodes = promptObj.m1Nodes;
            const allReachableNodes = [];
            //Find all nodes reachable from m1Nodes for input symbol
            m1Nodes.forEach(function(node){
                const reachableNodes = node.getReachableNodesWithEpsilon(symbol);
                reachableNodes.forEach(function(node){
                    if(!allReachableNodes.includes(node)){
                        allReachableNodes.push(node);
                    }
                });
            });

            //Check for false positives (nodes that are selected but are not in allReachableNodes)
            for(let i = 0; i < selectedNodes.length; i++){
                const node = selectedNodes[i];
                if(!allReachableNodes.includes(node)){
                    feedbackObj.falsePositiveNode = node;
                    return feedbackObj;
                }
            }

            //Check for false negatives (nodes that are not selected but are in allReachableNodes)
            for(let i = 0; i < allReachableNodes.length; i++){
                const node = allReachableNodes[i];
                if(!selectedNodes.includes(node)){
                    feedbackObj.falseNegativeNode = node;
                    return feedbackObj;
                }
            }

            //No false positives or negatives -> correct answer
            //So add corresponding node to m2 (if it is not already present)
            const nodeSetName = "{" + selectedNodes.map(node => node.name).sort().reduce((x,y) => `${x}, ${y}`) + "}";
            let targetM2Node = Model.question.nodeSetNameToM2Node[nodeSetName];
            if(!targetM2Node){
                //Corresponding node not present in m2, create it.
                const isInitial = false; //New nodes cannot be initial
                const isAccepting = selectedNodes.map(node => node.isAccepting).reduce((x,y) => x || y); //New node is accepting if any of its consitituent nodes are.
                const x = 0; //Node repositioning is the responsibility of Display.
                const y = 0;
                targetM2Node = m2.addNode(x, y, nodeSetName, isInitial, isAccepting);

                feedbackObj.newNode = targetM2Node; //Tell Display which node must be positioned.
                feedbackObj.sourceNode = m2Node;

                //If creating a new node, we must update the mappings:
                Model.question.m2tom1[targetM2Node.id] = selectedNodes;
                Model.question.nodeSetNameToM2Node[nodeSetName] = targetM2Node;

                //And the frontier
                const alphabet = m2.alphabet.map(x => x).reverse(); //Create reversed copy of alphabet. Reversed so that order will be correct after push/pop.
                alphabet.forEach(function(symbol){
                    Model.question.DfaAddToFrontier(targetM2Node.id, symbol);
                });
            }

            // Now we must add a link to targetM2Node (or modify an existing link)
            let link = m2Node.getLinkTo(targetM2Node);
            if(!link){
                link = m2.addLink(m2Node, targetM2Node, [symbol], {}, false);
            } else {
                link.addInput([symbol], false);
            }

            // Finally, return the feedbackObj
            feedbackObj.thisCorrect = true;
            feedbackObj.allCorrectFlag = Model.question.frontier.length === 0; //Process finished if frontier is empty.
            return feedbackObj;
        },

        checkMinimizeTable: function(){
            const minimalMachine = new Model.Machine("orig");
            minimalMachine.build(Model.question.machineSpec);
            minimalMachine.minimize();
            const machine = Model.machines[0];
            const feedbackObj = {allCorrectFlag: false, message:"", incorrectSequence:undefined, shouldAcceptIncorrect: undefined};

            //machine must be equivalent to the original so use the giveEquivalent check to do some of the work:
            Model.question.targetMachineSpec = Model.question.machineSpec;
            const equivFeedback = Model.question.checkGiveEquivalent();
            if(!equivFeedback.allCorrectFlag){
                if(equivFeedback.incorrectSequence){
                    let printableSequence = equivFeedback.incorrectSequence.reduce((x,y) => x + Model.question.splitSymbol + y, "");
                    if(printableSequence.length === 0){
                        printableSequence = "the empty string";
                    } else{
                        printableSequence = "'" + printableSequence + "'";
                    }
                    if(equivFeedback.shouldAcceptIncorrect){
                        feedbackObj.message = `Incorrect – the original machine accepted ${printableSequence} but this machine does not.`;
                    }else{
                        feedbackObj.message = `Incorrect – the original machine rejected ${printableSequence} but this machine does not.`;
                    }
                    return feedbackObj;
                } else{
                    feedbackObj.message = equivFeedback.message;
                    return feedbackObj;
                }
            }

            //Machine is equivalent, now we must check if it is minimal
            //Minimize the original machine, completely specify it, and count the number of nodes
            minimalMachine.completelySpecify("blackhole"); //Make the blackhole state explicit so that we can count it
            const nNodesMinimal = minimalMachine.getNodeList().length;

            //Compare the number of nodes in the minimal machine to the number in the user's machine, after it has also been completely specified.
            const machineCopy = new Model.Machine("cpy");
            machineCopy.build(machine.getSpec()); //Construct a copy of the users machine, as we do not want to modify the original
            machineCopy.completelySpecify("blackhole");
            const nNodesUser = machineCopy.getNodeList().length;
            if(nNodesUser === nNodesMinimal){
                //Correct number of nodes -> machine is minimized.
                feedbackObj.allCorrectFlag = true;
                return feedbackObj;
            }
            if(nNodesUser < nNodesMinimal){
                //This shouldn't happen!
                throw new Error("The minimized machine has fewer nodes than expected. Something has gone wrong!");
            }
            //Here we know that the user machine can be minimized further
            feedbackObj.message = "Incomplete – the machine can be minimized further";
            return feedbackObj;


        },

        checkSatisfyDefintion: function(){
            const machine = Model.machines[0];
            const spec = Model.question.definition;
            const feedbackObj = {allCorrectFlag: false, message: ""};

            //Test number of states.
            const nNodes = machine.getNodeCount();
            if(nNodes !== spec.states.length){
                feedbackObj.message = `Incorrect – the machine should have ${spec.states.length} states but it has ${nNodes} states.`;
                return feedbackObj;
            }

            //Test that each state name is present.
            const nodes = machine.getNodeList();
            const nodeNames = nodes.map(node => node.name);
            const missingNodeNames = spec.states.filter(name => !nodeNames.includes(name));
            if(missingNodeNames.length > 0){
                feedbackObj.message = `Incorrect – the machine should have a state named ‘${missingNodeNames[0]}’.`;
                return feedbackObj;
            }

            //Test that there are the correct number of accepting states;
            const acceptingStates = nodes.filter(node => node.isAccepting).map(node => node.name);
            if(acceptingStates.length !== spec.acceptingStates.length){
                feedbackObj.message = `Incorrect – the machine should have ${spec.acceptingStates.length} accepting states but it has ${acceptingStates.length} accepting states.`;
                return feedbackObj;
            }

            //Test that the accepting states are correct;
            const missingAcceptingNodeNames = spec.acceptingStates.filter(name => !acceptingStates.includes(name));
            if(missingAcceptingNodeNames.length > 0){
                feedbackObj.message = `Incorrect – state ‘${missingAcceptingNodeNames[0]}’ should be an accepting state.`;
                return feedbackObj;
            }

            //Test that there are the correct number of initial states;
            const initialStates = nodes.filter(node => node.isInitial).map(node => node.name);
            if(initialStates.length !== spec.initialStates.length){
                feedbackObj.message = `Incorrect – the machine should have ${spec.initialStates.length} initial states but it has ${initialStates.length} initial states.`;
                return feedbackObj;
            }

            //Test that the initial states are correct;
            const missingInitialStateNames = spec.initialStates.filter(name => !initialStates.includes(name));
            if(missingInitialStateNames.length > 0){
                feedbackObj.message = `Incorrect – state ‘${missingInitialStateNames[0]}’ should be an initial state.`;
                return feedbackObj;
            }

            //Create a dictionary mapping names to nodes
            const nodeDict = {};
            nodes.forEach(function(node){
                nodeDict[node.name] = node;
            });

            //Test that all links that should be there are present
            for(let i = 0; i < spec.links.length; i++){
                const link = spec.links[i];
                const sourceNode = nodeDict[link.from];
                const targetNode = nodeDict[link.to];
                if(link.epsilon){
                    const epsLink = sourceNode.getLinkTo(targetNode);
                    if(epsLink === null || !epsLink.hasEpsilon){
                        feedbackObj.message = `Incorrect – there should be an epsilon (ε) transition from state ‘${link.from}’ to ‘${link.to}’.`;
                        return feedbackObj;
                    }
                }else{
                    const reachableNodes = sourceNode.getReachableNodes(link.symbol).nodeIDs.map(nodeID => machine.nodes[nodeID]);
                    if(!reachableNodes.includes(targetNode)){
                        feedbackObj.message = `Incorrect – there should be a link from state ‘${link.from}’ to ‘${link.to}’ for ‘${link.symbol}’.`;
                        return feedbackObj;
                    }
                }
            }

            const links = spec.links;
            //Test that all links that are present should be there
            for(let linkID in machine.links){
                const link = machine.links[linkID];
                const from = link.source.name;
                const to = link.target.name;
                for(let i = 0; i < link.input.length; i++){
                    const symbol = link.input[i];
                    let found = false;
                    for(let j = 0; j < links.length && !found; j++){
                        const specLink = links[j];
                        if(to === specLink.to && from === specLink.from && symbol == specLink.symbol){
                            found = true;
                        }
                    }
                    if(!found){
                        feedbackObj.message = `Incorrect – there should not be a link from state ‘${from}’ to ‘${to}’ for ‘${symbol}’.`;
                        return feedbackObj;
                    }
                }
                if(link.hasEpsilon){
                    let found = false;
                    for(let i = 0; i < links.length && !found; i++){
                        const specLink = links[i];
                        if(to === specLink.to && from === specLink.from && specLink.epsilon){
                            found = true;
                        }
                    }
                    if(!found){
                        feedbackObj.message = `Incorrect – there should not be an epsilon (ε) transition from state ‘${from}’ to ‘${to}’.`;
                        return feedbackObj;
                    }
                }
            }
            feedbackObj.allCorrectFlag = true;
            return feedbackObj;
        },

        checkDoesAccept: function(input){
            var machine = Model.machines[0];
            var sequences = Model.question.sequences.map(str => Model.parseInput(str));
            var feedbackObj = {allCorrectFlag: true, isCorrectList: Array(sequences.length).fill(true)};
            for(var i = 0; i< sequences.length; i++){
                var answer = input[i];
                var doesAccept = machine.accepts(sequences[i]);
                if(answer !== doesAccept){
                    feedbackObj.allCorrectFlag = false;
                    feedbackObj.isCorrectList[i] = false;
                }
            }
            return feedbackObj;
        },
        checkGiveEquivalent: function(){
            //setup target machine if it does not exist already
            if(!Model.question.targetMachine){
                Model.question.targetMachine = new Model.Machine("tgt");
                Model.question.targetMachine.build(Model.question.targetMachineSpec);
            }
            const targetMachine = Model.question.targetMachine;
            const inputMachine = Model.machines[0];
            const feedbackObj = {allCorrectFlag: false, message:"", incorrectSequence:undefined, shouldAcceptIncorrect: undefined};
            //Catch invalid machines here
            if(inputMachine.getAcceptingNodeCount() === 0){
                feedbackObj.message = "Machine must have an accepting state.";
                return feedbackObj;
            }
            if(inputMachine.getInitialNodeCount() === 0){
                feedbackObj.message = "Machine must have an initial state.";
                return feedbackObj;
            }
            if(Model.machines[0].isEquivalentTo(targetMachine)){
                feedbackObj.allCorrectFlag = true;
                return feedbackObj;
            }
            //We now know the machine is incorrect, we now must construct an error message

            const inputComplement = new Model.Machine("m1c");
            inputComplement.build(inputMachine.getSpec());
            inputComplement.complement();

            //This machine accepts sequences that the input machine rejects but the target machine accepts:
            const notInputAndTargetMachine = inputComplement.getIntersectionWith(targetMachine);

            let incorrectSequence = notInputAndTargetMachine.getAcceptedSequence();
            if(incorrectSequence !== null){
                let printableSequence = incorrectSequence.reduce((x,y) => x + Model.question.splitSymbol + y, "");
                if(incorrectSequence.length > 0){
                    feedbackObj.message = `Incorrect – the machine should accept ‘${printableSequence}’.`;
                } else {
                    feedbackObj.message = `Incorrect – the machine should accept the empty string.`;
                }
                feedbackObj.incorrectSequence = incorrectSequence;
                feedbackObj.shouldAcceptIncorrect = true;
                return feedbackObj;
            }

            const targetComplement = new Model.Machine("t1c");
            targetComplement.build(targetMachine.getSpec());
            targetComplement.complement();

            //This machine accepts sequences that the input machine accepts but the target machine rejects:
            const inputAndNotTargetMachine = inputMachine.getIntersectionWith(targetComplement);

            incorrectSequence = inputAndNotTargetMachine.getAcceptedSequence();
            if(incorrectSequence !== null){
                let printableSequence = incorrectSequence.reduce((x,y) => x + Model.question.splitSymbol + y, "");
                if(incorrectSequence.length > 0){
                    feedbackObj.message = `Incorrect – the machine should reject ‘${printableSequence}’.`;
                } else {
                    feedbackObj.message = `Incorrect – the machine should reject the empty string.`;
                }
                feedbackObj.incorrectSequence = incorrectSequence;
                feedbackObj.shouldAcceptIncorrect = false;
            }

            return feedbackObj;
        },
        checkGiveInput: function(){
            var feedbackObj = {allCorrectFlag: false};
            if(Model.question.target === "none"){
                return feedbackObj;
            }
            if(Model.question.target === "accept"){
                feedbackObj.allCorrectFlag = Model.machines.filter(m => m.isInAcceptingState()).length === Model.machines.length; //All machines should be in an accepting state.
                return feedbackObj;
            }
            if(Model.question.target === "output"){
                const currentOutput = Model.machines[0].currentOutput;
                const targetOutput = Model.question.outputSequence;
                if(currentOutput.length !== targetOutput.length){
                    feedbackObj.allCorrectFlag = false;
                    return feedbackObj;
                }
                const isCorrect = currentOutput.filter((symbol, i) => symbol !== targetOutput[i]).length === 0;
                feedbackObj.allCorrectFlag = isCorrect;
                return feedbackObj;
            }
        },
        checkGiveList: function(input){
            // Input received as list of strings.
            var machine = Model.machines[0];

            var allCorrectFlag = true;
            var messages = new Array(Model.question.lengths.length).fill(""); // feedback messages to show the user for each question
            var isCorrectList = new Array(Model.question.lengths.length).fill(true); // Tracks whether each answer is correct
            var seen = []; //Use to catch duplicates. Not an efficient algorithm but the dataset is tiny.

            input.forEach(function(string, index){
                var sequence = Model.parseInput(string);
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
                    allCorrectFlag = false;
                    isCorrectList[index] = false;
                    messages[index] = `Incorrect – duplicate entry.`;
                    return;
                }
                seen.push(string);

                //Not duplicate – check if all symbols are in the machine's alphabet
                var nonAlphabetSymbols = sequence.filter(x => machine.alphabet.indexOf(x) === -1);
                if(nonAlphabetSymbols.length > 0){
                    allCorrectFlag = false;
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
        checkSatisfyList: function(){
            const machine = Model.machines[0];
            const feedbackObj = {allCorrectFlag: true, acceptList:[], rejectList:[]};
            const splitSymbol = Model.question.splitSymbol;
            const acceptList = Model.question.shouldAccept;
            const rejectList = Model.question.shouldReject;

            //Check the acceptList
            for(let i = 0; i < acceptList.length; i++){
                //Split the input into individual tokens based on the split symbol.
                const input = acceptList[i].split(splitSymbol).map(y => y.replace(/ /g,"")).filter(z => z.length > 0);
                if(machine.accepts(input)){
                    feedbackObj.acceptList[i] = true;
                } else {
                    feedbackObj.acceptList[i] = false;
                    feedbackObj.allCorrectFlag = false;
                }
            }

            for(let i = 0; i < rejectList.length; i++){
                const input = rejectList[i].split(splitSymbol).map(y => y.replace(/ /g,"")).filter(z => z.length > 0);
                if(!machine.accepts(input)){
                    feedbackObj.rejectList[i] = true;
                } else {
                    feedbackObj.rejectList[i] = false;
                    feedbackObj.allCorrectFlag = false;
                }
            }

            return feedbackObj;
        },
        checkSelectStates: function(){
            var machine = Model.machines[0];
            var selectedNodes = machine.getNodeList().filter(node => node.selected);

            //Determine the nodes that should be collected.
            var initialInput = Model.question.initialSequence;
            var subsequentInput = Model.question.targetSequence;

            var completeSequence = initialInput.concat(subsequentInput);
            machine.setToInitialState();
            machine.accepts(completeSequence);
            var targetNodes = machine.getCurrentNodeList();

            var feedbackObj = {allCorrectFlag: false, initialInput, subsequentInput};

            //Determine if target nodes are the same as selected nodes
            if(targetNodes.length !== selectedNodes.length){
                return feedbackObj;
            }
            if(targetNodes.filter(node => selectedNodes.includes(node)).length !== targetNodes.length){
                return feedbackObj;
            }

            feedbackObj.allCorrectFlag = true;
            return feedbackObj;

        },
        resetMachine(){
            Model.machines[0].build(Model.question.machineSpec);
        },
        getNextDfaPrompt: function(){
            if(Model.question.frontier.length === 0){
                throw new Error("Error in Model.question.getNextDfaPrompt – frontier is empty.");
            }

            const m2 = Model.machines[1];
            const pair = Model.question.frontier.pop();
            const m2Node = m2.nodes[pair[0]];
            const symbol = pair[1];
            const m1Nodes = Model.question.m2tom1[m2Node.id];

            const promptObj = {
                m1Nodes,
                m2Node,
                symbol
            };

            Model.question.lastPromptObj = promptObj;
            return promptObj;
        },
        DfaAddToFrontier: function(m2NodeID, symbol){
            const frontier = Model.question.frontier;
            //Don't add if already in frontier:
            if(frontier.filter(pair => pair[0] === m2NodeID && pair[1] === symbol).length > 0){
                return;
            }
            //Don't add if no reachable nodes from corresponding m1nodes
            const m1Nodes = Model.question.m2tom1[m2NodeID];
            const hasReachableNodes = m1Nodes.map(node => node.getReachableNodesWithEpsilon(symbol)).filter(nodeList => nodeList.length > 0).length > 0;
            if(hasReachableNodes){
                frontier.push([m2NodeID, symbol]);
            }
        }
    }
};


// For use by node during testing - set Model as the export if module is defined.
if (typeof module !== "undefined"){
    module.exports = Model;
}

/*global module*/
