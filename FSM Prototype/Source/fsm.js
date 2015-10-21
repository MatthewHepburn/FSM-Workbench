config = {
    displayNextOnCorrect: true, // Display an extra next button when a question is answered correctly.
    displayConstrainedLinkRename: true, //Give a list of options from the alphabet when renaming links, rather than presenting the user with a text field.
    showRenameOnLinkCreation: true,
    submitRenameOnBGclick: false
}

var display = {
    nodeRadius: 20,
    acceptingRadius: 14,
    askQuestion: function(){
        if (model.question.type == "none"){
            return;
        }
        var div = document.querySelector(".question");
        //Add forms if required by the question:
        if (model.question.type == "give-list"){
            document.getElementById("check-button").addEventListener("click", checkAnswer.giveList);
            document.querySelector(".qformblock").addEventListener("submit", function(event){event.preventDefault();checkAnswer.giveList();});
            if (model.question.prefill){
                for (key in model.question.prefill){
                    d3.select("#qf" + key).attr("value", model.question.prefill[key])
                }
            }
            return;
        }
        if (model.question.type == "satisfy-list"){
            var table = "<div class='table-div'><table class='qtable'><tr><th>Accept</th><th class='table-space'> </th><th>Reject</th><th class='table-space'> </th></tr>";
            var accLength = model.question.acceptList.length;
            var rejLength = model.question.rejectList.length;
            var nRows = Math.max(model.question.acceptList.length, model.question.rejectList.length);
            for (i = 0; i < nRows; i++){
                table += "<tr>";
                // Build html for element i of the acceptList
                var parsedInput;
                var string;
                if (i < accLength){
                    parsedInput = JSON.stringify(model.parseInput(model.question.acceptList[i], model.question.alphabetType == "char"));
                    string = "<a class='trace-link' onclick='javascript:display.showTrace(" + parsedInput + ");'>'" + model.question.acceptList[i] + "'</a>";
                    table += "<td id=td-acc-" + i + "'>" + string + "</td><td id=\'td-acc-adj-" + i +"'> </td>";
                } else {
                    table += "<td></td><td></td>";
                }
                // Build html for element i of the rejectList
                if (i < rejLength){
                    parsedInput = JSON.stringify(model.parseInput(model.question.rejectList[i], model.question.alphabetType == "char"));
                    string = "<a class='trace-link' onclick='javascript:display.showTrace(" + parsedInput + ");'>'" + model.question.rejectList[i] + "'</a>";
                    table += "<td id=td-rej-" + i + "'>" + string + "</td><td id=\'td-rej-adj-" + i +"'> </td></tr>";
                } else {
                    table += "<td></td></tr>";
                }
            }
            table += "</table>";
            document.querySelector(".question-text").insertAdjacentHTML("afterEnd", table)
            document.getElementById("check-button").addEventListener("click", checkAnswer.satisfyList);
            return;
        }
        if (model.question.type == "satisfy-definition"){
            document.getElementById("check-button").addEventListener("click", checkAnswer.satisfyDefinition);
            return;
        }
        if (model.question.type == "satisfy-regex"){
            document.getElementById("check-button").addEventListener("click", checkAnswer.satisfyRegex)
        }

        if (model.question.type == "select-states"){
            document.getElementById("check-button").addEventListener("click", checkAnswer.selectStates)
            model.selected = [];
            // Enable the selection of states.
            // Need to wait until nodes are created to register event handlers.
            var f = function(){
                if (loaded){
                    d3.selectAll(".node").on("click", model.toggleSelectedNode);
                } else {
                    setTimeout(f, 100);
                }
            };
            setTimeout(f, 100);
            return;
        }
        if (model.question.type == "does-accept"){
            var str;
            var html = "<table id = 'does-accept-table'><tbody>"
            for (i = 0; i < model.question.strList.length; i++){
                str = model.question.strList[i]
                html += '<tr class="does-accept-cb"><td><input class="does-accept-cb" type="checkbox" value="' + str + '">' + str + '</td><td class="table-space"> </td><td id="feedback-'+ i +'"></td></tr>'
            }
            html += "</tbody></table>"
            document.querySelector(".question-text").insertAdjacentHTML("afterEnd", html);
            document.getElementById("check-button").addEventListener("click", checkAnswer.doesAccept);

        }
        if (model.question.type == "demo"){
            var html = "<div id='demo-div'>"
            // Create buttons for the user to provide the machine with input
            for (var i = 0; i< model.question.alphabet.length; i++){
                var inChar = model.question.alphabet[i]
                html += "<button id='demo-" + inChar +"' class='demo-button pure-button' type='submit'>"+inChar+"</button>"
            }
            html += "<button id='demo-reset' class='demo-button pure-button' type='submit'>Reset</button>"
            document.querySelector(".question-text").insertAdjacentHTML("afterEnd", html);
            // Add an event listener to each button
            document.getElementById("demo-reset").addEventListener("click", controller.demoReset);
            for(i = 0; i < model.question.alphabet.length; i++){
                var inChar = model.question.alphabet[i];
                document.getElementById("demo-"+inChar).addEventListener("click", eventHandler.demoButton)
            }

        }

    },
    dismissTrace: function(){
        //First, remove controls + displayed input
        d3.select(".machine-input").remove();
        d3.select(".tracecontrols").remove();
        //Remove highlight + dim classes:
        d3.selectAll(".highlight").classed("highlight", false);
        d3.selectAll(".dim").classed("dim", false);
        //Restore nodes to their initial colours:
        d3.selectAll(".node")
            .style("fill", function(d){
                return colors(d.id);
            });
    },
    drawControlPalette: function(){
        var bwidth = 40; //button width
        var strokeWidth = 2;
        var margin = 10;
        var g = svg.append("g")
                    .classed("controls", true);
        var tools = ["nodetool", "linetool","texttool", "acceptingtool", "deletetool"];
        var tooltips = {
            nodetool:"Create new states",
            linetool:"Link states together",
            texttool:"Change link inputs and rename states",
            acceptingtool:"Toggle whether states are accepting",
            deletetool: "Delete links and states"
        };
        // create a button for each tool in tools
        for (var i = 0; i < tools.length; i++){
            g.append("image")
                .attr("x", 0.5 * margin)
                .attr("y", 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", "img/Icons/"+ tools[i] +".svg")
                .attr("class", "control-img");
            g.append("rect")
                .attr("width", bwidth)
                .attr("height", bwidth)
                .attr("x", 0)
                .attr("y", i * bwidth)
                .attr("fill", "#101010")
                .attr("fill-opacity", 0)
                .attr("style", "stroke-width:" + strokeWidth +";stroke:rgb(0,0,0)")
                .classed("control-rect", true)
                .attr("id", tools[i])
                .on("click", eventHandler.toolSelect)
                .append("svg:title").text(tooltips[tools[i]]);
        }
        // Define a gradient to be applied when a button is selected:
        var grad = d3.select("defs").append("svg:linearGradient")
            .attr("id", "Gradient1")
            .attr("x1", "0")
            .attr("x2", "1")
            .attr("y1", "0")
            .attr("y2", "1")

        grad.append("svg:stop")
            .attr("offset", "0%")
            .attr("stop-color", "black")
            .attr("stop-opacity", 0.7)

        grad.append("svg:stop")
            .attr("offset", "65%")
            .attr("stop-color", "black")
            .attr("stop-opacity", 0.1)


    },
    drawTraceControls: function(){
        var bwidth = 40; //button width
        var strokeWidth = 2;
        var margin = 10;
        var g = svg.append("g")
                    .classed("tracecontrols", true);
        var tools = ["rewind", "back", "forward", "stop"];
        // create a button for each tool in tools
        for (var i = 0; i < tools.length; i++){
            g.append("image")
                .attr("y",  4 * height/5 +  0.5 * margin)
                .attr("x", (width/2) - (0.5 * bwidth * tools.length ) + 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", "img/Icons/trace-"+ tools[i] +".svg")
                .attr("class", "control-img");
            g.append("rect")
                .attr("width", bwidth)
                .attr("height", bwidth)
                .attr("x", (width/2) - (0.5 * bwidth * tools.length ) + (i * bwidth))
                .attr("y", 4 * height/5)
                .attr("fill", "#101010")
                .attr("fill-opacity", 0)
                .attr("style", "stroke-width:" + strokeWidth +";stroke:rgb(0,0,0)")
                .classed("tracecontrol-rect", true)
                .attr("id", tools[i])
                .on("click", eventHandler.traceControl);
        }
    },
    createLinkContextMenu: function(canvas, id, mousePosition) {
        //TODO - prevent context menus from appearing off the side of the canvas
        var html = "<p data-id='" + id + "' class = 'button changeconditions'>Change Conditions</p>";
        html += "<p data-id='" + id + "' class = 'button deletelink'>Delete Link</p>";

        var menu = canvas.append("foreignObject")
            .attr("x", mousePosition[0])
            .attr("y", mousePosition[1])
            .attr("width", "260em")
            .attr("height", "55em")
            .classed("context-menu-holder", true)
            .append("xhtml:div")
            .attr("class", "contextmenu")
            .html(html);

        d3.select(".changeconditions").on("click", function(){display.renameLinkForm(id);});
        d3.select(".deletelink").on("click", function(d){model.deleteLink(id); display.dismissContextMenu();});

        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault();
        });
    },
    createStateContextMenu: function(canvas, id, mousePosition) {
        var html = "<p data-id='" + id + "' class = 'button toggleaccepting'>Toggle Accepting</p>";
        html += "<p data-id='" + id + "' class = 'button renamestate'>Rename State</p>";
        if (id != 0){
            // Do not add delte button to node 0 as deleting it is not allowed
            html += "<p data-id='" + id + "' class = 'button deletestate'>Delete State</p>";
        }

        var menu = canvas.append("foreignObject")
            .attr("x", mousePosition[0])
            .attr("y", mousePosition[1])
            .attr("width", "260em")
            .attr("height", "55em")
            .classed("context-menu-holder", true)
            .append("xhtml:div")
            .attr("class", "contextmenu")
            .html(html);

        d3.select(".toggleaccepting").on("click", function(){model.toggleAccepting(id);});

        d3.select(".renamestate").on("click", function(){display.renameStateForm(id);});

        if (id != 0){
            d3.select(".deletestate").on("click", function(){model.deleteNode(id); display.dismissContextMenu();});
        }


        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault();
        });
    },
    dismissContextMenu: function() {
        d3.select(".contextmenu").remove();
        d3.select(".context-menu-holder").remove();
        contextMenuShowing = false;
    },
    dismissRenameMenu: function() {
        d3.select(".rename").remove();
        renameMenuShowing = false;
    },
    drawInput: function(){
        // Displays the current input, used to draw the trace.
        var g = svg.append("g")
            .attr("class", "machine-input");
        if (model.question.type != "demo"){
            if (model.fullInput.length < 10){
                display.colour = d3.scale.category10();
            } else{
                display.colour = d3.scale.category20b();
            }
        } else {
            //Only use black letters for demo mode
            display.colour = d3.scale.ordinal().domain(["#000000"])
        }
        var totalInputLength = 0; //No need to account for spaces
        for (var i = 0; i < model.fullInput.length; i++){
            totalInputLength += model.fullInput[i].length;
        }
        var y = 70;
        var charWidth = 25; // Rough estimate -TODO align precisely
        var inWidth = totalInputLength * charWidth;
        var x = width/2 - (inWidth/2);
        for (i = 0; i < model.fullInput.length; i++){
            g.append("text")
                .text(model.fullInput[i])
                .style("fill", d3.rgb(display.colour(i)).toString())
                .classed("input", true)
                .attr("id", "in"+i)
                .attr("x", x)
                .attr("y", y);
            // use bounding box to figure out how big the element is:

            x = x + (document.querySelector("#in"+i).getBBox().width) + 20;
            // Add comma to all but last element.
            if (i == model.fullInput.length - 1){
                continue;
            } else {
                g.append("text")
                    .text(",")
                    .classed("input-comma", true)
                    .attr("id", "in-comma"+i)
                    .attr("x", x -  20)
                    .attr("y", y);
            }
        }
    },
    drawStart: function(x, y) {
        var length = 200;
        var start = String((x - length) + "," +y);
        var end = String(x + "," + y);
        svg.append("svg:path")
            .attr("class", "link start")
            .attr("d", "M" + start + " L" + end);

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
        var m1y = c1y + 0.5 * vy;

        // Define strings to use to define the path
        var P1 = x1 + "," + y1;
        var M1 = m1x + "," + m1y;
        var P2 = x2 + "," + y2;
        var C1 = c1x + "," + c1y;
        var C2 = c2x + "," + c2y;

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
        var M = midx + "," + midy;
        var P2 = x2 + "," + y2;

        return ("M" + P1 + " L" + M + " L" + P2);
    },
    getLinkLabelPosition: function(x1, y1, x2, y2, isBezier) {
        //Function takes the location of two nodes (x1, y1) and (x2, y2) and
        //returns a suitable position for the link between them.

        //test if link is reflexive (not necessarily 100% accurate, but good enough)
        if (x1 == x2 && y1 == y2){
            return {
                x: x1,
                y: y1 - 75,
                rotation: 0
            };
        }

        var cx = 0.5 * (x1 + x2);
        var cy = 0.5 * (y2 + y1);

        //Find vector V from P1 to P2
        var vx = x2 - x1;
        var vy = y2 - y1;

        // Find suitable offset by getting a vector perpendicular to V
        var vpx = -1 * vy;
        var vpy = vx;

        //find angle of the line relative to x axis. From -180 to 180.
        var angle = (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI);
        if (Math.abs(angle) > 90) {
            angle = angle - 180; //don't want text upside down
        }

        var scale;
        if (!isBezier) {
            scale = 0.11;
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        } else {
            scale = 0.21;
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        }
    },
    highlightLinks: function(linkIDs){
        // Clear existing highlights
        d3.selectAll(".link").classed("highlight", false);
        if (!linkIDs){
            return;
        }
        for (var i = 0; i < linkIDs.length; i++){
            d3.select("#link" + linkIDs[i]).classed("highlight", true);
        }
    },
    highlightCurrentStates: function(){
        // Highlights the state(s) the machine is currently in
        // Clear existing state highlights
        d3.selectAll(".node").classed("highlight", false).classed("dim", true);
        for (var i = 0; i< model.currentStates.length; i++){
            d3.select("[id='"+ model.currentStates[i] +"']").classed("highlight", true).classed("dim", false);

        }
    },
    reflexiveLink: function (x, y) {
        // Create two segments, meeting at the top, to allow placement of arrowheads
        // Note this is not needed for arrowheads to display in Chrome, but based on the specification this may be a bug in Chrome.
        var x1 = x - 10;
        var y1 = y + 5;

        var P1 = x1 + "," + y1;

        var x2 = x
        var y2 = y - 22.9129 - 20
        var x3 = x + 10;
        var y3 = y1;

        var P2 = x2 + "," + y2;
        var P3 = x3 + "," + y3;

        var rad = 25;

        var str = "M" + P1 + " A" + rad + " " + rad + " 0 0 1 " + P2;
        str += "  A" + rad + " " + rad + " 0 0 1 " + P3;
        return str;


    },
    renameLinkForm: function(id) {
        if (renameMenuShowing) {
            display.dismissRenameMenu();
        }
        //Get the data associated with the link
        var d = query.getLinkData(id);

        var current = String(d.input);
        if (current == undefined) {
            current = "";
        }

        //Calculate the position to put the form
        var labelPos = display.getLinkLabelPosition(d.source.x, d.source.y, d.target.x, d.target.y, query.isBezier(id));
        var formX = labelPos.x - 40;
        var formY = labelPos.y + 15;

        if (config.displayConstrainedLinkRename){
            // Draw a rename form with checkboxes
            var alphabet = model.question.alphabet
            //'lcon' for link-constrained:
            var html = '<form class="renameinput checkboxrename" action="" id = lcon' + id + '>'
            var isChecked;
            var outChar;
            for (var i = 0; i < alphabet.length; i++){
                isChecked = d.input.indexOf(alphabet[i]) != -1

                html += '<input type="checkbox" name="input" value="' + alphabet[i] + '"'
                if (isChecked){
                    html += "checked"
                }
                html += '>' + alphabet[i]
                if (model.question.isTransducer){
                	var currentOut = query.getOutput(d, alphabet[i])
                	html += ' <select id="out-' + alphabet[i] + '"><option value="">No Output</option>'
                	for (var j = 0; j < model.question.outAlphabet.length; j++){
                		outChar = model.question.outAlphabet[j]
                		if (outChar == currentOut){
                			html += '<option selected="selected" value="' + outChar +'">' + outChar + '</option>'
                		}else{
                			html += '<option value="' + outChar +'">' + outChar + '</option>'
                		}

                	}
                	html += "</select><br>"
                }else{
                	html += '<br>'
                }
            }
            html += '<a class="pure-button" id="constrainedrenamesubmit">OK</a></form>'

            svg.append("foreignObject")
                .attr("width", 300)
                .attr("height", 35 + 22 * alphabet.length)
                .attr("x", formX - 40)
                .attr("y", formY)
                .attr("class", "rename")
                .append("xhtml:body")
                .html(html)
            document.getElementById("constrainedrenamesubmit").addEventListener("click", controller.renameSubmit)

        } else {
            // create a text field over the targeted node
            svg.append("foreignObject")
                .attr("width", 80)
                .attr("height", 50)
                .attr("x", formX)
                .attr("y", formY)
                .attr("class", "rename")
                .append("xhtml:body") //'ltxt' for link-text
                .html("<form onkeypress='javascript:return event.keyCode != 13;'><input onsubmit='javascript:return false;' class='renameinput' id='ltxt" + id + "' text-anchor='middle' type='text' size='2', name='link conditions' value='" + current + "'></form>");

            // give form focus
            document.getElementById("ltxt" + id).focus();
        }




        renameMenuShowing = true;
        display.dismissContextMenu();
    },
    renameStateForm: function(id) {
        if (renameMenuShowing) {
            display.dismissRenameMenu();
        }
        var d = query.getNodeData(id);
        var currentName = d.name;
        if (currentName == undefined) {
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
            .html("<form onkeypress='javascript:return event.keyCode != 13;'><input class='renameinput' id='node" + id + "' type='text' size='1' maxlength='5' name='state name' value='" + currentName + "'></form>");

        // give form focus
        document.getElementById("node" + id).focus();

        renameMenuShowing = true;
        display.dismissContextMenu();
    },
    resetTrace: function(){
        // Resets the display of a trace to the initial position
        // Resetting the model is handled separatly in model.resetTrace()
        d3.selectAll(".node").classed("dim", true);
        d3.select("[id='0']")
            .classed("dim", false)
            .classed("highlight", true)
            .attr("style","fill: rgb(44, 160, 44); stroke:rgb(0,0,0);");
        // Undim & unhighlight the machine input.
        d3.selectAll(".input")
            .classed("dim", false)
            .classed("highlight", false)
            .attr("transform", "");
        d3.selectAll(".input-comma")
            .classed("dim", false);
        // Highlight the first input element
        d3.select("#in0").classed("highlight", true);
        //Highlight any other nodes that could be current due to ε transitions
        for (var i = 0; i < model.currentStates.length; i++){
            var id = model.currentStates[i];
            if (id == 0){
                continue;
            }
            else{
                d3.select("[id='"+id+"']")
                    .classed("dim", false)
                    .classed("highlight", true)
                    .attr("style","fill: rgb(44, 160, 44); stroke:rgb(0,0,0);");
            }
        }

    },
    showTrace: function(input){
        // Takes input in form ['a', 'b', 'c']
        display.dismissTrace();
        traceInProgress = true;
        model.fullInput = JSON.parse(JSON.stringify(input));
        model.resetTrace();
        d3.selectAll(".node").classed("dim", true);
        if (model.question.type != "demo"){
            display.drawInput();
            display.drawTraceControls();}
        display.resetTrace();
    },
    toggleSelectedNode: function(id){
        var node = d3.select("[id = '" + id + "']");
        node.classed("qselect", !node.classed("qselect"));
    },
    traceStep: function(autoPlay, backward){
        traceStepInProgress = true;
        if (backward && model.currentStep == 0){
            traceStepInProgress = false;
            return;
        }
        if (!backward && model.currentStates.length == 0){
            return;
        }
        d3.selectAll(".dim").classed("dim", false);
        d3.selectAll(".node").classed("dim", true);
        d3.selectAll(".highlight").classed("highlight", false);
        var i = model.currentStep + 1;
        if (!backward){
            if (model.currentInput.length != 0 && model.currentStates.length != 0){
                var linksUsed = model.step()
                display.highlightLinks(linksUsed)
                model.traceRecord[model.currentStep] = {
                    states: JSON.parse(JSON.stringify(model.currentStates)),
                    currentInput: JSON.parse(JSON.stringify(model.currentInput)),
                    linkIDs:linksUsed
                };
                if (autoPlay){
                    setTimeout(function(){display.traceStep(true);}, 3000);
                }
            }
            else {
                traceInProgress = false;
                traceStepInProgress = false;
                return;
            }
        }
        else {
            if (model.traceRecord.length == 0){
                traceStepInProgress = false;
                return;
            }
            var record = model.traceRecord[model.currentStep -1];
            model.currentStates = record.states;
            model.currentInput = JSON.parse(JSON.stringify(record.currentInput));
            model.currentStep = model.fullInput.length - model.currentInput.length;
            var linksUsed = record.linkIDs
            display.highlightLinks(linksUsed)
            d3.select("#in-comma" + (i-1))
                .classed("dim", true);
            for (var j = i; j < model.fullInput.length; j++){
                d3.select("#in" + j)
                    .transition()
                    .duration(50)
                    .attr("transform", "translate(0, 0)");
            }
        }



        //Dim all previous input letters that have been consumed
        var index = model.fullInput.length - model.currentInput.length;
        for (var k = 0; k < index; k++){
            d3.select("#in" + k)
                .classed("highlight", false)
                .classed("dim", true)
                .transition().duration(1000)
                .attr("transform", "translate(0, 1000)");
            d3.select("#in-comma" + k)
                .classed("dim", true);
        }

        for (k = 0; k < model.currentStates.length; k++){
            var stateID = model.currentStates[k];
            d3.select("[id='" + stateID + "']")
                .classed("dim", false)
                .classed("highlight", true)
                .attr("style","fill: " + d3.rgb(display.colour(i -1)).toString() +"; stroke:rgb(0,0,0);");
        }

        if (backward && model.currentStep == 0){
            traceStepInProgress = false;
            return;
        }

        // check if most recent letter was consumed:
        if (!backward && model.currentStates.length > 0){
            d3.select("#in" + (i -1))
                .classed("dim", true)
                .classed("highlight", false)
                .transition().duration(1000)
                .attr("transform", "translate(0, 1000)");
            d3.select("#in-comma" + (i-1))
                .classed("dim", true);
            d3.select("#in" + i).classed("highlight", true);
        } else {
            var x = document.querySelector("#in"+(i-1)).getBBox().x;
            d3.select("#in" + (i-1))
                .classed("rejected", true)
                .transition()
                .duration(100)
                .attr("x", x + 10)
                .each("end", function(){
                    d3.select(this)
                        .transition()
                        .duration(120)
                        .attr("x", x - 10)
                        .each("end", function(){
                            d3.select(this)
                                .transition()
                                .duration(100)
                                .attr("x", x);
                        });
                });
            d3.select("#in-comma" + (i-1))
                .classed("dim", false);
        }
        traceStepInProgress = false;
        return;
    },
    showNextButton: function(){
        if (document.querySelector(".extra-next") != null){
            return;
        }
        var nextURL = document.getElementById("nav-next").href;
        var checkButton = document.getElementById("check-button")
        var buttonHTML = "<a href='" + nextURL + "' class= 'extra-next";
        // Copy classes of check button, as some question types use different display methods
        // TODO - standardise this: make all use a button-div?
        for (var i = 0; i < checkButton.classList.length; i++){
            buttonHTML += " " + checkButton.classList[i];
        }
        buttonHTML += "'>Next</a>";
        var siblings = checkButton.parentNode.children
        var lastSibling = siblings[siblings.length - 1];
        lastSibling.insertAdjacentHTML("afterend",buttonHTML);

    },
    updateLinkLabel:function(linkID){
        label = svg.select("#linklabel" + linkID);
        label.text(function(d) {
            //Funtion to turn array of symbols into the label string
            if (d.input.length == 0) {
                return "";
            } else {
                var labelString = "";
                for (var i = 0; i < d.input.length; i++) {
                	var inchar = d.input[i]
                	if (model.question.isTransducer){
                		var outchar = ""
                		for (var j = 0; j < d.output.length; j++){
                			if (d.output[j][0] == inchar){
                				var outchar = ":" + d.output[j][1];
                				break;
                			}
                		}
                		labelString += inchar + outchar + ", ";
                	} else {
                		labelString += inchar + ", ";
                	}

                }
                return labelString.slice(0,-2);
            }
        });
    }
};

var model = {
    toolMode: "none",
    nodes: {},
    links: {},
    editable: true,
    options: {},
    currentStates: [0], //IDs of state(s) that the simulation could be in. Initially [0], the start state.
    currentStep: 0,
    traceRecord:[],
    currentOutput:"",
    fullInput: ["a", "a"], // The complete input the machine is processing, this should not be changed during simulation.
    currentInput: ["a", "a"], // This will have symbols removed as they are processed.
    accepts: function(input){
        // Given input in the form ["a", "b", "c"], determines if the current machine accepts it.
        // NOTE: this resets the model variables.
        // Use JSON.parse/JSON.stringify as native deep-copy
        model.fullInput = JSON.parse(JSON.stringify(input));
        model.currentInput = JSON.parse(JSON.stringify(input));
        model.currentStates = [0];
        model.doEpsilonTransitions()
        // Simulate until input is consumed
        while (this.currentInput.length > 0){
            if (this.currentStates == []){
                return false;
            }
            this.step();
        }
        // When input is consumed, check if any of the current states are accepting;
        for (var i = 0; i < this.currentStates.length; i++){
            var state = query.getNodeData(this.currentStates[i]);
            if (state.accepting){
                return true;
            }
        }
        return false;
    },
    deleteLink: function(id){
        // Check that editing is allowed.
        if (model.editable == false){
            return;
        }
        for (var i = 0; i < model.links.length; i++){
            if (model.links[i].id == id){
                model.links.splice(i, 1);
                selected_link = null;
                d3.select("#linklabel"+id).remove();
                d3.select("#linkpad" + id).remove();
                linkLabels.exit().remove();
                restart();
                return;
            }
        }
        model.setMaxIDs()

    },
    deleteNode: function(id){
        // Check that editing is allowed and that node0 is not target:
        if (model.editable == false || id == 0){
            return;
        }
        var node = query.getNodeData(id);
        model.nodes.splice(model.nodes.indexOf(node), 1);
        var toSplice = model.links.filter(function(l) {
            return (l.source === node || l.target === node);
        });
        //Use j to avoid closure strangeness - i gets overwritten by model.deleteLink
        // TODO - check if this is still true^
        for (var j = 0; j < toSplice.length; j++){
            model.deleteLink(toSplice[j].id);
        }
        selected_node = null;
        model.setMaxIDs()
        restart();
    },
    doEpsilonTransitions: function(){
        //Adds all states linked to by a transition accepting ε to model.currentStates
        //Return the links used.
        var transitionMade = true;
        var linkIDs = [];
        while (transitionMade == true){ //Search every link until no more transitions are made. Not efficient but sufficient.
            transitionMade = false;
            for (var i = 0; i < model.currentStates.length; i++){
                var stateID = model.currentStates[i];
                for (var j in model.links){
                    var link = model.links[j];
                    if(link.source.id == stateID){// See if link starts from currently considered node.
                        if (link.input.indexOf("ε") > -1){ // See if this is an epsilon transition.
                            linkIDs.push(link.id);
                            //Add link target to newStates if it isn't there already
                            if (model.currentStates.indexOf(link.target.id) == -1){
                                model.currentStates.push(link.target.id);
                                transitionMade = true;
                            }
                        }
                    }
                }
            }
        }
        return linkIDs

    },
    generateDefinition: function(){
        //Outputs a formal definition of the current model, in the form used by satisfy-definition questions.
        var definition={}
        var nodes = [];
        for (var i = 0; i < model.nodes.length; i++){
            if (model.nodes[i] == undefined){
                continue;
            }
            nodes.push(model.nodes[i].name);
        }
        definition.nodes = nodes;

        var accepting = [];
        for (i = 0; i < model.nodes.length; i++){
            if (model.nodes[i].accepting){
                accepting.push(model.nodes[i].name);
            }
        }
        definition.accepting = accepting;

        var initial = query.getNodeData(0).name;
        definition.initial = initial;

        var links = [];
        for (i = 0; i < model.links.length; i++){
            var link = model.links[i];
            for (var j = 0; j < link.input.length; j++){
                var thisLink = {
                    source: link.source.name,
                    target: link.target.name,
                    input: link.input[j]
                };
                links.push(thisLink);
            }
        }
        definition.links = links
        /*eslint-disable */
        console.log(JSON.stringify(JSON.stringify(definition)));
        /*eslint-enable */
    },
    generateJSON: function(){
        var nodesStr = "data-nodes='" + JSON.stringify(model.nodes) + "'";

        //create a clone of model.links. VERY hacky but apparantly not bad for efficiency
        var linksTmp = JSON.parse(JSON.stringify(model.links));
        //change source + target of links to be node IDs:
        for (var i = 0; i < linksTmp.length; i++){
            linksTmp[i].source = linksTmp[i].source.id;
            linksTmp[i].target = linksTmp[i].target.id;
        }
        var linksStr = "data-links='" + JSON.stringify(linksTmp) + "'";
        var questionStr = "data-question='" + JSON.stringify(model.question) + "'";
        /*eslint-disable */
        console.log(nodesStr);
        console.log(linksStr);
        console.log(questionStr);
        /*eslint-enable */



    },
    generateJSON2: function(){
        //Generates JSON in the format of questions.JSON
        var nodesStr = JSON.stringify(model.nodes);
        nodesStr = '"data-nodes": "' + nodesStr.replace(/"/g, '\\"') + '"';


        // Create a copy of model.links to replace the source + target objects with node IDs
        var linksTmp = JSON.parse(JSON.stringify(model.links));
        for (var i = 0; i < linksTmp.length; i++){
            linksTmp[i].source = linksTmp[i].source.id;
            linksTmp[i].target = linksTmp[i].target.id;
        }
        var linkStr = JSON.stringify(linksTmp);
        linkStr = '"data-links": "' + linkStr.replace(/"/g, '\\"')+ '"';
        var questionStr = JSON.stringify(model.question);
        questionStr = '"data-question": "' + questionStr.replace(/"/g, '\\"')+ '"';
        var optionsStr = JSON.stringify(model.options);
        optionsStr = '"data-options": "' + optionsStr.replace(/"/g, '\\"')+ '"';
        var out = nodesStr + ", " + linkStr + ", " + questionStr + ", " + optionsStr;
        return out;
    },
    generateJSON3:function(){
        // Generates JSON for use by edit.js
        // Create a copy of model.links to replace the source + target objects with node IDs
        var linksTmp = JSON.parse(JSON.stringify(model.links));
        for (var i = 0; i < linksTmp.length; i++){
            linksTmp[i].source = linksTmp[i].source.id;
            linksTmp[i].target = linksTmp[i].target.id;
        }
        return {
            "data-nodes":JSON.stringify(model.nodes),
            "data-links":JSON.stringify(linksTmp)
        }

    },
    parseInput: function(string, isCharType){
        // Given a string 'abc', return input in form ['a', 'b', 'c'] if charType
        // or given a string 'stop start go', return input in form ['stop', 'start', 'go']
        if (isCharType){
            return string.split("");
        } else {
            return string.split(/\ |,\ |,/);
        }

    },
    resetTrace: function(){
        model.currentInput = JSON.parse(JSON.stringify(model.fullInput));
        model.currentStates = [0];
        model.currentOutput = "";
        model.doEpsilonTransitions();
        model.currentStep = 0;
        model.traceRecord = [{states:[0], currentInput: JSON.parse(JSON.stringify(model.fullInput))}];
    },
    readJSON: function(){
        // Need to read in nodes + links separately as links refer directly to nodes
        var body = document.querySelector(".canvas");
        model.nodes = JSON.parse(body.dataset.nodes);
        model.links = JSON.parse(body.dataset.links);
        if (body.dataset.question != undefined){
            model.question = JSON.parse(body.dataset.question);
        } else{
            model.question = {type:"none"};
        }

        // Turn IDs in model.links into references to the nodes they refer to.
        // Also set the lastLinkID used.
        var maxLinkID = 0;
        for(var i = 0; i < model.links.length; i++){
            var link = model.links[i];
            if (link.id > maxLinkID){
                maxLinkID = link.id;
            }
            link.source = query.getNodeData(link.source);
            link.target = query.getNodeData(link.target);
        }
        model.lastLinkID = maxLinkID;

        // Set lastNodeID:
        model.setMaxIDs()

        // Read in options
        if (body.dataset.options != undefined){
            var options = JSON.parse(body.dataset.options);
            model.options = options;
            if (options.nodeRadius != undefined){
                display.nodeRadius = options.nodeRadius;
            }
            if (options.acceptingRadius != undefined){
                display.acceptingRadius = options.acceptingRadius;
            }
            if (options.constrainRename != undefined){
                config.displayConstrainedLinkRename = options.constrainRename;
            }
        }
        return true;

    },
    setMaxIDs: function(){
        // Set lastNodeID:
        var maxNodeID = 0;
        for (var i = 0; i < model.nodes.length; i++){
            if (model.nodes[i].id > maxNodeID){
                maxNodeID = model.nodes[i].id;
            }
        }
        model.lastNodeID = maxNodeID;

        //set lastLinkID:
        var maxLinkID = 0;
        for (i = 0; i < model.links.length; i++){
            if (model.links[i].id > maxLinkID){
                maxLinkID = model.links[i].id;
            }
        }
        model.lastLinkID = maxLinkID

    },
    setupQuestion: function(){
        // Function uses data in model.question to setup the question environment
        var types = ["satisfy-regex","deterministic-satisfy-regex","satisfy-list","deterministic-satisfy-list","give-regex",
                    "give-list","select-states","convert-nfa", "does-accept", "satisfy-definition", "demo", "none"];
        if (types.indexOf(model.question.type) == -1){
            alert(model.question.type + " is not a valid question type.");
            return;
        }
        // Set editable flag:
        if (["give-list", "select-states", "does-accept", "demo"].indexOf(model.question.type) != -1){
            model.editable = false;
        } else {
            model.editable = true;
        }
        // Stop here if type is "none"
        if (model.question.type == "none"){
            return;
        }
        display.askQuestion(model.question.text);
    },
    step: function(){
        // Perfoms one simulation step, consuming the first symbol in currentInput and updating currentStates.
        // Returns a list of the ids of links used in this step.
        var curSymbol = model.currentInput.shift();
        // Remove any whitespace:
        curSymbol = curSymbol.replace(/ /g,"");
        var newStates = [];
        var linkIDs = [];

        for (var i = 0; i < model.currentStates.length; i++){
            var stateID = model.currentStates[i];  // For every state in currentStates, test every link.
            for (var j in model.links){
                var link = model.links[j];
                if(link.source.id == stateID){// See if link starts from currently considered node.
                    if (link.input.indexOf(curSymbol) > -1){ // See if this transition is legal.
                        linkIDs.push(link.id);
                        //Add link target to newStates if it isn't there already
                        if (newStates.indexOf(link.target.id) == -1){
                            newStates.push(link.target.id);
                        }
                    }
                }
            }
        }
        model.currentStates = newStates;
        if (model.question.isTransducer && linkIDs.length == 1 && query.isDeterministic()){
        	model.currentOutput += query.getOutput(query.getLinkData(linkIDs[0]), curSymbol)
        }
        linkIDs = linkIDs.concat(model.doEpsilonTransitions());
        model.currentStep++;

        return linkIDs;
    },
    toggleAccepting: function(id) {
        //Check editing is allowed:
        if (model.editable == false){
            return;
        }
        // Change state in nodes
        var state = query.getNodeData(id);
        //Remove concentric ring if we are toggling off:
        if (state.accepting) {
            d3.selectAll("#ar" + id).remove();
        }
        state.accepting = !state.accepting;
        //Dismiss the context menu
        display.dismissContextMenu();

        // Update is now needed:
        restart();
    },
    toggleSelectedNode: function() {
        var id = d3.event.target.id;
        var node = query.getNodeData(id);
        if (model.selected.indexOf(node) == -1){
            model.selected.push(node);
        } else {
            model.selected.splice(model.selected.indexOf(node), 1);
        }
        display.toggleSelectedNode(id);
    }
};

var query = {
    getLinkData: function(id) {
        var d;
        for (var i in model.links) {
            if (model.links[i].id == id) {
                d = model.links[i];
                break;
            }
        }
        if (d == undefined) {
            alert("Error in query.getLinkData - link id not found");
        }
        return d;
    },
    getOutput: function(link, input){
    	if(!link.output){
    		return "" //Catch case where output is not defined/falsey.
    	}
    	for (var i = 0; i< link.output.length; i++){
    		if (link.output[i][0] == input){
    			return link.output[i][1] //Otherwise search for matchin output and return the first result.
    		}
    	}
    	return ""

    },
    getLinksFromNode: function(node){
        var links = [];
        for (var l in model.links){
            if (model.links[l].source == node){
                links.push(model.links[l]);
            }
        }
        return links;
    },
    getNodeData: function(id){
        var d;
        // Don't use i here to avoid closure strangeness
        for (var n in model.nodes) {
            if (model.nodes[n].id == id) {
                d = model.nodes[n];
                break;
            }
        }
        if (d == undefined) {
            /*eslint-disable */
            console.log("Unexpected id =");
            console.log(id);
            alert("Error in query.getNodeData - nodeID '" + id + "' not found");
            /*eslint-enable */
        }
        return d;

    },
    getPaths: function(node, input, string, pathLength, returnList){
        // Recursively find all accepted paths through the current fsm of length <= pathLength
        if (model.question.alphabetType == "char"){
            var newString = string
            if (input != "ε"){
                newString += input;
            }
        } else {
            alert("TODO - implement symbol type in checkAnswer.satisfyRegex");
            return;
        }
        if (node.accepting){
            returnList.push(newString);
        }

        if (newString.length == pathLength){
            return returnList;
        }
        var links = query.getLinksFromNode(node);
        links.map(function(link){
            link.input.map(function(m){
                returnList = returnList.concat(query.getPaths(link.target, m, JSON.parse(JSON.stringify(newString)), pathLength, []));
            });
        });
        return returnList;
    },
    hasAcceptingState:function() {
        //Determine if the machine has at least one accepting state.
        for (var i = 0; i<model.nodes.length; i++){
            if (model.nodes[i].accepting){
                return true
            }
        }
        return false
    },
    isBezier: function(id) {
        // Determine if a given link is drawn as a curve. IE if there is link in the opposite direction

        // Get link data from link ID
        var d = query.getLinkData(id);

        var sourceId = d.source.id;
        var targetId = d.target.id;

        var exists = model.links.filter(function(l) {
            return (l.source.id === targetId && l.target.id === sourceId);
        })[0]; //True if link exists in other direction - from target to source.

        return exists;

    },
    isDeterministic: function() {
        // returns [true, ""] if the model is deterministic, [false, "reason"] if not
        for (var i = 0; i < model.nodes.length; i++){
            // For each node, get all links out of it
            var links = query.getLinksFromNode(model.nodes[i]);
            var symbolsSeen = [];
            for (var j = 0; j < links.length; j++){
                var link = links[j];
                for (var k = 0; k < link.input.length; k++){
                    var input = link.input[k];
                    var nodeName;
                    if (symbolsSeen.indexOf(input) != -1){
                        nodeName = model.nodes[i].name;
                        if (nodeName == undefined){
                            nodeName = "an unnamed node";
                        }
                        return [false, "There are two transitions out of " + nodeName + " for symbol '" + input + "'."];
                    }
                    if (input == "ε"){
                        nodeName = model.nodes[i].name;
                        if (nodeName == undefined){
                            nodeName = "an unnamed node";
                        }
                        return [false, "There is an epsilon transition from " + nodeName + "." ];
                    }
                    symbolsSeen.push(input);
                }
            }
        }
        return [true, ""];
    },
    getCopyForRegex: function(){
        //Return a deep copy of the current machine as an object with nodes and links properties
        //Replace the current inital state with a new state with an epsilon transition to the old state
        var copy = {}
        copy.nodes = JSON.parse(JSON.stringify(model.nodes))
        copy.links = JSON.parse(JSON.stringify(model.links));
        var getNodeByID = function(id){
            for (var j = 0; j < copy.nodes.length; j++){
                if (copy.nodes[j].id == id){
                    return copy.nodes[j]
                }
            }
        }
        var getExprFromInput = function(input){
            var expr = "(" + input[0];
            for (var i = 1; i < input.length; i++){
                expr += "|" + input[i]
            }
            expr += ")";
            return expr;
        }
        // Replace source and target objects with ids
        var newID = copy.nodes.length
        copy.nodes.push(JSON.parse(JSON.stringify(copy.nodes[0])))
        copy.nodes[newID].id = newID
        for (var i = 0; i < copy.links.length; i++){
            if (copy.links[i].source.id != 0){
                copy.links[i].source = getNodeByID(copy.links[i].source.id);}
            else{
                copy.links[i].source = getNodeByID(newID)
            }
            if (copy.links[i].source.id != 0){
                copy.links[i].target = getNodeByID(copy.links[i].target.id);}
            else{
                copy.links[i].target = getNodeByID(newID)
            }
            copy.links[i].expr = getExprFromInput(copy.links[i].input)
        }
        copy.links.push({expr: "", id: copy.links.length-1, source:getNodeByID(0),target:getNodeByID(newID), input:["ε"]})

        return copy;
    },

    getRegex2: function(){
        var getFreeLinkID = function(){
            var max = 0
            for (var i = 0; i < m.links.length; i ++){
                if (m.links[i].id > max){
                    max = m.links[i].id;
                }
            }
            return max + 1
        }

        var eliminateState = function(index){
            var node = m.nodes[index];
            var inLinks = [];
            var outLinks = [];
            var link;
            var toSplice = [];
            var reflexiveRegex = ""
            //Build lists of inlinks, outlinks and the reflexive regex. Remove links to/from the state from m.links
            for (var i = 0; i < m.links.length; i++){
                link = m.links[i]
                if (link.target.id == link.source.id && link.source.id == node.id ){
                    reflexiveRegex = "(" +  link.expr + ")*"
                    toSplice.push(link);
                    continue
                }
                if (link.source.id == node.id){
                    outLinks.push(JSON.parse(JSON.stringify(link)));
                    toSplice.push(link);
                    continue;
                }
                if (link.target.id == node.id){
                    inLinks.push(JSON.parse(JSON.stringify(link)));
                    toSplice.push(link);
                }
            }
            toSplice.map(function(l) {
                m.links.splice(m.links.indexOf(l), 1);
            });
            // For each possible inlink -> outlink pair, create a new link with the appropriate regex
            var inLink;
            var outLink;
            var newLink
            for(var inIndex = 0; inIndex < inLinks.length; inIndex++){
                inLink = inLinks[inIndex]
                for (var outIndex = 0; outIndex < outLinks.length; outIndex++){
                    outLink = outLinks[outIndex]
                    newLink = {target: outLink.target, source: inLink.source, expr:inLink.expr + reflexiveRegex + outLink.expr, id:getFreeLinkID()}
                    m.links.push(JSON.parse(JSON.stringify(newLink)))
                }
            }
            m.nodes.splice(index, 1)
        }


        //Using the state elimination method, construct a regex equivilant to the current machine.
        //Algorithm from http://courses.cs.washington.edu/courses/cse311/14sp/kleene.pdf
        var m = query.getCopyForRegex() // Operate on a copy of the machine
        // Create a new state that every other accepting state has an epsilon transition to.
        // Make all previously accepting states non-accepting

        //TODO, assign a correct new ID
        //TODO, enforce no empty links before checking.
        var acceptingID = m.nodes.length
        m.nodes.push({id: acceptingID, accepting: true})
        for (var i = 0; i < m.nodes.length-1; i++){
            if (!m.nodes[i].accepting){
                continue;
            }
            m.nodes[i].accepting = false;
            m.links.push({expr: "", source:m.nodes[i], target: m.nodes[m.nodes.length -1], input:["ε"]})
        }
        while (m.nodes.length > 2){
            eliminateState(1)
        }

        //Combine all links from start to end into a single regex
        var finalRegex = "(" + m.links[0].expr + ")"
        for (i = 1; i < m.links.length; i++){
            if (finalRegex[finalRegex.length-1] == "|"){
                finalRegex +=m.links[i].expr
            } else{
                finalRegex += "|(" + m.links[i].expr + ")"
            }

        }
        console.log(finalRegex)
        return m


    },
    getRegex: function(){
        // For each state, get a regex for the transition to itself. Empty string if state has no reflexive link
        var states = {};
        var links;
        var node;
        var i, j, k;
        var str;
        var reflexive;
        for (i = 0; i < model.nodes.length; i++){
            reflexive = null
            node = model.nodes[i];
            links = query.getLinksFromNode(node)
            for (j = 0; j < links.length; j++){
                if (links[j].target === node && links[j].input.length > 0){
                    reflexive = links[j];
                    break;
                }
            }
            if(reflexive === null){
                states[String(node.id)] = ""
            } else {
                str = "(" + reflexive.input[0]
                for (k = 1; k < reflexive.input.length; k++){
                    str += "|" + reflexive.input[k]
                }
                str += ")*"
                states[String(node.id)] = str;
            }
        }

        // For each accepting state, create a base regex:
        var regexes = {}
        for(i = 0; i < model.nodes.length; i++){
            if (!model.nodes[i].accepting){
                continue;
            }
            regexes[String(model.nodes[i].id)] = states[String(model.nodes[i].id)]
        }
        return regexes;

    },
    getMinimalDFA: function(){
        // create a copy to the current machine:
        var machine = {
            "nodes": JSON.parse(JSON.stringify(model.nodes)),
            "links": JSON.parse(JSON.stringify(model.links))
        }

        // Remove any unreachable states. First find all reachable states:
        var changed = true;
        var reachableIDs = [];
        var frontier = [0]
        var newfrontier = []
        var link
        while (changed){
            changed = false
            for (var i = 0; i < frontier.length; i++){
                var sourceID = frontier[i]
                for (var j = 0; j< machine.links.length; j++){
                    link = machine.links[j];
                    if (link.source.id == sourceID){
                        var targetID = link.target.id
                        if (reachableIDs.indexOf(targetID) == -1 && newfrontier.indexOf(targetID) == -1 && frontier.indexOf(targetID)== -1){
                            newfrontier.push(targetID);
                            changed = true
                        }
                    }
                }
            }
            reachableIDs = reachableIDs.concat(frontier)
            frontier = newfrontier
            newfrontier = []
        }
        //Then remove any state not appearring in reachableIDs:
        for (i = 0; i < machine.nodes.length; i++){
            if (reachableIDs.indexOf(machine.nodes[i].id) == -1){
                var nodeID = machine.nodes[i].id;
                machine.nodes.splice(i, 1);
                // And remove all links to/from it.
                for (j = 0; j < machine.links.length; j++){
                    link = machine.links[j]
                    if (link.source.id == nodeID || link.target.id == nodeID){
                        machine.links.splice(j, 1)
                    }
                }
            }
        }

        console.log(machine)
    }
};

var checkAnswer = {
    doesAccept: function(){
        var listLength = model.question.strList.length;
        var passed = true;
        var tableRows = document.querySelector("#does-accept-table tbody").children
        var isChecked;
        for (var i = 0; i < listLength; i++){
            // Test element i of strList
            isChecked = tableRows[i].firstChild.firstChild.checked
            var input = model.parseInput(model.question.strList[i], model.question.alphabetType == "char");
            var accepts = model.accepts(input);
            if (accepts == isChecked){
                document.querySelector("#feedback-"+i).innerHTML = "<img class ='x-check' src=img/Icons/check.svg>";
            } else {
                document.querySelector("#feedback-"+i).innerHTML = "<img class ='x-check' src=img/Icons/x.svg>";
                passed = false;
            }
        }
        if (passed && config.displayNextOnCorrect){
            display.showNextButton();
        }
        logging.sendAnswer(passed);

    },
    giveList: function(){
        //First, remove feedback from previous attempt:
        d3.selectAll(".feedback").remove();
        d3.selectAll(".correct").classed("correct", false);
        d3.selectAll(".incorrect").classed("incorrect", false);
        var forms = document.querySelectorAll(".qform");
        var answers = [];
        var allCorrect = true;
        loop1:
        for (var num = 0; num < forms.length; num++){
            // Needed to avoid JS closure strangeness
            var i = num;
            answers[i] = forms[i].value;
            // Handle string parsing differently for char/symbol modes:
            if (model.question.alphabetType == "symbol"){
                answers[i] = answers[i].split(",");
            } else {
                answers[i] = answers[i].split("");
            }
            //ignore empty fields:
            if (answers[i].length == 0){
                allCorrect = false;
                continue;
            }

            // Check that the answer is the correct length
            if (answers[i].length != model.question.lengths[i]){
                forms[i].classList.add("incorrect");
                var message = document.createElement("p");
                message.innerHTML = "Incorrect length - expected " + model.question.lengths[i] + " but got " + answers[i].length +".";
                message.classList.add("feedback");
                forms[i].parentNode.appendChild(message);
                allCorrect = false;
                continue;
            }
            // Check that a unique string has been provided:
            for (var j = i - 1; j > -1; j--){
                if (JSON.stringify(answers[i]) == JSON.stringify(answers[j])){
                    forms[i].classList.add("incorrect");
                    var message = document.createElement("p");
                    message.innerHTML = "Input not unique, same as #" + (j + 1) + ".";
                    message.classList.add("feedback");
                    forms[i].parentNode.appendChild(message);
                    allCorrect = false;
                    continue loop1;
                }
            }

            // Check that FSM accepts answer
            if (!model.accepts(answers[i])){
                forms[i].classList.add("incorrect");
                var message = document.createElement("p");
                var trace = "<a class='pure-button' href='javascript:display.showTrace("+JSON.stringify(answers[i])+")'>Show trace.</a>";
                message.innerHTML = "Incorrect - input not accepted by machine. " + trace;
                message.classList.add("feedback");
                forms[i].parentNode.appendChild(message);
                logging.sendAnswer(false, answers);
                allCorrect = false;
                continue;
            }
            forms[i].classList.remove("incorrect");
            forms[i].classList.add("correct");
            logging.sendAnswer(true, answers[i]);
        }
        if (allCorrect && config.displayNextOnCorrect){
                display.showNextButton();
            }
    },
    satisfyDefinition: function(){
        // Declare a feedback function here that each test can use.
        var displayFeedback = function(f){
            //remove old feedback
            var feedback = document.querySelector(".inline-feedback");
            if (feedback != null){
                feedback.remove();
            }
            var message = document.createElement("p");
            message.classList.add("inline-feedback");
            message.innerHTML = f;
            document.querySelector(".button-div").appendChild(message);
        };
        // Test that fsm has the correct number of nodes:
        if (model.nodes.length != model.question.nodes.length){
            var actual = model.nodes.length;
            var expected = model.question.nodes.length;
            displayFeedback("Incorrect - the FSM should have " + expected + " states but there are only " + actual + ".");
            logging.sendAnswer(false);
            return;
        }
        // Test if every named node exists:
        for (var i = 0; i < model.question.nodes.length; i++){
            var questionNode = model.question.nodes[i];
            var found = false;
            for (var j = 0; j < model.nodes.length; j++){
                var thisNode = model.nodes[j];
                if (thisNode.name == questionNode){
                    found = true;
                }
            }
            if (!found){
                displayFeedback("Incorrect - the FSM should have a state labelled '" + questionNode + "'.");
                logging.sendAnswer(false);
                return;
            }
        }
        // Test that the correct state is the intial state:
        if (query.getNodeData(0).name != model.question.initial){
            var expected = model.question.initial;
            if (expected == undefined){
                expected = "unnamed"
            }
            else{
                expected = "'" + expected + "'"
            }
            var actual = query.getNodeData(0).name;
            displayFeedback("Incorrect - the initial state should be " + expected +" not '" + actual + "'.");
            logging.sendAnswer(false);
            return;
        }
        // Test if the correct state(s) are accepting:
        for (i = 0; i < model.question.accepting.length; i++){
            var questionNode = model.question.accepting[i];
            for (j = 0; j < model.nodes; j++){
                var thisNode = model.nodes[j];
                if (thisNode.name != questionNode){
                    continue;
                } else {
                    if (!thisNode.accepting){
                        displayFeedback("Incorrect - '" + thisNode +"' should be an accepting state.");
                        logging.sendAnswer(false);
                        return;
                    }
                }

            }
        }
        // Test that no states are accepting that shouldn't be:
        for (i = 0; i < model.nodes.length; i++){
            thisNode = model.nodes[i];
            if (!thisNode.accepting){
                continue;
            } else {
                var found = false;
                for (j = 0; j < model.question.accepting.length; j++){
                    if (thisNode.name == model.question.accepting[j]){
                        found = true;
                    }
                }
                if (found == false){
                    var name = thisNode.name;
                    if (name == undefined){
                        name = "unnamed";
                    } else {
                        name = "'" + name + "'";
                    }
                    displayFeedback("Incorrect - " + name + " should not be an accepting state.");
                    logging.sendAnswer(false);
                    return;
                }
            }
        }
        // Test that every link that exists is supposed to:
        // Also record whether every link that is supposed to exist does exist
        var exists = new Array(model.question.links.length);
        for (i = 0; i  < model.links.length; i ++){
            var thisLink = model.links[i];
            for (j = 0; j < thisLink.input.length; j++){
                var thisInput = thisLink.input[j];
                var found = false;
                for (var k = 0; k < model.question.links.length && found == false; k++){
                    var questionLink = model.question.links[k];
                    if (questionLink.source != thisLink.source.name){
                        continue;
                    }
                    if (questionLink.target != thisLink.target.name){
                        continue;
                    }
                    if (questionLink.input != thisInput){
                        continue;
                    }
                    found = true;
                    exists[k] = true;
                }
                if (!found){
                    displayFeedback("Incorrect - there should not be a transition from '" + thisLink.source.name + "' to '" + thisLink.target.name + "' for input '" + thisInput +"'.");
                    logging.sendAnswer(false);
                    return;
                }
            }
        }

        // Check that every link that is supposed to exist does (using information from previous step):
        for (i = 0; i< exists.length; i++){
            if (!exists[i]){
                var source = model.question.links[i].source;
                var target = model.question.links[i].target;
                var input = model.question.links[i].input;
                displayFeedback("Incorrect - there should be a link from '" + source + "' to '" + target + "' for input '" + input + "'.");
                logging.sendAnswer(false);
                return;
            }
        }

        //All tests passed:
        displayFeedback("Correct!");
        if (config.displayNextOnCorrect){
                display.showNextButton();
        }
        logging.sendAnswer(true);
    },
    satisfyList: function(){
        var accLength = model.question.acceptList.length;
        var rejLength = model.question.rejectList.length;
        var nRows = Math.max(model.question.acceptList.length, model.question.rejectList.length);
        var passed = true;
        for (var num = 0; num < nRows; num++){
            var i = num;
            // Test element i of acceptList
            if (i < accLength){
                var input = model.parseInput(model.question.acceptList[i], model.question.alphabetType == "char");
                var accepts = model.accepts(input);
                if (accepts){
                    document.querySelector("#td-acc-adj-"+i).innerHTML = "<img class ='x-check' src=img/Icons/check.svg>";
                } else {
                    document.querySelector("#td-acc-adj-"+i).innerHTML = "<img class ='x-check' src=img/Icons/x.svg>";
                    passed = false;
                }
            }
            // Test element i of rejectList
            if (i < rejLength){
                var input = model.parseInput(model.question.rejectList[i], model.question.alphabetType == "char");
                var accepts = model.accepts(input);
                if (!accepts){
                    document.querySelector("#td-rej-adj-"+i).innerHTML = "<img class ='x-check' src=img/Icons/check.svg>";
                } else {
                    document.querySelector("#td-rej-adj-"+i).innerHTML = "<img class ='x-check' src=img/Icons/x.svg>";
                    passed = false;
                }
            }

        }
        if (passed && config.displayNextOnCorrect){
            display.showNextButton();
        }
        logging.sendAnswer(passed);
    },
    satisfyRegex: function() {
        // Declare a feedback function here that each test can use.
        var displayFeedback = function(f){
            //remove old feedback
            var feedback = document.querySelector(".inline-feedback");
            if (feedback != null){
                feedback.remove();
            }
            var message = document.createElement("p");
            message.classList.add("inline-feedback");
            message.innerHTML = f;
            document.querySelector(".button-div").appendChild(message);
        };
        //Check if n/dfa has been specifed:
        if (model.question.deterministic != undefined){
            var isDeterministic = query.isDeterministic();
            if (model.question.deterministic && isDeterministic[0] == false){
                displayFeedback("Incorrect - Machine must be deterministic. " + isDeterministic[1]);
                return;
            }
            if (!model.question.deterministic && isDeterministic[0]){
                displayFeedback("Incorrect - Machine must be non deterministic.");
                return;
            }
        }
        //Check if a maximum number of states has been specified:
        if (model.question.maxStates != undefined){
            if (model.nodes.length > model.question.maxStates){
                displayFeedback("Machine must have at most " + model.question.maxStates + " states but this machine has " + model.nodes.length + ".");
                return;
            }
        }
        //Check if there is an accepting state:
        if(!query.hasAcceptingState()){
            displayFeedback("Incorrect - Machine does not have an accepting state.")
            return;
        }

        var regex = new RegExp(model.question.regex);
        if (model.question.minAcceptLength == undefined){ // minAcceptLength is the length of the shortest string that the regex should accept. Here given a default value of 4.
            var minAcceptLength = 4;
        } else {
            var minAcceptLength = model.question.minAcceptLength;
        }
        // First, check that what the machine accepts is a subset of what the regex accepts (for length <= pathLength)
        var pathLength = model.nodes.length + 1 // TODO prove that this is sufficient.
        if (pathLength < minAcceptLength){
            pathLength = minAcceptLength;
        }
        var paths = query.getPaths(query.getNodeData(0), "", "", pathLength, []);
        var errorFound = false;
        paths.map(function(string){
            if (errorFound){
                return;
            }
            if (regex.exec(string) == null || regex.exec(string)[0] != string){
                if (string == ""){
                    displayFeedback("Incorrect - the machine accepts the empty string ('') which it should reject.");
                } else{
                    displayFeedback("Incorrect - the machine accepts the string '" + string + "' which it should reject.");
                }
                errorFound = true;
            }
        });
        if (errorFound){
            logging.sendAnswer(false);
            return;
        }

        // Next, check that what the regex accepts is a subset of what the machine accepts
        // First, create a list of all possible strings built from the alphabet using Dynamic Programming.

        //Use alphabet with 'ε' removed
        var alphabet = []
        for (var i = 0; i < model.question.alphabet.length; i++){
            if (model.question.alphabet[i] != "ε"){
                alphabet.push(model.question.alphabet[i])
            }
        }
        var strings = ["", alphabet];
        for (var length = 2; length <= pathLength; length++){
            displayFeedback("building string list - on length " + length);
            strings[length] = [];
            strings[length-1].map(function(s){
                for (i = 0; i < alphabet.length; i++){
                    var newString = s + alphabet[i];
                    strings[length].push(newString);
                }
            });
        }
        // Avoid i and j as loop variables because of closures.
        // Map doesn't work well as you can't return the function from inside a map (I think).
        for (length = 0; length < strings.length; length++){
            for (var k = 0; k < strings[length].length; k++){
                var string = strings[length][k];
                displayFeedback("Analysing " + string);
                if (regex.exec(string) != null && regex.exec(string)[0] ==  string){
                        //If the regex accepts the string, check the machine accepts it
                    if (!model.accepts(model.parseInput(string, model.question.alphabetType))){
                        displayFeedback("Incorrect - the machine rejects the string '" + string + "' which it should accept.");
                        logging.sendAnswer(false);
                        return;
                    }
                }
            }
        }
        displayFeedback("Correct!");
        if (config.displayNextOnCorrect){
            display.showNextButton();
        }
        logging.sendAnswer(true);
    },
    selectStates: function(){
        // Declare a feedback function here
        var displayFeedback = function(isCorrect){
            //remove old feedback
            var feedback = document.querySelector(".inline-feedback");
            if (feedback != null){
                feedback.remove();
            }
            var message = document.createElement("p");
            message.classList.add("inline-feedback");
            if (isCorrect){
                message.innerHTML = "<img class ='x-check-button' src=img/Icons/check.svg>";
                logging.sendAnswer(true, model.selected);
            } else{
                message.innerHTML = "<img class ='x-check-button' src=img/Icons/x.svg>";
                logging.sendAnswer(false, model.selected);
            }
            document.querySelector(".button-div").appendChild(message)
        };
        //Put machine into state described by the question.
        model.currentStates = JSON.parse(JSON.stringify(model.question.initialState));
        model.fullInput = JSON.parse(JSON.stringify(model.question.input));
        model.currentInput = JSON.parse(JSON.stringify(model.question.input));
        // Take the required number of steps
        for (var i = 0; i < model.question.nSteps; i++){
            model.step();
        }

        // Check that the selection is correct:
        // First, check that the lengths are the same:
        if (model.selected.length != model.currentStates.length){
            displayFeedback(false);
            return;
        }

        for (i = 0; i < model.selected.length; i++){
            var state = model.selected[i].id;
            if (model.currentStates.indexOf(state) == -1){
                displayFeedback(false);
                return;
            }
        }

        displayFeedback(true);
        if (config.displayNextOnCorrect){
            display.showNextButton();
        }
        return;
    }
};

var eventHandler = {
    demoButton: function(){
        var symbol = event.target.id.slice(5);
        controller.demoInput(symbol);
        display.highlightCurrentStates();
        d3.selectAll(".machine-input").remove();
        display.drawInput()
    },
    clickBackground: function() {
        // if click was on element other than background, do nothing further.
        if (d3.event.target.id != "main-svg"){
            return;
        }
        console.log(d3.event);

        // Dismiss context menu if it is present
        if (contextMenuShowing) {
            display.dismissContextMenu();
            return;
        }

        // because :active only works in WebKit?
        svg.classed("active", true);

        if (d3.event.button != 0 || mousedown_node || mousedown_link) return;


        // If rename menu is showing, submit it if config allows.
        if (renameMenuShowing) {
            if (config.submitRenameOnBGclick){
                controller.renameSubmit()
            }
            return;
        }


        if (model.toolMode == "nodetool" || model.toolMode == "acceptingtool"){
            d3.event.preventDefault()
            eventHandler.createNode()
            return;
        }

    },
    clickLink: function(d){
        if (selected_link == d){
            selected_link = null;
        } else {
            selected_link = d;
        }
        restart();
        if (model.toolMode == "texttool"){
            display.renameLinkForm(d.id);
            return;
        }
        if (model.toolMode == "deletetool"){
            model.deleteLink(d.id);
            return;
        }

    },
    clickLinkPadding: function(d){
        if (model.toolMode == "nodetool" || model.toolMode == "acceptingtool"){
            eventHandler.createNode();
        }
        else {
            eventHandler.clickLink(d);
        }
    },
    clickNode: function(d) {
        if (model.toolMode == "acceptingtool"){
            model.toggleAccepting(d.id);
            return;
        }
        if (model.toolMode == "deletetool"){
            model.deleteNode(d.id);
            return;
        }
        if (model.toolMode == "texttool"){
            display.renameStateForm(d.id);
            return;
        }
        if (model.toolMode == "nodetool"){
            eventHandler.createNode();
        }
    },
    addLinkMouseDown: function(d) {
        if (d3.event.ctrlKey) return;
        selected_node = null;
        restart();
    },
    createLink: function(d, eventType) {
        if (model.toolMode != "linetool"){
            return;
        }
        if (eventType == "mousedown") {
            if (d3.event.ctrlKey || (d3.event.button != 0 && d3.event.button != undefined)) return;
            // select node
            mousedown_node = d;
            if (mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;

            // reposition drag line
            drag_line
                .style("marker-end", "url(#end-arrow)")
                .classed("hidden", false)
                .attr("d", "M" + mousedown_node.x + "," + mousedown_node.y + "L" + mousedown_node.x + "," + mousedown_node.y);
            restart();
        } else if (eventType == "mouseup") {
            if (!mousedown_node || (d3.event.button != 0 && d3.event.button != undefined)) return;

            // needed by FF
            drag_line
                .classed("hidden", true)
                .style("marker-end", "");

            // Extract target for touch events
            if(d3.event.button == 0){
                mouseup_node = d;
            } else {
                var touch = d3.event.changedTouches[0];
                var elem = document.elementFromPoint(touch.clientX, touch.clientY);
                if (!elem.classList.contains("node")){
                    return;
                } else {
                    mouseup_node = query.getNodeData(elem.id);
                }
            }


            // check for drag-to-self
            // if (mouseup_node === mousedown_node) {
            //     resetMouseVars();
            //     return;
            // }

            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target;
            source = mousedown_node;
            target = mouseup_node;

            //Check if link already exists. Create it if it doesn't.
            var link;
            link = model.links.filter(function(l) {
                return (l.source === source && l.target === target);
            })[0];

            if (!link) {
                link = {
                    source: source,
                    target: target,
                    input: [],
                    id: ++model.lastLinkID
                };
                model.links.push(link);
                if (config.showRenameOnLinkCreation){
                    display.renameLinkForm(link.id);
                }

            }

            // select new link
            selected_link = link;
            selected_node = null;
            force.start();
            restart();
        }
    },
    createNode: function(){
        // insert new node at point
        var point = d3.mouse(d3.select("#main-svg")[0][0]),
            node = {
                id: ++model.lastNodeID,
                accepting: (model.toolMode == "acceptingtool")
            };
        node.x = point[0];
        node.y = point[1];
        model.nodes.push(node);
        force.start();
        restart();
        return;
    },
    // Provides right-click funtionality for links
    linkContextMenu: function(id) {
        d3.event.preventDefault();

        //If menu already present, dismiss it.
        if (contextMenuShowing) {
            display.dismissContextMenu();
        }
        if (id == undefined){
            // Get the id of the clicked link:
            id = d3.event.target.id.slice(4);
        }

        var canvas = svg;
        contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());

        display.createLinkContextMenu(canvas, id, mousePosition);

    },
    rate: function() {
        var rating;
        if (hasRated){
            return;
        }
        // Event handeler for the question-rating buttons
        if (d3.event.target.id == "rate-yes") {
            rating = "yes";
        } else {
            rating = "no";
        }
        d3.select(".rate")
            .transition()
            .duration(400)
            .style("opacity", "0.1")
            .remove();
        logging.sendRating(rating);
        hasRated = true;
    },
    //Provides right-click functionality for states.
    stateContextMenu: function() {
        d3.event.preventDefault();

        //If menu already present, dismiss it.
        if (contextMenuShowing) {
            display.dismissContextMenu();
        }
        // Get the id of the clicked state:
        var id = d3.event.target.id;

        contextMenuShowing = true;
        var mousePosition = d3.mouse(svg.node());

        display.createStateContextMenu(svg, id, mousePosition);
    },
    //Function to handle clicks to the control palette:
    toolSelect: function() {
        //Clear previous selection:
        d3.select(".control-rect.selected").classed("selected", false)
            .attr("fill", "white");
        var newMode = d3.event.target.id;
        // If current mode is texttool, submit any open rename forms:
        if (model.toolMode == "texttool"){
            controller.renameSubmit();
        }
        // Reinstate drag-to-move if previous mode did not allow it.
        if(model.toolMode == "linetool"|| model.toolMode == "texttool" || model.toolMode == "acceptingtool" || model.toolMode == "deletetool" || model.toolMode == "nodetool"){
            circle.call(force.drag);
        }
        // If current mode is the same as the new mode, deselect it:
        if (model.toolMode == newMode){
            model.toolMode = "none";
            newMode = "none";
        } else {
            model.toolMode = newMode;
            d3.select("#"+newMode).classed("selected", true)
                .attr("fill", "url(#Gradient1)");
        }
        //  disable node dragging if needed by new mode:
        if (newMode == "linetool" || newMode == "texttool" || newMode == "acceptingtool" || newMode == "deletetool" || newMode == "nodetool"){
            circle
                .on("mousedown.drag", null)
                .on("touchstart.drag", null);
        }
    },
    traceControl: function(){
        var button = d3.event.target.id;
        if (button == "rewind"){
            model.resetTrace();
            display.resetTrace();
            return;
        }
        if (button == "back"){
            if (!tracePlaying){
                display.traceStep(false, true);
            }
        }
        if (button == "forward"){
            if (!tracePlaying){
                display.traceStep(false, false);
            }
        }
        if (button == "play"){
            model.currentInput = JSON.parse(JSON.stringify(model.fullInput));
            model.currentStates = [0];
            model.currentStep = 0;
            d3.selectAll(".node").classed("dim", true);
            d3.select("[id='0']").classed("dim", false).classed("highlight", true);
            d3.selectAll(".input").classed("dim", false).classed("highlight", false);
            setTimeout(function(){display.traceStep(true);}, 1500);
            return;
        }
        if (button == "stop"){
            model.resetTrace();
            display.dismissTrace();
            return;
        }
    }
};


var controller = {
    demoInput: function(symbol){
        model.fullInput += [symbol]
        model.currentInput = [symbol]
        model.step()
    },
    demoReset: function(){
        model.fullInput = []
        model.resetTrace();
        d3.selectAll(".machine-input").remove()
        display.resetTrace();
    },
    renameSubmit: function() {
        var menu = d3.select(".renameinput")[0][0];
        //Check menu is present
        if (menu == null){
            return;
        }
        var value = menu.value;
        var id = menu.id;
        var type = id.slice(0, 4);
        var d;
        var label;

        // Process differently if it is a node or link rename
        if (type === "node") {
            var nodeID = id.slice(4);
            d = d3.select("[id='" + nodeID + "']").data()[0];
            d.name = value;
            //Change the displayed label to the new name
            label = svg.select("#nodename" + nodeID);
            label.text(value);
        }
        //Link rename using a text form:
        if (type === "ltxt") {
            var linkID = id.slice(4);
            d = query.getLinkData(linkID);
            //Strip whitespace:
            value = value.replace(/ /g, "");
            //Split on comma and store
            d.input = value.split(",");
            //Replace the epsilon synonyms with ε
            for (var i = 0; i < d.input.length; i++){
                var toLower = d.input[i].toLowerCase();
                if (["epsilon", "epssilon", "espilon", "epsillon"].indexOf(toLower) > -1){
                    d.input[i] = "ε";
                }
            }
            display.updateLinkLabel(linkID)

        }
        //Link rename using a checkbox menu:
        if (type == "lcon"){
            var linkID = id.slice(4);
            d = query.getLinkData(linkID);
            d.input = [];
            d.output = [];
            var element;
            var insymbol;
            for (var i = 0; i < menu.children.length; i++){
                element = menu.children[i]
                if (element.tagName == "INPUT"){
                    if (!element.checked){
                    continue;
                	}
                	d.input.push(element.value)
                } else if (element.tagName == "SELECT") { //Get output symbols from the dropdown menu
                	value = element.value
                	if (value == ""){ //Ignore empty output
                		continue;
                	}
                	insymbol = element.id.slice(4)
                	if (d.input.indexOf(insymbol) == -1){ //Ignore outputs for input that are not accepted.
                		continue;
                	}
                	d.output.push([insymbol, value])
                }
            }
            display.updateLinkLabel(linkID)
        }
        display.dismissRenameMenu();
    }
};




function resetMouseVars() {
    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
    // draw directed edges with proper padding from node centers
    path.attr("d", function(d) {
            // Check for reflexive links
            if (d.source == d.target){
                return display.reflexiveLink(d.source.x, d.source.y - 18);
            }

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
            if (query.isBezier(d.id)) {
                return display.bezierCurve(sourceX, sourceY, targetX, targetY);
            } else {
                return display.line(sourceX, sourceY, targetX, targetY);
            }
        })
        .style("stroke-width", 2)
        .attr("id", function(d) {
            return "link" + d.id;
        });

    //Update the path padding
    model.links.map(function(l){
        var path = d3.select("#link" + l.id);
        var padding = d3.select("#linkpad" + l.id);
        padding.attr("d", path.attr("d"))
    })


    // Move the input labels
    linkLabels.attr("transform", function(d) {
        // Determine if there is a link in the other direction.
        // We need this as labels will be placed differently for curved links.
        var sourceId = d.source.id;
        var targetId = d.target.id;
        var exists = model.links.filter(function(l) {
            return (l.source.id === targetId && l.target.id === sourceId);
        })[0];
        exists = Boolean(exists);

        var position = display.getLinkLabelPosition(d.source.x, d.source.y, d.target.x, d.target.y, exists);

        return "translate(" + position.x + "," + position.y + ") rotate(" + position.rotation + ")";
    });
    linkLabels.attr("id", function(d) {
        return "linklabel" + d.id;
    });

    // Draw the nodes in their new positions
    circle.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
    });

    // Move the start line
    d3.select(".start").attr("d", function(){
        var node0 = d3.select("[id='0']").data()[0];
        var length = 100;
        var start = String((node0.x - length - display.nodeRadius) + "," + node0.y);
        var end = String(node0.x - 7 - display.nodeRadius + "," + node0.y);
        return "M" + start + " L" + end;
    })
        .style("marker-end", "url(#end-arrow)")
        .style("stroke-width", "2px");
}

// update graph (called when needed)
function restart() {
    // path (link) group
    path = path.data(model.links, function(d){return d.id;});

    // update existing links
    path.classed("selected", function(d) {
            return d === selected_link;
        })
        .style("marker-mid", "url(#end-arrow)");

    // add new links
    var newLinks = path.enter();
    newLinks.append("svg:path")
        .attr("class", "link")
        .classed("selected", function(d) {
            return d === selected_link;
        })
        .style("marker-mid", "url(#end-arrow)")
        .on("mousedown", function(d) {
            eventHandler.addLinkMouseDown(d);
        })
        .each(function(d){
            d3.select("#paths")
            .append("svg:path")
            .attr("class", "link-padding")
            .attr("id", "linkpad" + d.id)
            .on("mousedown", function() {
                eventHandler.addLinkMouseDown(d);
            })
            .attr("data-link-id", d.id)
            .on("click", function() {
                eventHandler.clickLinkPadding(d);
            });
        });


    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(model.nodes, function(d) {
        return d.id;
    });

    // update existing nodes (accepting & selected visual states)
    circle.selectAll("circle")
        .style("fill", function(d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .classed("accepting", function(d) {
            return d.accepting;
        })

    // Add link labels
    linkLabels = linkLabels.data(model.links, function(d){
        return d.id;
    });
    linkLabels.enter().append("svg:text")
        .text(function(d) {
            //Funtion to turn array of symbols into the label string
            if (d.input.length == 0) {
                return "";
            } else {
                var labelString = String(d.input[0]);
                for (var i = 1; i < d.input.length; i++) {
                    labelString += ", " + d.input[i];
                }
                return labelString;
            }
        })
        .attr("class", "linklabel")
        .attr("text-anchor", "middle") // This causes text to be centred on the position of the label.
        .on("click", function(d){
            eventHandler.clickLink(d);
        })
        .on("contextmenu", function(d){
            eventHandler.linkContextMenu(d.id);
        });

    // add new nodes
    var g = circle.enter().append("svg:g");

    g.append("svg:circle")
        .attr("class", "node")
        .attr("r", display.nodeRadius)
        .style("fill", function(d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .style("stroke", function(d) {
            return d3.rgb(colors(d.id)).darker().toString();
        })
        .classed("accepting", function(d) {
            return d.accepting;
        })
        .attr("id", function(d) {
            return d.id;
        })
        .on("click", function(d) {
            eventHandler.clickNode(d);
        })
        .on("mousedown", function(d) {
            eventHandler.createLink(d, "mousedown");
        })
        .on("touchstart", function(d) {
            eventHandler.createLink(d, "mousedown");
        })
        .on("mouseup", function(d) {
            eventHandler.createLink(d, "mouseup");
        })
        .on("touchend", function(d) {
            eventHandler.createLink(d, "mouseup");
        });



    // Add a concentric circle to accepting nodes. It has class "accepting-ring"
    d3.selectAll(".node").each(function(d) {
        var id = d.id;
        if (d.accepting & !document.getElementById("ar" + id)) {
            d3.select(this.parentNode).append("svg:circle")
                .attr("r", display.acceptingRadius)
                .attr("class", "accepting-ring")
                .attr("id", "ar" + id)
                .style("stroke", "black")
                .style("stroke-width", 2)
                .style("fill-opacity", 0)
                // Make pointer events pass through the inner circle, to the node below.
                .style("pointer-events", "none");
        }
    });


    // show node IDs
    g.append("svg:text")
        .attr("class", "nodename")
        .attr("id", function(d) {
            return "nodename" + d.id;
        })
        .text(function(d) {
            return d.name;
        });



    // remove old nodes
    circle.exit().remove();

    // add listeners
    d3.selectAll(".node")
        .on("contextmenu", eventHandler.stateContextMenu);

    d3.selectAll(".link")
        .on("click", function(d){eventHandler.clickLink(d);})
        .on("contextmenu", function(d){
            eventHandler.linkContextMenu(d.id);
        });

    d3.selectAll(".link-padding")
        .on("contextmenu", function(){eventHandler.linkContextMenu(d3.select(this).attr("data-link-id"));});

}



function mousemove() {
    if (!mousedown_node) return;

    d3.event.preventDefault();

    // update drag line
    drag_line.attr("d", "M" + mousedown_node.x + "," + mousedown_node.y + "L" + d3.mouse(this)[0] + "," + d3.mouse(this)[1]);

    restart();
}

function mouseup() {
    if (mousedown_node) {
        // hide drag line
        drag_line
            .classed("hidden", true)
            .style("marker-end", "");
    }

    // because :active only works in WebKit?
    svg.classed("active", false);

    // clear mouse event vars
    resetMouseVars();
}

function spliceLinksForNode(node) {
    var toSplice = model.links.filter(function(l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
        model.links.splice(model.links.indexOf(l), 1);
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
        //Call the rename handler if there is a rename menu showing.
        if (renameMenuShowing) {
            controller.renameSubmit();
        }
    }

    // ctrl
    if (d3.event.keyCode === 17) {
        circle.call(force.drag);
        svg.classed("ctrl", true);
    }

    if (!selected_node && !selected_link) return;
    switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
        // Do nothing if the rename menu is open
        if (renameMenuShowing) {
            break;
        }
        if (selected_node) {
            model.nodes.splice(model.nodes.indexOf(selected_node), 1);
            spliceLinksForNode(selected_node);
        } else if (selected_link) {
            model.deleteLink(selected_link.id);
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
            .on("mousedown.drag", null)
            .on("touchstart.drag", null);
        svg.classed("ctrl", false);
    }
}

var logging = {
    userID: undefined,
    generateUserID: function() {
        //Use local storage if it is available
        var hasStorage;
        if(typeof(localStorage) !== "undefined") {
            hasStorage = true;
            if (localStorage.getItem("userID") !== null){
                logging.userID = localStorage.getItem("userID");
                return;
            }
        } else {
            hasStorage = false;
        }
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=="x" ? r : (r&0x3|0x8)).toString(16);
        });
        logging.userID = uuid;
        if (hasStorage){
            localStorage.setItem("userID", uuid);
        }
    },
  // answer is an optional parameter, if not specified the current state will be sent.
    sendAnswer: function(isCorrect, answer) {
        if (answer == undefined){
            answer = model.generateJSON2();
        } else {
            answer = JSON.stringify(answer);
        }
        if (isCorrect){
            isCorrect = "true";
        } else {
            isCorrect = "false";
        }
        // Record different information if the model is editable
        var url = window.location.href;
        if (logging.userID == undefined){
            logging.generateUserID();
        }
        var data = "url=" + encodeURIComponent(url) + "&userID=" + encodeURIComponent(logging.userID);
        data = data + "&isCorrect=" + isCorrect + "&answer=" + answer;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        var request = new XMLHttpRequest();
        request.open("POST", "/cgi/s1020995/answer.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");

        request.send(data);
    },
    sendInfo: function() {
        var url = window.location.href;
        if (!isActive){
            // Don't log if the window is not active
            return;
        }
        if (logging.userID == undefined){
            logging.generateUserID();
        }
        var data = "url=" + encodeURIComponent(url) + "&userID=" +encodeURIComponent(logging.userID);
        var request = new XMLHttpRequest();
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        request.open("POST", "/cgi/s1020995/logging.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(data);
    },
    sendRating: function(rating) {
        var url = window.location.href;
        if (logging.userID == undefined){
            logging.generateUserID();
        }
        var data = "url=" + encodeURIComponent(url) + "&userID=" +encodeURIComponent(logging.userID);
        data = data + "&rating=" + encodeURIComponent(rating);
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        var request = new XMLHttpRequest();
        request.open("POST", "/cgi/s1020995/rating.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(data);
    }
};


function init(){
    model.readJSON();
    // set up SVG for D3
    width = 960,
    height = 500,
    colors = d3.scale.category10();

    svg = d3.select("#main-svg")


    // init D3 force layout
    force = d3.layout.force()
        .nodes(model.nodes)
        .links(model.links)
        .size([width, height])
        .linkDistance(150)
        .chargeDistance(160)
        .charge(-30)
        .gravity(0.00)//gravity is attraction to the centre, not downwards.
        .on("tick", tick);

    // line displayed when dragging new nodes
    drag_line = svg.append("svg:path")
        .attr("class", "link dragline hidden")
        .attr("d", "M0,0L0,0");

    // handles to link and node element groups
    path = svg.append("svg:g").attr("id", "paths").selectAll("path"),
        circle = svg.append("svg:g").selectAll("g"),
        linkLabels = svg.selectAll(".linklabel");


    // mouse event vars
    selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

    model.setupQuestion();

    if (model.editable){
        display.drawControlPalette();
    }
    svg.on("mousedown", eventHandler.clickBackground)
        .on("mousemove", mousemove)
        .on("touchmove", mousemove)
        .on("mouseup", mouseup)
        .on("touchend", mouseup);
    d3.select(window)
        .on("keydown", keydown)
        .on("keyup", keyup);
    contextMenuShowing = false;
    renameMenuShowing = false;
    restart();
    force.start();
    circle.call(force.drag);
    // Add a start arrow to node 0
    node0 = d3.select("[id='0']").data()[0];
    tracePlaying = false;
    display.drawStart(node0.x, node0.y);
    // Add event listener to the rate buttons
    d3.selectAll(".rate-button").on("click", eventHandler.rate);
    hasRated = false;
    loaded = true;
    // Keep track of whether the tab is active, for logging purposes
    isActive = true;

    window.onfocus = function () {
      isActive = true;
    };

    window.onblur = function () {
      isActive = false;
    };

    //Start demo mode if needed once everything has loaded:
    if(model.question.type == "demo"){
        display.showTrace("");
        d3.selectAll(".node").attr("style","fill: rgb(44, 160, 44); stroke:rgb(0,0,0);");
    }

    // Don't put anything after logging.sendInfo as that raises an error when testing. TODO - proper error handling here.
    logging.sendInfo();
    setInterval(logging.sendInfo, 120000);

}

init();