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
            this.nodes[nodeID] = new Constructor.Node(this, nodeID, x, y, name, isInitial, isAccepting);
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
            this.links[linkID] = new Constructor.Link(this, linkID, sourceNode, targetNode, input, output, hasEpsilon);
            sourceNode.outgoingLinks[linkID] = this.links[linkID];
            return linkID;
        };
        this.deleteNode = function(node){
            // Removes a node from the machine, deleting all links to or from it.
            // Accepts either a Node object or a nodeID
            if (node instanceof Constructor.Node === false){
                node = this.nodes[node];
            }
            delete this.nodes[node.id];
            var context = this;
            Object.keys(node.outgoingLinks).map(function(linkID){
                delete context.links[linkID];
            })
            Object.keys(this.links).map(function(linkID){
                if (context.links[linkID].target.id === node.id){
                    delete context.links[linkID]
                }
            })
        }
        this.build = function(spec){
            //Sets up the machine based on a specification object passed in
            this.nodes = {};
            this.links = {};
            var nodes = spec.nodes;
            var nodeIDDict = {}; //Used to map IDs in the spec to machine IDs
            for (var i = 0; i < nodes.length; i++){
                var n = nodes[i];
                var specID = n.id;
                nodeIDDict[specID] = this.addNode(n.x, n.y, n.name, n.isInit, n.isAcc);
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
            var spec = {"nodes": [], "links": []};
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
                // Machine and Node is probably harmless.
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
    Link: function(machine, linkID, sourceNode, targetNode, input, output, hasEpsilon){
        this.machine = machine; 
        this.id = linkID;
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

var Model = {
    machines: []
};

var Display = {
    nodeRadius: 12,
    canvasVars: {
        "m1": {
            "force":d3.layout.force().on("tick", function(){Display.forceTick("m1");}),
            "machine":Model.machines[0]
        }
    },
    drawNodeContextMenu: function(svg, node, mousePosition){
        var html = "<p class = 'button toggleinitial'>Toggle Start</p>";
        html += "<p class = 'button toggleaccepting'>Toggle Accepting</p>";
        html += "<p class = 'button renamestate'>Rename State</p>";
        html += "<p class = 'button deletestate'>Delete State</p>";

        var menuWidth = 100,
            menuHeight = 80;

        var menuCoords = Display.getContextMenuCoords(svg, mousePosition[0], mousePosition[1], menuWidth, menuHeight);

        var menu = svg.append("foreignObject")
            .attr("x", menuCoords[0])
            .attr("y", menuCoords[1])
            .attr("width", menuWidth)
            .attr("height", menuHeight)
            .classed("context-menu-holder", true)
            .append("xhtml:div")
            .attr("class", "contextmenu")
            .html(html);

        d3.select(".toggleinitial").on("click", function(){node.toggleInitial(); Display.dismissContextMenu()});
        d3.select(".toggleaccepting").on("click", function(){node.toggleAccepting(); Display.dismissContextMenu()});
        d3.select(".renamestate").on("click", function(){display.renameStateForm(node); Display.dismissContextMenu()});


        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault();
        });

    },
    dismissContextMenu: function() {
        d3.select(".contextmenu").remove();
        d3.select(".context-menu-holder").remove();
        Global.contextMenuShowing = false;
    },
    forceTick: function(canvasID){
        //Update the display after the force layout acts
        var svg = d3.select("#"+canvasID)        
        svg.selectAll(".node")
            .attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
        svg.selectAll(".link")
            .each(function(link){
                var linkID = link.id;
                var paddingID = "linkpad"+linkID;
                var pathD = Display.getLinkPathD(link);
                // Calculate d once, then apply to both the link and the link padding.
                d3.select("#" + linkID).attr("d", pathD);
                d3.select("#" + paddingID).attr("d", pathD);
            })
    },
    getContextMenuCoords: function(svg, mouseX, mouseY, menuWidth, menuHeight ){
        // Get coordinates for the context menu so that it is not drawn off screen in form [x, y]
        var id = svg.attr("id");
        var svg = document.querySelector("#" + id); //Switch from a d3 selection to native JS 
        var viewboxWidth = svg.viewBox.baseVal.width;
        var viewboxHeight = svg.viewBox.baseVal.height;
        if(svg.getBoundingClientRect().width > svg.getBoundingClientRect().height){
            var userCoordtoScreenCoord = svg.getBoundingClientRect().height/viewboxHeight;
            var maxX = viewboxWidth + ((svg.clientWidth/(2 * userCoordtoScreenCoord)) - ( viewboxWidth/2));
            var maxY = viewboxHeight;
        } else {
            userCoordtoScreenCoord = svg.getBoundingClientRect().width/viewboxWidth;
            maxX = viewboxWidth;
            maxY = viewboxHeight + ((svg.clientHeight/(2 * userCoordtoScreenCoord)) - (viewboxHeight/2));
        }

        if (mouseX + menuWidth < maxX){
            var menuX = mouseX;
        } else{
            menuX = maxX - menuWidth;
        }

        if (mouseY + menuHeight < maxY -6){
            var menuY = mouseY;
        } else {
            menuY = maxY - menuHeight - 6;
        }
        return [menuX, menuY];
    },
    getLinkPathD: function(link){
        // Test if the link is from a node to itself:
        if (link.source.id === link.target.id){
            // Create two segments, meeting at the top, to allow placement of arrowheads
            // Note this is not needed for arrowheads to display in Chrome, but based on the specification this may be a bug in Chrome.
            var x = link.source.x;
            var y = link.source.y;

            var rad = 15;
            var xoffset = 5;
            var yoffset = 7;


            var x1 = x - xoffset;
            var y1 = y - yoffset;

            var P1 = x1 + "," + y1;

            var x2 = x;
            var y2 = y1 - (Math.sqrt(rad*rad - (xoffset*xoffset)) + rad);
            var x3 = x + xoffset;
            var y3 = y1;

            var P2 = x2 + "," + y2;
            var P3 = x3 + "," + y3;

            

            var str = "M" + P1 + " A" + rad + " " + rad + " 0 0 1 " + P2;
            str += "  A" + rad + " " + rad + " 0 0 1 " + P3;
            return str;

        }
        // Test if there is a link in the opposite direction:
        var hasOpposite = false;
        for (var i = 0; !hasOpposite && i < Object.keys(link.target.outgoingLinks).length; i++){
            var linkID = Object.keys(link.target.outgoingLinks)[i]
            var outgoingLink = link.target.outgoingLinks[linkID];
            if (outgoingLink.target.id === link.source.id){
                hasOpposite = true;
            }
        }

        var deltaX = link.target.x - link.source.x,
            deltaY = link.target.y - link.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Define unit vector from source to target:
        var unitX = deltaX / dist,
            unitY = deltaY / dist;


        var x1 = link.source.x + (unitX * 0.8 * Display.nodeRadius);
        var x2 = link.target.x - (unitX * 0.8 * Display.nodeRadius);
        var y1 = link.source.y + (unitY * 0.4 * Display.nodeRadius);
        var y2 = link.target.y - (unitY * 0.4 * Display.nodeRadius);

        if (hasOpposite){
            //Use a bezier curve
            // Calculate vector from P1 to P2
            var vx = x2 - x1;
            var vy = y2 - y1;

            // Find suitable control points by rotating v left 90deg, normalising and scaling
            var vlx = -1 * vy;
            var vly = 1 * vx;

            var normal_vlx = vlx/Math.sqrt(vlx*vlx + vly*vly);
            var normal_vly = vly/Math.sqrt(vlx*vlx + vly*vly);

            var scaled_vlx = 10 * normal_vlx;
            var scaled_vly = 10 * normal_vly;

            //offset the start and end points along vl
            x1 += 3 * normal_vlx;
            y1 += 3 * normal_vly;
            x2 += 3 * normal_vlx;
            y2 += 3 * normal_vly;


            // Can now define the control points by adding vl to P1 and P2
            var c1x = x1 + scaled_vlx;
            var c1y = y1 + scaled_vly;

            var c2x = x2 + scaled_vlx;
            var c2y = y2 + scaled_vly;

            // We need an explicit midpoint to allow a direction arrow to be placed
            var m1x = c1x + 0.5 * vx;
            var m1y = c1y + 0.5 * vy;

            // Define strings to use to define the path
            var P1 = x1 + "," + y1;
            var M1 = m1x + "," + m1y;
            var P2 = x2 + "," + y2;
            var C1 = c1x + "," + c1y;
            var C2 = c2x + "," + c2y;

            return ("M" + P1 + " Q" + C1 + " " + M1 + " Q" + C2 + " " + P2);
        } else {
            // define vector v from P1 to halfway to P2
            var vx = 0.5 * (x2 - x1);
            var vy = 0.5 * (y2 - y1);

            // midpoint is then:
            var midx = x1 + vx;
            var midy = y1 + vy;

            var P1 = x1 + "," + y1;
            var M = midx + "," + midy;
            var P2 = x2 + "," + y2;

            return ("M" + P1 + " L" + M + " L" + P2);
        }
    },
    update: function(machine, canvasID){
        var colours = Global.colours;

        var svg = d3.select("#"+canvasID);

        // Draw new nodes
        var nodeg = svg.select("#nodes"); // Select the g element used for nodes
        var nodeList = Object.keys(machine.nodes).map(function(nodeID){return machine.nodes[nodeID];});
        var circle = nodeg.selectAll("g")
            .data(nodeList, function(d){return d.id;});
        var newNodes = circle.enter().append("svg:g")
            .append("circle")
                .attr("cx", function(d){return d.x;})
                .attr("cy", function(d){return d.y;})
                .attr("id", function(d){return d.id;})
                .classed("node", true)
                .classed("accepting", function(d){return d.isAccepting;})
                .attr("r", Display.nodeRadius)
                .style("fill", function(d){return colours(d.id);})
                .on("contextmenu", function(node){EventHandler.nodeContextClick(node)});


        // Draw new links
        var linkg = svg.select("#links");
        var linkList = Object.keys(machine.links).map(function(linkID){return machine.links[linkID];})
        var linkGs = linkg.selectAll("g")
            .data(linkList, function(d){return d.id;});
        var newLinks = linkGs.enter().append("svg:g")

        newLinks.append("path")
               .attr("d", function(d){return Display.getLinkPathD(d);})
               .classed("link", true)
               .style("marker-mid", "url(#end-arrow)")
               .attr("id", function(d){return d.id;});
        newLinks.append("svg:path")
               .attr("class", "link-padding")
               .attr("id", function(d){return "linkpad" + d.id;})
               .data("id", function(d){return d;})

        var force = this.canvasVars[canvasID].force;
        force.nodes(nodeList)
            .size([300,300])
            .linkStrength((1))
            .linkDistance(100)
            .chargeDistance(110)
            .charge(-80)
            .alpha(0.02)
            .gravity(0.00)//gravity is attraction to the centre, not downwards.
        force.start()
        newNodes.call(force.drag)





    }
};

var EventHandler = {
    nodeContextClick: function(node){
        d3.event.preventDefault();
        if(Global.contextMenuShowing){
            Display.dismissContextMenu();
        }
        var svg = d3.select("#" + node.machine.id);
        Global.contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());
        Display.drawNodeContextMenu(svg, node, mousePosition);
    }
}

var Controller = {
    init: function(){
        //Reference: addLink(sourceNode, targetNode, input, output, hasEpsilon)
        m = new Constructor.Machine("m1");
        Model.machines.push(m);
        Controller.setupMachine(m, 0);
        Display.update(Model.machines[0], "m1");
    },
    setupMachine: function(machine, i){
        var body = document.querySelector("body");
        var spec = JSON.parse(body.dataset.machinelist)[i];
        machine.build(spec);

    }
};

var Global = {
    // Not certain if this is a good idea - object to hold global vars
    // Some globals useful to avoid keeping duplicated code in sync - this seems like
    // a more readable way of doing that than scattering global vars throughout the codebase
    "toolsWithDragAllowed": ["none"],
    "pageLoaded": false,
    "colours": d3.scale.category10(),
    "iconAddress": document.querySelector("body").dataset.iconaddress,
    //Track state
    "renameMenuShowing":false,
    "contextMenuShowing":false,
    "traceInProgress": false,
    "hasRated": false
};

//Declare d3 as global readonly for ESLint
/*global d3*/

var m;
Controller.init();