"use strict";

// 'UI' or 'Interface' might be a more accurate name? ('View' as in MVC?)
var Display = {
    nodeRadius: 12,
    acceptingRadius: 0.7 * 12,
    canvasVars: {
        "m1": {
            "force":d3.layout.force().on("tick", function(){Display.forceTick("m1");}),
            "machine": undefined,
            "colours": d3.scale.category10(),
            "toolMode": "none",
            "linkInProgress": false, // True when the user has begun creating a link, but has not selected the second node
            "linkInProgressNode": null, // When linkInProgess is true, holds the source node of the link being created
            "submitRenameFunction": null // When there is rename menu, this holds the function to call to submit it
        }
    },
    newCanvas: function(id, machine){
        Display.canvasVars[id] = {
            "force": d3.layout.force().on("tick", function(){Display.forceTick(id);}),
            "machine": machine,
            "colours": d3.scale.category10(),
            "toolMode": "none",
            "linkInProgress": false,
            "linkInProgressNode": null,
            "submitRenameFunction": null,
        };
        // Add a new svg element
        var svg = d3.select(".maindiv").append("svg")
                    .attr("id", id)
                    .attr("viewBox", "0 0 500 300")
                    .attr("preserveAspectRatio","xMidYMid meet")
                    .on("contextmenu", function(){EventHandler.backgroundContextClick(machine);})
                    .on("click", function(){EventHandler.backgroundClick(machine, true);});
        // resize all canvases
        Display.setSvgSizes();

        // Add <g> elements for nodes and links
        svg.append("g").classed("links", true);
        svg.append("g").classed("nodes", true);
    },
    deleteCanvas: function(machineID){
        d3.select("#" + machineID).remove();
        delete Display.canvasVars[machineID];
        Display.setSvgSizes();
    },
    setSvgSizes: function(){
        var height = "50%";
        var width = (90 / Object.keys(Display.canvasVars).length) + "%";
        d3.selectAll("svg").style("height", height).style("width", width);
    },
    drawControlPalette: function(canvasID){
        var iconAddress = Global.iconAddress;
        var bwidth = 25; //button width
        var strokeWidth = 1;
        var margin = 6;
        var g = d3.select("#" + canvasID).append("g")
                    .classed("controls", true);
        var tools = ["nodetool", "linetool","texttool","initialtool", "acceptingtool", "deletetool"];
        var tooltips = {
            nodetool:"Create new states",
            linetool:"Link states together",
            texttool:"Change link inputs and rename states",
            initialtool: "Toggle start states",
            acceptingtool:"Toggle accepting states",
            deletetool: "Delete links and states"
        };

        var mouseoverFunction = function(){
            var controlRect = d3.select(this)
            controlRect.attr("x", -1);
        };

        var mouseoutFunction = function(){
            var controlRect = d3.select(this)
            controlRect.attr("x", 0);
        };

        // create a button for each tool in tools
        tools.forEach(function(toolName, i){
            var thisG = g.append("g");
            thisG.append("rect") // White rectangle at the bottom - to prevent the button being transparent
                .attr("width", bwidth)
                .attr("height", bwidth)
                .attr("x", 0)
                .attr("y", i * bwidth)
                .attr("fill", "#FFFFFF")
                .attr("fill-opacity", 1);
            thisG.append("rect") // control rect in the middle - ensures that all of the button is clickable
                .attr("width", bwidth)
                .attr("height", bwidth)
                .attr("x", 0)
                .attr("y", i * bwidth)
                .attr("fill", "#010101")
                .attr("fill-opacity", 0)
                .attr("style", "stroke-width:" + strokeWidth +";stroke:rgb(0,0,0)")
                .classed("control-rect", true)
                .attr("id", canvasID + "-" + toolName)
                .on("click", function(){EventHandler.toolSelect(canvasID, toolName);})
                .on("mouseover", mouseoverFunction)
                .on("mouseout", mouseoutFunction)
                .append("svg:title").text(tooltips[tools[i]]);
            thisG.append("image") // Button on top
                .attr("x", 0.5 * margin)
                .attr("y", 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", iconAddress + toolName +".svg")
                .attr("class", "control-img")
                .on("click", function(){EventHandler.toolSelect(canvasID, toolName);});

        });
        // Define a gradient to be applied when a button is selected:
        var grad = d3.select("defs").append("svg:linearGradient")
            .attr("id", "Gradient1")
            .attr("x1", "0")
            .attr("x2", "1")
            .attr("y1", "0")
            .attr("y2", "1");

        grad.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "black")
            .attr("stop-opacity", 0.7);

        grad.append("svg:stop")
            .attr("offset", "65%")
            .attr("stop-color", "black")
            .attr("stop-opacity", 0.1);
    },
    beginLink: function(node){
        var canvasID = node.machine.id;
        var canvasVars = Display.canvasVars[canvasID];
        if (canvasVars.linkInProgress === true){
            return;
        }
        canvasVars.linkInProgress = true;
        canvasVars.linkInProgressNode = node;
        var svg = d3.select("#" + canvasID);
        var halfLink = svg.insert("svg:path",":first-child")
                          .classed("halflink", true)
                          .attr("id", canvasID+"-halflink");

        svg.on("mousemove", function(){
            // Update the link whenenver the mouse is moved over the svg
            var mousePos = d3.mouse(svg.node());
            var d = "M" + node.x + "," + node.y;
            d += "L" + mousePos[0] + "," + mousePos[1];
            halfLink.attr("d",d);
        });

    },
    endLink: function(canvasID){
        var canvasVars = Display.canvasVars[canvasID];
        if (canvasVars.linkInProgress === false){
            return;
        }
        d3.select("#" + canvasID + "-halflink").remove(); // Remove element
        d3.select("#" + canvasID).on("mousemove", null); // Remove event listener
        canvasVars.linkInProgress = false;
        canvasVars.linkInProgressNode = null;
    },
    getInitialArrowPath: function(node){
        // Returns the description of a path resembling a '>'
        var arrowHeight = 0.6 * Display.nodeRadius;
        var midpointX = node.x - Display.nodeRadius - 0.5;
        var midpointY = node.y;
        var midStr = midpointX + "," + midpointY;

        var startX = midpointX - arrowHeight;
        var startY = midpointY - arrowHeight;
        var startStr = startX + "," + startY;

        var endX = startX;
        var endY = midpointY + arrowHeight;
        var endStr = endX + "," + endY;

        return "M" + startStr + "L" + midStr + "L" + endStr;
    },
    getLinkLabelPosition: function(node1, node2) {
        // Function takes two nodes andr eturns a suitable position
        // for the label of the link between them.

        // Test if the link is from one node to itself
        if (node1.id === node2.id){
            return {
                x: node1.x,
                y: node2.y - 60,
                rotation: 0
            };
        }

        // Find the point between the two nodes
        var cx = 0.5 * (node1.x + node2.x);
        var cy = 0.5 * (node1.y + node2.y);

        //Find vector V from P1 to P2
        var vx = node2.x - node1.x;
        var vy = node2.y - node1.y;

        // Find suitable offset by getting a vector perpendicular to V
        var vpx = -1 * vy;
        var vpy = vx;

        //Normalise this vector:
        var magnitude = Math.sqrt(vpx * vpx + vpy * vpy);
        vpx = vpx / magnitude;
        vpy = vpy /magnitude;

        //find angle of the line relative to x axis. From -180 to 180.
        var angle = (Math.atan2(node2.y - node1.y, node2.x - node1.x) * 180 / Math.PI);
        if (Math.abs(angle) > 90) {
            angle = angle - 180; //don't want text upside down
        }

        // Determine if the links are drawn as bezier curves ie there is a link between the nodes in both directions
        // Test if there is link from node2 to node1
        var isBezier = node2.hasLinkTo(node1);

        var scale;
        if (!isBezier) {
            scale = 10;
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        } else {
            scale = 22;
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        }
    },
    getTextLength:function(svg,text, fontSize, className){
        //Returns the length of some text in the units of the specified SVG when rendered as an SVG using the specifed fontSize and class.
        var text = svg.append("text")
                      .text(text)
                      .classed(className, true)
                      .attr("font-size", fontSize);

        var boundingBox = text.node().getBBox();
        var result = boundingBox.width;
        text.remove();
        return result;
    },
    drawGearIcon: function(svg){
        //Draw a gear icon in the top right corner, and register a function to draw the settings menu on click.

        svg.append("image")
                .attr("x",svg.attr("width") - 20)
                .attr("y", 5 )
                .attr("width", 15)
                .attr("height", 15)
                .attr("xlink:href", Global.iconAddress + "gear.svg")
                .attr("class", "gear-icon")
                .on("click", function(){Display.drawSettingsMenu(svg)});
    },
    drawContextMenu:function(svg,mousePosition,actions){
        //Generic function to draw a context menu, with the labels and associated functions specified in actions in the
        //from [["label", function(){doThing;}], ["label2", function(){doOtherThing();}]]
        var fontSize = 12;
        var yStep = fontSize * 1.3;
        var textClass = "context-menu-text";

        // Find width of menu based on rendered text length. Need to do this dynamically as rendered length varies by browser
        // First, find the longest string:
        var returnLonger = (x,y) => x.length > y.length ? x : y;
        var longestLabel = actions.map(x => x[0]).reduce(returnLonger, "")
        // Then find its length:
        var longestLabelLength = Display.getTextLength(svg, longestLabel, fontSize, textClass);

        var menuWidth = longestLabelLength + 10;
        var menuHeight = actions.length * yStep;

        var menuCoords = Display.getContextMenuCoords(svg, mousePosition[0], mousePosition[1], menuWidth, menuHeight);
        var menu = svg.append("g")
                    .classed("context-menu-holder", true)

        // initial text coordinates
        var textX = menuCoords[0] + 5;
        var textY = menuCoords[1] + fontSize;

        // Disable system menu on right-clicking the context menu
        var preventDefault = () => d3.event.preventDefault();

        for(var i = 0; i < actions.length; i++){
            var label = actions[i][0]; // String to display
            var funct = actions[i][1]; // function to call when text(or text background) is clicked.

            //Add a background rect for each link as well to provide a larger clicking target
            menu.append("rect")
                .classed("context-background-rect", true)
                .attr("x", textX - 5)
                .attr("y", textY - fontSize)
                .attr("width", menuWidth)
                .attr("height", yStep)
                .on("click", funct)
                .on("contextmenu", preventDefault);

            //Add text for each label
            menu.append("text")
                .text(label)
                .attr("x", textX)
                .attr("y", textY)
                .attr("font-size", 12)
                .classed(textClass, true)
                .on("click", funct)
                .on("contextmenu", preventDefault);

            textY = textY + yStep;
        }
    },

    drawLinkContextMenu:function(svg,link,mousePosition){
        var actions = [["Change Conditions",function(){Controller.requestLinkRename(link); Display.dismissContextMenu();}],
                       ["Delete Link", function(){Controller.deleteLink(link); Display.dismissContextMenu();}],
                       ["Reverse Link", function(){Controller.reverseLink(link); Display.dismissContextMenu();}]];

        Display.drawContextMenu(svg,mousePosition,actions);

    },
    drawNodeContextMenu: function(svg, node, mousePosition){
        var actions = [["Toggle Initial", function(){Controller.toggleInitial(node); Display.dismissContextMenu();}],
                       ["Toggle Accepting", function(){Controller.toggleAccepting(node); Display.dismissContextMenu();}],
                       ["Rename State", function(){Controller.requestNodeRename(node); Display.dismissContextMenu();}],
                       ["Delete State", function(){Controller.deleteNode(node); Display.dismissContextMenu();}]];

        Display.drawContextMenu(svg,mousePosition,actions);
    },

    drawNodeRenameForm: function(canvasID, node){
        var currentName = node.name;

        var submitRenameFunction = function(d3InputElement){
            Controller.submitNodeRename(node, d3InputElement.select("input").node().value);};
        Display.getCanvasVars(canvasID).submitRenameFunction = submitRenameFunction;

        // create a form over the targeted node
        d3.select("#" + canvasID).append("foreignObject")
            .attr("width", 80)
            .attr("height", 50)
            .attr("x", node.x + 20)
            .attr("y", node.y - 6)
            .attr("class", "rename")
            .append("xhtml:body")
                .append("form")
                .on("keypress", function(){EventHandler.nodeRenameFormKeypress(node, this);})
                    .append("input")
                    .classed("renameinput", true)
                    .attr("id", node.id + "-rename")
                    .attr("type", "text")
                    .attr("size", "1")
                    .attr("maxlength", "5")
                    .attr("name", "state name")
                    .attr("value", currentName)
                        .node().select();
    },
    getLinkRenameResult: function(canvasID, formType){
        //Get the result from each rename type differently
        if(formType === "constrainedSVG"){
            return Display.getLinkRenameResultConstrainedSVG(canvasID, formType)
        }

        throw new Error("No method for formType " + formType + " in Display.getLinkRenameResult");
    },
    getLinkRenameResultConstrainedSVG: function(canvasID){
        // Return user input from the Constrained SVG link rename form.
        // Returns an input object of form {input: ["a", "b", "longsymbol"], hasEpsilon:false}
        var input = {input:[], hasEpsilon:false};
        var svg = d3.select(`#${canvasID}`);
        var checkedSymbols = svg.select(".rename-menu-holder").selectAll(".checked").data();
        for(var i = 0; i< checkedSymbols.length; i++){
            if(checkedSymbols[i] === 'ε'){
                input.hasEpsilon = true;
            }
            else{
                input.input.push(checkedSymbols[i])
            }
        }
        return input;

    },
    drawSVGConstrainedLinkRenameForm: function(svg, link, mousePosition){
        var alphabet = jsonCopy(link.machine.alphabet); //Do not want to modify alphabet
        var fontSize = 12;
        var checkBoxSize = 0.9 * fontSize;
        var textClass = "context-menu-text";
        var yStep = 1.5 * fontSize;

        // Add epsilon if needed
        if (link.machine.allowEpsilon){
            alphabet.push("ε");
        }

        // Find width of menu based on rendered text length. Need to do this dynamically as rendered length varies by browser.
        // First, find the longest string:
        var returnLonger = (x,y) => x.length > y.length ? x : y;
        var longestSymbol = alphabet.reduce(returnLonger, "")

        // Then find its length:
        var longestSymbolLength = Display.getTextLength(svg, longestSymbol, fontSize, textClass);

        var menuWidth = longestSymbolLength + 27 + checkBoxSize;
        var menuHeight = (alphabet.length + 1.5) * yStep ;

        // Position based on the mouse postion (could also be done based on the position of the link label)
        var menuCoords = Display.getContextMenuCoords(svg, mousePosition[0], mousePosition[1], menuWidth, menuHeight);
        var menu = svg.append("g")
                    .classed("rename-menu-holder", true)
                    .classed("rename", true);

        // Use to prevent context menu clicks
        var preventDefault = () => d3.event.preventDefault();

        var textX = menuCoords[0] + 5;
        var textY = menuCoords[1] + fontSize;

        //Add background rectangle
        menu.append("rect")
            .attr("x", textX - 5)
            .attr("y", textY - fontSize)
            .attr("height", menuHeight)
            .attr("width", menuWidth)
            .classed("rename-background-rect", true)
            .on("contextmenu", preventDefault)



        // Do it this way to avoid all toggle functions toggling the final id
        var getToggleFunction = function(id){
            return function(){
                var checkmark = d3.select("#" + id);
                checkmark.classed("checked", !checkmark.classed("checked"))
            };
        }

        //Add an entry for each symbol in the machine alphabet.
        for(var i = 0; i < alphabet.length; i++){
            var symbol = alphabet[i];
            var id = link.machine.id + "-rename-option" + i
            var checked = false

            if((symbol === "ε" && link.hasEpsilon) || link.input.indexOf(symbol) !== -1){
                checked = true
            }

            var toggleFunction = getToggleFunction(id);

            //Add text for current symbol
            menu.append("text")
                .text(symbol)
                .attr("x", textX)
                .attr("y", textY)
                .attr("font-size", 12)
                .classed(textClass, true)
                .on("contextmenu", preventDefault);

            var checkboxX = textX + longestSymbolLength + 10;
            var checkboxY = textY - (checkBoxSize/fontSize) * fontSize + 0.1 * fontSize;

            //Add checkbox for current symbol
            menu.append("rect")
                .attr("x", checkboxX)
                .attr("y", checkboxY)
                .attr("height", checkBoxSize)
                .attr("width",  checkBoxSize)
                .classed("rename-checkbox", true)
                .on("click", toggleFunction)

            //Add a tick to current checkbox (this will be visible only when the checkbox is selected)
            menu.append("path")
                .classed("checkmark", true)
                .classed("checked", checked)
                .attr("d", `M ${checkboxX} ${checkboxY} l ${checkBoxSize} ${checkBoxSize} m ${-checkBoxSize} 0 l ${checkBoxSize} ${-checkBoxSize}`)
                .attr("id", id)
                .data([symbol]) //pass in a list here, otherwise d3 will treat the string as a list of chars and assign only the first character.
                .enter()

            textY += yStep
        }

        var buttonWidth = 1.7 * Display.getTextLength(svg, fontSize, "OK", "button-text");
        var buttonHeight = 1.5 * fontSize;
        var buttonY = textY - 0.5 * yStep;
        var buttonX = textX;


        // Set the submit function
        var submitFunction = function(d3InputElement){Controller.submitLinkRename(link.machine.id, link, "constrainedSVG");};
        Display.canvasVars[link.machine.id].submitRenameFunction = submitFunction;

        // Finally, add the "OK" button
        menu.append("rect")
            .attr("y", buttonY)
            .attr("x", textX)
            .attr("width", buttonWidth)
            .attr("height", buttonHeight)
            .classed("svg-button", true)

        menu.append("text")
            .text("OK")
            .classed("button-text", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("x", buttonX + 0.5 * buttonWidth)
            .attr("y", buttonY + 0.5 * buttonHeight)
            .on("click", Display.canvasVars[link.machine.id].submitRenameFunction)

    },
    drawConstrainedLinkRenameForm: function(canvasID, link){
        var svg = d3.select("#" + canvasID);
        var alphabet = jsonCopy(link.machine.alphabet);
        if (link.machine.allowEpsilon){
            alphabet.push("ε");
        }
        // Derive the position of the form from the location of the link label
        var labelPos = Display.getLinkLabelPosition(link.source, link.target);
        var formX = labelPos.x - 40;
        var formY = labelPos.y + 15;

        var form = svg.append("foreignObject")
                      .attr("width", 100)
                      .attr("height", 35 + 22 * alphabet.length)
                      .attr("x", formX - 40)
                      .attr("y", formY)
                      .attr("class", "rename")
                          .append("xhtml:body")
                              .append("form")
                              .classed("renameinput", true)
                              .classed("checkboxrename", true);
        alphabet.forEach(function(symbol){
            var span = form.append("span");
            var elem = span.insert("input", ":first-child")
                           .attr("type", "checkbox")
                           .attr("name", "input")
                           .attr("value", symbol)
                           .classed("rename-checkbox", true);
            span.html(span.html() + " " + symbol); // Inelegent. Beware of resetting listeners
            if(link.input.indexOf(symbol) !== -1){
                elem.attr("checked", "checked");
            }
        });

        form.append("a")
            .classed("pure-button", true)
            .text("OK");

    },
    drawUnconstrainedLinkRenameForm: function(canvasID, link){
        // This creates a rename form as a textbox where anything can be entered
        var svg = d3.select("#" + canvasID);

        // Derive the position of the form from the location of the link label
        var labelPos = Display.getLinkLabelPosition(link.source, link.target);
        var formX = labelPos.x - 40;
        var formY = labelPos.y + 15;

        // Get the string representing the current link conditions
        var current = Display.linkLabelText(link);

        var submitFunction = function(d3InputElement){Controller.submitLinkRename(link.machine.id, link, "unconstrained");};
        Display.canvasVars[canvasID].submitRenameFunction = submitFunction;

        svg.append("foreignObject")
            .attr("width", 80)
            .attr("height", 50)
            .attr("x", formX)
            .attr("y", formY)
            .attr("class", "rename")
            .append("xhtml:body")
                .append("form")
                .on("keypress", function(){EventHandler.linkRenameFormKeypress(link, this, "unconstrained");})
                    .append("input")
                    .classed("rename", true)
                    .classed("linkrename", true)
                    .classed("unconstrained", true)
                    .attr("id", link.id + "-rename")
                    .attr("type", "text")
                    .attr("size", "10")
                    .attr("name", "link conditions")
                    .attr("value", current)
                    .node().select();

    },
    dismissContextMenu: function() {
        d3.select(".contextmenu").remove();
        d3.select(".context-menu-holder").remove();
        Global.contextMenuShowing = false;
    },
    dismissRenameMenu: function(canvasID){
        Display.getCanvasVars(canvasID).submitRenameFunction = null;
        d3.select("#" + canvasID).selectAll(".rename").remove();
    },
    drawTestPoint: function(canvasID, x, y){
        //Function to draw a point, for testing coordinate conversion
        var svg = d3.select("#" + canvasID);
        svg.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 1)
            .attr("fill", "#000000");
    },
    drawSettingsMenu: function(svg){
        //Check if settings menu already exists, dismiss and return if it is.
        var existingMenu = svg.select(".settings-menu")
        if(!existingMenu.empty()){
            existingMenu.remove();
            return;
        }

        var settings = Controller.getSettings();
        var menuWidth = 0.5 * svg.attr("width");
        var menuHeight = 0.5 * svg.attr("height");
        var fontSize = 10;
        var optionBorder =  2;
        var xBorder = 15

        var x = 0.25 * svg.attr("width");
        var y = 0.1 * svg.attr("height");
        var g = svg.append("g").classed("settings-menu", true);

        g.append("rect")
         .attr("x", x)
         .attr("y", y)
         .attr("width", menuWidth)
         .attr("height", menuHeight)
         .attr("fill", "#FFFFFF")
         .attr("stroke", "#555555")

        var textX = x + xBorder;
        var textY = y + (4 * fontSize);
        var longestDescription = Display.getTextLength(svg,"Colour scheme", fontSize, "settings-menu")
        var longestOption = 4 +  Display.getTextLength(svg,"monochrome", fontSize, "settings-menu")


        var getOnClickFunction = function(currentTextSelection,settingsKey,x, y){
            return function(){
                //this function should be called to create the dropdown part of the dropdown menu

                //if menu already open, dismiss and return
                var existingMenu = d3.select(`#dropdown-${settingsKey}`);
                if (!existingMenu.empty()){
                    existingMenu.remove()
                    return
                }

                var drop = g.append("g").attr("id",`dropdown-${settingsKey}`)

                var options = settings[settingsKey].options

                //Add a white background under menu
                    drop.append("rect")
                        .attr("y", y)
                        .attr("x", x)
                        .attr("width", longestOption + 2 * optionBorder)
                        .attr("height", (fontSize + optionBorder)  * options.length + (2*optionBorder))
                        .attr("fill", "#FFFFFF")
                        .attr("stroke", "#444444")

                for(var i = 0; i < options.length; i++){
                    //Add a background to allow highlighting on mouseover
                    drop.append("rect")
                        .attr("x", x)
                        .classed("dropdown-option-background", true)
                        .attr("y", y + i * (1.5 * optionBorder + fontSize) + 1)
                        .attr("width", longestOption + 2 * optionBorder)
                        .attr("height", fontSize + optionBorder * 1.5)
                        .attr("fill", "#FFFFFF")
                        .attr("fill-opacity", 0)
                        .attr("stroke-opacity", 0)
                        .data([options[i]])
                        .on("click", function(){
                            currentTextSelection.text(d3.select(this).data()[0])
                            d3.select(`#dropdown-${settingsKey}`).remove();
                        })
                    //Add the text for each option
                    drop.append("text")
                        .classed("dropdown-option", true)
                        .attr("y", y + ((i +1)) * (optionBorder + fontSize))
                        .attr("x", x + optionBorder)
                        .attr("font-size", fontSize)
                        .text(options[i])
                }
            }
        }

        for(var s in settings){
            // Add the setting description.
            g.append("text")
             .text(settings[s].description)
             .attr("x", textX)
             .attr("y", textY)
             .attr("font-size", fontSize);

            // Add the text for the currently set option
            var optionText = g.append("text")
                              .text(settings[s].value)
                              .attr("id", `settings-${s}-option`)
                              .classed("option", true)
                              .attr("x", x + menuWidth - longestOption - xBorder)
                              .attr("y", textY)
                              .attr("font-size", fontSize);

            // Add a box around the text to show that it is a dropdown menu
            var boxX = x + menuWidth - longestOption - xBorder - optionBorder;
            var boxY = textY - fontSize
            g.append("rect")
             .attr("x", boxX)
             .attr("y", textY - fontSize)
             .attr("width", longestOption + 2 * optionBorder)
             .attr("height", fontSize + 2 * optionBorder)
             .attr("fill", "#FFFFFF")
             .attr("fill-opacity", 0)
             .attr("stroke", "#444444")
             .on("click", getOnClickFunction(optionText, s, boxX, boxY + fontSize + 2 * optionBorder))

            textY = textY  + 2 * fontSize;
        }

        //Add the submit button
        var textWidth = Display.getTextLength(svg, "Save", fontSize, "settings-button-text")
        var buttonWidth = 2 * textWidth
        var buttonHeight = 1.5 * fontSize
        var submitX = x + menuWidth - buttonWidth - xBorder;
        var submitY = y + menuHeight - fontSize - 15;
        //Background
        g.append("rect")
            .attr("x", submitX)
            .attr("y", submitY)
            .attr("height", buttonHeight)
            .attr("width", buttonWidth)
            .attr("fill", "#BBBBBB")
            .classed("settings-button-background", true)
            .attr("stroke", "#444444")

        //text
        g.append("text")
            .text("Save")
            .attr("x", submitX + 0.5 * buttonWidth - 0.5 * textWidth)
            .attr("y", submitY + buttonHeight - (0.5 * fontSize))
            .attr("font-size", fontSize)
            .classed("settings-button-text", true)
            .on("click", function(){
                for(s in settings){
                    settings[s].value = d3.select(`#settings-${s}-option`).html()
                }
                Controller.setSettings(settings)
                g.remove()
            })



    },
    forceTick: function(canvasID){
        // Update the display after the force layout acts. Should be called at least once to initialise positions, even if
        // force is not used.
        var svg = d3.select("#"+canvasID);
        svg.selectAll(".node")
            .attr("cx", function(d){ //prevent nodes leavinf the canvas on the x axis
                var x = d.x;
                if(x < 0){
                    return 1;
                }
                if(x > svg.attr("width")){
                    return svg.attr("width") -1;
                }
                return x;
            })
            .attr("cy", function(d){ //prevent nodes leavinf the canvas on the y axis
                var y = d.y;
                if(y < 0){
                    return 1;
                }
                if(y > svg.attr("height")){
                    return svg.attr("height") -1;
                }
                return y;
            });
        svg.selectAll(".accepting-ring")
            .attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
        svg.selectAll(".start")
            .attr("d", function(node){return Display.getInitialArrowPath(node);});
        svg.selectAll(".link")
            .each(function(link){
                var linkID = link.id;
                var paddingID = "linkpad"+linkID;
                var pathD = Display.getLinkPathD(link);
                // Calculate d once, then apply to both the link and the link padding.
                d3.select("#" + linkID).attr("d", pathD);
                d3.select("#" + paddingID).attr("d", pathD);
            });

        // Update the rotation and position of each linklabel
        Display.updateLinkLabelPositions(svg, false)

        // Update the position of each node name
        svg.selectAll(".nodename")
            .each(function(node){
                d3.select(this).attr("x", node.x).attr("y", node.y);
            });
    },
    getCanvasVars: function(canvasID){
        return Display.canvasVars[canvasID];
    },
    getContextMenuCoords: function(svg, mouseX, mouseY, menuWidth, menuHeight ){
        // Get coordinates for the context menu so that it is not drawn off screen in form [x, y]
        // Mouse coordinates are already in the SVG coordinate space thanks to the d3.mouse() function.
        var maxX = svg.attr("width");
        var maxY = svg.attr("height");

        var menuX = mouseX; //default values in case no change necessary
        var menuY = mouseY;

        if(mouseX + menuWidth > maxX){
            menuX = maxX - menuWidth;
        }

        if(mouseY + menuHeight > maxY){
            menuY = maxY - menuHeight;
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

            var rad = 14;
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
            var linkID = Object.keys(link.target.outgoingLinks)[i];
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


        x1 = link.source.x + (unitX * 0.8 * Display.nodeRadius);
        x2 = link.target.x - (unitX * 0.8 * Display.nodeRadius);
        y1 = link.source.y + (unitY * 0.4 * Display.nodeRadius);
        y2 = link.target.y - (unitY * 0.4 * Display.nodeRadius);

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
            P1 = x1 + "," + y1;
            var M1 = m1x + "," + m1y;
            P2 = x2 + "," + y2;
            var C1 = c1x + "," + c1y;
            var C2 = c2x + "," + c2y;

            return ("M" + P1 + " Q" + C1 + " " + M1 + " Q" + C2 + " " + P2);
        } else {
            // define vector v from P1 to halfway to P2
            vx = 0.5 * (x2 - x1);
            vy = 0.5 * (y2 - y1);

            // midpoint is then:
            var midx = x1 + vx;
            var midy = y1 + vy;

            P1 = x1 + "," + y1;
            var M = midx + "," + midy;
            P2 = x2 + "," + y2;

            return ("M" + P1 + " L" + M + " L" + P2);
        }
    },
    getStartNode: function(canvasID){
        if (Display.canvasVars[canvasID].linkInProgress === false){
            return null;
        } else {
            return Display.canvasVars[canvasID].linkInProgressNode;
        }
    },
    linkLabelText:function(link){
        //Create the label string for a link
        var labelString;
        if (link.input.length == 0) {
            return link.hasEpsilon? "ε" : "";
        } else {
            labelString = "";
            for (var i = 0; i < link.input.length; i++) {
                var inchar = link.input[i];
                if (link.machine.isTransducer){
                    var outchar = "";
                    for (var j = 0; j < link.output.length; j++){
                        if (link.output[j][0] == inchar){
                            outchar = ":" + link.output[j][1];
                            break;
                        }
                    }
                    labelString += inchar + outchar + ", ";
                } else {
                    labelString += inchar + ", ";
                }
            }
            labelString =  labelString.slice(0,-2);
            // Append an epsilon symbol if needed.
            return link.hasEpsilon? labelString + ", ε" : labelString;
        }
    },
    toolSelect: function(canvasID, newMode){
        var svg = d3.select("#" + canvasID);
        // Deselect all rectangles
        svg.selectAll(".control-rect").classed("selected", false);
        if(newMode !== "none"){
            svg.select("#" + canvasID + "-" + newMode)
                .classed("selected", true)
                .attr("fill", "url(#Gradient1)");
        }
        Display.canvasVars[canvasID].toolMode = newMode;
    },
    submitAllRename: function(canvasID){
        // Submits all currently open rename forms in the given canvas
        // (only actually submits the most recent form, but there shouldn't be more than one form open at a time)
        var svg = d3.select("#" + canvasID);
        var canvasVars = Display.getCanvasVars(canvasID);
        var renameForm = svg.select(".rename");
        if (renameForm.size() !== 0){
            // Get the submit function from canvasVars, and call it on the d3 selection of the open form.
            canvasVars.submitRenameFunction(renameForm);
        }
    },
    setUpQuestion: function(){
        var qType = Model.question.type;
        var checkButtonTypes = ["give-list"]; //Question types with a check button
        if(checkButtonTypes.indexOf(qType) !== -1){
            d3.select("#check-button").on("click", EventHandler.checkButtonClick);
        }
    },
    update: function(canvasID){
        var colours = Display.canvasVars[canvasID].colours;
        var machine = this.canvasVars[canvasID].machine;

        var svg = d3.select("#"+canvasID);

        // Draw new nodes
        var nodeg = svg.select(".nodes"); // Select the g element used for nodes
        var nodeList = Object.keys(machine.nodes).map(function(nodeID){return machine.nodes[nodeID];});
        var nodeGs = nodeg.selectAll("g")
            .data(nodeList, function(d){return d.id;});
        var newNodes = nodeGs.enter().append("svg:g").classed("nodeg", true);
        var newCircles = newNodes.append("circle")
                                .attr("cx", function(d){return d.x;})
                                .attr("cy", function(d){return d.y;})
                                .attr("id", function(d){return d.id;})
                                .classed("node", true)
                                .attr("r", Display.nodeRadius)
                                .on("contextmenu", function(node){EventHandler.nodeContextClick(node);})
                                .on("click", function(node){EventHandler.nodeClick(node);});

        //Enforce physics setting on new nodes
        var newNodeObjs = nodeGs.data()
        if(Controller.getPhysicsSetting() == "off"){
            for(var i = 0; i< newNodeObjs.length; i++){
                newNodeObjs[i].fixed = true
            }
        }


        if(Controller.getColourScheme() === "monochrome"){
            Display.styleMonochrome(canvasID, newCircles)
        } else {
            Display.styleColour(canvasID, newCircles)
        }

        // Add a name label:
        // TODO - allow labels too large to be placed within the node to be placed below.
        newNodes.append("svg:text")
            .classed("nodename", true)
            .attr("id", function(node){return node.id + "-label";})
            .attr("font-size", 1.2 * Display.acceptingRadius) 	// Sets the font height relative to the radius of the inner ring on accepting nodes
            .text(function(node){return node.name;});


        nodeGs.exit().remove(); //Remove nodes whose data has been deleted

        // Update nodes
        // Set classes
        var circles = nodeGs.selectAll("circle")
            .classed("accepting", function(node){return node.isAccepting;})
            .classed("initial", function(node){return node.isInitial;});
        // Add concentric circle to accepting nodes
        circles.each(function(node){
            var shouldHaveRing = node.isAccepting;
            var hasRing = document.querySelector("#ar"+node.id);
            if(shouldHaveRing && !hasRing){
                d3.select(this.parentNode).append("svg:circle")
                .attr("cx", node.x)
                .attr("cy", node.y)
                .attr("r", Display.acceptingRadius)
                .attr("class", "accepting-ring")
                .attr("stroke-width", 0.8)
                .attr("id", "ar" + node.id);
                return;
            }
            if(!shouldHaveRing && hasRing){
                hasRing.remove();
            }
        });
        // Add arrows to initial nodes
        circles.each(function(node){
            var shouldHaveArrow = node.isInitial;
            var hasArrow = document.querySelector("#"+node.id + "-in");
            if(shouldHaveArrow && !hasArrow){
                d3.select(this.parentNode).append("svg:path")
                    .classed("start", true)
                    .attr("d", function(node){return Display.getInitialArrowPath(node);})
                    .attr("id", node.id + "-in");
                return;
            }
            if(!shouldHaveArrow && hasArrow){
                hasArrow.remove();
            }
        });


        // Draw new links
        var linkg = svg.select(".links");
        var linkList = Object.keys(machine.links).map(function(linkID){return machine.links[linkID];});
        var linkGs = linkg.selectAll("g")
            .data(linkList, function(d){return d.id;});
        var newLinks = linkGs.enter().append("svg:g");

        newLinks.append("path")
               .attr("d", function(d){return Display.getLinkPathD(d);})
               .classed("link", true)
               .style("marker-mid", "url(#end-arrow)")
               .attr("id", function(d){return d.id;})
               .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
               .on("click", function(link){EventHandler.linkClick(link);});

        //Add link padding to make links easier to click. Link padding handles click events as if it were a link.
        newLinks.append("svg:path")
               .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
               .on("click", function(link){EventHandler.linkClick(link);})
               .attr("class", "link-padding")
               .attr("id", function(d){return "linkpad" + d.id;});

        // Add link labels
        newLinks.append("svg:text")
            .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
            .on("click", function(link){EventHandler.linkClick(link);})
            .attr("class", "linklabel")
            .attr("text-anchor", "middle") // This causes text to be centred on the position of the label.
            .attr("font-size", 1.2 * Display.acceptingRadius) // Set the font height, using the radius of the inner ring of accepting nodes as a somewhat arbitrary reference point.
            .attr("id", function(link){return link.id + "-label";})
            .text(function(link){return Display.linkLabelText(link);});

        linkGs.exit().remove(); //Remove links whose data has been deleted


        var force = this.canvasVars[canvasID].force;
        force.nodes(nodeList)
            .links(linkList)
            .size([1000,600])
            .linkDistance(100)
            .chargeDistance(60)
            .charge(-30)
            .gravity(0.00); //gravity is attraction to the centre, not downwards.
        force.start();
        newNodes.call(force.drag);

    },
    updateAllLinkLabels: function(canvasID){
        var linkList = Object.keys(Display.canvasVars[canvasID].machine.links);
        linkList.forEach(function(id){
            Display.updateLinkLabel(Display.canvasVars[canvasID].machine.links[id]);
        });
    },
    updateLinkLabel: function(link){
        var svg = d3.select("#" + link.machine.id);
        svg.select("#" + link.id + "-label").text(Display.linkLabelText(link));
    },
    repositionAllLinkLabels: function(){
        for(var canvasID in Display.canvasVars){
            var svg = d3.select(`#${canvasID}`)
            Display.updateLinkLabelPositions(svg, true)
        }
    },
    updateLinkLabelPositions: function(svg, forceChange){
        svg.selectAll(".linklabel")
            .each(function(link){
                var positionObj = Display.getLinkLabelPosition(link.source, link.target);

                //Do not update position for minor changes – avoids unwanted text jitter in Firefox unless forceChange is specified
                if(!forceChange && this.x.baseVal.length > 0 && this.y.baseVal.length > 0){
                    var prevX = this.x.baseVal[0].value;
                    var prevY = this.y.baseVal[0].value;
                    var minChange = 0.4; //arbitrary constant – tweak by eye. Set to zero to make all changes.
                    if (Math.abs(positionObj.x - prevX) < minChange && Math.abs(positionObj.y - prevY) < minChange){
                        return;
                    }
                }

                d3.select(this)
                    .attr("x", positionObj.x)
                    .attr("y", positionObj.y)
                    .attr("transform", function(){
                        if(Controller.getLabelRotation() === "never" || (Controller.getLabelRotation() === "long only"  && d3.select(this).html().length < 2)){
                            return null;
                        } else {
                            return "rotate(" + positionObj.rotation + ", " + positionObj.x +", " + positionObj.y +")";
                        }
                    });
            });

    },
    updateNodeName: function(node){
        var svg = d3.select("#" + node.machine.id);
        svg.select("#" + node.id + "-label").text(node.name);
    },
    updateNodeStyle: function(){
        var circles;
        var styleFunction = Controller.getColourScheme() === "monochrome"? Display.styleMonochrome : Display.styleColour;

        for(var id in Display.canvasVars){
            circles = d3.select(`#${id}`).selectAll(".nodeg").selectAll(".node");
            styleFunction(id, circles);
        }

    },
    updateNodePhysics:function(){
        for(var i = 0; i < Model.machines.length; i++){
            var machine = Model.machines[i];
            for(var nodeID in machine.nodes){
                var node = machine.nodes[nodeID];
                if(Controller.getPhysicsSetting() === "on"){
                    node.fixed = false;
                    Display.update(node.machine.id)
                }
                else if(Controller.getPhysicsSetting() === "off"){
                    node.fixed = true;
                }
            }
        }

    },
    styleColour:function(canvasID, circleSelection){
        //Takes a selection of node circles and applies multicoloured styling to them
        var colours = Display.canvasVars[canvasID].colours;
        circleSelection.style("fill", d => colours(d.id))
                       .style("stroke-width", 1)
                       .style("stroke", "#000000")
    },
    styleMonochrome:function(canvasID, circleSelection){
        //Takes a selection of node circles and applies monochrome styling to them
        circleSelection.style("fill","#FFFFFF")
                       .style("stroke-width", 1)
                       .style("stroke", "#000000");
    }
};

var EventHandler = {
    backgroundClick: function(machine, checkTarget){
        // Check that the target is the background - this handler will recieve all clicks on the svg
        // Or proceed anyway if checkTarget is false;
        var canvasID = machine.id;
        if(!checkTarget || d3.event.target.id === canvasID){
            Display.dismissContextMenu();
            Controller.endLink(machine.id);
            var toolMode = Display.canvasVars[canvasID].toolMode;
            if (toolMode === "none" || toolMode === "linetool" || toolMode === "texttool" || toolMode === "deletetool"){
                return;
            }
            if (toolMode === "nodetool" || toolMode === "acceptingtool"|| toolMode === "initialtool"){
                //Get coordinates where node should be created:
                var point = d3.mouse(d3.select("#" + canvasID)[0][0]);
                Controller.createNode(machine, point[0], point[1], toolMode === "initialtool", toolMode === "acceptingtool");
            }
        }

    },
    backgroundContextClick: function(machine){
        // Check that the target is the background - this handler will recieve all clicks on the svg
        var canvasID = machine.id;
        if(d3.event.target.id === canvasID){
            Display.dismissContextMenu();
            if (Display.canvasVars[machine.id].linkInProgress){
                d3.event.preventDefault();
                Controller.endLink(machine.id);
            }

        }
    },
    checkButtonClick: function(){
        Controller.checkAnswer();
    },
    linkClick: function(link){
        var canvasID = link.machine.id;
        var toolMode = Display.canvasVars[canvasID].toolMode;
        if(toolMode === "none"){
            return;
        }
        if(toolMode === "nodetool" || toolMode === "acceptingtool" || toolMode === "initialtool"){
            // For node creation tools, pass the click on to the background click handler to handle.
            EventHandler.backgroundClick(link.machine, false);
            return;
        }
        if(toolMode === "texttool"){
            Controller.requestLinkRename(link);
            return;
        }
        if(toolMode === "deletetool"){
            Controller.deleteLink(link);
            return;
        }

    },
    linkContextClick: function(link){
        d3.event.preventDefault();
        if(Global.contextMenuShowing){
            Display.dismissContextMenu();
        }
        var svg = d3.select("#" + link.machine.id);
        Global.contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());
        Display.drawLinkContextMenu(svg, link, mousePosition);

    },
    nodeClick: function(node){
        var canvasID = node.machine.id;
        var toolMode = Display.canvasVars[canvasID].toolMode;
        if(toolMode === "none" || toolMode === "nodetool"){
            return;
        }
        if(toolMode === "linetool"){
            var linkInProgress = Display.canvasVars[canvasID].linkInProgress; // true if there is link awaiting and endpoint
            if(!linkInProgress){
                Controller.beginLink(node);
            } else {
                var startNode = Display.getStartNode(canvasID);
                Controller.createLink(startNode, node);
            }
        }
        if(toolMode === "deletetool"){
            Controller.deleteNode(node);
        }
        if(toolMode === "texttool"){
            Controller.requestNodeRename(node);
        }
        if(toolMode === "acceptingtool"){
            Controller.toggleAccepting(node);
        }
        if(toolMode === "initialtool"){
            Controller.toggleInitial(node);
        }
    },
    nodeContextClick: function(node){
        d3.event.preventDefault();
        if(Global.contextMenuShowing){
            Display.dismissContextMenu();
        }
        var svg = d3.select("#" + node.machine.id);
        Global.contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());
        Display.drawNodeContextMenu(svg, node, mousePosition);
    },
    linkRenameFormKeypress:function(link, context, formType){
        // Event handler to prevent submission of page on return key
        // and to notify Controller instead
        if (event.keyCode != 13){
            return true;
        }
        event.preventDefault();
        Controller.submitLinkRename(link, context, formType);

    },
    nodeRenameFormKeypress: function(node, context){
        // Event handler to prevent submission of page on return key
        // and to notify Controller instead
        if(event.keyCode == 13){
            event.preventDefault();
            Controller.submitNodeRename(node, d3.select(context).select("input").node().value);
        }
    },
    toolSelect: function(canvasID, newMode){
        var oldMode = Display.canvasVars[canvasID].toolMode;

        if (oldMode == newMode){
            newMode = "none";
        }
        Controller.toolSelect(canvasID, oldMode, newMode);
        Display.toolSelect(canvasID, newMode);

    }
};

var Controller = {
    settings:{
        colourScheme: {description: "Colour scheme", value:"colour", options:["colour", "monochrome"]},
        forceLayout: {description:"Node physics", value:"on", options:["on", "off"]},
        labelRotation: {description:"Rotate transition labels", value:"long only", options:["always","long only", "never"]}
    },
    addMachine: function(specObj){
        //Adds a machine to the model and displays it on a new canvas
        var newMachine = Model.addMachine(specObj)
        var machineID = newMachine.id
        Display.newCanvas(machineID, newMachine);
        Display.update(machineID);
    },
    beginLink: function(souceNode){
        // Called when the user is using the link tool add a link starting from sourceNode
        Display.beginLink(souceNode);
    },
    checkAnswer: function(){
        //Check if input must be collected
        if(["give-list"].indexOf(Model.question.type) !== 0){
            var input = Controller.getQuestionInput(Model.question.type)
        }
        var feedbackObj = Model.question.checkAnswer(input);
        Display.giveFeedback(feedbackObj);
        // Logging.logAnswer(feedbackObj);
    },
    getQuestionInput:function(type){
        var input
        if(type === "give-list"){
            // Obtain the users input as a list of unproccessed strings
            input = [];
            model.question.lengths.forEach(function(v, index){
                input[index] = d3.select("#qf" + index).node().value;
            });
        }
        return input;
    },
    loadSettings:function(){
        //Load settings from localStorage if it exists and has a settings entry
        if(!localStorage){
            return;
        }
        if(!localStorage.getItem("settings")){
            return;
        }
        var settingsObj = JSON.parse(localStorage.getItem("settings"))
        for(var s in settingsObj){
            if (this.settings[s]){
                this.settings[s].value = settingsObj[s]
            }
        }

    },
    getSettings:function(){
        return jsonCopy(this.settings);
    },
    setSettings: function(settingsObj){
        //Save the settings values and make any changes necessary to switch settings.
        var oldSettings = jsonCopy(this.settings)
        this.settings = settingsObj;
        if(oldSettings.colourScheme.value !== this.settings.colourScheme.value){
            Display.updateNodeStyle();
        }
        if(oldSettings.forceLayout.value !== this.settings.forceLayout.value){
            Display.updateNodePhysics();
        }
        if(oldSettings.labelRotation.value !== this.settings.labelRotation.value){
            Display.repositionAllLinkLabels();
        }
        //Create a simplified object to save to local storage.
        var saveObj = {}
        for(var key in settingsObj){
            saveObj[key] = settingsObj[key].value;
        }
        if(localStorage){
            localStorage.setItem('settings', JSON.stringify(saveObj));
        }
    },
    endLink: function(canvasID){
        // Called to end a link creation action.
        Display.endLink(canvasID);
    },
    createLink: function(sourceNode, targetNode){
        // Check nodes are both in the same machine
        if (sourceNode.machine.id !== targetNode.machine.id){
            return;
        }
        // Check that the link does not already exist.
        if(sourceNode.hasLinkTo(targetNode)){
            Controller.endLink(sourceNode.machine.id);
            return;
        }
        var newLink = sourceNode.machine.addLink(sourceNode, targetNode);
        Controller.endLink(sourceNode.machine.id);
        Display.update(sourceNode.machine.id);
        Controller.requestLinkRename(newLink);

    },
    deleteMachine: function(machineID){
        Model.deleteMachine(machineID);
        Display.deleteCanvas(machineID);
    },
    deleteLink: function(link){
        link.machine.deleteLink(link);
        Display.update(link.machine.id);
    },
    createNode: function(machine, x, y, isInitial, isAccepting){
        machine.addNode(x, y, "", isInitial, isAccepting);
        Display.update(machine.id);
    },
    deleteNode: function(node){
        node.machine.deleteNode(node);
        Display.update(node.machine.id);
    },
    reverseLink: function(link){
        link.reverse();
        Display.update(link.machine.id);
        Display.updateAllLinkLabels(link.machine.id);
    },
    requestLinkRename: function(link){
        var canvasID = link.machine.id;
        var svg = d3.select("#"+canvasID);
        var mousePosition = d3.mouse(svg.node());
        // Submit any currently open rename form on the same canvas.
        Display.submitAllRename(canvasID);
        if (link.machine.alphabet.length === 0){
            Display.drawUnconstrainedLinkRenameForm(canvasID, link);
        } else {
            Display.drawSVGConstrainedLinkRenameForm(svg, link, mousePosition);
        }
    },

    requestNodeRename: function(node){
        var canvasID = node.machine.id;
        Display.submitAllRename(canvasID);
        Display.drawNodeRenameForm(canvasID, node);
    },

    setAlphabet: function(machine, alphabetArray){
        machine.setAlphabet(alphabetArray);
        Display.updateAllLinkLabels(machine.id);
    },

    startTrace: function(machine, sequence){
        var traceObj = machine.getTrace();
        Display.drawTrace(machine.id, traceObj)
    },

    getColourScheme: function(){
        return this.settings.colourScheme.value;
    },

    getPhysicsSetting: function(){
        return this.settings.forceLayout.value;
    },
    getLabelRotation: function(){
        return this.settings.labelRotation.value;
    },
    init: function(){
        //Reference: addLink(sourceNode, targetNode, input, output, hasEpsilon)
        Controller.loadSettings();
        m = new Model.Machine("m1");
        Model.machines.push(m);
        Controller.setupMachine(m, 0);
        Display.canvasVars["m1"].machine = m;
        Display.update("m1");
        var svg = d3.select("#m1")
            .on("click", function(){EventHandler.backgroundClick(m, true);})
            .on("contextmenu", function(){EventHandler.backgroundContextClick(m);});
        Controller.setUpQuestion();
        Display.setUpQuestion();
        Display.drawGearIcon(svg);
        if(Model.question.allowEditing){
            Display.drawControlPalette("m1");
        }
    },
    setupMachine: function(machine, i){
        var body = document.querySelector("body");
        var spec = JSON.parse(body.dataset.machinelist)[i];
        machine.build(spec);

    },
    setUpQuestion: function(){
        // get the question object and from the DOM and pass it to Model
        var body = document.querySelector("body");
        if (body.dataset.question != undefined){
            var questionObj = JSON.parse(body.dataset.question);
            Model.question.setUpQuestion(questionObj);
        }

    },
    submitLinkRename: function(canvasID, link, formType){
        var inputObj = Display.getLinkRenameResult(canvasID, formType);
        var input = inputObj.input;
        var hasEpsilon = input.hasEpsilon;
        link.setInput(input, hasEpsilon);
        Display.updateLinkLabel(link);
        Display.dismissRenameMenu(link.machine.id);
    },
    submitNodeRename: function(node, newName){
        node.name = newName;
        Display.updateNodeName(node);
        Display.dismissRenameMenu(node.machine.id);
    },
    toggleAccepting: function(node){
        node.toggleAccepting();
        Display.update(node.machine.id);
    },
    toggleInitial: function(node){
        node.toggleInitial();
        Display.update(node.machine.id);
    },
    toolSelect: function(canvasID, oldMode, newMode){
        if(oldMode === "linetool"){
            Controller.endLink(canvasID);
        }
    }
};

var Global = {
    // Not certain if this is a good idea - object to hold global vars
    // Some globals useful to avoid keeping duplicated code in sync - this seems like
    // a more readable way of doing that than scattering global vars throughout the codebase
    "toolsWithDragAllowed": ["none"],
    "pageLoaded": false,
    "iconAddress": document.querySelector("body").dataset.iconaddress,
    //Track state
    "renameMenuShowing":false,
    "contextMenuShowing":false,
    "traceInProgress": false,
    "hasRated": false
};

var jsonCopy = function(x){
    // Return a copy of x
    return JSON.parse(JSON.stringify(x));
};

//Declare d3 as global readonly for ESLint
/*global d3*/

var m;
Controller.init();