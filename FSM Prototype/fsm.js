var eventHandler = {
    addLinkMouseDown: function(d) {
        if (d3.event.ctrlKey) return;
        // select link
        mousedown_link = d;
        if (mousedown_link === selected_link) selected_link = null;
        else selected_link = mousedown_link;
        selected_node = null;
        restart();
    },
    createLink: function(d, eventType) {
        if (eventType == "mousedown") {
            if (d3.event.ctrlKey || d3.event.button != 0) return;
            // select node
            mousedown_node = d;
            if (mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
                .style('marker-end', 'url(#end-arrow)')
                .classed('hidden', false)
                .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
            restart();
        } else if (eventType == "mouseup") {
            if (!mousedown_node || d3.event.button != 0) return;

            // needed by FF
            drag_line
                .classed('hidden', true)
                .style('marker-end', '');

            // check for drag-to-self
            mouseup_node = d;
            if (mouseup_node === mousedown_node) {
                resetMouseVars();
                return;
            }

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target;
            source = mousedown_node;
            target = mouseup_node;

            //Check if link already exists. Create it if it doesn't.
            var link;
            link = links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if (!link) {
                link = {
                    source: source,
                    target: target,
                    input: [],
                    id: ++lastLinkId
                };
                links.push(link);
            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        }
    },
    // Provides right-click funtionality for links
    linkContextMenu: function() {
        d3.event.preventDefault();

        //If menu already present, dismiss it.
        if (contextMenuShowing) {
            d3.select(".contextmenu").remove();
            contextMenuShowing = false;
            return;
        }
        // Get the id of the clicked link:
        var id = d3.event.target.id.slice(4);

        var canvas = d3.select(".canvas")
        contextMenuShowing = true;
        mousePosition = d3.mouse(svg.node());

        display.createLinkContextMenu(canvas, id, mousePosition);

    },
    renameState: function() {
        if (renameMenuShowing) {
            display.dismissRenameMenu()
        }
        //Get the id of the targeted node
        var id = d3.event.currentTarget.dataset.id;
        var d = d3.select("[id='" + id + "']").data()[0];
        var currentName = d.name
        if (currentName == undefined){
            currentName = "";
        }
        // create a form over the targeted node
        svg.append("foreignObject")
            .attr("width", 80)
            .attr("height", 50)
            .attr("x", d.x + 30)
            .attr("y", d.y - 10)
            .attr("class", "rename")
            .append("xhtml:body")
            .style("font", "14px 'Helvetica Neue'")
            .style("user-select", "text")
            .style("webkit-user-select", "text")
            .style("z-index", 3)
            .html("<form><input class='renameinput' id='node"+id+"' type='text' size='1' maxlength='5' name='state name' value='" + currentName + "'></form>");

        // give form focus
        document.getElementById('node'+id).focus();

        renameMenuShowing = true;
        display.dismissContextMenu();
    },
    //Provides right-click functionality for states.
    stateContextMenu: function() {
        d3.event.preventDefault();

        //If menu already present, dismiss it.
        if (contextMenuShowing) {
            d3.select(".contextmenu").remove();
            contextMenuShowing = false;
            return;
        }
        // Get the id of the clicked state:
        var id = d3.event.target.id

        var canvas = d3.select(".canvas")
        contextMenuShowing = true;
        mousePosition = d3.mouse(svg.node());

        display.createStateContextMenu(canvas, id, mousePosition);

    }

}

var display = {
    createLinkContextMenu: function(canvas, id, mousePosition) {
        menu = canvas.append("div")
            .attr("class", "contextmenu")
            .style("left", mousePosition[0] + "px")
            .style("top", mousePosition[1] + "px");

        menu.append("p")
            .classed("button changeconditions", true)
            .text("Change condtitions")
            .attr("data-id", id)

        d3.select(".changeconditions").on("click", controller.changeLinkConditions);

        menu.append("p")
            .classed("button deletelink", true)
            .text("Delete link")
            .attr("data-id", id)

        d3.select(".deletelink").on("click", controller.deleteLink);

        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault()
        })

        canvasSize = [
            canvas.node().offsetWidth,
            canvas.node().offsetHeight
        ];

        popupSize = [
            menu.node().offsetWidth,
            menu.node().offsetHeight
        ];
        if (popupSize[0] + mousePosition[0] > canvasSize[0]) {
            menu.style("left", "auto");
            menu.style("right", 0);
        }

        if (popupSize[1] + mousePosition[1] > canvasSize[1]) {
            menu.style("top", "auto");
            menu.style("bottom", 0);
        }
    },
    createStateContextMenu: function(canvas, id, mousePosition) {
        menu = canvas.append("div")
            .attr("class", "contextmenu")
            .style("left", mousePosition[0] + "px")
            .style("top", mousePosition[1] + "px");

        menu.append("p")
            .classed("button toggleaccepting", true)
            .text("Toggle accepting")
            .attr("data-id", id)

        d3.select(".toggleaccepting").on("click", toggleAccepting);

        menu.append("p")
            .classed("button renamestate", true)
            .text("Rename state")
            .attr("data-id", id)

        d3.select(".renamestate").on("click", eventHandler.renameState)

        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault()
        })

        canvasSize = [
            canvas.node().offsetWidth,
            canvas.node().offsetHeight
        ];

        popupSize = [
            menu.node().offsetWidth,
            menu.node().offsetHeight
        ];
        if (popupSize[0] + mousePosition[0] > canvasSize[0]) {
            menu.style("left", "auto");
            menu.style("right", 0);
        }

        if (popupSize[1] + mousePosition[1] > canvasSize[1]) {
            menu.style("top", "auto");
            menu.style("bottom", 0);
        }
    },
    dismissContextMenu: function() {
        d3.select(".contextmenu").remove();
        contextMenuShowing = false;
    },
    dismissRenameMenu: function() {
        d3.select(".rename").remove();
        renameMenuShowing = false;
    },
    bezierCurve: function(x1, y1, x2, y2) {
        // Calculate vector from P1 to P2
        var vx = x2 - x1;
        var vy = y2 - y1;

        // Find suitable control points by rotating v left 90deg and scaling
        var vlx = -0.15 * vy;
        var vly = 0.15 * vx;

        // Can now define the control points by adding vl to P1 and P2
        var c1x = x1 + vlx;
        var c1y = y1 + vly;

        var c2x = x2 + vlx;
        var c2y = y2 + vly;

        // We need an explicit midpoint to allow a direction arrow to be placed
        var m1x = c1x + 0.5 * vx;
        var m1y = c1y + 0.5 * vy

        // Define strings to use to define the path
        var P1 = x1 + "," + y1;
        var M1 = m1x + "," + m1y;
        var P2 = x2 + "," + y2;
        var C1 = c1x + ',' + c1y;
        var C2 = c2x + ',' + c2y;

        return ("M" + P1 + " Q" + C1 + " " + M1 + " Q" + C2 + " " + P2);
    },
    // Returns a path for a line with a node at the midpoint
    line: function(x1, y1, x2, y2) {
        // define vector v from P1 to halfway to P2
        var vx = 0.5 * (x2 - x1);
        var vy = 0.5 * (y2 - y1);

        // midpoint is then:
        var midx = x1 + vx;
        var midy = y1 + vy;

        var P1 = x1 + "," + y1;
        var M = midx + "," + midy
        var P2 = x2 + "," + y2;

        return ("M" + P1 + " L" + M + " L" + P2);
    },
    getLinkLabelPosition: function(x1, y1, x2, y2, isBezier) {
        //Function takes the location of two nodes (x1, y1) and (x2, y2) and
        //returns a suitable position for the link between them.
        var cx = 0.5 * (x1 + x2);
        var cy = 0.5 * (y2 + y1);

        var dx = x2 - x1;
        var dy = y2 - y1;

        //Find vector V from P1 to P2
        var vx = x2 - x1;
        var vy = y2 - y1;

        // Find suitable offset by getting a vector perpendicular to V
        var vpx = -1 * vy;
        var vpy = vx;

        //find angle of the line relative to x axis. From -180 to 180.
        var angle = (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI)
        if (Math.abs(angle) > 90) {
            angle = angle - 180 //don't want text upside down
        }

        if (!isBezier) {
            var scale = 0.10
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };

        } else {
            var scale = 0.20
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        }
    }
}

var controller = {
    changeLinkConditions: function(){
        alert("Not Implemented yet!")
    },
    deleteLink: function(){
        alert("Not Implemented yet!")
    },
    renameSubmit: function() {
        var menu = d3.select('.renameinput')[0][0];
        var value = menu.value
        var id = menu.id
        var type = id.slice(0,4);

        // Process differently if it is a node or link rename
        if (type == "node"){
            var nodeID = id.slice(4)
            var d = d3.select("[id='" + nodeID + "']").data()[0];
            d.name = value;
            //Change the displayed label to the new name
            var label = svg.select("#nodename"+nodeID);
            label.text(value)            
            
        }
        display.dismissRenameMenu()
    }
}



// set up SVG for D3
var width = 960,
    height = 500,
    colors = d3.scale.category10();

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
var nodes = [{
        id: 0,
        accepting: false,
        name: "foo"
    }, {
        id: 1,
        accepting: true,
        name: "bar"
    }, {
        id: 2,
        accepting: false,
        name: "2"
    }],
    lastNodeId = 2,
    links = [{
        source: nodes[0],
        target: nodes[1],
        input: ["a", "b"],
        id:0
    }, {
        source: nodes[1],
        target: nodes[2],
        input: ["a", "b", "c"],
        id:1
    }, {
        source: nodes[1],
        target: nodes[0],
        input: ["a"],
        id:2
    }],
    lastLinkId = 2;

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .gravity(0.05) //gravity is attraction to the centre, not downwards.
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -10 20 20')
    .attr('refX', 7)
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-10L20,0L0,10')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g'),
    linkLabels = svg.selectAll(".linklabel")


// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function(d) {
            var deltaX = d.target.x - d.source.x,
                deltaY = d.target.y - d.source.y,
                dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),

                //Define unit vectors
                unitX = deltaX / dist,
                unitY = deltaY / dist,

                padding = 18,
                sourceX = d.source.x + (padding * unitX),
                sourceY = d.source.y + (padding * unitY),
                targetX = d.target.x - (padding * unitX),
                targetY = d.target.y - (padding * unitY);

            // Determine if there is a link in the other direction.
            // If there is, we will use a bezier curve to allow both to be visible
            var sourceId = d.source.id
            var targetId = d.target.id
            exists = links.filter(function(l) {
                return (l.source.id === targetId && l.target.id === sourceId);
            })[0];

            if (exists) {
                return display.bezierCurve(sourceX, sourceY, targetX, targetY);
            } else {
                return display.line(sourceX, sourceY, targetX, targetY);
            }
        })
        .style("stroke-width", 2)
        .attr("id", function(d){
            return "link"+d.id;
        })

    // Move the input labels
    linkLabels.attr('transform', function(d) {
        // Determine if there is a link in the other direction.
        // We need this as labels will be placed differently for curved links.
        var sourceId = d.source.id
        var targetId = d.target.id
        exists = links.filter(function(l) {
            return (l.source.id === targetId && l.target.id === sourceId);
        })[0];
        exists = Boolean(exists)

        var position = display.getLinkLabelPosition(d.source.x, d.source.y, d.target.x, d.target.y, exists)

        return 'translate(' + position.x + ',' + position.y + ') rotate(' + position.rotation + ')';
    });

    // Draw the nodes in their new positions
    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}

// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(links);

    // update existing links
    path.classed('selected', function(d) {
            return d === selected_link;
        })
        .style('marker-mid', 'url(#end-arrow)');

    // add new links
    path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) {
            return d === selected_link;
        })
        .style('marker-mid', 'url(#end-arrow)')
        .on('mousedown', function(d) {
            eventHandler.addLinkMouseDown(d)
        });

    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, function(d) {
        return d.id;
    });

    // update existing nodes (accepting & selected visual states)
    circle.selectAll('circle')
        .style('fill', function(d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .classed('accepting', function(d) {
            return d.accepting;
        });

    // Add link labels
    linkLabels = linkLabels.data(links);
    linkLabels.enter().append('svg:text')
        .text(function(d) {
            //Funtion to turn array of symbols into the label string
            if (d.input.length == 0) {
                return ""
            } else {
                var labelString = String(d.input[0])
                for (i = 1; i < d.input.length; i++) {
                    labelString += ", " + d.input[i];
                }
                return labelString;
            }

        })
        .attr('class', 'linklabel')
        .attr('text-anchor', 'middle') // This causes text to be centred on the position of the label.

    // add new nodes
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 20)
        .style('fill', function(d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .style('stroke', function(d) {
            return d3.rgb(colors(d.id)).darker().toString();
        })
        .classed('accepting', function(d) {
            return d.accepting;
        })
        .attr("id", function(d) {
            return d.id;
        })
        .on('mousedown', function(d) {
            eventHandler.createLink(d, "mousedown")
        })
        .on('mouseup', function(d) {
            eventHandler.createLink(d, "mouseup")
        });



    // Add a concentric circle to accepting nodes. It has class "accepting-ring"
    d3.selectAll('.node').each(function(d) {
        var id = d.id
        if (d.accepting & !document.getElementById("ar" + id)) {
            d3.select(this.parentNode).append('svg:circle')
                .attr('r', 14)
                .attr('class', "accepting-ring")
                .attr('id', "ar" + id)
                .style('stroke', "black")
                .style('stroke-width', 2)
                .style('fill-opacity', 0)
                // Make pointer events pass through the inner circle, to the node below.
                .style('pointer-events', 'none');
        }
    });


    // show node IDs
    g.append('svg:text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('class', 'nodename')
        .attr('id', function(d){
            return "nodename"+d.id;
        })
        .text(function(d) {
            return d.name;
        });



    // remove old nodes
    circle.exit().remove();

    linkLabels.exit().remove();

    // set the graph in motion
    force.start();

    // add listeners
    d3.selectAll(".node")
        .on('contextmenu', eventHandler.stateContextMenu);

    d3.selectAll(".link")
        .on('contextmenu', eventHandler.linkContextMenu);
}

function mousedown() {
    // prevent I-bar on drag
    //d3.event.preventDefault();

    // because :active only works in WebKit?
    svg.classed('active', true);

    if (d3.event.ctrlKey || d3.event.button != 0 || mousedown_node || mousedown_link) return;

    // Dismiss context menu if it is present
    if (contextMenuShowing) {
        d3.select(".contextmenu").remove();
        contextMenuShowing = false;
        return;
    }

    // If rename menu is showing, do nothing
    if(renameMenuShowing){
        return;
    }

    // insert new node at point
    var point = d3.mouse(this),
        node = {
            id: ++lastNodeId,
            accepting: false
        };
    node.x = point[0];
    node.y = point[1];
    nodes.push(node);

    restart();
}

function mousemove() {
    if (!mousedown_node) return;

    // update drag line
    drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if (mousedown_node) {
        // hide drag line
        drag_line
            .classed('hidden', true)
            .style('marker-end', '');
    }

    // because :active only works in WebKit?
    svg.classed('active', false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
        links.splice(links.indexOf(l), 1);
    });
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
    //d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    //return / enter
    if (d3.event.keyCode == 13) {
        // Prevent default form submit
        d3.event.preventDefault();
        //Call the rename handler if there is a rename menu showing.
        if (renameMenuShowing){
            controller.renameSubmit()
        }
    }

    // ctrl
    if (d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: // delete
            // Do nothing if the rename menu is open
            if(renameMenuShowing){
                break;
            }
            if (selected_node) {
                nodes.splice(nodes.indexOf(selected_node), 1);
                spliceLinksForNode(selected_node);
            } else if (selected_link) {
                links.splice(links.indexOf(selected_link), 1);
            }
            selected_link = null;
            selected_node = null;
            restart();
            break;
        case 82: // R
            if (selected_node) {
                // toggle whether node is accepting
                selected_node.accepting = !selected_node.accepting;
            } else if (selected_link) {
                // set link direction to right only
                selected_link.left = false;
                selected_link.right = true;
            }
            restart();
            break;
    }
}

function keyup() {
    lastKeyDown = -1;

    // ctrl
    if (d3.event.keyCode === 17) {
        circle
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}


function toggleAccepting() {
    var id = d3.event.currentTarget.dataset.id;
    // Change state in nodes
    state = nodes[id]
        //Remove concentric ring if we are toggling off:
    if (state.accepting) {
        d3.selectAll("#ar" + id).remove();
    }
    state.accepting = !state.accepting;
    //Dismiss the context menu
    display.dismissContextMenu();

    // Update is now needed:
    restart();

}



// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
var contextMenuShowing = false;
var renameMenuShowing = false;
restart();