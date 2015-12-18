var Constructor = {
    Machine: function(id) {
        this.id = id;
        this.nodes = {};
        this.links = {};
        this.alphabet = [];
        this.currentState = [];
        this.linksUsed = [];

        this.addNode = function(x, y, name, isInitial, isAccepting){
            //Adds a node to the machine. Returns the id assigned to the node.
            isInitial = isInitial === undefined? false : isInitial;
            isAccepting = isAccepting === undefined? false : isAccepting;
            name = name === undefined? "" : name;
            var nodeID = this.getNextNodeID();
            this.nodes[nodeID] = new Constructor.Node(nodeID, x, y, name, isInitial, isAccepting);
            return nodeID;

        };
        this.addLink = function(sourceNode, targetNode, input, output, hasEpsilon){
            //Adds a link to the machine. Returns the id assigned to the link.
            //Accepts either nodeIDs or node references for source and target
            if (sourceNode instanceof Constructor.Node === false){
                sourceNode = this.nodes[sourceNode];
            }
            if (targetNode instanceof Constructor.Node === false){
                targetNode = this.nodes[targetNode];
            }
            input = input === undefined? [] : input;
            output = output === undefined? {} : output;
            hasEpsilon = hasEpsilon === undefined? false : hasEpsilon;
            var linkID = this.getNextLinkID();
            this.links[linkID] = new Constructor.Link(linkID, sourceNode, targetNode, input, output, hasEpsilon);
            sourceNode.outgoingLinks[linkID] = this.links[linkID];
            return linkID;
        };
        this.getNextNodeID = function(){
            // Returns a sequential node id that incorporates the machine id
            if (this.lastNodeID === undefined){
                this.lastNodeID = -1;
            }
            this.lastNodeID += 1;
            return this.id + "-n" + String(this.lastNodeID);
        };
        this.getNextLinkID = function(){
            // Returns a sequential node id that incorporates the machine id
            if (this.lastLinkID === undefined){
                this.lastLinkID = -1;
            }
            this.lastLinkID += 1;
            return this.id + "-l" + String(this.lastLinkID);
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
            var nodes = this.currentState.map(function(nodeID){
                return this.nodes[nodeID];
            });
            var newNodes = [];
            var linksUsed = [];
            for (var i = 0; i < nodes.length; i++){
                var thisNode = nodes[i];
                var reachableNodeObj = thisNode.getReachableNodes(symbol);
                // Get nodeIDs of nodes reachable from current node for input = symbol, where the nodeID is not in newNodes
                var newReachableNodeIDs = reachableNodeObj.nodeIDs.filter(function(nodeID){
                    return newNodes.indexOf(nodeID) == -1;
                });
                newNodes = newNodes.concat(newReachableNodeIDs);
                linksUsed = linksUsed.concat(reachableNodeObj.linkIDs);
            }
            this.currentState = newNodes;
            this.linksUsed = linksUsed;
            this.followEpsilonTransitions();
        };
    },
    Node: function(id, x, y, name, isInitial, isAccepting){
        this.name = name;
        this.id = id;
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
            for(var i = 0; i < keys; i++){
                var linkID = keys[i];
                var link = this.outgoingLinks[linkID];
                if(link.input.indexOf(symbol) != -1){
                    nodeIDs.push(link.target.id);
                    linkIDs.push(linkID);
                }
            }
            return {"nodeIDS": nodeIDs, "linkIDs": linkIDs};
        };
    },
    Link: function(id, sourceNode, targetNode, input, output, hasEpsilon){
        this.id = id;
        this.input = input;
        this.output = output;
        this.source = sourceNode;
        this.target = targetNode;
        this.hasEpsilon = hasEpsilon;

        this.reverse = function(){
            var t = this.source;
            this.source = this.target;
            this.target = t;
        };

        this.setInput = function(inputList, hasEpsilon){
            this.input = inputList;
            this.hasEpsilon = hasEpsilon;
        };
    }
};

var Controller = {
    init: function(){
        //Reference: addLink(sourceNode, targetNode, input, output, hasEpsilon)
        m = new Constructor.Machine("m1");
        var tim = m.addNode(10,10, "TIM", false, true);
        var node2 = m.addNode(20,20, "", true, false);
        var node3 = m.addNode(0,0,"", false, true);
        var link1 = m.addLink(tim, node2);
        var link2 = m.addLink(node2, tim, [], {}, true);
        var link3 = m.addLink(tim, node3, [], {}, true);
    }
};

var m;
Controller.init();