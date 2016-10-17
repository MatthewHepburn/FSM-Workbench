"use strict";

// 'UI' or 'Interface' might be a more accurate name? ('View' as in MVC?)
const Display = {
    extraNext: true, //Adding a an extra next button when a correct answer is given may help users to navigate
    showProgressBar: false, //show a progress bar in question sets. (currently overwritten by test001)
    nodeRadius: 12,
    acceptingRadius: 0.7 * 12, //12 = nodeRadius
    nodeNameFontSize: 1.2 * 0.7 * 12, //0.7 * 12 = acceptingRadius (Done this way because an object cannot refer to itself before it is created)
    linkWidth: 1,
    //Use a getter as this value is needed further down.
    get nodeColourScale(){return ["#63a0cb","#ffa657", "#6cbd6c", "#e26869", "#b495d1", "#af8981", "#eba0d4", "#a6a6a6", "#d0d165", "#5dd2dd"];},
    canvasVars: {
        //Start with one machine initialised
        "m1": {
            "layout":d3.forceSimulation().on("tick", function(){Display.forceTick("m1");}),
            "machine": undefined,
            "colours": d3.scaleOrdinal(["#63a0cb","#ffa657", "#6cbd6c", "#e26869", "#b495d1", "#af8981", "#eba0d4", "#a6a6a6", "#d0d165", "#5dd2dd"]),
            "toolMode": "none",
            "linkInProgress": false, // True when the user has begun creating a link, but has not selected the second node
            "linkInProgressNode": null, // When linkInProgess is true, holds the source node of the link being created
            "submitRenameFunction": null, // When there is rename menu, this holds the function to call to submit it
            "_textLengthMemo": {"_cacheSize": 0} // Used to memoise the results of Display.getTextLength;
        }
    },
    newCanvas: function(id, machine){
        Display.canvasVars[id] = {
            "layout": d3.forceSimulation().on("tick", function(){Display.forceTick(id);}),
            "machine": machine,
            "colours": d3.scaleOrdinal(Display.nodeColourScale),
            "toolMode": "none",
            "linkInProgress": false,
            "linkInProgressNode": null,
            "submitRenameFunction": null,
            "_textLengthMemo": {"_cacheSize": 0} // Used to memoise the results of Display.getTextLength
        };
        // Add a new svg element
        let width = 375; //May want to specify these as arguements?
        let height = 300;
        var svg = d3.select("#machine-div").append("svg")
                    .attr("id", id)
                    .attr("width", width)
                    .attr("height", height)
                    .attr("viewBox", `0 0 ${width} ${height}`)
                    .attr("preserveAspectRatio","xMinYMin meet")
                    .on("contextmenu", function(){EventHandler.backgroundContextClick(machine);})
                    .on("mousedown", function(){EventHandler.backgroundClick(machine, true);});
        // resize all canvases
        Display.setSvgSizes();

        // Add <g> elements for nodes and links
        svg.append("g").classed("links", true);
        svg.append("g").classed("nodes", true);

        //Setup force:
        Display.canvasVars[id].layout
            .force("link", d3.forceLink(m.getLinkList()).distance(100))
            .force("charge", d3.forceManyBody().strength(-60).distanceMax(80).distanceMin(0.1).theta(0.9))
            .force("collide", d3.forceCollide(Display.nodeRadius));
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
            var controlRect = d3.select(this);
            controlRect.attr("x", -1);
        };

        var mouseoutFunction = function(){
            var controlRect = d3.select(this);
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

        d3.select(`#${node.id}`).classed("link-in-progress", true);

    },
    endLink: function(canvasID){
        var canvasVars = Display.canvasVars[canvasID];
        if (canvasVars.linkInProgress === false){
            return;
        }
        d3.select("#" + canvasID + "-halflink").remove(); // Remove element
        d3.select("#" + canvasID)
            .on("mousemove", null) // Remove event listener
            .selectAll(".link-in-progress")
                .classed("link-in-progress", false);
        canvasVars.linkInProgress = false;
        canvasVars.linkInProgressNode = null;
    },
    isLinkInProgress: function(canvasID){
        var canvasVars = Display.canvasVars[canvasID];
        return canvasVars.linkInProgress === true;
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
            //Get the link if it exists yet, to see if it is above or below the node.
            const link = node1.getLinkTo(node2);
            const positionAbove = { x: node1.x,
                                    y: node2.y - (3.2 * Display.nodeRadius) - 3, //By eye, constant to account for text size
                                    rotation: 0};
            if(!link){
                return positionAbove;
            }
            if(link.alignment === "below"){
                return {x: node1.x,
                        y: node1.y + (3.2 * Display.nodeRadius) + 3,
                        rotation: 0};
            } else{
                return positionAbove;
            }

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
    getTextLength: function(svg,text, fontSize, className){
        //Returns the length of some text in the units of the specified SVG when rendered as an SVG using the specifed fontSize and class.
        //The result is memoised, as creating elements is very expensive and this value is needed many times for the same input.
        const canvasVars = Display.getCanvasVars(svg.attr("id"));
        let memory = canvasVars._textLengthMemo;
        if(memory[className]){
            if(memory[className][fontSize]){
                if(memory[className][fontSize][text]){
                    //Result already stored, return it
                    return memory[className][fontSize][text];
                }
            }
        }
        //Result not stored, compute it.
        let result;
        if(text.length === 0){
            result = 0;
        } else {
            const textElem = svg.append("text")
                          .text(text)
                          .classed(className, true)
                          .attr("font-size", fontSize);

            const boundingBox = textElem.node().getBBox();
            result = boundingBox.width;
            textElem.remove();
        }




        //Protect against an infinitely growing cache
        if(memory._cacheSize > 500){
            //Clear when size exceeds 500 elements
            canvasVars._textLengthMemo = {"_cacheSize": 0};
            memory = canvasVars._textLengthMemo;
        }

        //Store result
        if(!memory[className]){
            memory[className] = {fontSize: {}};
        }
        if(!memory[className][fontSize]){
            memory[className][fontSize] = {};
        }
        memory[className][fontSize][text] = result;
        memory._cacheSize = memory._cacheSize + 1;

        return result;
    },
    appendNextButton: function(selection){
        if(!selection.select(".extra-next").empty()){
            return;
        }
        var button = selection.append("a").text("Next").classed("pure-button", true).classed("extra-next", true);
        var nextURL = d3.select("#nav-next").attr("href");
        button.attr("href", nextURL);
    },
    giveFeedback: function(feedbackObj){
        const feedbackFunctions = {
            "dfa-convert": Display.giveFeedbackForDfaConvert,
            "give-list": Display.giveFeedbackForGiveList,
            "give-input": Display.giveFeedbackForGiveInput,
            "give-equivalent": Display.giveFeedbackForGiveEquivalent,
            "select-states": Display.giveFeedbackForSelectStates,
            "does-accept": Display.giveFeedbackForDoesAccept,
            "minimize-table": Display.giveFeedbackForMinimizeTable,
            "satisfy-definition": Display.giveFeedbackForSatisfyDefinition,
            "satisfy-list": Display.giveFeedbackForSatisfyList
        };
        const feedbackFunction = feedbackFunctions[Model.question.type];
        if(feedbackFunction){
            feedbackFunction(feedbackObj)
        } else{
            throw new Error("No method for question type " + Model.question.type + " in Display.giveFeedback");
        }

    },
    giveFeedbackForDfaConvert: function(feedbackObj){
        const feedbackSpan = d3.select("#dfa-convert-feedback");
        if(feedbackObj.falsePositiveNode){
            feedbackSpan.html("X – state <b>" + feedbackObj.falsePositiveNode.name + "</b> is not reachable for input '<b>" + feedbackObj.symbol + "</b>'.");
            return;
        }
        if(feedbackObj.falseNegativeNode){
            feedbackSpan.html("X – state <b>" + feedbackObj.falseNegativeNode.name + "</b> is also reachable for input '<b>" + feedbackObj.symbol + "</b>'.");
            return;
        }

        feedbackSpan.html("");

        //Correct, reposition the new node if necessary, update the m2 canvas, and get the next prompt.
        if(feedbackObj.newNode){
            const newNode = feedbackObj.newNode;
            const sourceNode = feedbackObj.sourceNode;

            var xOffset = 60;
            var maxYoffset = 5;

            newNode.x = sourceNode.x + xOffset;
            newNode.y = sourceNode.y + (maxYoffset * 2 * (Math.random() - 0.5));
        }
        Display.update(Model.machines[1].id);
        Display.reheatSimulation(Model.machines[1].id);

        //Done if allCorrectFlag == true, otherwise prompt next node set.
        if(feedbackObj.allCorrectFlag){
            d3.select("#dfa-prompt-text").text("Conversion complete!");
            //Add extra next:
            if(Display.extraNext){
                const buttonDiv = d3.select("#dfa-prompt-button-div").html("");
                Display.appendNextButton(buttonDiv);
            } else {
                d3.select("#dfa-prompt-button-div").classed("invisible", true);
            }
            //Clear highlights on both machines:
            Model.machines.forEach(function(m){
                Display.unhighlightNodes(m.id);
                m.getNodeList().forEach(node => node.selected = false);
            });
            d3.selectAll(".node").classed("selected", false);


        }else{
            Display.promptDfaConvert();
        }

    },
    giveFeedbackForMinimizeTable: function(feedbackObj){
        const messageDiv = d3.select(".message-div");
        //Clear any previous feedback;
        messageDiv.html("");
        //Add a tick/cross
        if(feedbackObj.allCorrectFlag){
            messageDiv.append("span").text("✓").classed("adjacent-tick", true);
        }else{
            messageDiv.append("span").text("☓").classed("adjacent-cross", true);
        }
        //Add the feedback message
        let message;
        if(feedbackObj.message.length > 0){
            message = feedbackObj.message;
        } else {
            message = "\xa0"; //nonbreaking space.
        }
        messageDiv.append("span").text(message);
        //Add extra next button
        if(Display.extraNext){
            const buttonDiv = d3.select(".button-div");
            Display.appendNextButton(buttonDiv);
        }

    },
    giveFeedbackForSatisfyDefinition: function(feedbackObj){
        var buttonDiv = d3.select(".button-div");
        if(buttonDiv.select("#adjacent-feedback").empty()){
            buttonDiv.append("div").attr("id", "adjacent-feedback");
        }
        var feedbackDiv = buttonDiv.select("#adjacent-feedback");
        feedbackDiv.text("");
        if(feedbackObj.allCorrectFlag === true){
            feedbackDiv.append("span").text("✓").classed("adjacent-tick", true);
            if(Display.extraNext ){
                Display.appendNextButton(feedbackDiv);
            }
        } else {
            feedbackDiv.append("span").text("☓").classed("adjacent-cross", true);
            feedbackDiv.append("span").text(feedbackObj.message).classed("adjacent-feedback-text", true);
        }

    },
    giveFeedbackForDoesAccept: function(feedbackObj){
        for(let i = 0; i < feedbackObj.isCorrectList.length; i++){
            const feedbackSpace = d3.select(`#feedback-${i}`);
            const traceSpace = d3.select(`#does-accept-trace-${i}`);
            if(feedbackObj.isCorrectList[i] === true){
                feedbackSpace.text("✓").classed("table-tick", true);
            }else{
                feedbackSpace.text("☓").classed("table-cross", true);
            }
            if(traceSpace.text() === ""){
                const inputSequence = Model.question.sequences[i];
                traceSpace
                    .text("trace")
                    .on("click", function(){
                        Controller.startTrace(m, inputSequence, 0);
                    });
            }
        }
        if(Display.extraNext && feedbackObj.allCorrectFlag){
            const buttonDiv = d3.select(".button-div");
            Display.appendNextButton(buttonDiv);
        }
    },
    giveFeedbackForSelectStates: function(feedbackObj){
        var buttonDiv = d3.select(".button-div");
        if(buttonDiv.select("#adjacent-feedback").empty()){
            buttonDiv.append("div").attr("id", "adjacent-feedback");
        }
        var feedbackDiv = buttonDiv.select("#adjacent-feedback");
        feedbackDiv.text("");
        if(feedbackObj.allCorrectFlag === true){
            feedbackDiv.append("span").text("✓").classed("adjacent-tick", true);
            if(Display.extraNext){
                Display.appendNextButton(feedbackDiv);
            }
        } else {
            feedbackDiv.append("span").text("☓").classed("adjacent-cross", true);
            var message = "show trace";
            var traceButton = feedbackDiv.append("span").text(message).classed("show-trace", true);
            traceButton.on("click", function(){
                var fullSequence = feedbackObj.initialInput.concat(feedbackObj.subsequentInput);
                var stepToStart = feedbackObj.initialInput.length;
                var machine = Model.machines[0];
                Controller.startTrace(machine, fullSequence, stepToStart);
                d3.select(".stop").on("click", function(){
                    var svg = d3.select(`#${machine.id}`);
                    Display.dismissTrace(svg);
                    Controller.setUpQuestion();
                });
            });
        }

    },
    giveFeedbackForGiveEquivalent: function(feedbackObj){
        var buttonDiv = d3.select(".button-div");
        if(buttonDiv.select("#adjacent-feedback").empty()){
            buttonDiv.append("div").attr("id", "adjacent-feedback");
        }
        var feedbackDiv = buttonDiv.select("#adjacent-feedback");
        feedbackDiv.text("");
        if(feedbackObj.allCorrectFlag === true){
            feedbackDiv.append("span").text("✓").classed("adjacent-tick", true);
            if(Display.extraNext){
                Display.appendNextButton(feedbackDiv);
            }
        } else {
            feedbackDiv.append("span").text("☓").classed("adjacent-cross", true);
            feedbackDiv.append("span").text(feedbackObj.message + " ").classed("adjacent-feedback-text", true);
            if(feedbackObj.incorrectSequence){
                feedbackDiv.append("span")
                    .text("Show trace.")
                    .classed("show-trace", true)
                    .on("click", function(){
                        Controller.startTrace(Model.machines[0], feedbackObj.incorrectSequence, 0);
                    });
            }
        }
    },
    giveFeedbackForGiveInput: function(){
        var buttonDiv = d3.select(".button-div");
        //If feedback already present, do nothing.
        if(!d3.select(".give-input-tick").empty()){
            return;
        }
        //Add tick
        buttonDiv.append("span").text("✓").classed("give-input-tick", true);
        if(Display.extraNext){
            Display.appendNextButton(buttonDiv);
        }
    },
    giveFeedbackForGiveList: function(feedbackObj){
        for(let i = 0; i < feedbackObj.isCorrectList.length; i++){
            const isCorrect = feedbackObj.isCorrectList[i];

            //Clear any previous feedback
            const feedbackLabel = d3.select(`#give-list-feedback-${i}`).text("");
            const inputBox = d3.select(`#qf${i}`).classed("correct", false).classed("incorrect", false);

            //Do nothing if an input of length 0 was provided - assume that the user has simply not attempted that yet.
            if(feedbackObj.input[i].length === 0){
                continue;
            }

            //Add a tick/cross as needed
            let feedbackText;
            if(isCorrect){
                feedbackText = "✓ ";
            } else {
                feedbackText = "☓ ";
            }
            //Add the message
            feedbackLabel.text(feedbackText + feedbackObj.messages[i]);

            //Style the input box:
            inputBox.classed("correct", isCorrect).classed("incorrect", !isCorrect);
        }
        //Add extra next button if all correct
        if(Display.extraNext && feedbackObj.allCorrectFlag){
            const buttonDiv = d3.select(".button-div");
            Display.appendNextButton(buttonDiv);
        }
    },
    giveFeedbackForSatisfyList: function(feedbackObj){
        feedbackObj.acceptList.forEach(function(isCorrect, i){
            d3.select(`#td-acc-adj-${i}`)
              .html("")
              .append("span")
              .classed("table-cross-small", !isCorrect)
              .classed("table-tick-small", isCorrect)
              .text(() => isCorrect ? "✓" : "☓");
        });
        feedbackObj.rejectList.forEach(function(isCorrect, i){
            d3.select(`#td-rej-adj-${i}`)
              .html("")
              .append("span")
              .classed("table-cross-small", !isCorrect)
              .classed("table-tick-small", isCorrect)
              .text(() => isCorrect ? "✓" : "☓");
        });
        if(feedbackObj.allCorrectFlag && Display.extraNext){
            const buttonDiv = d3.select(".button-div");
            Display.appendNextButton(buttonDiv);
        }
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
                .on("click", function(){Display.drawSettingsMenu(svg);});
    },
    drawContextMenu: function(svg,mousePosition,actions){
        //Generic function to draw a context menu, with the labels and associated functions specified in actions in the
        //from [["label", function(){doThing;}], ["label2", function(){doOtherThing();}]]
        var fontSize = 12;
        var yStep = fontSize * 1.3;
        var textClass = "context-menu-text";

        // Find width of menu based on rendered text length. Need to do this dynamically as rendered length varies by browser
        // First, find the longest string:
        var returnLonger = (x,y) => x.length > y.length ? x : y;
        var longestLabel = actions.map(x => x[0]).reduce(returnLonger, "");
        // Then find its length:
        var longestLabelLength = Display.getTextLength(svg, longestLabel, fontSize, textClass);

        var menuWidth = longestLabelLength + 10;
        var menuHeight = actions.length * yStep;

        var menuCoords = Display.getContextMenuCoords(svg, mousePosition[0], mousePosition[1], menuWidth, menuHeight);
        var menu = svg.append("g")
                    .classed("context-menu-holder", true);

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

    drawLinkContextMenu: function(svg,link,mousePosition){
        const menuItems = {
            changeConditions: {text: "Change Conditions", fn: function(){Controller.requestLinkRename(link);}},
            deleteLink: {text: "Delete Link", fn: function(){Controller.deleteLink(link);}},
            reverseLink: {text: "Reverse Link", fn: function(){Controller.reverseLink(link);}}
        };
        const getAction = function(name){
            return [menuItems[name].text, function(){
                //Call the function specific to this action
                menuItems[name].fn();
                //Call functions common to all entries
                Display.dismissContextMenu();
                Logging.incrementSessionCounter(`context-click-link-${name}`);
                Logging.incrementSessionCounter(`context-click-link-allItems`);
            }];
        };
        const actions = Object.keys(menuItems).map(getAction);

        Display.drawContextMenu(svg,mousePosition,actions);

    },
    drawNodeContextMenu: function(svg, node, mousePosition){
        const menuItems = {
            toggleInitial: {text: "Toggle Initial", fn: function(){Controller.toggleInitial(node);}},
            toggleAccepting: {text: "Toggle Accepting", fn: function(){Controller.toggleAccepting(node);}},
            renameState: {text: "Rename State", fn: function(){Controller.requestNodeRename(node);}},
            deleteState: {text: "DeleteState", fn: function(){Controller.deleteNode(node);}}
        };
        const getAction = function(name){
            return [menuItems[name].text, function(){
                //Call the function specific to this action
                menuItems[name].fn();
                //Call functions common to all entries
                Display.dismissContextMenu();
                Logging.incrementSessionCounter(`context-click-node-${name}`);
                Logging.incrementSessionCounter(`context-click-node-allItems`);
            }];
        };
        const actions = Object.keys(menuItems).map(getAction);

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
                        .attr("size", "2")
                        .attr("maxlength", "10")
                        .attr("autocomplete", "off")
                        .attr("name", "state name")
                        .attr("value", currentName)
                        .node().focus();
    },
    getLinkRenameResult: function(canvasID, formType){
        //Get the result from each rename type differently
        if(formType === "constrainedSVG"){
            return Display.getLinkRenameResultConstrainedSVG(canvasID, formType);
        }

        throw new Error("No method for formType " + formType + " in Display.getLinkRenameResult");
    },
    getLinkRenameResultConstrainedSVG: function(canvasID){
        // Return user input from the Constrained SVG link rename form.
        // Returns an input object of form {input: ["a", "b", "longsymbol"], hasEpsilon:false}
        var linkData = {input:[], hasEpsilon:false, output:{}};
        var svg = d3.select(`#${canvasID}`);
        var checkedSymbols = svg.select(".rename-menu-holder").selectAll(".checked").data();
        for(var i = 0; i< checkedSymbols.length; i++){
            const symbol = checkedSymbols[i];
            if(symbol === "ε"){
                linkData.hasEpsilon = true;
            }
            else{
                linkData.input.push(symbol);
            }
            //See if output is also specified
            //TODO - modify this and the menu drawing so that the input symbol is not entered into the element id. This will
            //allow a larger set of symbols to be used e.g '('.
            if(Display.getCanvasVars(canvasID).machine.isMealy && !d3.select(`#${canvasID}-output-for-${symbol}`).empty()){
                const outputSymbol = d3.select(`#${canvasID}-output-for-${symbol}`).text();
                if (outputSymbol.length > 0){
                    linkData.output[symbol] = outputSymbol;
                }
            }
        }
        return linkData;

    },
    drawSVGConstrainedLinkRenameForm: function(svg, link, mousePosition){
        const alphabet = jsonCopy(link.machine.alphabet); //Do not want to modify alphabet
        const outputAlphabet = link.machine.outputAlphabet;
        const fontSize = 12;
        const checkBoxSize = 0.9 * fontSize;
        const textClass = "context-menu-text";
        const yStep = 1.5 * fontSize;

        // Add epsilon if needed
        if (link.machine.allowEpsilon){
            alphabet.push("ε");
        }

        //Need to know if the machine is a transducer, so that we can add options for output
        const isMealy = link.machine.isMealy;

        // Find width of menu based on rendered text length. Need to do this dynamically as rendered length varies by browser.
        // First, find the longest string:
        var returnLonger = (x,y) => x.length > y.length ? x : y;
        var longestInputSymbol = alphabet.reduce(returnLonger, "");

        // Then find its length:
        var longestInputSymbolLength = Display.getTextLength(svg, longestInputSymbol, fontSize, textClass);

        let menuWidth, menuHeight, longestOutputSymbolLength;

        if(isMealy){
            const longestOutputSymbol = outputAlphabet.reduce(returnLonger, "");
            longestOutputSymbolLength = Display.getTextLength(svg, longestOutputSymbol, fontSize, textClass);
            menuWidth = longestInputSymbolLength + 27 + checkBoxSize + 10 + longestOutputSymbolLength;
            menuHeight = (alphabet.length + 1.5) * yStep;

        } else {
            menuWidth = longestInputSymbolLength + 27 + checkBoxSize;
            menuHeight = (alphabet.length + 1.5) * yStep;
        }


        // Position based on the mouse postion (could also be done based on the position of the link label)
        var menuCoords = Display.getContextMenuCoords(svg, mousePosition[0], mousePosition[1], menuWidth, menuHeight);
        var menu = svg.append("g")
                    .classed("rename-menu-holder", true)
                    .classed("rename", true);

        // Use to prevent context menu clicks
        var preventDefault = d3.event.preventDefault;

        var textX = menuCoords[0] + 5;
        var textY = menuCoords[1] + fontSize;

        //Add background rectangle
        menu.append("rect")
            .attr("x", textX - 5)
            .attr("y", textY - fontSize)
            .attr("height", menuHeight)
            .attr("width", menuWidth)
            .classed("rename-background-rect", true)
            .on("contextmenu", preventDefault);



        // Do it this way to avoid all toggle functions toggling the final id
        var getToggleFunction = function(id){
            return function(value){
                const checkmark = d3.select("#" + id);
                let newValue;
                if(value === undefined){
                    //Toggle if no value is specifed
                    newValue = ! checkmark.classed("checked");
                } else{
                    newValue = value;
                }
                checkmark.classed("checked", newValue);
            };
        };

        //Add an entry for each symbol in the machine alphabet.
        for(var i = 0; i < alphabet.length; i++){
            var symbol = alphabet[i];
            var id = link.machine.id + "-rename-option" + i;
            var checked = false;

            if((symbol === "ε" && link.hasEpsilon) || link.input.indexOf(symbol) !== -1){
                checked = true;
            }

            const toggleFunction = getToggleFunction(id);

            //Add text for current symbol
            menu.append("text")
                .text(symbol)
                .attr("x", textX)
                .attr("y", textY)
                .attr("font-size", 12)
                .classed(textClass, true)
                .on("contextmenu", preventDefault);

            const checkboxX = textX + longestInputSymbolLength + 10;
            const checkboxY = textY - (checkBoxSize/fontSize) * fontSize + 0.1 * fontSize;

            //Add checkbox for current symbol
            menu.append("rect")
                .attr("x", checkboxX)
                .attr("y", checkboxY)
                .attr("height", checkBoxSize)
                .attr("width",  checkBoxSize)
                .classed("rename-checkbox", true)
                .attr("id", id + "-rect")
                .on("click", toggleFunction);

            //Add a tick to current checkbox (this will be visible only when the checkbox is selected)
            menu.append("path")
                .classed("checkmark", true)
                .classed("checked", checked)
                .attr("d", `M ${checkboxX} ${checkboxY} l ${checkBoxSize} ${checkBoxSize} m ${-checkBoxSize} 0 l ${checkBoxSize} ${-checkBoxSize}`)
                .attr("id", id)
                .data([symbol]) //pass in a list here, otherwise d3 will treat the string as a list of chars and assign only the first character.
                .enter();

            //Add an output entry for Mealy machines
            if(isMealy){
                const outputBoxX = checkboxX + checkBoxSize + 15;
                const outputBoxY = checkboxY;
                const outputBoxWidth = 4 + longestOutputSymbolLength;
                const outputTextX = outputBoxX + 2 + longestOutputSymbolLength/2;
                const outputTextY = textY;
                const options = [""].concat(outputAlphabet);
                //When a nonempty output is selected, ensure that the input is ticked.
                const onSelectFunction = function(value){
                    if(value.length > 0){
                        toggleFunction(true);
                    }
                };

                const currentOutput = link.output[symbol]? link.output[symbol] : ""; //empty string if undefined.

                //Add a box to show that this is a dropdown menu
                const rect = menu.append("rect")
                                .attr("fill", "#FFFFFF")
                                .attr("stroke", "#444444")
                                .attr("x", outputBoxX)
                                .attr("y", outputBoxY)
                                .attr("height", checkBoxSize)
                                .attr("width", outputBoxWidth);


                //Add the currently selected output
                const text = menu.append("text")
                                .text(currentOutput)
                                .attr("id", `${link.machine.id}-output-for-${symbol}`)
                                .classed("option", true)
                                .classed("centre-align", true)
                                .style("pointer-events", "none")
                                .attr("x", outputTextX)
                                .attr("y", outputTextY)
                                .attr("font-size", fontSize);

                rect.on("click", Display.getDropdownOnClickFunction(svg, menu, text, symbol, options, 12, outputBoxX, outputBoxY, outputBoxWidth, onSelectFunction));

            }

            textY += yStep;

        }

        var buttonWidth = 1.7 * Display.getTextLength(svg, fontSize, "OK", "button-text");
        var buttonHeight = 1.5 * fontSize;
        var buttonY = textY - 0.5 * yStep;
        var buttonX = menuCoords[0] + menuWidth - buttonWidth - 4;


        // Set the submit function
        var submitFunction = function(){Controller.submitLinkRename(link.machine.id, link, "constrainedSVG");};
        Display.canvasVars[link.machine.id].submitRenameFunction = submitFunction;

        // Finally, add the "OK" button
        menu.append("rect")
            .attr("y", buttonY)
            .attr("x", buttonX)
            .attr("width", buttonWidth)
            .attr("height", buttonHeight)
            .classed("svg-button", true)
            .on("click", Display.canvasVars[link.machine.id].submitRenameFunction);

        menu.append("text")
            .text("OK")
            .classed("button-text", true)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("x", buttonX + 0.5 * buttonWidth)
            .attr("y", buttonY + 0.5 * buttonHeight)
            .attr("id", `${link.machine.id}-rename-submit-text`)
            .on("click", Display.canvasVars[link.machine.id].submitRenameFunction);

    },
    drawTrace: function(canvasID, traceObj, hideControls){
        const svg = d3.select(`#${canvasID}`);
        const canvasVars = Display.getCanvasVars(canvasID);
        const isTransducer = traceObj.output !== undefined;
        canvasVars.traceStep = 0;
        canvasVars.traceObj = traceObj;

        //Check if trace is already present;
        if (svg.classed("trace")){
            Display.dismissTrace(svg);
        }
        svg.classed("trace", true);

        //create a g to hold all trace objects
        const traceG = svg.append("g")
                        .classed("trace-g", true);

        //Add the trace controls to that g
        if(!hideControls){
            // This option is used in the give-input and select-states question types.
            Display.appendTraceControls(svg, traceG, canvasID);
            // Scroll down to ensure that the controls are visible.
            Display.scrollToTraceControls(canvasID);
        }


        //Draw the input text
        Display.appendInputText(svg, traceG, traceObj.input, traceObj.inputSeparator, isTransducer);

        if(isTransducer){
            const lastOutput = traceObj.output[traceObj.output.length -1];
            Display.appendOutputText(svg, traceG, lastOutput, traceObj.inputSeparator, true);
        }

        //Initialise trace
        Display.drawTraceStep(svg, 0, canvasID);
    },
    drawTraceStep(svg, step, canvasID, animate){
        const canvasVars = Display.getCanvasVars(canvasID);
        canvasVars.traceStep = step;
        const traceObj = canvasVars.traceObj;
        const isTransducer = traceObj.output !== undefined;

        //Cancel any animation in progress
        if(canvasVars.cancelTraceAnimation){
            canvasVars.cancelTraceAnimation();
        }

        //reset all trace styling
        Display.resetTraceStyling(svg);

        //Class next input element
        svg.select(`#${canvasID}-trace-input-${step}`).classed("trace-next", true);
        svg.select(`#${canvasID}-trace-input-separator-${step}`).classed("trace-next", true);

        //Class consumed input
        for(let i = 0;  i < step; i++){
            svg.select(`#${canvasID}-trace-input-${i}`).classed("trace-consumed", true);
            svg.select(`#${canvasID}-trace-input-separator-${i}`).classed("trace-consumed", true);
        }

        //Handle output from transducers
        if(isTransducer){
            const nSymbolsEmitted = traceObj.output[step].length;
            const totalSymbols = traceObj.output[traceObj.output.length - 1].length;
            //Class emitted symbols
            for(let i = 0; i < nSymbolsEmitted; i++){
                svg.select(`#${canvasID}-trace-output-${i}`).classed("trace-emitted", true);
                svg.select(`#${canvasID}-trace-output-separator-${i}`).classed("trace-emitted", true);
            }
            //Class symbols not yet emitted
            for(let i = nSymbolsEmitted; i < totalSymbols; i++){
                svg.select(`#${canvasID}-trace-output-${i}`).classed("trace-not-emitted", true);
                svg.select(`#${canvasID}-trace-output-separator-${i}`).classed("trace-not-emitted", true);
            }
        }


        //Class all nodes as not current
        svg.selectAll(".node").classed("trace-not-current", true);


        //Enclose the final steps in a function so that it can be called after animation if necessary
        const applyFinalStyle = function(){
            //Class current states
            const currentNodes = traceObj.states[step];
            for(let i = 0; i < currentNodes.length; i++){
                const nodeID = currentNodes[i].id;
                d3.select(`#${nodeID}`).classed("trace-current", true).classed("trace-not-current", false);
            }

            //Class used links and link inputs
            const usedLinks = traceObj.links[step];
            for(let i = 0; i < usedLinks.length; i++){
                const linkUsageObj = usedLinks[i];
                const link = linkUsageObj.link;
                d3.select(`#${link.id}`).classed("trace-used-link", true);
                Display.setLinkMarker(link, "url(#highlight-arrow)");
                if(linkUsageObj.epsUsed){
                    //Handle case of epsilon link
                    d3.select(`#${link.id}-input-eps`).classed("trace-used-link-input", true);
                } else {
                    const inputIndex = linkUsageObj.inputIndex;
                    d3.select(`#${link.id}-input-${inputIndex}`).classed("trace-used-link-input", true);
                }
            }
        };

        if(!animate){
            //Finish here if no animation is needed
            applyFinalStyle();
            return;
        }

        //Animate the transition
        const usedLinks = traceObj.links[step];
        //Add a temporary path to each link group
        usedLinks.forEach(function(linkUsageObj){
            const linkG = d3.select(`#linkg-${linkUsageObj.link.id}`);
            const animPath = linkG.append("path")
                                .classed("trace-animation", true)
                                .style("marker-end", "url(#highlight-arrow)");

            linkUsageObj.animPath = animPath; //Save path to usageObj


        });
        let startTime;
        const duration = 400; //ms

        //Register a function to cancel this animation (e.g if the next animation is activated)
        canvasVars.cancelTraceAnimation = function(){
            if(canvasVars.traceAnimCallbackID){
                window.cancelAnimationFrame(canvasVars.traceAnimCallbackID);
                canvasVars.traceAnimCallbackID = null;
            }
            d3.selectAll(".trace-animation").remove();
            applyFinalStyle();
            canvasVars.cancelTraceAnimation = null;
        };

        //TODO handle chains of epsilon links

        const drawFrame = function(timeStamp){
            //Takes a DOMHighResTimeStamp, provided by window.requestAnimationFrame
            if(!startTime){
                startTime = timeStamp;
                // endTime = startTime + duration;
            }
            const tRaw = (timeStamp - startTime) / duration; // 0 <= t <= 1
            const t = d3.easePolyIn(tRaw, 1.1); //Apply easing function to make animation look more natural.

            if(1 <= t){
                //End animation. Remove temporary elements and apply final style.
                d3.selectAll(".trace-animation").remove();
                applyFinalStyle();
                canvasVars.traceAnimCallbackID = null;
                return;
            }

            usedLinks.forEach(function(linkUsageObj){
                Display.animateLink(linkUsageObj.link, t);

            });
            canvasVars.traceAnimCallbackID = window.requestAnimationFrame(drawFrame);
        };

        canvasVars.traceAnimCallbackID = window.requestAnimationFrame(drawFrame);


    },

    //link - Link object to be animated
    //t - time value in range [0,1]
    animateLink: function(link, t){
        let animPath = d3.select("#anim-" + link.id);
        if(animPath.empty()){
            animPath = d3.select(`#linkg-${link.id}`)
                        .append("path")
                                .attr("id", "anim-" + link.id)
                                .classed("trace-animation", true)
                                .style("marker-end", "url(#highlight-arrow)");
        }
        if(link.isReflexive()){
            // Derive a path for animation from the link padding, as this is not split in two,
            // unlike the link itself
            const padding = d3.select(`#linkpad${link.id}`);
            const paddingPathD = padding.attr("d");
            //Extract the start point, the end point and the radius
            //Path should be in form M{startX},{startY} A{xradius} {yradius} {x-axis-rotation} {large-arc-flag} {sweep-flag} {endX} {endY}
            const components = paddingPathD.split(/[MA, ]/).filter(elem => elem.length > 0).map(Number); //Extract just the numerical components

            const startPos = new Victor(components[0], components[1]);

            const xRadius = components[2];
            const yRadius = components[3];

            const xAxisRotation = components[4];
            let largeArc = components[5];
            const sweep = components[6];

            //Now, calculate the postion on the arc at t
            //Use generic SVG methods (could likely optimise by using what we know about the path)
            const totalLength = padding.node().getTotalLength();
            const tLength = t * totalLength;
            const tPoint = padding.node().getPointAtLength(tLength);

            //Finally, we must set the largeArc flag correctly
            //ie to 1 if the arc covers more than 180deg
            //We can do this by comparing the current arc length to the cicumference if the arc is circular (as ellipse perimeter is more difficult to calculate).
            if(xRadius !== yRadius){
                //Implement this case later if it is ever needed
                throw new Error("Animation of reflexive links with non-circular arcs has not been implemented");
            } else{
                const circumference = 2 * Math.PI * xRadius;
                largeArc = tLength /circumference > 0.5 ? 1 : 0;
            }

            const newD = `M${startPos.x},${startPos.y} A${xRadius} ${yRadius} ${xAxisRotation} ${largeArc} ${sweep} ${tPoint.x} ${tPoint.y}`;
            animPath.attr("d", newD);

            return;
        }
        if(link.hasOpposite()){
            // Link is Bezier
            // SVG does not allow only drawing part of a bezier, so use an arc instead:
            const bezPoints = Display.getBezierPoints(link);
            const pathStart = new Victor.fromObject(bezPoints.P1);
            const pathMid = new Victor.fromObject(bezPoints.M1);
            const pathEnd = new Victor.fromObject(bezPoints.P2);
            //Calculate arc radii. rx is distance from sourceNode to targetNode, ry is the maximum perpendicular distance to the bezier curve
            const rx = pathEnd.clone().subtract(pathStart).length() / 2;
            const centre = pathStart.clone().add(pathEnd).multiplyScalar(0.5);
            const ry = pathMid.clone().subtract(centre).length();
            //Calculate radius rotations:
            const pathStartToEnd = pathEnd.clone().subtract(pathStart);
            const xRotationRad = Math.atan2(pathStartToEnd.y, pathStartToEnd.x);
            const xRotationDeg = xRotationRad * 180 / Math.PI; //convert to degrees

            //Scale t, as the very start and very end of the arc look odd animated
            const scale = d3.scaleLinear().domain([0,1]).range([0.2, 0.95]);
            t = scale(t);

            //Calculate the point on the arc at t
            const angle = (1 - t) * Math.PI; // in range [0, π], with angle = π at t = 0.
            const xUnit = pathEnd.clone().subtract(pathStart).normalize(); //x unit vector (in svg coordinates)
            const yUnit = pathMid.clone().subtract(centre).normalize();
            const posAtT = centre.clone().add(xUnit.multiplyScalar(rx * Math.cos(angle)).add(yUnit.multiplyScalar(ry * Math.sin(angle))));


            const pathD = `M${pathStart.x},${pathStart.y} A ${rx} ${ry} ${xRotationDeg} 0 0 ${posAtT.x},${posAtT.y}`;
            animPath.attr("d", pathD);

            return;
        }
        //Link is straight path
        const sourceNode = new Victor(link.source.x, link.source.y);
        const targetNode = new Victor(link.target.x, link.target.y);
        //Nb anim path dones not start at sourceNode, but at at the edge of the source node radius.
        //however the path does end at targetNode as it looks more natural for the arrow to enter the target node.
        const unitSourceToTarget = targetNode.clone().subtract(sourceNode).normalize();

        const pathStart = sourceNode.clone().add(unitSourceToTarget.clone().multiplyScalar(Display.nodeRadius));
        const pathEnd = targetNode;
        const pathStartToEnd = pathEnd.clone().subtract(pathStart);
        const endAtT = pathStart.clone().add(pathStartToEnd.clone().multiplyScalar(t));

        animPath.attr("d", `M${pathStart.x},${pathStart.y} L${endAtT.x},${endAtT.y}`);
    },
    highlightNodes: function(svg, nodeArray, hexColour, overwritePrevious){
        //Accept either a selection of a machineID
        if(!(svg instanceof d3.selection)){
            svg = d3.select(`#${svg}`);
        }
        const nodes = svg.selectAll(".node");
        nodes.each(function(node){
            const elem = d3.select(this);
            if(nodeArray.includes(node)){
                if(elem.classed("highlight-mode-selected") && !overwritePrevious){
                    const oldColour = d3.color(elem.style("fill"));
                    const thisColour = d3.color(hexColour);
                    const newColour = d3.rgb((oldColour.r + thisColour.r)/2, (oldColour.g + thisColour.g)/2, (oldColour.b + thisColour.b/2)).toString();
                    elem.style("fill", newColour)
                        .classed("highlight-mode-selected", true);
                } else{
                    elem.classed("highlight-mode-selected", true)
                    .style("fill", hexColour);
                }
            } else{
                if(!elem.classed("highlight-mode-selected") || overwritePrevious){
                    elem.classed("highlight-mode-selected", false)
                        .classed("highlight-mode-deselected", true)
                        .style("fill", "#FFFFFF");
                }
            }
        });

    },
    unhighlightNodes: function(svg){
        if(!(svg instanceof d3.selection)){
            svg = d3.select(`#${svg}`);
        }
        const nodes = svg.selectAll(".node");
        nodes.each(function(){
            const elem = d3.select(this);
            elem.classed("highlight-mode-selected", false)
                .classed("highlight-mode-deselected", false);
        });
        Display.resetNodeStyling(svg);

    },
    stepTrace: function(machineID, deltaStep, allowAnimation){
        //advances the trace by deltaStep steps. NB deltaStep can be negative => deltaStep = -1 means move back one step
        const svg = d3.select("#" + machineID);
        const canvasVars = Display.getCanvasVars(machineID);
        const currentStep = canvasVars.traceStep;
        const traceObj = canvasVars.traceObj;
        const newStep = currentStep + deltaStep;

        //Ensure new step is in allowed range
        if(newStep < 0 || newStep >=traceObj.states.length){
            return;
        }

        //Animate transition only if deltaStep == 1 AND animation is enabled in the settings
        const settings = Controller.getSettings();
        const showAnimation = allowAnimation && settings.traceAnimation.value === "on" && deltaStep === 1;

        Display.drawTraceStep(svg, newStep, machineID, showAnimation);
    },
    resetTraceStyling(svg){
        //Resets the trace-specific stying on all elements - i.e. removes node/link highlights and input text styling
        var traceClasses = ["trace-next", "trace-consumed", "trace-current", "trace-not-current", "trace-used-link", "trace-used-link-input", "trace-emitted", "trace-not-emitted"];
        traceClasses.forEach(function(className){
            svg.selectAll("." + className).classed(className, false);
        });
        d3.selectAll(".link-wrapper").each(link => Display.setLinkMarker(link, "url(#end-arrow)"));
    },
    appendOutputText: function(svg, element, output, separator, showLabel){
        //Create a text element to hold the output text
        const g = element.append("g").classed("trace-output", true);
        const textElement = g.append("text");
        const canvasID = svg.attr("id");

        //Add the output text as tspans
        for(var i = 0; i < output.length; i++){
            textElement.append("tspan").text(output[i]).attr("id", `${canvasID}-trace-output-${i}`).classed("output", true);
            //Add separator if not last element
            if(i < output.length + 1){
                textElement.append("tspan").text(separator + "   ").attr("id",`${canvasID}-trace-input-separator-${i}`).attr("xml:space", "preserve").classed("input-separator", true);
            }

        }

        //Position text element
        const svgWidth = svg.attr("width");
        const svgHeight = svg.attr("height");
        const textY = 0.14 * svgHeight;
        const textWidth = textElement.node().getBBox().width;
        let textX = svgWidth/2 - textWidth/2;

        //prevent text disappearing off left side:
        if (textX < 0.04 * svgWidth){
            textX = 0.04 * svgWidth;
        }

        if(showLabel){
            //Move text if it is too close to left side
            if(textX < 0.1 * svgWidth){
                textX = 0.1 * svgWidth;
            }
            //Align label to input label if it is present and further left.
            let labelX = textX - 0.02 * svgWidth;
            const inputLabel = d3.select(`#${canvasID}-trace-label-input`);
            if(!inputLabel.empty()){
                const inputLabelX = inputLabel.attr("x");
                labelX = Math.min(labelX, inputLabelX);
            }

            g.append("text")
                .text("Output:")
                .attr("x", labelX)
                .attr("y", textY)
                .attr("id", `${canvasID}-trace-label-output`)
                .classed("trace-label", true);
        }

        textElement.attr("y", textY);
        textElement.attr("x", textX);

    },
    appendInputText: function(svg, element, input, separator, showLabel){
        //Create a text element to hold the input text
        const g = element.append("g").classed("trace-input", true);
        const textElement = g.append("text");
        const canvasID = svg.attr("id");

        //Add the input text as tspans
        for(var i = 0; i < input.length; i++){
            textElement.append("tspan").text(input[i]).attr("id", `${canvasID}-trace-input-${i}`).classed("input", true);
            //Add separator if not last element
            if(i < input.length + 1){
                textElement.append("tspan").text(separator + "   ").attr("id",`${canvasID}-trace-input-separator-${i}`).attr("xml:space", "preserve").classed("input-separator", true);
            }

        }

        //Position text element
        var svgWidth = svg.attr("width");
        var svgHeight = svg.attr("height");
        var textY = 0.07 * svgHeight;
        var textWidth = textElement.node().getBBox().width;
        let textX = svgWidth/2 - textWidth/2;

        //prevent text disappearing off left side:
        if (textX < 0.04 * svgWidth){
            textX = 0.04 * svgWidth;
        }

        if(showLabel){
            //Move text if it is too close to left side
            if(textX < 0.1 * svgWidth){
                textX = 0.1 * svgWidth;
            }
            g.append("text")
                .text("Input:")
                .attr("x", textX - 0.02 * svgWidth)
                .attr("y", textY)
                .classed("trace-label", true)
                .attr("id", `${canvasID}-trace-label-input`);
        }

        textElement.attr("y", textY);
        textElement.attr("x", textX);
    },
    appendTraceControls(svg, element, canvasID){
        var iconAddress = Global.iconAddress;
        var bwidth = 20; //button width
        var strokeWidth = 1;
        var margin = 5;

        var g = element.append("g").classed("tracecontrols", true).attr("id", `${canvasID}-trace-controls`);
        // Tool names and functions to call on click.
        var tools = [["rewind", function(){Display.drawTraceStep(svg, 0, canvasID, false);}],
                     ["back", function(){Display.stepTrace(canvasID, -1, true);}],
                     ["forward", function(){Display.stepTrace(canvasID, 1, true);}],
                     ["stop", function(){Display.dismissTrace(svg);}]];
        var width = svg.attr("width");
        var height = svg.attr("height");

        // create a button for each tool in tools
        for (var i = 0; i < tools.length; i++){
            g.append("image")
                .attr("y",  6 * height/7 +  0.5 * margin)
                .attr("x", (width/2) - (0.5 * bwidth * tools.length ) + 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", iconAddress +"trace-"+ tools[i][0] +".svg")
                .attr("class", "control-img");
            g.append("rect")
                .attr("width", bwidth)
                .attr("height", bwidth)
                .attr("x", (width/2) - (0.5 * bwidth * tools.length ) + (i * bwidth))
                .attr("y", 6 * height/7)
                .attr("fill", "#101010")
                .attr("fill-opacity", 0)
                .attr("style", "stroke-width:" + strokeWidth +";stroke:rgb(0,0,0)")
                .classed("tracecontrol-rect", true)
                .classed(tools[i][0], true)
                .attr("id", `${canvasID}-${tools[i][0]}`)
                .on("click", tools[i][1]);
        }
    },
    dismissTrace: function(svg){
        svg.select(".trace-g").remove();
        svg.classed("trace", false);
        Display.resetTraceStyling(svg);
    },
    drawUnconstrainedLinkRenameForm: function(canvasID, link){
        // This function creates a rename form as a textbox where anything can be entered
        var svg = d3.select("#" + canvasID);

        // Derive the position of the form from the location of the link label
        var labelPos = Display.getLinkLabelPosition(link.source, link.target);
        var formX = labelPos.x - 40;
        var formY = labelPos.y + 15;

        // Get the string representing the current link conditions
        var current = Display.linkLabelText(link);

        var submitFunction = function(){Controller.submitLinkRename(link.machine.id, link, "unconstrained");};
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
    dismissSettingsMenu: function(svg){
        svg.selectAll(".settings-menu").remove();
    },
    drawSettingsMenu: function(svg){
        //Check if settings menu already exists, dismiss and return if it is.
        const existingMenu = svg.select(".settings-menu");
        if(!existingMenu.empty()){
            existingMenu.remove();
            return;
        }

        const settings = Controller.getSettings();
        const menuWidth = 0.5 * svg.attr("width");
        const menuHeight = 0.5 * svg.attr("height");
        const fontSize = 10;
        const optionBorder =  2;
        const xBorder = 15;

        const x = 0.25 * svg.attr("width");
        const y = 0.1 * svg.attr("height");
        const g = svg.append("g").classed("settings-menu", true);

        g.append("rect")
         .attr("x", x)
         .attr("y", y)
         .attr("width", menuWidth)
         .attr("height", menuHeight)
         .attr("fill", "#FFFFFF")
         .attr("stroke", "#555555");

        const textX = x + xBorder;
        let textY = y + (4 * fontSize);
        const longestOption = 4 +  Display.getTextLength(svg,"monochrome", fontSize, "settings-menu");



        for(let s in settings){
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
            var boxY = textY - fontSize;
            const boxWidth = longestOption + 2 * optionBorder;
            g.append("rect")
             .attr("x", boxX)
             .attr("y", textY - fontSize)
             .attr("width", boxWidth)
             .attr("height", fontSize + 2 * optionBorder)
             .attr("fill", "#FFFFFF")
             .attr("fill-opacity", 0)
             .attr("stroke", "#444444")
             .on("click", Display.getDropdownOnClickFunction(svg, g, optionText, s, settings[s].options, 10,  boxX, boxY + fontSize + 2 * optionBorder, boxWidth));

            textY = textY  + 2 * fontSize;
        }

        //Add the submit button
        var textWidth = Display.getTextLength(svg, "Save", fontSize, "settings-button-text");
        var buttonWidth = 2 * textWidth;
        var buttonHeight = 1.5 * fontSize;
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
            .attr("stroke", "#444444");

        //text
        g.append("text")
            .text("Save")
            .attr("x", submitX + 0.5 * buttonWidth - 0.5 * textWidth)
            .attr("y", submitY + buttonHeight - (0.5 * fontSize))
            .attr("font-size", fontSize)
            .classed("settings-button-text", true)
            .on("click", function(){
                for(let s in settings){
                    settings[s].value = d3.select(`#settings-${s}-option`).html();
                }
                Controller.setSettings(settings);
                g.remove();
            });



    },
    forceTick: function(canvasID){
        // Update the display after the force layout acts. Should be called at least once to initialise positions, even if
        // force is not used.
        var svg = d3.select("#"+canvasID);
        svg.selectAll(".node")
            .attr("cx", function(node){ //prevent nodes leaving the canvas on the x axis
                const rad = Display.nodeRadius;
                if(node.x < rad){
                    node.x = rad;
                    return node.x;
                }
                if(node.x + rad > svg.attr("width")){
                    node.x = svg.attr("width") - rad;
                    return node.x;
                }
                return node.x;
            })
            .attr("cy", function(node){ //prevent nodes leavinf the canvas on the y axis
                const rad = Display.nodeRadius;
                if(node.y < rad){
                    node.y = rad;
                    return node.y;
                }
                if(node.y + rad > svg.attr("height")){
                    node.y = svg.attr("height") - rad;
                    return node.y;
                }
                return node.y;
            });
        svg.selectAll(".accepting-ring")
            .attr("cx", function(d){return d.x;})
            .attr("cy", function(d){return d.y;});
        svg.selectAll(".start")
            .attr("d", function(node){return Display.getInitialArrowPath(node);});
        svg.selectAll(".link")
            .each(function(link){
                const linkID = link.id;
                const paddingID = "linkpad"+linkID;
                const pathD = Display.getLinkPathD(link);
                if(link.source !== link.target){
                    //Handle reflexive links separately, as part of the effort to work around the marker-mid issue in Chrome.
                    d3.select("#" + linkID + "-path").attr("d", pathD);
                    d3.select("#" + paddingID).attr("d", pathD);
                } else{
                    d3.select("#"+ linkID + "-path-1").attr("d", pathD.part1);
                    d3.select("#"+ linkID + "-path-2").attr("d", pathD.part2);
                    d3.select("#" + paddingID).attr("d", pathD.padding);
                }

            });

        // Update the rotation and position of each linklabel
        Display.updateLinkLabelPositions(svg, false);

        // Update the position of each node name
        svg.selectAll(".nodename")
            .each(function(node){
                const coords = Display.getNodeNameCoords(node);
                d3.select(this).attr("x", coords.x).attr("y", coords.y);
            });
    },
    getCanvasVars: function(canvasID){
        return Display.canvasVars[canvasID];
    },
    getNodeNameCoords: function (node){
        // Get the coordinates of the node name label
        // This will be the coordinates of the node for short labels, longer labels
        // be positioned below the node, or elsewhere if that collides with a link
        const name = node.name;
        const svg = d3.select(`#${node.machine.id}`);
        const fontSize = Display.nodeNameFontSize;
        const nameLength = Display.getTextLength(svg, name, fontSize, "nodename");
        const maxlength = node.isAccepting? 1.8 * Display.acceptingRadius : 1.8 * Display.nodeRadius;
        if(nameLength < maxlength){
            return {x: node.x, y:node.y};
        } else {
            //Try positioning below or above the node, then to right or left
            const coordArray = [{x: node.x, y: node.y + (1.6 * Display.nodeRadius)},
                                {x: node.x, y: node.y - (1.6 * Display.nodeRadius)},
                                {x: node.x + 1.6 * Display.nodeRadius + (0.5 * nameLength), y: node.y},
                                {x: node.x - 1.6 * Display.nodeRadius - (0.5 * nameLength), y: node.y}];

            const testElems = []; // elements to test for collisions with using bounding boxes
            const testLinks = []; // Links to test for collisions with
            //Add links to testLinks
            node.machine.getLinkList().forEach(link => testLinks.push(link));

            //Test coordinates for collisions with links, until a set is found with no collisions (or until the list is exhausted)
            for(let i = 0; i < coordArray.length; i++){
                let collisionFound = false;
                const coordObj = coordArray[i];
                //Construct the boundingBox of the nodename, for this coordob
                const textBBox = {x: coordObj.x - (nameLength/2), y: coordObj.y - (fontSize/2), width: nameLength, height: fontSize};
                // Test for intersection using the boundingbox of testElems
                for(let j = 0; j < testElems.length; j++){
                    const testBBox = testElems[j].getBBox();
                    if(Display.doBoundingBoxesOverlap(textBBox, testBBox)){
                        collisionFound = true;
                        break;
                    }
                }
                //Then test against links, treating them as lines (much more precise than bounding box approach for diagonal lines)
                for(let j = 0; j < testLinks.length && !collisionFound; j++){
                    const testLink = testLinks[j];
                    if(Display.doesLinkIntersectBoundingBox(testLink, textBBox)){
                        collisionFound = true;
                        break;
                    }
                }
                if(!collisionFound){
                    //Return the first set of coordinates with no collision.
                    return coordObj;
                }
            }
            //Fallback -> return the first result even if it collides.
            return coordArray[0];
        }
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
            // Return an object containing 3 path descriptions
            // This is done as a work around to the issue with marker-mid in Chrome
            // (see http://stackoverflow.com/questions/37384804/on-chrome-svg-chart-arrowhead-marker-mid-is-viewed-3-times-instead-1 and
            // http://stackoverflow.com/questions/31920448/svg-marker-mid-not-appearing-on-arc-in-firefox )
            const pathObj = {
                part1: undefined,
                part2: undefined,
                padding: undefined
            };

            const x = link.source.x;
            const y = link.source.y;

            const rad = Display.nodeRadius * 1.16;
            const xoffset = 5; //How far the left/right of centre the path starts
            const yoffset = 7;
            const bboxXoffset = rad * 0.8; // How far left/right of centre the bounding box extends. (constant to tweak eagerness to switch – using full bounding box is too agressive.)
            const bboxYoffset = yoffset + 5;
            const height = (Math.sqrt(rad*rad - (xoffset*xoffset)) + rad);

            //Determine whether to place the link above or below the node. Above by default,
            //below if that would collide with a link, above if both collide.
            let aboveBlocked = false;
            let belowBlocked = false;
            const links = link.machine.getLinkList().filter(l => !l.isReflexive()); // Get all links other than this link and reflexive links.
                                                                                    // Skip reflexive links as we don't want to have mutual dependendence between reflexive links.
                                                                                    // This is a simple display algorithm, we don't want to deal with CSPs.
            const bboxUp = {x: x - bboxXoffset, y: y - height - bboxYoffset, width: 2 * bboxXoffset, height};
            let bboxDown; // Calculate later, as most of the time not needed.

            for(let testLink of links){
                if(Display.doesLinkIntersectBoundingBox(testLink, bboxUp)){
                    aboveBlocked = true;
                    break;
                }
            }
            //Above is blocked, see if below is free
            if(aboveBlocked){
                bboxDown = {x: x - bboxXoffset, y: y + bboxYoffset, width: 2 * bboxXoffset, height};
                for(let testLink of links){
                    if(Display.doesLinkIntersectBoundingBox(testLink, bboxDown)){
                        belowBlocked = true;
                        break;
                    }
                }
            }

            const placeAbove = !aboveBlocked ||(aboveBlocked && belowBlocked);
            const signMultiplier = placeAbove? -1: 1;
            link.alignment = placeAbove? "above" : "below";

            // Store the bounding box used in the Link object – it is needed for collision tests against node labels
            // and calculating it from the DOM is very expensive.
            link.boundingBox = placeAbove? bboxUp : bboxDown;

            const x1 = x + (signMultiplier * xoffset);
            const y1 = y + (signMultiplier * yoffset);

            //Calculate points P1, P2, P3 – the start, mid, and end points respectively.

            const P1 = x1 + "," + y1;

            const x2 = x;
            const y2 = y1 + (signMultiplier * height);
            const x3 = x - (signMultiplier * xoffset);
            const y3 = y1;

            const P2 = x2 + "," + y2;
            const P3 = x3 + "," + y3;

            //Arc flags are A radius-x radius-y x-axis-rotation large-arc-flag sweep-flag x y
            pathObj.padding = `M${P1} A${rad} ${rad} 0 1 1 ${P3}`;
            pathObj.part1 = `M${P1} A${rad} ${rad} 0 0 1 ${P2}`;
            pathObj.part2 = `M${P2} A ${rad} ${rad} 0 0 1 ${P3}`;
            return pathObj;

        }
        // Test if there is a link in the opposite direction:
        const hasOpposite = link.hasOpposite();

        if (hasOpposite){
            //Use a bezier curve
            const points = Display.getBezierPoints(link);

            //Define strings to use to define the path
            const P1 = points.P1.x + "," + points.P1.y;
            const M1 = points.M1.x + "," + points.M1.y;
            const P2 = points.P2.x + "," + points.P2.y;
            const C1 = points.C1.x + "," + points.C1.y;
            const C2 = points.C2.x + "," + points.C2.y;

            return ("M" + P1 + " Q" + C1 + " " + M1 + " Q" + C2 + " " + P2);

        } else {
            const source = new Victor(link.source.x, link.source.y);
            const target = new Victor(link.target.x, link.target.y);

            // Define unit vector from source to target:
            const sourceToTarget = target.clone().subtract(source);
            const unitX = sourceToTarget.clone().normalize();

            //Define p1 and p2 at the edge of their nodes
            const p1 = source.clone().add(unitX.clone().multiplyScalar(Display.nodeRadius));
            const p2 = target.clone().add(unitX.clone().multiplyScalar(-1 * Display.nodeRadius));

            //Define midpoint halfway between the nodes:
            const m = source.clone().add(sourceToTarget.clone().multiplyScalar(0.5));

            const P1 = p1.x + "," + p1.y;
            const M = m.x + "," + m.y;
            const P2 = p2.x + "," + p2.y;

            return ("M" + P1 + " L" + M + " L" + P2);
        }
    },
    getBezierPoints: function(link){
        // Return the points needed to draw the bezier curve for this link
        // in form {P1:{x,y}, P2:{x,y}, C1:{x,y}, C2:{x,y}, M1:{x,y}}
        // where P1, P2 are the start and end points,
        // C1, C2 are the control points
        // and M1 is the midpoint.

        const source = new Victor(link.source.x, link.source.y);
        const target = new Victor(link.target.x, link.target.y);

        const sourceToTarget = target.clone().subtract(source);

        //Define unit vectors
        const unitX = sourceToTarget.clone().normalize(); //Take xaxis as running from source to target
        const unitY = unitX.clone().rotateDeg(90);

        // Define a vector at an angle to unitX of the same length as the node radius
        // This will be used to place the start and end points on the radius of the node
        const radiusAngle = 20;
        const radiusPositive = unitX.clone().rotateDeg(radiusAngle).multiplyScalar(Display.nodeRadius);
        const radiusNegative = radiusPositive.clone().rotateDeg(180 - (2*radiusAngle));

        const p1 = source.clone().add(radiusPositive);
        const p2 = target.clone().add(radiusNegative);


        // Control points are directly above p1 and p2
        const heightVector = unitY.clone().multiplyScalar(9);
        const c1 = p1.clone().add(heightVector);
        const c2 = p2.clone().add(heightVector);

        // We need an explicit midpoint to allow a direction arrow to be placed
        const m = p1.clone().add(p2).multiplyScalar(0.5).add(heightVector);

        return {P1: p1, P2: p2, M1: m, C1: c1, C2: c2};
    },
    getAllLinkPaths: function(machineID, filterFunction){
        //Return an array of native (ie not d3 selections) path elements for all links in the machine
        const paths = [];
        const machine = Display.getCanvasVars(machineID).machine;
        let links = [];
        if(filterFunction !== undefined){
            links = machine.getLinkList().filter(filterFunction);
        } else {
            links = machine.getLinkList();
        }
        links.map(link => d3.selectAll(`#${link.id} path.link`)).forEach(function(selection){selection.each(function(){paths.push(this);});});
        return paths;
    },
    getStartNode: function(canvasID){
        if (Display.canvasVars[canvasID].linkInProgress === false){
            return null;
        } else {
            return Display.canvasVars[canvasID].linkInProgressNode;
        }
    },
    appendLinkLabelTspans: function(element,link){
        //Append <tspan> to element. Allows individual input elements to be addressable, allowing them to be highlighted.
        var e = d3.select(element);
        for(var i = 0; i < link.input.length; i++){
            e.append("tspan")
            .text(function(){
                const inputSymbol = link.input[i];
                if(!link.machine.isMealy){
                    return inputSymbol;
                } else {
                    // Handle case where machine is a Mealy machine
                    const outputSymbol = link.output[inputSymbol];
                    if(outputSymbol === undefined){
                        // No output defined for this symbol
                        return inputSymbol;
                    } else {
                        // return string in form a:OUT
                        return `${link.input[i]}:${link.output[link.input[i]]}`;
                    }

                }
            })
            .attr("id", link => `${link.id}-input-${i}`);

            //Add separator
            if(i < link.input.length - 1 || link.hasEpsilon){
                e.append("tspan")
                 .text(", ")
                 .classed("linklabel-separator", true);
            }
        }
        if(link.hasEpsilon){
            e.append("tspan")
             .text("ε")
             .attr("id",link => `${link.id}-input-eps`);
        }
    },
    linkLabelText: function(link){
        //Create the label string for a link
        var labelString;
        if (link.input.length == 0) {
            return link.hasEpsilon? "ε" : "";
        } else {
            labelString = "";
            for (var i = 0; i < link.input.length; i++) {
                var inchar = link.input[i];
                if (link.machine.isMealy){
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
    clearMenus: function(svg){
        //Submits rename menus, dismisses the trace, dismisses context menus
        //Accepts a d3 selection or a canvasID
        if(!(svg instanceof d3.selection)){
            var canvasID = svg;
            svg = d3.select(`#${svg}`);
        } else {
            canvasID = svg.attr("id");
        }
        Display.submitAllRename(canvasID);
        if(!["select-states", "give-input"].includes(Model.question.type)){
            //Can't dissmiss trace on give-input or select-states questions.
            Display.dismissTrace(svg);
        }
        Display.dismissSettingsMenu(svg);
        Display.dismissContextMenu();

    },
    setUpQuestion: function(){
        const qType = Model.question.type;
        const checkButtonTypes = ["give-list", "satisfy-list", "give-equivalent", "select-states", "does-accept", "satisfy-definition", "minimize-table"]; //Question types with a check button
        if(checkButtonTypes.indexOf(qType) !== -1){
            d3.select("#check-button").on("click", EventHandler.checkButtonClick);
        }

        if(qType === "satisfy-list"){
            //make list entries clickable to show trace
            Model.question.shouldAccept.forEach(function(string, i){
                var onclick = function(){
                    var sequence = Model.parseInput(string);
                    var machine = Model.machines[0];
                    Controller.startTrace(machine, sequence, 0);
                };
                d3.select(`#td-acc-${i}`)
                  .on("click", onclick);
            });

            Model.question.shouldReject.forEach(function(string, i){
                var onclick = function(){
                    var sequence = Model.parseInput(string);
                    var machine = Model.machines[0];
                    Controller.startTrace(machine, sequence, 0);
                };
                d3.select(`#td-rej-${i}`)
                  .on("click", onclick);
            });
        }
        if(qType === "give-list"){
            //Add listeners to the 'trace' button
            d3.selectAll(".give-list-show-trace")
              .on("click", function(d, i){
                  var inputString = d3.select(`#qf${i}`).node().value;
                  var inputSequence = Model.parseInput(inputString);
                  var machine = Model.machines[0];
                  Controller.startTrace(machine, inputSequence, 0);
                  d3.event.preventDefault();
              });
        }
        if(qType === "give-input"){
            //Adds event listeners to the input buttons
            d3.selectAll(".give-input-button")
              .on("click", function(){
                  var inputSymbol = this.innerHTML;
                  Controller.giveMachinesInput(inputSymbol);
              });
            d3.select(".give-input-reset")
              .on("click", function(){
                  Controller.resetMachines();
              });
        }
        if(qType === "dfa-convert"){
            Display.promptDfaConvert();
        }
        if(qType === "minimize-table"){
            Display.drawMinimizationTable();
            //Setup resest button
            d3.select(".reset-button").on("click", function(){
                Model.question.resetMachine();
                Display.resetNodeStyling(Model.machines[0].id);
                d3.select(".message-div").html("").text("\xa0");
                d3.selectAll(".nodeg").remove();
                d3.selectAll(".linkg").remove();
                Display.update(Model.machines[0].id);
                Display.drawMinimizationTable(true);
            });
        }

    },
    update: function(canvasID){
        var machine = Display.getCanvasVars(canvasID).machine;

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
                                .on("mousedown", function(node){EventHandler.nodeClick(node);});

        //Enforce physics setting on new nodes
        const newNodeObjs = newNodes.data();
        if(Controller.getPhysicsSetting() == "off"){
            for(let i = 0; i< newNodeObjs.length; i++){
                const node = newNodeObjs[i];
                node.fixed = true;
                node.fx = node.x;
                node.fy = node.y;
            }
        }

        if(Controller.getColourScheme() === "monochrome"){
            Display.styleMonochrome(canvasID, newCircles);
        } else {
            Display.styleColour(canvasID, newCircles);
        }

        // Add a name label:
        newNodes.append("svg:text")
            .classed("nodename", true)
            .attr("id", function(node){return node.id + "-label";})
            .attr("font-size", Display.nodeNameFontSize)   // Sets the font height relative to the radius of the inner ring on accepting nodes
            .on("mousedown", function(node){
                // Call the event listeners on the node (could just pass events using
                // pointer-events: none but want name to be clickable when it is outside a node)
                const onClickFunction = d3.select(`#${node.id}`).on("mousedown");
                onClickFunction.apply(this, [node]);
            })
            .on("contextmenu", function(node){EventHandler.nodeContextClick(node, true);}) //use this simpler method as no other right-click handlers are ever added.
            .text(function(node){return node.name;});


        nodeGs.exit().remove(); //Remove nodes whose data has been deleted

        // Update nodes
        // Set classes
        var circles = svg.selectAll("circle")
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
        var linkGs = linkg.selectAll(".linkg")
            .data(linkList, d => d.id);
        var newLinks = linkGs.enter()
                             .append("svg:g")
                                .classed("linkg", true)
                                .attr("id", link => `linkg-${link.id}`);

        newLinks.each(function(link){
            const g = d3.select(this);
            if(link.source === link.target){
                // Handle reflexive links differently, to deal with the marker-mid inconsistency between FF and Chrome.
                const pathObj = Display.getLinkPathD(link);
                const linkWrapper = g.append("g")
                                     .classed("link", true)
                                     .classed("link-wrapper", true)
                                     .attr("id", link.id)
                                     .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
                                     .on("mousedown", function(link){EventHandler.linkClick(link);});

                linkWrapper.append("path")
                 .classed("link", true)
                 .attr("d", pathObj.part1)
                 .attr("id", link.id + "-path-1")
                 .classed("link-pt1", true)
                 .style("stroke-width", Display.linkWidth)
                 .style("marker-end", "url(#end-arrow)");

                linkWrapper.append("path")
                 .classed("link", true)
                 .attr("d", pathObj.part2)
                 .attr("id", link.id + "-path-2")
                 .classed("link-pt2", true)
                 .style("stroke-width", Display.linkWidth);

                linkWrapper.append("svg:path")
                    .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
                    .on("mousedown", function(link){EventHandler.linkClick(link);})
                    .attr("class", "link-padding")
                    .attr("id", function(d){return "linkpad" + d.id;});

            }else{
                const linkWrapper = g.append("g")
                                     .classed("link", true)
                                     .classed("link-wrapper", true)
                                     .attr("id", link.id)
                                     .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
                                     .on("mousedown", function(link){EventHandler.linkClick(link);});


                linkWrapper.append("path")
                   .attr("d", function(d){return Display.getLinkPathD(d);})
                   .classed("link", true)
                   //See https://bugzilla.mozilla.org/show_bug.cgi?id=309612 for why marker-mid is not done using CSS
                   //TL;DR Mozilla's reading of the spec means that external css cannot refer to SVG definitions in the html.
                   .style("marker-mid", "url(#end-arrow)")
                   .style("stroke-width", Display.linkWidth)
                   .attr("id", function(d){return d.id + "-path";})
                   .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
                   .on("mousedown", function(link){EventHandler.linkClick(link);});

                //Add link padding to make links easier to click. Link padding handles click events as if it were a link.
                linkWrapper.append("svg:path")
                    .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
                    .on("mousedown", function(link){EventHandler.linkClick(link);})
                    .attr("class", "link-padding")
                    .attr("id", function(d){return "linkpad" + d.id;});

            }
        });

        // Add link labels
        var textElements = newLinks.append("svg:text")
            .on("contextmenu", function(link){EventHandler.linkContextClick(link);})
            .on("mousedown", function(link){EventHandler.linkClick(link);})
            .attr("class", "linklabel")
            .attr("text-anchor", "middle") // This causes text to be centred on the position of the label.
            .attr("font-size", 1.2 * Display.acceptingRadius) // Set the font height, using the radius of the inner ring of accepting nodes as a somewhat arbitrary reference point.
            .attr("id", function(link){return link.id + "-label";});

        textElements.each(function(link){Display.appendLinkLabelTspans(this, link);});

        linkGs.exit().remove(); //Remove links whose data has been deleted


        const layout = Display.getCanvasVars(canvasID).layout;
        layout.nodes(nodeList);
        layout.force("link", d3.forceLink(machine.getLinkList()).distance(100));
        newNodes.call(d3.drag()
          .on("start", Display.dragHandlers.dragstarted)
          .on("drag", Display.dragHandlers.dragged)
          .on("end", Display.dragHandlers.dragended));

        Display.forceTick(canvasID);
    },
    updateAllLinkLabels: function(canvasID){
        var linkList = Object.keys(Display.canvasVars[canvasID].machine.links);
        linkList.forEach(function(id){
            Display.updateLinkLabel(Display.canvasVars[canvasID].machine.links[id]);
        });
    },
    updateLinkLabel: function(link){
        var svg = d3.select("#" + link.machine.id);
        // Clear label and then add a new one (updates are infrequent so not a significant performance concern).
        var label = svg.select("#" + link.id + "-label").text("").node();
        Display.appendLinkLabelTspans(label, link);
        Display.updateLinkLabelPositions(svg, true);
    },
    repositionAllLinkLabels: function(){
        for(var canvasID in Display.canvasVars){
            var svg = d3.select(`#${canvasID}`);
            Display.updateLinkLabelPositions(svg, true);
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
                        if(Controller.getLabelRotation() === "never" || (Controller.getLabelRotation() === "long only"  && d3.select(this).text().length < 2)){
                            return null;
                        } else {
                            return "rotate(" + positionObj.rotation + ", " + positionObj.x +", " + positionObj.y +")";
                        }
                    });
            });

    },
    updateNodeName: function(node){
        const svg = d3.select("#" + node.machine.id);
        const coords = Display.getNodeNameCoords(node);
        const label = svg.select("#" + node.id + "-label").text(node.name);
        label.attr("x", coords.x)
             .attr("y", coords.y);
    },
    resetNodeStyling: function(svgOrCanvasID){
        //Accept either a selection of a machineID
        let canvasID = svgOrCanvasID;
        let svg = svgOrCanvasID;
        if(svgOrCanvasID instanceof d3.selection){
            canvasID = svg.attr("id");
        } else {
            svg = d3.select("#"+canvasID);
        }
        const circles = svg.selectAll(".nodeg").selectAll(".node");
        const styleFunction = Controller.getColourScheme() === "monochrome"? Display.styleMonochrome : Display.styleColour;
        styleFunction(canvasID, circles);

    },
    updateAllNodeStyle: function(){
        for(var id in Display.canvasVars){
            Display.resetNodeStyling(id);
        }
    },
    updateNodePhysics: function(){
        for(let i = 0; i < Model.machines.length; i++){
            const machine = Model.machines[i];
            for(let nodeID in machine.nodes){
                const node = machine.nodes[nodeID];
                if(Controller.getPhysicsSetting() === "on"){
                    node.fixed = false;
                    node.fx = null;
                    node.fy = null;
                    Display.update(node.machine.id);
                }
                else if(Controller.getPhysicsSetting() === "off"){
                    node.fixed = true;
                    node.fx = node.x;
                    node.fy = node.y;
                }
            }
        }

    },
    resetColours: function(canvasID){
        Display.canvasVars[canvasID].colours = d3.scaleOrdinal(this.nodeColourScale);
    },
    styleColour: function(canvasID, circleSelection){
        //Takes a selection of node circles and applies multicoloured styling to them
        if(canvasID instanceof d3.selection){
            canvasID = canvasID.attr("id");
        }
        const colours = Display.canvasVars[canvasID].colours;
        circleSelection.style("fill", d => colours(d.id))
                       .style("stroke", "#000000");
    },
    styleMonochrome: function(canvasID, circleSelection){
        //Accept either a selection or a canvasID
        if(canvasID instanceof d3.selection){
            canvasID = canvasID.attr("id");
        }
        //Takes a selection of node circles and applies monochrome styling to them
        circleSelection.style("fill","#FFFFFF")
                       .style("stroke", "#000000");
    },
    makeNodesSelectable: function(machine){
        if (machine instanceof Model.Machine === true){
            var machineID = machine.id;
        } else{
            machineID = machine;
            machine = Display.getCanvasVars(machineID).machine;
        }
        var getOnClickFunction = function(node){
            return function(){
                node.toggleSelected();
                var nodeDisplay = d3.select(`#${node.id}`);
                nodeDisplay.classed("selected", !nodeDisplay.classed("selected"));
            };
        };
        var svg = d3.select(`#${machineID}`);
        svg.selectAll(".node")
           .classed("selected", false)
           .each(function(node){
               d3.select(this).on("mousedown", getOnClickFunction(node));
               node.selected = false;
           });
    },
    setLinkMarker(link, urlString){
        //Expect urlString to be in form "url(#end-arrow)"
        const isReflexive = link.source === link.target;
        if(isReflexive){
            d3.select(`#${link.id}-path-1`).style("marker-end", urlString);
        }else{
            d3.select(`#${link.id}-path`).style("marker-mid", urlString);
        }
    },
    doesLinkIntersectBoundingBox(link, bBox){
        if(link.isReflexive()){
            // Test reflexive links using boundingboxes
            // Retrieve bounding box stored in the link (done this way as getting bbox from DOM is very expensive).
            const linkBBox = link.boundingBox;
            if(!linkBBox){
                // Catch case where no bounding box defined yet.
                return false;
            } else {
                return Display.doBoundingBoxesOverlap(bBox, linkBBox);
            }

        }
        const isBezier = link.target.hasLinkTo(link.source);


        // Define a function to test line segments for overlap with a bounding box.
        // As described here: http://stackoverflow.com/a/293052
        const doesLineSegmentOverlapBbox =function (p1, p2, bBox){

            const bboxPoints = [{x:bBox.x, y: bBox.y}, {x:bBox.x, y:bBox.y + bBox.height},
                                {x:bBox.x + bBox.width, y:bBox.y}, {x:bBox.x + bBox.width, y:bBox.y + bBox.height}];

            // Test if all corners of the boundingbox are on the same side of the line segment – if that is the case there is no overlap.
            const aboveOrBelow = function(point){
                const indicator = (p2.y - p1.y) * point.x + (p1.x - p2.x) * point.y + (p2.x * p1.y - p1.x * p2.y);
                if(indicator >= 0){ //Ignore case where point lies on line.
                    return "above";
                } else {
                    return "below";
                }
            };

            // Cannot intersect if all bBox corners are on same side of the line segment.
            const cannotIntersect = bboxPoints.map(aboveOrBelow).every(function(d, i, arr){return d === arr[0];});
            if(cannotIntersect){
                return false;
            }
            if(p1.x > bBox.x + bBox.width && p2.x > bBox.x + bBox.width){
                // both points are to right of bBox
                return false;
            }
            if(p1.x < bBox.x && p2.x < bBox.x){
                // both points are to left of bBox
                return false;
            }
            if(p1.y < bBox.y && p2.y < bBox.y){
                // both points are above the bBox
                return false;
            }
            if(p1.y > bBox.y + bBox.height && p2.y > bBox.y + bBox.height){
                // both points are below the bBox
                return false;
            }
            return true;
        };

        let lines;

        const sourcePoint = {x: link.source.x, y: link.source.y};
        const targetPoint = {x: link.target.x, y: link.target.y};
        if(isBezier){
            //Approximate bezier as two straight lines
            const points = Display.getBezierPoints(link);
            const midPoint = points.M1;
            lines = [{p1: sourcePoint, p2: midPoint}, {p1: midPoint, p2: targetPoint}];
        } else {
            lines = [{p1: sourcePoint,  p2: targetPoint}];
        }

        for(let l of lines){
            if(doesLineSegmentOverlapBbox(l.p1, l.p2, bBox)){
                return true;
            }
        }
        return false;


    },
    doBoundingBoxesOverlap(bBox1, bBox2){
        //Returns true/false
        //BBoxes should be in form {x, y, width, height}
        if(bBox1.x + bBox1.width < bBox2.x || bBox2.x + bBox2.width < bBox1.x){
            //No intersection on x axix
            return false;
        }
        if(bBox1.y + bBox1.height < bBox2.y || bBox2.y + bBox2.height < bBox1.y){
            //No intersection on y axix
            return false;
        } else {
            //Intersect on both axes
            return true;
        }
    },
    drawMinimizationTable: function(resestCheckboxes){
        //Clear any existing entries
        const firstDraw = d3.selectAll(".minimize-table tbody tr").empty()? true : false;
        d3.selectAll(".minimize-table tbody tr");
        const machine = Model.machines[0];
        const nodes = machine.getNodeList();

        //Create a list of all pairs of nodes
        const nodePairs = [];
        for(let i = 0; i < nodes.length -1; i++){
            for(let j = i + 1; j< nodes.length; j++){
                //Present pair in alphabtical order
                let nodesPair;
                if(nodes[i].name < nodes[j].name){
                    nodesPair = [nodes[i], nodes[j]];
                } else {
                    nodesPair = [nodes[j], nodes[i]];
                }
                //Construct pair object
                const pairObject = {
                    node1: nodesPair[0],
                    node2: nodesPair[1],
                    name: nodesPair[0].name + ", " + nodesPair[1].name,
                    id: `pair-${nodesPair[0].id}-${nodesPair[1].id}`
                };
                //Record the current value of the checkbox if this is not the first draw:
                if(firstDraw || resestCheckboxes){
                    pairObject.checked = false;
                } else{
                    if(d3.select("#" + pairObject.id).empty()){
                        pairObject.checked = false;
                    } else {
                        pairObject.checked = d3.select("#" + pairObject.id).node().checked;
                    }
                }
                nodePairs.push(pairObject);
            }
        }
        //Now that we have recorded which entries were checked, we can clear the table.
        d3.selectAll(".minimize-table tbody tr").remove();

        //Sort the pairs based on the first and then second node name.
        nodePairs.sort(function(pair1, pair2){
            if(pair1.node1.name < pair2.node1.name){
                return -1;
            }
            if(pair1.node1.name > pair2.node1.name){
                return 1;
            }
            if(pair1.node2.name < pair2.node2.name){
                return -1;
            }
            return 1;
        });

        const tbody = d3.select(".minimize-table tbody");
        const svg = d3.select("#m1");

        //Add a row for each pair
        nodePairs.forEach(function(pair){
            //Add a row to the table for this pair.On mouseover, the nodes will be highlighted.
            const tr = tbody.append("tr");
            tr.on("mouseover", function(){
                Display.highlightNodes(svg, [pair.node1, pair.node2], "green", true);
            })
            .on("mouseleave", function(){
                Display.unhighlightNodes(svg);
            });

            //Add a label for the pair name.
            tr.append("td")
                .classed("state-pair", true)
                .text(pair.name);

            const checkbox = tr.append("td")
                                .classed("distinguishable", true)
                                .append("input")
                                    .attr("type", "checkbox")
                                    .attr("id", pair.id);

            checkbox.node().checked = pair.checked;

            const merge = tr.append("td")
                            .classed("merge-button", true)
                            .append("p")
                                .classed("merge-button", true)
                                .classed("invisible", pair.checked)
                                .text("merge");

            checkbox.on("change", function(){
                merge.classed("invisible", this.checked);
            });

            merge.on("click", function(){
                if(Global.mergeInProgress){
                    return;
                }
                Global.mergeInProgress = true;
                const n1 = pair.node1;
                const n2 = pair.node2;

                //Animate the mergining of the two nodes

                //Target position is midway between the nodes
                const target = {
                    x: (n1.x + n2.x)/2,
                    y: (n1.y + n2.y)/2
                };

                //Start postions
                const n1Initial = {
                    x: n1.x,
                    y: n1.y
                };

                const n2Initial = {
                    x: n2.x,
                    y: n2.y
                };

                const getn1Pos = function(t){
                    //calculate vector from initial position to target
                    const vx = target.x - n1Initial.x;
                    const vy = target.y - n1Initial.y;
                    //Add the v * t, so that at t = 1 the position is the target
                    return {x: n1Initial.x + (t * vx), y: n1Initial.y + (t * vy)};
                };

                const getn2Pos = function(t){
                    //calculate vector from initial position to target
                    const vx = target.x - n2Initial.x;
                    const vy = target.y - n2Initial.y;
                    return {x: n2Initial.x + (t * vx), y: n2Initial.y + (t * vy)};
                };

                const easeFunction = d3.easeCubic;

                const animFunction = function(t){
                    //This function adjusts the position of the nodes
                    //at t = 1, the nodes will be at the target position.
                    t = easeFunction(t);
                    const n1Pos = getn1Pos(t);
                    const n2Pos = getn2Pos(t);
                    n1.fx = n1Pos.x;
                    n1.fy = n1Pos.y;
                    n2.fx = n2Pos.x;
                    n2.fy = n2Pos.y;
                };

                //Duration of the animation in ms
                const duration = 1500;
                //Number of steps to use (more == smoother)
                const steps = 120;


                const getTimeoutFunction = function(t){
                    return function(){
                        animFunction(t);
                        Display.reheatSimulation("m1");
                        if(t < 0.75){
                            //Keep setting new timeouts until t >= 0.75
                            window.setTimeout(getTimeoutFunction(t + 1/steps), duration/steps);
                        }else{
                            //Then actually merge the nodes.
                            Controller.mergeNodes(pair.node1, pair.node2, true);
                            Display.drawMinimizationTable();
                            Global.mergeInProgress = false;
                            if(Controller.settings.forceLayout.value === "on"){
                                //Unfix nodes if phyics is on
                                n1.x = n1.fx;
                                n1.fx = undefined;
                                n1.y = n1.fy;
                                n1.fy = undefined;

                                n2.x = n2.fx;
                                n2.fx = undefined;
                                n2.y = n2.fy;
                                n2.fy = undefined;
                            }
                        }
                    };
                };

                //Call the timeout function
                getTimeoutFunction(0)();
            });
        });
    },
    promptDfaConvert: function(){
        let promptDiv = d3.select("#dfa-prompt-div");
        //Create promptDiv if it does not exist
        if(promptDiv.empty()){
            promptDiv = d3.select(".question-text")
                          .append("div")
                            .attr("id", "dfa-prompt-div");
            promptDiv.append("div")
                     .attr("id", "dfa-prompt-text");

            const buttonDiv = promptDiv.append("div")
                                       .attr("id", "dfa-prompt-button-div");

            buttonDiv.append("button")
                     .classed("pure-button", true)
                     .attr("type", "submit")
                     .text("Check")
                     .on("click", Controller.checkAnswer);

            buttonDiv.append("span")
                     .attr("id", "dfa-convert-feedback");
        }
        const promptObj = Model.question.getNextDfaPrompt();
        //Costruct grammatical phrase for the set of m1nodes
        const m1NodeNames = promptObj.m1Nodes.map(node => node.name).sort();
        let m1NodesString = "";
        if(m1NodeNames.length === 1){
            m1NodesString = "state <b>" + m1NodeNames[0] + "</b>";
        }
        if(m1NodeNames.length > 1){
            m1NodesString = "states <b>";
            for(let i = 0; i + 1 < m1NodeNames.length; i++){
                m1NodesString += m1NodeNames[i] + ", ";
            }
            m1NodesString += "and " + m1NodeNames[m1NodeNames.length - 1] + "</b>";
        }


        let message = `On the left machine, select all states that can reached from ${m1NodesString} for input '<b>${promptObj.symbol}</b>'.`;
        let promptText = promptDiv.select("#dfa-prompt-text");
        promptText.html(message);

        Display.highlightNodes(Model.machines[0].id, promptObj.m1Nodes, "#2CA02C", true);
        Display.highlightNodes(Model.machines[1].id, [promptObj.m2Node], "#2CA02C", true);
        Display.makeNodesSelectable(Model.machines[0].id);
    },
    reheatSimulation: function(canvasID){
        const layout = Display.getCanvasVars(canvasID).layout;
        layout.alpha(0.2).restart();

    },
    scrollToTraceControls: function(canvasID){
        const xScroll= 0;
        const controlYPos = d3.select(`#${canvasID}-trace-controls`).node().getBoundingClientRect().bottom + window.scrollY; //Position of bottom of controls relative to page.
        const yScoll = controlYPos - window.innerHeight + 5;
        window.scrollTo(xScroll, yScoll);
    },
    drawProgressBar: function(statsObj){
        const sidebar = d3.select(".sidebar");
        if(sidebar.empty() || !statsObj){
            return;
        }
        const percentFull = (100 * statsObj.questionsCorrect / statsObj.totalQuestions) | 0;
        if(!sidebar.select(".progress-inner").empty()){
            //If a progress bar is already present, update it instead of drawing a new one.
            sidebar.select(".progress-inner").style("width", percentFull + "%");
        } else{
            //There is a progress tag but we don't use it as the implementation is too inconsistent and styling it is not generally supported.
            //So instead we draw a bar using two divs.
            const div = sidebar.insert("div", ":first-child");
            const barHolder = div.append("div")
                                .classed("progress-outer", true);
            barHolder.append("div")
                .classed("progress-inner", true)
                .style("width", percentFull + "%");
        }
    },
    getDropdownOnClickFunction: function(svg, element, currentTextSelection,menuID,options,fontSize, x, y, width, onSelectFunction){
        return function(){
            //this function should be called to create the dropdown part of the dropdown menu

            //if menu already open, dismiss and return
            var existingMenu = d3.select(`#dropdown-${menuID}`);
            if (!existingMenu.empty()){
                existingMenu.remove();
                return;
            }
            //Dismiss any other dropdowns open
            svg.selectAll(".dropdown-menu").remove();

            const drop = element.append("g")
                                .attr("id",`dropdown-${menuID}`)
                                .classed("dropdown-menu", true);
            const optionBorder = 2;

            //Add a white background under menu
            drop.append("rect")
                    .attr("y", y)
                    .attr("x", x)
                    .attr("width", width)
                    .attr("height", (fontSize + optionBorder)  * options.length + (2*optionBorder))
                    .attr("fill", "#FFFFFF")
                    .attr("stroke", "#444444");

            for(let i = 0; i < options.length; i++){
                //Add a background to allow highlighting on mouseover
                drop.append("rect")
                    .attr("x", x)
                    .classed("dropdown-option-background", true)
                    .attr("y", y + i * (1.5 * optionBorder + fontSize) + 1)
                    .attr("width", width)
                    .attr("height", fontSize + optionBorder * 1.5)
                    .attr("fill", "#FFFFFF")
                    .attr("fill-opacity", 0)
                    .attr("stroke-opacity", 0)
                    .data([options[i]])
                    .on("click", function(){
                        const value = d3.select(this).data()[0];
                        //Set the current text to be the new value
                        currentTextSelection.text(value);
                        //Execute the onSelection function if one was passed
                        if(onSelectFunction){
                            onSelectFunction(value);
                        }
                        d3.select(`#dropdown-${menuID}`).remove();
                    });
                //Add the text for each option
                drop.append("text")
                    .classed("dropdown-option", true)
                    .classed("centre-align", true)
                    .attr("y", y + ((i +1)) * (optionBorder + fontSize))
                    .attr("x", x + width/2)
                    .attr("font-size", fontSize)
                    .text(options[i]);
            }
        };
    },
    dragHandlers:{
        dragstarted: function(node){
            if(!Global.toolsWithDragAllowed.includes(Display.getCanvasVars(node.machine.id).toolMode)){
                return;
            }
            if (!d3.event.active){
                Display.reheatSimulation(node.machine.id);
            }
            node.fx = node.x;
            node.fy = node.y;
        },
        dragged: function(node){
            const machineID = node.machine.id;
            const canvasVars = Display.getCanvasVars(machineID);
            if(canvasVars.linkInProgress){
                //update the in-progress link while dragging
                const halflink = d3.select(`#${machineID}-halflink`);
                const sourceNode = canvasVars.linkInProgressNode;
                const mousePos = d3.mouse(d3.select(`#${machineID}`).node());
                halflink.attr("d", `M${sourceNode.x},${sourceNode.y}L${mousePos[0]},${mousePos[1]}`);
            }
            if(!Global.toolsWithDragAllowed.includes(Display.getCanvasVars(node.machine.id).toolMode)){
                return;
            }
            node.fx = d3.event.x;
            node.fy = d3.event.y;
            Display.reheatSimulation(node.machine.id);
        },
        dragended: function(node){
            if(!Global.toolsWithDragAllowed.includes(Display.getCanvasVars(node.machine.id).toolMode)){
                return;
            }
            if(!node.fixed){
                node.fx = null;
                node.fy = null;
            }
        }
    }
};

const EventHandler = {
    backgroundClick: function(machine, checkTarget){
        if(d3.event.type === "contextmenu"|| d3.event.button === 2){
            return;
        }
        // Check that the target is the background - this handler will recieve all clicks on the svg
        // Or proceed anyway if checkTarget is false;
        const canvasID = machine.id;
        if(!checkTarget || d3.event.target.id === canvasID){
            Display.clearMenus(machine.id);
            const toolMode = Display.canvasVars[canvasID].toolMode;
            if(toolMode === "linetool" && Display.isLinkInProgress(canvasID)){
                //End a link if one is in progress
                Controller.endLink(machine.id);
            }
            if (toolMode === "none" || toolMode === "linetool" || toolMode === "texttool" || toolMode === "deletetool"){
                return;
            }
            if (toolMode === "nodetool" || toolMode === "acceptingtool"|| toolMode === "initialtool"){
                //Get coordinates where node should be created:
                const point = d3.mouse(d3.select("#" + canvasID).node());
                Controller.createNode(machine, point[0], point[1], toolMode === "initialtool", toolMode === "acceptingtool");
            }
        }

    },
    backgroundContextClick: function(machine){
        // Check that the target is the background - this handler will recieve all clicks on the svg
        if(d3.event.type !== "contextmenu"){
            return;
        }
        const canvasID = machine.id;
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
        if(d3.event.type === "contextmenu" || d3.event.button === 2){
            return;
        }
        const canvasID = link.machine.id;
        const toolMode = Display.canvasVars[canvasID].toolMode;
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
        if(d3.event.type !== "contextmenu"){
            return;
        }
        d3.event.preventDefault();
        if(Global.contextMenuShowing){
            Display.dismissContextMenu();
        }
        var svg = d3.select("#" + link.machine.id);
        Global.contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());
        if(Model.question.allowEditing){
            Display.drawLinkContextMenu(svg, link, mousePosition);
        }


    },
    nodeClick: function(node){
        if(d3.event.type === "contextmenu"|| d3.event.button === 2){
            return;
        }
        d3.event.preventDefault();
        var canvasID = node.machine.id;
        var toolMode = Display.canvasVars[canvasID].toolMode;
        if(toolMode === "none" || toolMode === "nodetool"){
            return false;
        }
        if(toolMode === "linetool"){
            var linkInProgress = Display.canvasVars[canvasID].linkInProgress; // true if there is link awaiting an endpoint
            if(!linkInProgress){
                Controller.beginLink(node);
            } else {
                var startNode = Display.getStartNode(canvasID);
                Controller.createLink(startNode, node);
            }
            return true;
        }
        if(toolMode === "deletetool"){
            Controller.deleteNode(node);
            return true;
        }
        if(toolMode === "texttool"){
            Controller.requestNodeRename(node);
            return true;
        }
        if(toolMode === "acceptingtool"){
            Controller.toggleAccepting(node);
            return true;
        }
        if(toolMode === "initialtool"){
            Controller.toggleInitial(node);
            return true;
        }
        return true;
    },
    nodeContextClick: function(node, forceInvoke){
        if(d3.event.type !== "contextmenu" && !forceInvoke){
            return;
        }
        d3.event.preventDefault();
        if(Global.contextMenuShowing){
            Display.dismissContextMenu();
        }
        var svg = d3.select("#" + node.machine.id);
        Global.contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());
        if(Model.question.allowEditing){
            Display.drawNodeContextMenu(svg, node, mousePosition);
        }

    },
    linkRenameFormKeypress: function(link, context, formType){
        // Event handler to prevent submission of page on return key
        // and to notify Controller instead
        if (d3.event.keyCode != 13){
            return true;
        }
        d3.event.preventDefault();
        Controller.submitLinkRename(link, context, formType);

    },
    nodeRenameFormKeypress: function(node, context){
        // Event handler to prevent submission of page on return key
        // and to notify Controller instead
        if(d3.event.keyCode == 13){
            d3.event.preventDefault();
            Controller.submitNodeRename(node, d3.select(context).select("input").node().value);
        }
    },
    questionFormKeypress: function(){
        //Prevent page submission on return key.
        if(d3.event.keyCode == 13){
            d3.event.preventDefault();
            Controller.checkAnswer();
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

const Controller = {
    settings:{
        colourScheme: {description: "Colour scheme", value:"monochrome", options:["colour", "monochrome"]},
        forceLayout: {description:"Node physics", value:"on", options:["on", "off"]},
        labelRotation: {description:"Rotate transition labels", value:"long only", options:["always","long only", "never"]},
        traceAnimation: {description: "Animate trace", value:"on", options:["on", "off"]}
    },
    addMachine: function(specObj, allowEditing){
        //Adds a machine to the model and displays it on a new canvas
        var newMachine = Model.addMachine(specObj);
        var machineID = newMachine.id;
        Display.newCanvas(machineID, newMachine);
        Display.update(machineID);
        if (allowEditing === undefined){
            allowEditing = Model.question.allowEditing;
        }
        if(allowEditing){
            Display.drawControlPalette(machineID);
        }
        return machineID;
    },
    beginLink: function(sourceNode){
        // Called when the user is using the link tool add a link starting from sourceNode
        Display.clearMenus(sourceNode.machine.id);
        Display.beginLink(sourceNode);
    },
    checkAnswer: function(){
        //Check if input must be collected
        if(["give-list", "does-accept"].includes(Model.question.type)){
            var input = Controller.getQuestionInput(Model.question.type);
        }
        var feedbackObj = Model.question.checkAnswer(input);
        Display.giveFeedback(feedbackObj);
        if(Model.question.type === "dfa-convert" && feedbackObj.allCorrectFlag === false){
            // Only submit final dfa answer, as multiple steps are necessary.
            return;
        }
        if(input === undefined){
            const answer = Model.getMachineList();
            Logging.sendAnswer(feedbackObj.allCorrectFlag, answer);
        } else {
            Logging.sendAnswer(feedbackObj.allCorrectFlag, input);
        }

    },
    getQuestionInput: function(type){
        var input;
        if(type === "give-list"){
            // Obtain the users input as a list of unproccessed strings
            input = [];
            Model.question.lengths.forEach(function(v, index){
                input[index] = d3.select("#qf" + index).node().value;
            });
        }
        if(type === "does-accept"){
            // Construct a true/false array, based on which checkboxes are selected
            input = [];
            for(var i = 0; i < Model.question.sequences.length; i++){
                input[i] = d3.select(`#does-accept-checkbox-${i}`).node().checked;
            }
        }
        return input;
    },
    loadSettings: function(){
        //Load settings from localStorage if it exists and has a settings entry
        if(!localStorage){
            return;
        }
        if(!localStorage.getItem("settings")){
            return;
        }
        var settingsObj = JSON.parse(localStorage.getItem("settings"));
        for(var s in settingsObj){
            if (this.settings[s]){
                this.settings[s].value = settingsObj[s];
            }
        }

    },
    getSettings: function(){
        return jsonCopy(this.settings);
    },
    setSettings: function(settingsObj){
        //Save the settings values and make any changes necessary to switch settings.
        var oldSettings = jsonCopy(this.settings);
        this.settings = settingsObj;
        if(oldSettings.colourScheme.value !== this.settings.colourScheme.value){
            Display.updateAllNodeStyle();
        }
        if(oldSettings.forceLayout.value !== this.settings.forceLayout.value){
            Display.updateNodePhysics();
        }
        if(oldSettings.labelRotation.value !== this.settings.labelRotation.value){
            Display.repositionAllLinkLabels();
        }
        //Create a simplified object to save to local storage.
        var saveObj = {};
        for(var key in settingsObj){
            saveObj[key] = settingsObj[key].value;
        }
        if(localStorage){
            localStorage.setItem("settings", JSON.stringify(saveObj));
        }
    },
    convertToDFA: function(machine){
        Display.clearMenus(machine.id);
        machine.convertToDFA();
        Display.resetColours(machine.id);
        Display.forceTick(machine.id);
        Display.update(machine.id);
    },
    minimize: function(machine){
        Display.clearMenus(machine.id);
        machine.minimize();
        Display.resetColours(machine.id);
        Display.forceTick(machine.id);
        Display.update(machine.id);
    },
    reverseMachine: function(machine){
        Display.clearMenus(machine.id);
        machine.reverse();
        Display.resetColours(machine.id);
        Display.forceTick(machine.id);
        Display.update(machine.id);
    },
    endLink: function(canvasID){
        // Called to end a link creation action.
        Display.clearMenus(canvasID);
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
        Display.clearMenus(sourceNode.machine.id);
        Controller.requestLinkRename(newLink);
        Display.reheatSimulation(sourceNode.machine.id);

    },
    deleteMachine: function(machineID){
        Model.deleteMachine(machineID);
        Display.deleteCanvas(machineID);
    },
    deleteLink: function(link){
        Display.clearMenus(link.machine.id);
        link.machine.deleteLink(link);
        Display.update(link.machine.id);
        Display.reheatSimulation(link.machine.id);
    },
    createNode: function(machine, x, y, isInitial, isAccepting){
        Display.clearMenus(machine.id);
        machine.addNode(x, y, "", isInitial, isAccepting);
        Display.update(machine.id);
        Display.reheatSimulation(machine.id);
    },
    deleteNode: function(node){
        Display.clearMenus(node.machine.id);
        node.machine.deleteNode(node);
        Display.update(node.machine.id);
        Display.reheatSimulation(node.machine.id);
    },
    mergeNodes: function(node1, node2, useShortNames){
        if(node1.machine.id !== node2.machine.id){
            throw new Error("Cannot merge nodes that are in different machines.");
        }
        Display.clearMenus(node1.machine.id);
        node1.machine.mergeNodes(node1, node2, useShortNames);
        Display.update(node1.machine.id);
        Display.reheatSimulation(node1.machine.id);
    },
    reverseLink: function(link){
        Display.clearMenus(link.machine.id);
        link.reverse();
        Display.update(link.machine.id);
        Display.updateAllLinkLabels(link.machine.id);
    },
    requestLinkRename: function(link){
        // Submit any currently open rename form on the same canvas.
        Display.clearMenus(link.machine.id);
        var canvasID = link.machine.id;
        var svg = d3.select("#"+canvasID);
        var mousePosition = d3.mouse(svg.node());
        if (link.machine.alphabet.length === 0){
            Display.drawUnconstrainedLinkRenameForm(canvasID, link);
        } else {
            Display.drawSVGConstrainedLinkRenameForm(svg, link, mousePosition);
        }
    },

    requestNodeRename: function(node){
        Display.clearMenus(node.machine.id);
        var canvasID = node.machine.id;
        Display.drawNodeRenameForm(canvasID, node);
    },

    setAlphabet: function(machine, alphabetArray, allowEpsilon){
        Display.clearMenus(machine.id);
        machine.setAlphabet(alphabetArray, allowEpsilon);
        Display.updateAllLinkLabels(machine.id);
    },
    setOutputAlphabet: function(machine, outputAlphabet){
        Display.clearMenus(machine.id);
        machine.setOutputAlphabet(outputAlphabet);
        Display.updateAllLinkLabels(machine.id);

    },
    startTrace: function(machine, sequence, position, hideControls){
        position = position === undefined? 0 : position;
        hideControls = hideControls === undefined? false : hideControls;

        Display.clearMenus(machine.id);
        var traceObj = machine.getTrace(sequence);
        Display.drawTrace(machine.id, traceObj, hideControls);
        if(position !== 0){
            Display.stepTrace(machine.id, position, false);
        }
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
    giveMachinesInput: function(symbol){
        //Used by the give-input question type
        //Add the input to the model
        Model.question.currentInput.push(symbol);
        Model.machines.forEach(function(m){
            //Draw a trace for each machine and then advance it to the second latest stage
            Controller.startTrace(m, Model.question.currentInput,0, true); //true param for hideControls option
            var traceObj = Display.getCanvasVars(m.id).traceObj;
            if(traceObj.states.length > 1){
                Display.stepTrace(m.id, traceObj.states.length-2,false);
            }
            //Then step to the latest stage with animation:
            Display.stepTrace(m.id, 1, true);

        });
        //Query the model for correctness
        var feedbackObj = Model.question.checkAnswer();
        if (feedbackObj.allCorrectFlag){
            Display.giveFeedback(feedbackObj);
            //Log correct answer
            Logging.sendAnswer(true, {"correctInput": Model.question.currentInput});
        }
    },
    resetMachines: function(){
        //Used by the give-input question type
        Model.question.currentInput = [];
        Model.machines.forEach(function(m){
            //Draw a trace for each machine
            Controller.startTrace(m, Model.question.currentInput,0, true); //true param for hideControls option
        });


    },
    init: function(){
        //Init process is somewhat complex as parts of the page are already in the HTML for performance / rendering reasons.
        Controller.loadSettings();
        m = new Model.Machine("m1");
        Model.machines.push(m);
        var svg = d3.select("#m1")
            .on("mousedown", function(){EventHandler.backgroundClick(m, true);})
            .on("contextmenu", function(){EventHandler.backgroundContextClick(m);});
        const machineList = Controller.getQuestionMachineList();
        let width = 500;
        let height = 300;
        if(machineList.length > 1){
            for(let i = 1; i < machineList.length; i++){
                Controller.addMachine(machineList[i], false);
            }
            //Zoom in to make the machines easier to see.
            width = 375;
            d3.selectAll("svg")
                .attr("viewBox", `0 0 ${width} ${height}`)
                .attr("width", width)
                .attr("height", height);
        }
        Controller.setupMachine(m, 0);
        const canvasVars = Display.getCanvasVars("m1");
        canvasVars.machine = Model.machines[0];
        canvasVars.layout
            .force("link", d3.forceLink(m.getLinkList()).distance(100))
            .force("charge", d3.forceManyBody().strength(-60).distanceMax(80).distanceMin(0.1).theta(0.9))
            .force("collide", d3.forceCollide(Display.nodeRadius));
        Display.update("m1");
        Controller.setUpQuestion();
        Display.setUpQuestion();
        Display.drawGearIcon(svg);
        if(Model.question.allowEditing){
            Model.machines.forEach(function(machine){
                Display.drawControlPalette(machine.id);
            });
        }
        Logging.init(); //Sets up logging system, assigns to test group.
        if(Model.question.type !== "none" && Display.showProgressBar && !d3.select(".sidebar").empty()){
            const statsObj = Logging.getQuestionsCorrect();
            if(statsObj){
                Display.drawProgressBar(statsObj);
            }
        }

    },
    getQuestionMachineList: function(){
        const body = document.querySelector("body");
        return JSON.parse(body.dataset.machinelist);
    },
    setupMachine: function(machine, i){
        var spec = Controller.getQuestionMachineList()[i];
        machine.build(spec);

    },
    setUpQuestion: function(){
        // get the question object and from the DOM and pass it to Model, do additional work as recquired by each question type
        var body = document.querySelector("body");
        if (body.dataset.question != undefined){
            var questionObj = JSON.parse(body.dataset.question);
            Model.question.setUpQuestion(questionObj);
        }
        if(Model.question.type === "give-input"){
            Model.machines.forEach(function(m){Controller.startTrace(m, Model.question.currentInput, 0,  true);}); //true param for hideControls option
            return;
        }
        if(Model.question.type === "give-list"){
            d3.select(".qformblock").on("keypress", EventHandler.questionFormKeypress);
            return;
        }
        if(Model.question.type === "select-states"){
            Model.machines.forEach(function(m){
                var initialSequence = Model.question.initialSequence;
                var stepsTaken = initialSequence.length;
                Controller.startTrace(m, initialSequence, stepsTaken, true);
                Display.makeNodesSelectable(m);
            });
            return;
        }

    },
    submitLinkRename: function(canvasID, link, formType){
        var inputObj = Display.getLinkRenameResult(canvasID, formType);
        var input = inputObj.input;
        var hasEpsilon = inputObj.hasEpsilon;
        link.setInput(input, hasEpsilon);
        if(link.machine.isMealy){
            link.setOutput(inputObj.output);
        }
        Display.updateLinkLabel(link);
        Display.dismissRenameMenu(link.machine.id);
        Display.clearMenus(canvasID);
    },
    submitNodeRename: function(node, newName){
        node.name = newName;
        Display.updateNodeName(node);
        Display.dismissRenameMenu(node.machine.id);
        Display.clearMenus(node.machine.id);
    },
    toggleAccepting: function(node){
        node.toggleAccepting();
        Display.update(node.machine.id);
        Display.clearMenus(node.machine.id);
    },
    toggleInitial: function(node){
        node.toggleInitial();
        Display.update(node.machine.id);
        Display.clearMenus(node.machine.id);
    },
    toolSelect: function(canvasID, oldMode, newMode){
        if(newMode !== "none"){
            Display.clearMenus(canvasID);
        }
        if(oldMode === "linetool"){
            Controller.endLink(canvasID);
        }
    }
};

const Logging = {
    loadTime: Math.floor(Date.now() / 1000),
    hasLocalStorage: typeof(localStorage) !== "undefined",
    analyticsPath: d3.select("body").attr("data-analytics-path"),
    get userID(){
        if(Logging._userID){
            return Logging._userID;
        }
        //Use local storage if it is available
        if(Logging.hasLocalStorage) {
            if (localStorage.getItem("userID") !== null){
                Logging._userID = localStorage.getItem("userID");
                return Logging._userID;
            }
        }
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=="x" ? r : (r&0x3|0x8)).toString(16);
        });
        //store the value for easy access later;
        Logging._userID = uuid;
        if (Logging.hasLocalStorage){
            localStorage.setItem("userID", uuid);
        }
        return uuid;
    },
    get pageID(){
        if(!Logging._pageID){
            Logging._pageID = document.querySelector("body").getAttribute("data-pageid");
        }
        return Logging._pageID;
    },

    sessionData: {},
    getQuestionsCorrect: function(){
        //Return an object giving the number of questions the user has answered correctly, as well as the total number of questions.
        //Note that this figure is calculated based on the questions in the sidebar, so that if a question has been removed but it is still
        //in localStorage, it will not be counted. This also stops questions from separate question sets from counting.
        if(!Logging.hasLocalStorage || d3.select(".sidebar").empty()){
            return null;
        }
        const statsObj = {
            totalQuestions: d3.selectAll(".sidebar-otherq").size() + 1, //plus 1 to account for this question
            questionsCorrect: undefined
        };
        if(localStorage.getItem("fsmQuestions") === null){
            // Assume that this means that no questions have been answered correctly
            // Could also mean that localStorage exists and is full.
            statsObj.questionsCorrect = 0;
            return statsObj;
        }

        const savedStatsObj = JSON.parse(localStorage.getItem("fsmQuestions"));
        //Count the number of question ids marked as correct that are present in the sidebar.
        statsObj.questionsCorrect = Object.keys(savedStatsObj).filter(id => savedStatsObj[id].correct).filter(id => !d3.select("#qid-" + id).empty()).length;
        return statsObj;
    },
    recordQuestionCorrect: function(){
        //Note in local storage that this question has been answered correctly
        if(!Logging.hasLocalStorage){
            return; //Do nothing if no local storage (could try cookies but not likely to be worthwhile)
        }
        let questionObj;
        if(localStorage.getItem("fsmQuestions") === null){
            // Note that localStorage can only be used to store strings.
            // We will use a stringified JSON object.
            localStorage.setItem("fsmQuestions", "{}");
            questionObj = {};
        } else{
            questionObj = JSON.parse(localStorage.getItem("fsmQuestions"));
        }
        questionObj[Logging.pageID] = {correct: true};
        localStorage.setItem("fsmQuestions", JSON.stringify(questionObj));
        if(Display.showProgressBar){
            Display.drawProgressBar(Logging.getQuestionsCorrect());
        }
    },
    //Answer will be an object, varying with question type
    sendAnswer: function(isCorrect, answer) {
        if(isCorrect){
            Logging.recordQuestionCorrect();
        }
        var timeElapsed = Math.floor(Date.now() / 1000) - Logging.loadTime;
        var url = window.location.href;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        var data = {
            "answer": answer,
            "isCorrect": isCorrect,
            "pageID": Logging.pageID,
            "timeElapsed": timeElapsed,
            "url": url,
            "userID": Logging.userID
        };
        var string =  "&data=" + encodeURIComponent(JSON.stringify(data));
        var request = new XMLHttpRequest();
        request.open("POST", `${Logging.analyticsPath}/answer.cgi`, true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    },
    setSessionVar: function(varName, value){
        //Used to add a variable to the session data that is sent on page close.
        this.sessionData[varName] = value;
    },
    incrementSessionCounter: function(counterName){
        if(!this.sessionData[counterName]){
            this.sessionData[counterName] = 0;
        }
        this.sessionData[counterName] = this.sessionData[counterName] + 1;
    },
    pushToSessionArray: function(arrayName, value){
        if(!this.sessionData[arrayName]){
            this.sessionData[arrayName] = [];
        }
        this.sessionData[arrayName].push(value);
    },
    sendSessionData: function() {
        var url = window.location.href;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }

        var timeOnPage = Math.floor(Date.now() / 1000) - Logging.loadTime;

        var data = {
            "pageID": Logging.pageID,
            "timeOnPage": timeOnPage,
            "url": url,
            "userID": Logging.userID,
            sessionData: this.sessionData
        };


        var string =  "&data=" + encodeURIComponent(JSON.stringify(data));
        var request = new XMLHttpRequest();
        request.open("POST", `${Logging.analyticsPath}/usage.cgi`, true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    },
    sendRating: function(rating) {
        var url = window.location.href;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }

        var data = {
            "pageID": Logging.pageID,
            "url": url,
            "userID": Logging.userID,
            "rating": rating
        };

        var string =  "&data=" + encodeURIComponent(JSON.stringify(data));
        var request = new XMLHttpRequest();
        request.open("GET", `https://keytracker.xyz/cgi/accountstatus.cgi`, true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    },
    markCorrectQuestions: function(){
        //In the sidebar, class all questions which have been answered correctly as correct.
        if(d3.select(".sidebar").empty()){
            return;
        }
        if(localStorage.getItem("fsmQuestions") === null){
            return;
        }
        const questionObj = JSON.parse(localStorage.getItem("fsmQuestions"));
        //get the ids of the questions to class;
        const correctIDs = Object.keys(questionObj).filter(id => questionObj[id].correct).map(id => "qid-" + id);
        correctIDs.forEach(function(id){
            const questionLink = d3.select("#" + id);
            if(!questionLink.empty()){
                questionLink.classed("correct", true);
            }
        });
    },
    setUpTestGroups: function(){
        //Assigns the user to a group for AB testing, setting variables as necessary and storing the group in localStorage
        //test001 is a test of the progress bar.
        let test001Group;
        if(!Logging.hasLocalStorage){
            // If local storage is unavailable, assign the user to group 'x'
            // They will be excluded from the experiment as they cannot be consistently assigned to 'a' or 'b'
            // using this method of testing.
            test001Group = "x";
        }else{
            if(["a","b"].includes(localStorage.getItem("fsmTest001"))){
                test001Group = localStorage.getItem("fsmTest001");
            } else {
                //Assign to a or b as not already assigned
                test001Group = Math.random() < 0.5 ? "a" : "b";
            }
            localStorage.setItem("fsmTest001", test001Group);
        }
        Logging.setSessionVar("test001Group", test001Group);
        if(test001Group === "a"){
            // group 'a' gets the progress bar
            Display.showProgressBar = true;
        } else {
            // group 'b' and 'x' do not get the progress bar
            Display.showProgressBar = false;
        }




    },
    init: function(){
        //Register a listener to send session data when the user leaves the page
        d3.select(window).on("beforeunload", function(){
            Logging.sendSessionData();
        });
        Logging.setUpTestGroups();
        Logging.markCorrectQuestions();

    }
};

const Global = {
    // Not certain if this is a good idea - object to hold global vars
    // Some globals useful to avoid keeping duplicated code in sync - this seems like
    // a more readable way of doing that than scattering global vars throughout the codebase
    "toolsWithDragAllowed": ["none", "nodetool"],
    "pageLoaded": false,
    "iconAddress": document.querySelector("body").dataset.iconaddress,
    //Track state
    "renameMenuShowing":false,
    "contextMenuShowing":false,
    "traceInProgress": false,
    "hasRated": false
};

const jsonCopy = function(x){
    // Return a copy of x
    return JSON.parse(JSON.stringify(x));
};

//Declare global readonly variables for ESLint
/*global d3*/
/*global Model*/
/*global Victor*/

var m; //Holds the first machine. Primarily for debugging convenience.

Controller.init();

