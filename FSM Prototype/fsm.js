var model = {
    toolMode: "none",
    nodes: {},
    links: {},
    editable: true,
    currentStates: [0], //IDs of state(s) that the simulation could be in. Initially [0], the start state.
    currentStep: 0,
    fullInput: ["a", "a"], // The complete input the machine is processing, this should not be changed during simulation.
    currentInput: ["a", "a"], // This will have symbols removed as they are processed.
    accepts: function(input){
        // Given input in the form ["a", "b", "c"], determines if the current machine accepts it.
        // NOTE: this resets the model variables.
        // Use JSON.parse/JSON.stringify as native deep-copy
        model.fullInput = JSON.parse(JSON.stringify(input));
        model.currentInput = JSON.parse(JSON.stringify(input));
        model.currentStates = [0];
        // Simulate until input is consumed
        while (this.currentInput.length > 0){
            if (this.currentStates == []){
                return false;
            }
            this.step();
        }
        // When input is consumed, check if any of the current states are accepting;
        for (i = 0; i < this.currentStates.length; i++){
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
        for (i = 0; i < model.links.length; i++){
            if (model.links[i].id == id){
                model.links.splice(i, 1);
                selected_link = null;
                d3.select("#linklabel"+id).remove();
                linkLabels.exit().remove()
                restart();
                return;
            }
        }

    },
    deleteNode: function(id){
        // Check that editing is allowed and that node0 is not target:
        if (model.editable == false || id == 0){
            return;
        }
        node = query.getNodeData(id)
        model.nodes.splice(model.nodes.indexOf(node), 1);
        var toSplice = model.links.filter(function(l) {
            return (l.source === node || l.target === node);
        });
        //Use j to avoid closure strangeness - i gets overwritten by model.deleteLink
        for (j = 0; j < toSplice.length; j++){
            model.deleteLink(toSplice[j].id)
        }
        selected_node = null;
        restart();
    },
    generateJSON: function(){
        var nodesStr = "data-nodes='" + JSON.stringify(model.nodes) + "'";
        console.log(nodesStr);
        //create a clone of model.links. VERY hacky but apparantly not bad for efficiency
        var linksTmp = JSON.parse(JSON.stringify(model.links));
        //change source + target of links to be node IDs:
        for (i = 0; i < linksTmp.length; i++){
            linksTmp[i].source = linksTmp[i].source.id;
            linksTmp[i].target = linksTmp[i].target.id;
        }
        var linksStr = "data-links='" + JSON.stringify(linksTmp) + "'";
        console.log(linksStr)
        var questionStr = "data-question='" + JSON.stringify(model.question) + "'";
        console.log(linksStr)

    },
    parseInput: function(string, isCharType){
        // Given a string 'abc', return input in form ['a', 'b', 'c'] if charType
        // or given a string 'stop start go', return input in form ['stop', 'start', 'go']
        if (isCharType){
                return string.split('');
            } else {
                return string.split(/\ |,\ |,/);
            }

    },
    resetTrace: function(){
        model.currentInput = JSON.parse(JSON.stringify(model.fullInput));
        model.currentStates = [0];
        model.currentStep = 0;
    },
    readJSON: function(){
        // Need to read in nodes + links separately as links refer directly to nodes
        var body = document.querySelector('.canvas');
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
        for(i=0; i<model.links.length; i++){
            var link = model.links[i];
            if (link.id > maxLinkID){
                maxLinkID = link.id;
            }
            link.source = query.getNodeData(link.source)
            link.target = query.getNodeData(link.target)
        }
        model.lastLinkID = maxLinkID;

        // Set lastNodeID:
        var maxNodeID = 0
        for (i = 0; i < model.nodes.length; i++){
            if (model.nodes[i].id > maxNodeID){
                maxNodeID = model.nodes[i].id
            }
        }
        model.lastNodeID = maxNodeID;
        return true;

    },
    setupQuestion: function(){
        // Function uses data in model.question to setup the question environment
        var types = ["satisfy-regex","deterministic-satisfy-regex","satisfy-list","deterministic-satisfy-list","give-regex",
                    "give-list","select-states","convert-nfa", "does-accept", "none"];
        if (types.indexOf(model.question.type) == -1){
            alert(model.question.type + " is not a valid question type.");
            return;
        }
        // Set editable flag:
        if (["satisfy-regex","deterministic-satisfy-regex","satisfy-list","deterministic-satisfy-list","convert-nfa","none"].indexOf(model.question.type) == -1){
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
        var newStates = [];
        var linkIDs = [];

        for (i = 0; i < model.currentStates.length; i++){
            var stateID = model.currentStates[i];  // For every state in currentStates, test every link.
            for (j in model.links){
                var link = model.links[j];
                if(link.source.id == stateID){// See if link starts from currently considered node.
                    if (link.input.indexOf(curSymbol) > -1 || link.input.indexOf("Epsilon") > -1){ // See if this transition is legal.
                        linkIDs.push(link.id)
                        //Add link target to newStates if it isn't there already
                        if (newStates.indexOf(link.target.id) == -1){
                            newStates.push(link.target.id)
                        }
                    }
                }
            }
        }
        model.currentStep++;
        model.currentStates = newStates;
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

    }
}

var query = {
    getLinkData: function(id) {
        var d;
        for (i in model.links) {
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
    getNodeData: function(id){
        var d;
        // Don't use i here to avoid closure strangeness
        for (n in model.nodes) {
            if (model.nodes[n].id == id) {
                d = model.nodes[n];
                break;
            }
        }
        if (d == undefined) {
            console.log("Unexpected id =")
            console.log(id)
            alert("Error in query.getNodeData - nodeID '" + id + "' not found");
        }
        return d;

    },
    isBezier: function(id) {
        // Determine if a given link is drawn as a curve. IE if there is link in the opposite direction

        // Get link data from link ID
        var d = query.getLinkData(id)

        var sourceId = d.source.id
        var targetId = d.target.id

        exists = model.links.filter(function(l) {
            return (l.source.id === targetId && l.target.id === sourceId);
        })[0]; //True if link exists in other direction - from target to source.

        return exists;

    }
}
// Read in data as soon as model and query methods are created.
model.readJSON();

var checkAnswer = {
    giveList: function(index){
        //First, remove feedback from previous attempt:
        d3.selectAll(".feedback").remove();
        d3.selectAll(".correct").classed("correct", false);
        d3.selectAll(".incorrect").classed("incorrect", false);
        var forms = document.querySelectorAll(".qform");
        var answers = []
    loop1:
        for (num = 0; num < forms.length; num++){
            // Needed to avoid JS closure strangeness
            var i = num
            answers[i] = forms[i].value;
            // Handle string parsing differently for char/symbol modes:
            if (model.question.alphabetType == "symbol"){
                answers[i] = answers[i].split(',');
            } else {
                answers[i] = answers[i].split('');
            }
            //ignore empty fields:
            if (answers[i].length == 0){
                continue;
            }

            // Check that the answer is the correct length
            if (answers[i].length != model.question.lengths[i]){
                forms[i].classList.add("incorrect")
                var message = document.createElement("p")
                message.innerHTML = "Incorrect length - expected " + model.question.lengths[i] + " but got " + answers[i].length +"."
                message.classList.add("feedback")
                forms[i].parentNode.appendChild(message)
                continue;
            }
            // Check that a unique string has been provided:
            for (j = i - 1; j > -1; j--){
                if (JSON.stringify(answers[i]) == JSON.stringify(answers[j])){
                    forms[i].classList.add("incorrect")
                    var message = document.createElement("p")
                    message.innerHTML = "Input not unique, same as #" + (j + 1) + "."
                    message.classList.add("feedback")
                    forms[i].parentNode.appendChild(message)
                    continue loop1;
                }
            }

            // Check that FSM accepts answer
            if (!model.accepts(answers[i])){
                forms[i].classList.add("incorrect")
                var message = document.createElement("p")
                var trace = "<a class='pure-button' href='javascript:display.showTrace("+JSON.stringify(answers[i])+")'>Show trace.</a>"
                message.innerHTML = "Incorrect - input not accepted by machine. " + trace
                message.classList.add("feedback")
                forms[i].parentNode.appendChild(message)
                continue;
            }
            forms[i].classList.remove("incorrect");
            forms[i].classList.add("correct");
        }
    },
    satisfyList: function(){
        var accLength = model.question.acceptList.length;
        var rejLength = model.question.rejectList.length;
        var nRows = Math.max(model.question.acceptList.length, model.question.rejectList.length)
        for (num = 0; num < nRows; num++){
            var i = num;
            // Test element i of acceptList
            if (i < accLength){
                var input = model.parseInput(model.question.acceptList[i], model.question.alphabetType == 'char')
                var accepts = model.accepts(input);
                if (accepts){
                    document.querySelector("#td-acc-adj-"+i).innerHTML = "<img class ='x-check' src=Icons/check.svg>"
                } else {
                    document.querySelector("#td-acc-adj-"+i).innerHTML = "<img class ='x-check' src=Icons/x.svg>"
                }
            }
            // Test element i of rejectList
            if (i < rejLength){
                var input = model.parseInput(model.question.rejectList[i], model.question.alphabetType == 'char')
                var accepts = model.accepts(input);
                if (!accepts){
                    document.querySelector("#td-rej-adj-"+i).innerHTML = "<img class ='x-check' src=Icons/check.svg>"
                } else {
                    document.querySelector("#td-rej-adj-"+i).innerHTML = "<img class ='x-check' src=Icons/x.svg>"
                }
            }

        }
    }
}

var eventHandler = {
    clickBackground: function() {

    // if click was on element other than background, do nothing further.
    if (d3.event.target.id != "main-svg"){
        return;
    }

    // Dismiss context menu if it is present
    if (contextMenuShowing) {
        d3.select(".contextmenu").remove();
        contextMenuShowing = false;
        return;
    }
    
    // because :active only works in WebKit?
    svg.classed('active', true);

    if (d3.event.button != 0 || mousedown_node || mousedown_link) return;

    // If not in nodetool mode, do nothing:
    if (model.toolMode != "nodetool"){
        return;
    }

    // If rename menu is showing, do nothing
    if (renameMenuShowing) {
        return;
    }

    // insert new node at point
    var point = d3.mouse(this),
        node = {
            id: ++model.lastNodeID,
            accepting: false
        };
    node.x = point[0];
    node.y = point[1];
    model.nodes.push(node);

    restart();
    },
    clickLink: function(d){
        if (selected_link == d){
            selected_link = null;
        } else {
            selected_link = d
        }
        restart();
        if (model.toolMode == "texttool"){
            display.renameLinkForm(d.id);
            return
        }
        if (model.toolMode == "deletetool"){
            model.deleteLink(d.id);
            return;
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
    },
    addLinkMouseDown: function(d) {
        if (d3.event.ctrlKey) return;
        selected_node = null;
        restart();
    },
    createLink: function(d, eventType) {
        if (model.toolMode != "linetool"){
            return
        }
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

            mouseup_node = d;
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
            }

            // select new link
            selected_link = link;
            selected_node = null;
            restart();
        }
    },
    // Provides right-click funtionality for links
    linkContextMenu: function(id) {
        d3.event.preventDefault();

        //If menu already present, dismiss it.
        if (contextMenuShowing) {
            d3.select(".contextmenu").remove();
            contextMenuShowing = false;
            return;
        }
        if (id == undefined){
            // Get the id of the clicked link:
            var id = d3.event.target.id.slice(4);
        }

        var canvas = svg;
        contextMenuShowing = true;
        mousePosition = d3.mouse(svg.node());

        display.createLinkContextMenu(canvas, id, mousePosition);

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

        display.createStateContextMenu(svg, id, mousePosition);
    },
    //Function to handle clicks to the control palette:
    toolSelect: function() {
        //Clear previous selection:
        d3.select(".control-rect.selected").classed("selected", false);
        console.log(d3.event)
        var newMode = d3.event.target.id
        // If current mode is texttool, submit any open rename forms:
        if (model.toolMode == "texttool"){
            controller.renameSubmit();
        }
        // If current mode is linetool, reinstate drag-to-move
        if(model.toolMode == "linetool"|| model.toolMode == "texttool" || model.toolMode == "acceptingtool" || model.toolMode == "deletetool"){
            circle.call(force.drag);
        }
        // If current mode is the same as the new mode, deselect it:
        if (model.toolMode == newMode){
            model.toolMode = "none";
            newMode = "none";
        } else {
            model.toolMode = newMode
            d3.select("#"+newMode).classed("selected", true);
        }
        //  disable node dragging if needed by new mode:
        if (newMode == "linetool" || newMode == "texttool" || newMode == "acceptingtool" || newMode == "deletetool"){
            circle
                .on('mousedown.drag', null)
                .on('touchstart.drag', null);
        }
    },
    traceControl: function(){
        console.log(d3.event)
        var button = d3.event.target.id
        if (button == "rewind"){
            model.resetTrace();
            display.resetTrace();            
            return;
        }
        if (button == "forward"){
            display.traceStep(false)
            return;
        }
        if (button == "play"){
            model.currentInput = JSON.parse(JSON.stringify(model.fullInput));
            model.currentStates = [0];
            model.currentStep = 0;
            d3.selectAll(".node").classed("dim", true)
            d3.select("[id='0']").classed("dim", false).classed("highlight", true);
            d3.selectAll(".input").classed("dim", false).classed("highlight", false)
            setTimeout(function(){display.traceStep(true)}, 1500);
            return;
        }
        if (button == "stop"){
            model.resetTrace();
            display.dismissTrace();
        }
    }

}

var display = {
    askQuestion: function(){
        if (model.question.type == "none"){
            return
        }
        //Display question string
        var div = document.querySelector(".question")
        div.innerHTML = "<div class='question-text'>" + model.question.text + "</div>";
        //Add forms if recquired by the question:
        if (model.question.type == "give-list"){
            var form = "<form class='pure-form-aligned pure-form qformblock'>";
            for (i = 0; i < model.question.lengths.length; i++){
                var numChars = model.question.lengths[i]
                var id ="qf" + i
                var line = "<div class='pure-control-group'><label for='" + id +"'>" + numChars + " symbols</label><input type='text' class='qform', id ='" +id +"'>"
                if (i < model.question.lengths.length - 1){
                    //Close div here, unless on the last loop execution
                    line = line + "</div>"
                }
                form = form + line;
            }
            form = form + "<div><button class='pure-button qbutton' type='submit' formaction='javascript:checkAnswer.giveList()'>Check</button></div></div></form>";
            div.innerHTML += form;
        }
        if (model.question.type == "satisfy-list"){
            var table = "<div class='table-div'><table class='qtable'><tr><th>Accept</th><th class='table-space'> </th><th>Reject</th><th class='table-space'> </th></tr>";
            var accLength = model.question.acceptList.length;
            var rejLength = model.question.rejectList.length;
            var nRows = Math.max(model.question.acceptList.length, model.question.rejectList.length)
            for (i = 0; i < nRows; i++){
                table += "<tr>"
                // Build html for element i of the acceptList
                if (i < accLength){
                    var parsedInput = JSON.stringify(model.parseInput(model.question.acceptList[i], model.question.alphabetType == "char"))
                    var string = "<a class='trace-link' onclick='javascript:display.showTrace(" + parsedInput + ");'>'" + model.question.acceptList[i] + "'</a>"
                    table += "<td id=td-acc-" + i + "'>" + string + '</td><td id=\'td-acc-adj-' + i +"'> </td>"
                } else {
                    table += "<td></td><td></td>"
                }
                // Build html for element i of the rejectList
                if (i < rejLength){
                    var parsedInput = JSON.stringify(model.parseInput(model.question.rejectList[i], model.question.alphabetType == "char"))
                    var string = "<a class='trace-link' onclick='javascript:display.showTrace(" + parsedInput + ");'>'" + model.question.rejectList[i] + "'</a>"
                    table += "<td id=td-rej-" + i + "'>" + string + '</td><td id=\'td-rej-adj-' + i +"'> </td></tr>"
                } else {
                    table += "<td></td></tr>"
                }
            }
            table += "</table><button class='pure-button qbutton table-button' type='submit' onclick='javascript:checkAnswer.satisfyList()'>Check</button></div>"
            div.innerHTML += table;
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
                return colors(d.id)
            })
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
        }
        // create a button for each tool in tools
        for (i = 0; i < tools.length; i++){
            g.append("image")
                .attr("x", 0.5 * margin)
                .attr("y", 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", "Icons/"+ tools[i] +".svg")
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
    },
    drawTraceControls: function(){
        var bwidth = 40; //button width
        var strokeWidth = 2;
        var margin = 10;
        var g = svg.append("g")
                    .classed("tracecontrols", true);
        var tools = ["rewind", "back", "forward", "play", "stop"];
        // create a button for each tool in tools
        for (i = 0; i < tools.length; i++){
            g.append("image")
                .attr("y",  4 * height/5 +  0.5 * margin)
                .attr("x", (width/2) - (0.5 * bwidth * tools.length ) + 0.5 * margin + (i * bwidth))
                .attr("width", bwidth - margin)
                .attr("height", bwidth - margin)
                .attr("xlink:href", "Icons/trace-"+ tools[i] +".svg")
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
        var html = "<p data-id='" + id + "' class = 'button changeconditions'>Change Conditions</p>"
        html += "<p data-id='" + id + "' class = 'button deletelink'>Delete Link</p>"

        var menu = canvas.append("foreignObject")
            .attr('x', mousePosition[0])
            .attr('y', mousePosition[1])
            .attr('width', 260)
            .attr('height', 55)
            .classed("context-menu-holder", true)   
            .append("xhtml:div")
            .attr("class", "contextmenu")
            .html(html)

        d3.select(".changeconditions").on("click", function(){display.renameLinkForm(id)});
        d3.select(".deletelink").on("click", function(d){model.deleteLink(id)});

        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault()
        })
    },
    createStateContextMenu: function(canvas, id, mousePosition) {
        var html = "<p data-id='" + id + "' class = 'button toggleaccepting'>Toggle Accepting</p>"
        html += "<p data-id='" + id + "' class = 'button renamestate'>Rename State</p>"

        var menu = canvas.append("foreignObject")
            .attr('x', mousePosition[0])
            .attr('y', mousePosition[1])
            .attr('width', 260)
            .attr('height', 55)
            .classed("context-menu-holder", true)   
            .append("xhtml:div")
            .attr("class", "contextmenu")
            .html(html)

        d3.select(".toggleaccepting").on("click", function(){model.toggleAccepting(id)});

        d3.select(".renamestate").on("click", function(){display.renameStateForm(id)})

        // Disable system menu on right-clicking the context menu
        menu.on("contextmenu", function() {
            d3.event.preventDefault()
        })
    },
    dismissContextMenu: function() {
        d3.select(".contextmenu").remove();
        var container = document.querySelector(".context-menu-holder")
        if (container != null) {
            container.remove()
        }
        contextMenuShowing = false;
    },
    dismissRenameMenu: function() {
        d3.select(".rename").remove();
        renameMenuShowing = false;
    },
    drawInput: function(){
        var g = svg.append("g")
            .attr("class", "machine-input")
        // Displays the current input, used to draw the trace.
        var symbols = []
        if (model.fullInput.length < 10){
            display.colour = d3.scale.category10()
        } else{
            display.colour = d3.scale.category20b()
        }
        var totalInputLength = 0 //No need to account for spaces
        for (i = 0; i < model.fullInput.length; i++){
            totalInputLength += model.fullInput[i].length
        }
        var y = 70
        var charWidth = 25 // Rough estimate
        var inWidth = totalInputLength * charWidth;
        var x = width/2 - (inWidth/2)
        for (i = 0; i < model.fullInput.length; i++){  
            g.append("text")
                .text(model.fullInput[i])   
                .style("fill", d3.rgb(display.colour(i)).toString())
                .classed("input", true)
                .attr("id", "in"+i)
                .attr("x", x)
                .attr("y", y)
            // use bounding box to figure out how big the element is:

            x = x + (document.querySelector("#in"+i).getBBox().width) + 20
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
        var end = String(x + "," + y)
        svg.append('svg:path')
            .attr('class', 'link start')
            .attr('d', "M" + start + " L" + end);

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
            var scale = 0.11
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };

        } else {
            var scale = 0.21
            return {
                x: cx + scale * vpx,
                y: cy + scale * vpy,
                rotation: angle
            };
        }
    },
    reflexiveLink: function (x, y) {
        var x1 = x - 10;
        var y1 = y + 5

        var P1 = x1 + "," + y1;

        var x2 = x + 10;
        var y2 = y1;

        var P2 = x2 + "," + y2;

        var rad = 25     

        return ("M" + P1 + " A" + rad + " " + rad + " 0 1 1 " + P2);


    },
    renameLinkForm: function(id) {
        if (renameMenuShowing) {
            display.dismissRenameMenu()
        }
        //Get the data associated with the link
        var d = query.getLinkData(id);

        var current = String(d.input)
        if (current == undefined) {
            current = "";
        }

        //Calculate the position to put the form
        var labelPos = display.getLinkLabelPosition(d.source.x, d.source.y, d.target.x, d.target.y, query.isBezier(id));
        var formX = labelPos.x - 40;
        var formY = labelPos.y + 15;

        // create a form over the targeted node
        svg.append("foreignObject")
            .attr("width", 80)
            .attr("height", 50)
            .attr("x", formX)
            .attr("y", formY)
            .attr("class", "rename")
            .append("xhtml:body")
            .html("<form onkeypress='javascript:return event.keyCode != 13;'><input onsubmit='javascript:return false;' class='renameinput' id='link" + id + "' text-anchor='middle' type='text' size='2', name='link conditions' value='" + current + "'></form>");

        // give form focus
        document.getElementById('link' + id).focus();

        renameMenuShowing = true;
        display.dismissContextMenu();
    },
    renameStateForm: function(id) {
        if (renameMenuShowing) {
            display.dismissRenameMenu()
        }
        var d = query.getNodeData(id)
        var currentName = d.name
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
        document.getElementById('node' + id).focus();

        renameMenuShowing = true;
        display.dismissContextMenu();
    },
    resetTrace: function(){
        // Resets the display of a trace to the initial position
        // Resetting the model is handled separatly in model.resetTrace()
        d3.selectAll(".node").classed("dim", true)
        d3.select("[id='0']")
            .classed("dim", false)
            .classed("highlight", true)
            .attr("style","fill: rgb(44, 160, 44); stroke:rgb(0,0,0);");
        // Undim & unhighlight the machine input. 
        d3.selectAll(".input")
            .classed("dim", false)
            .classed("highlight", false)
            .attr("transform", "")
        d3.selectAll(".input-comma")
            .classed("dim", false)
        // Highlight the first input element
        d3.select("#in0").classed("highlight", true)

    },
    showTrace: function(input){
        // Takes input in form ['a', 'b', 'c']
        display.dismissTrace();
        traceInProgress = true;
        model.fullInput = JSON.parse(JSON.stringify(input));
        model.currentInput = JSON.parse(JSON.stringify(input));
        model.currentStates = [0];
        model.currentStep = 0;
        d3.selectAll(".node").classed("dim", true);
        display.drawInput();
        display.drawTraceControls();
        display.resetTrace();
    },
    traceStep: function(autoPlay){
        d3.selectAll(".node").classed("dim", true)
        d3.selectAll(".highlight").classed("highlight", false)
        if (model.currentInput.length != 0 && model.currentStates.length != 0){
            linksUsed = model.step()
            if (autoPlay){
                setTimeout(function(){display.traceStep(true)}, 3000)
            }
        }
        else {
            traceInProgress = false          
            return
        }

        //Dim all previous input letters that have been consumed
        var i = model.fullInput.length - model.currentInput.length
        for (j = 0; j < i - 1; j++){
            d3.select("#in" + j)
                .classed("highlight", false)
                .classed("dim", true)
                .transition().duration(1000)
                .attr("transform", "translate(0, 1000)");
            d3.select("#in-comma" + j)
                .classed("dim", true);
        }
        // check if most recent letter was consumed:
        if (model.currentStates.length > 0){
            d3.select("#in" + (i -1))
                .classed("dim", true)
                .classed("highlight", false)
                .transition().duration(1000)
                .attr("transform", "translate(0, 1000)");
                d3.select("#in-comma" + (i-1))
                .classed("dim", true);
            d3.select("#in" + i).classed("highlight", true)
            } 
        else 
            {
            var x = document.querySelector("#in"+(i-1)).getBBox().x
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
                        })
                })
            }

        for (j = 0; j < model.currentStates.length; j++){
                 var stateID = model.currentStates[j];
                 d3.select("[id='" + stateID + "']")
                    .classed("dim", false)
                    .classed("highlight", true)
                    .attr("style","fill: " + d3.rgb(display.colour(i -1)).toString() +"; stroke:rgb(0,0,0);");
             }
         }
}

var controller = {
    renameSubmit: function() {
        var menu = d3.select('.renameinput')[0][0];
        //Check menu is present
        if (menu == null){
            return;
        }
        var value = menu.value
        var id = menu.id
        var type = id.slice(0, 4);

        // Process differently if it is a node or link rename
        if (type == "node") {
            var nodeID = id.slice(4)
            var d = d3.select("[id='" + nodeID + "']").data()[0];
            d.name = value;
            //Change the displayed label to the new name
            var label = svg.select("#nodename" + nodeID);
            label.text(value)
        }
        if (type == "link") {
            var linkID = id.slice(4);
            var d = query.getLinkData(linkID);
            //Strip whitespace:
            value = value.replace(/ /g, "");
            //Split on comma and store
            d.input = value.split(',');
            //Change the label
            var label = svg.select("#linklabel" + linkID);
            label.text(function(d) {
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
    .attr("id", "main-svg")
    .attr('width', width)
    .attr('height', height);



// init D3 force layout
var force = d3.layout.force()
    .nodes(model.nodes)
    .links(model.links)
    .size([width, height])
    .linkDistance(150)
    .chargeDistance(160)
    .charge(-30)
    .gravity(0.00)//gravity is attraction to the centre, not downwards.
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
            // Check for reflexive links
            if (d.source == d.target){
                return display.reflexiveLink(d.source.x, d.source.y - 18)
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
        })


    // Move the input labels
    linkLabels.attr('transform', function(d) {
        // Determine if there is a link in the other direction.
        // We need this as labels will be placed differently for curved links.
        var sourceId = d.source.id
        var targetId = d.target.id
        exists = model.links.filter(function(l) {
            return (l.source.id === targetId && l.target.id === sourceId);
        })[0];
        exists = Boolean(exists)

        var position = display.getLinkLabelPosition(d.source.x, d.source.y, d.target.x, d.target.y, exists)

        return 'translate(' + position.x + ',' + position.y + ') rotate(' + position.rotation + ')';
    });
    linkLabels.attr('id', function(d) {
        return "linklabel" + d.id;
    });

    // Draw the nodes in their new positions
    circle.attr('transform', function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });

    // Move the start line
    d3.select(".start").attr('d', function(){
        var node0 = d3.select("[id='0']").data()[0];
        var length = 100;
        var start = String((node0.x - length - 20) + "," + node0.y);
        var end = String(node0.x - 27 + "," + node0.y)
        return "M" + start + " L" + end;
    })
        .style("marker-end", 'url(#end-arrow)')
        .style("stroke-width", "2px");
}

// update graph (called when needed)
function restart() {
	// path (link) group
    path = path.data(model.links, function(d){return d.id});

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
    circle = circle.data(model.nodes, function(d) {
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
    linkLabels = linkLabels.data(model.links, function(d){
        return d.id;
    });
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
        .on('click', function(d){
            eventHandler.clickLink(d);
        })
        .on('contextmenu', function(d){
            eventHandler.linkContextMenu(d.id)
        })

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
        .on('click', function(d) {
            eventHandler.clickNode(d)
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
        .attr('class', 'nodename')
        .attr('id', function(d) {
            return "nodename" + d.id;
        })
        .text(function(d) {
            return d.name;
        });



    // remove old nodes
    circle.exit().remove();

    // add listeners
    d3.selectAll(".node")
        .on('contextmenu', eventHandler.stateContextMenu);

    d3.selectAll(".link")
        .on('click', function(d){eventHandler.clickLink(d)})
        .on('contextmenu', eventHandler.linkContextMenu);

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
            .on('mousedown.drag', null)
            .on('touchstart.drag', null);
        svg.classed('ctrl', false);
    }
}

var logging = {
  sessionID: undefined,
  generateSessionId: function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    logging.sessionID = uuid;
  },
  sendInfo: function() {
    var url = window.location.href;
    if (logging.sessionID == undefined){
      logging.generateSessionId()
    }
    var data = "url=" + encodeURIComponent(url) + "&sessionID=" +encodeURIComponent(logging.sessionID)
    var request = new XMLHttpRequest();
    request.open('POST', '/cgi/s1020995/logging.cgi', true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send(data)

  }
}

// app starts here
display.askQuestion();
display.drawControlPalette();
svg.on('mousedown', eventHandler.clickBackground)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
var contextMenuShowing = false;
var renameMenuShowing = false;
restart();
force.start();
circle.call(force.drag);
// Add a start arrow to node 0
var node0 = d3.select("[id='0']").data()[0];
var traceInProgress = false;
display.drawStart(node0.x, node0.y);
logging.sendInfo()
setInterval(logging.sendInfo, 120000)