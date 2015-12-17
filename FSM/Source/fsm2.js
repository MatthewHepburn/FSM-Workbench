var model = {
    Machine: function(id) {
        this.id = id;
        this.nodes = {};
        this.links = {};
        this.alphabet = [];
        this.currentStates = [];

        this.addNode = function(x,y, isInitial, isAccepting){
            isInitial = isInitial === undefined? false : isInitial;
            isAccepting = isAccepting === undefined? false : isAccepting;
            var nodeID = this.getNextNodeID();
            this.nodes[nodeID] = new model.Node(nodeID, x, y, isInitial, isAccepting);

        };
        this.addLink = function(sourceNode, targetNode, input, output, hasEpsilon){
            input = input === undefined? [] : input;
            output = output === undefined? {} : output;
            hasEpsilon = hasEpsilon === undefined? false : hasEpsilon;
            var linkID = this.getNextLinkID();
            this.links[linkID] = new model.Link(linkID, sourceNode, targetNode, input, output. hasEpsilon);
            sourceNode.outgoingLinks[linkID] = this.links[linkID];
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
            return this.id + "-l" + String(this.lastNodeID);
        };
        this.setToInitialState = function(){
            //Set the list of current states to be all initial states
            this.currentStates = Object.keys(this.nodes).filter(function(nodeID){
                return this.nodes[nodeID].isInitial;
            });
            this.followEpsilonTransitions();
        };
        this.followEpsilonTransitions = function(){
            var linksUsed = [];
            var visitedStates = [];
            var frontier = this.currentStates;
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
                            this.currentStates.push(targetNodeID);
                        }
                    }
                    visitedStates.push(frontier[i]);
                }
                frontier = newFrontier;
            }
            while (frontier.length != 0);
        };
    },
    Node: function(id, x,y, isInitial, isAccepting){
        this.name = "";
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
            return Object.keys(this.outgoingLinks).filter(function(linkID){
                return this.outgoingLinks[linkID].hasEpsilon;
            });
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

