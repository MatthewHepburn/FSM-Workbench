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
            var source, target, direction;
            if (mousedown_node.id < mouseup_node.id) {
                source = mousedown_node;
                target = mouseup_node;
                direction = 'right';
            } else {
                source = mouseup_node;
                target = mousedown_node;
                direction = 'left';
            }

            var link;
            link = links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if (link) {
                link[direction] = true;
            } else {
                link = {
                    source: source,
                    target: target,
                    left: false,
                    right: false
                };
                link[direction] = true;
                links.push(link);
            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        }
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

        d3.select(".renamestate").on("click", renameState)

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
    dismissStateContextMenu: function(){
        d3.select(".contextmenu").remove();
        contextMenuShowing = false;
    },
    bezierCurve: function(x1, y1, x2, y2){
        //Calculate vector from P1 to P2
        var vx = x2 - x1;
        var vy = y2 - y1;

        //Find suitable control points by rotating v left 90deg and scaling 
        var vlx = -0.15 * vy;
        var vly = 0.15 * vx;

        //Can now define the control points by adding vl to P1 and P2
        var c1x = x1+ vlx;
        var c1y = y1 + vly;

        var c2x = x2 + vlx;
        var c2y = y2 + vly;

        //Define strings to use to define the path
        var P1 = x1 +"," + y1;
        var P2 = x2 +"," + y2;
        var C1 = c1x + ',' + c1y;
        var C2 = c2x + ',' + c2y;

        return ("M" + P1 + " C" + C1 + " " + C2 + " " + P2);
    },
    line: function(x1, y1, x2, y2){
        var P1 = x1 +"," + y1;
        var P2 = x2 +"," + y2;

        return ("M" + P1 + " L" + P2);
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
//  - links are always source < target; edge directions are set by 'left' and 'right'.
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
        left: false,
        right: true
    }, {
        source: nodes[1],
        target: nodes[2],
        left: false,
        right: true
    },
    {
        source: nodes[1],
        target: nodes[0],
        left: false,
        right: true
    }];

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([width, height])
    .linkDistance(150)
    .charge(-500)
    .on('tick', tick)

// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 4)
    .attr('markerWidth', 3)
    .attr('markerHeight', 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M10,-5L0,0L10,5')
    .attr('fill', '#000');

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

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
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);

        // Determing if there is a link in the other direction. 
        // If there is, we will use a bezier curve to allow both to be visible
        var sourceId = d.source.id
        var targetId = d.target.id
        exists = links.filter(function(l) {
                return (l.source.id === targetId && l.target.id === sourceId);
            })[0];

        if (exists){
            return display.bezierCurve(d.source.x, d.source.y, d.target.x, d.target.y);
        }
        else{
            return display.line(d.source.x, d.source.y, d.target.x, d.target.y);
        }
    });

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
        .style('marker-start', function(d) {
            return d.left ? 'url(#start-arrow)' : '';
        })
        .style('marker-end', function(d) {
            return d.right ? 'url(#end-arrow)' : '';
        });


    // add new links
    path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) {
            return d === selected_link;
        })
        .style('marker-start', function(d) {
            return d.left ? 'url(#start-arrow)' : '';
        })
        .style('marker-end', function(d) {
            return d.right ? 'url(#end-arrow)' : '';
        })
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
        console.log(d.accepting)
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
        .attr('class', 'id')
        .text(function(d) {
            return d.name;
        });



    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();

    // add listeners
    d3.selectAll(".node")
        .on('contextmenu', eventHandler.stateContextMenu);
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
    d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if (d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed('ctrl', true);
    }

    if (!selected_node && !selected_link) return;
    switch (d3.event.keyCode) {
        case 8: // backspace
        case 46: // delete
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
        case 66: // B
            if (selected_link) {
                // set link direction to both left and right
                selected_link.left = true;
                selected_link.right = true;
            }
            restart();
            break;
        case 76: // L
            if (selected_link) {
                // set link direction to left only
                selected_link.left = true;
                selected_link.right = false;
            }
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
    var id = d3.event.toElement.dataset.id;
    // Change state in nodes
    state = nodes[id]
    //Remove concentric ring if we are toggling off:
    if (state.accepting) {
        d3.selectAll("#ar" + id).remove();
    }
    state.accepting = !state.accepting;
    //Dismiss the context menu
    display.dismissStateContextMenu();

    // Update is now needed:
    restart();

}

function renameState() {
    alert("not implemented yet!");
    display.dismissStateContextMenu();
}

// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
var contextMenuShowing = false;
restart();