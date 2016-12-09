const Create = {
    setup: function() {
        // Setup the creation environment.
        Create.registerTraceButtonListener();
        Create.registerAlphabetButtonListener();
        Create.registerDFAbuttonListener();
        Create.registerReverseButtonListener();
        Create.registerMinimalDFAButtonListener();
        Create.registerExportToSvgButtonListener();
        Create.registerSubsetButtonListener();
        Create.registerSaveLoadButtonListener();
    },
    registerSubsetButtonListener: function(){
        d3.select("#subset-button")
            .on("click", Create.showSubset3);
    },
    registerTraceButtonListener:function(){
        d3.select("#traceform-button")
            .on("click", function(){
                const machine = Model.machines[0];
                //Try to guess a split symbol
                let splitSymbol = "";
                if(machine.alphabet.filter(x => x.length > 1).length > 0){ //True if the alphabet contains a symbol longer than 1 char.
                    splitSymbol = " ";
                }
                const input = Model.parseInput(document.querySelector("#traceform").value, splitSymbol);

                Controller.startTrace(machine, input);
            });
    },
    registerAlphabetButtonListener:function(){
        d3.select("#setalphabet-button")
            .on("click", function(){
                this.blur();
                const alphabet = document.querySelector("#setalphabet").value;
                Create.setalphabet(alphabet);
            });
    },
    registerDFAbuttonListener: function(){
        d3.select("#dfa-button").on("click", function(){
            this.blur();
            const machine = Model.machines[0];
            Controller.convertToDFA(machine);
        });
    },
    registerReverseButtonListener: function(){
        d3.select("#reverse-button").on("click", function(){
            this.blur();
            const machine = Model.machines[0];
            Controller.reverseMachine(machine);
        });
    },
    registerMinimalDFAButtonListener: function(){
        d3.select("#minimal-dfa-button").on("click", function(){
            this.blur();
            const machine = Model.machines[0];
            Controller.minimize(machine);
        });
    },
    registerExportToSvgButtonListener: function(){
        d3.select("#export-svg-button").on("click", function(){
            this.blur();
            Display.exportToSVG("m1", true, true);
        });
    },
    registerSaveLoadButtonListener: function(){
        d3.select("#save-button").on("click", function(){
            this.blur();
            const success = Create.saveMachine();
            const buttonContainer = d3.select(this.parentNode);
            d3.select("#save-feedback").remove();
            const feedback = buttonContainer.append("span").attr("id", "save-feedback");
            if(success){
                feedback.text("Machine saved to local storage.");
            } else {
                feedback.text("An error occured – machine not saved.");
            }
            setTimeout(() => feedback.remove(), 2750);
        });
        d3.select("#load-button").on("click", function(){
            this.blur();
            Create.drawLoadMenu();
        });

    },
    setalphabet: function(string){
        try{
            const alphabet = JSON.parse(string);
            document.querySelector("#alphabeterror").innerHTML = "";
            if(alphabet.constructor !== Array){
                throw new Error("alphabet must be an array.");
            }
            Controller.setAlphabet(Model.machines[0], alphabet);
        }
        catch(e){
            document.querySelector("#alphabeterror").innerHTML = 'Parse error - enter alphabet in form ["a", "b"]';
        }
    },
    clearMenus: function(){
        d3.selectAll(".subset").remove();
        Display.makeNodesUnSelectable(Model.machines[0]);
        d3.select(".controls").style("display", "block");
        // Restore background event listener.
        d3.select("#m1").on("mousedown", () => EventHandler.backgroundClick(Model.machines[0], true));
    },
    drawSubsetTable: function(machine){
        d3.selectAll(".subset").remove();
        //Add the div and table
        const subsetDiv = d3.select("body").append("div")
                        .classed("subset", true)
                        .style("width", "15%")
                        .style("float", "right");
        const table = subsetDiv.append("table")
                        .classed("minimize-table", true)
                        .style("table-layout", "fixed")
                        .style("width", "140%")
                        .style("margin-left", "-50%")
                        .style("margin-top", "12.45em");

        const transitionTable = machine.getTransitionTable();


        //Add the table headers
        const alphabet = machine.alphabet;
        const head = table.append("thead");
        head.append("tr")
            .append("th")
            .attr("colspan", 1 + alphabet.length)
            .text("States in NFA");

        const alphabetHeader = head.append("tr");

        alphabetHeader.append("th").text(""); //Header for left column

        alphabet.forEach(symbol => alphabetHeader.append("th").text(symbol));

        //Add the existing node names
        const body = table.append("tbody")
                            .classed("minimize-table", true)
                            .classed("subset", true);
        const nodes = machine.getNodeListNameSorted();
        nodes.forEach(function(node){
            const tableEntry = transitionTable[node.id].transitions;
            const row = body.append("tr")
                .attr("id", "subset-nfa-" + node.id)
                .classed("subset-" + node.id, true)
                .classed("minimize-table", true);
            row.append("td").text(node.name);
            //Add a cell for each alphabet symbol
            for(let i = 0; i < alphabet.length; i++){
                const states = tableEntry[i].names;
                let stateName = states.length < 1 ? "{ }" : states.reduce((a,b) => a + ", " + b);
                row.append("td")
                    .classed("alphabet-" + i, true)
                    .classed("subset-transition", true)
                    .text(stateName);
            }
        });



        //Split table here - insert a blank line with no border
        body.append("tr")
            .style("border-style", "none")
            .append("td")
            .text("\u00A0")
            .style("border-style", "none");

        //Add new heading
        body.append("tr")
            .append("th")
            .attr("colspan", 1 + alphabet.length)
            .text("Reachable States");

        //Repeat the alphabet
        const alphabetHeader2 = body.append("tr");

        alphabetHeader2.append("th").text(""); //Header for left column

        alphabet.forEach(symbol => alphabetHeader2.append("th").text(symbol));

        //Add a dialogue box
        subsetDiv.append("div")
            .classed("minimize-dialogue", true)
            .style("width", "136%")
            .style("padding-left", "2%")
            .style("padding-right", "2%")
            .style("padding-top", "0.2em")
            .style("padding-bottom", "0.2em")
            .style("margin-left", "-50%")
            .style("margin-top", "1em")
            .style("border-style", "solid")
            .style("border-color", "black")
            .style("border-width", "thin")
            .text("\u00A0");
    },

    showSubset3(){
        const m = Model.machines[0];
        //Check that the machine has an initial state, as we need that.
        if(m.getInitialNodeCount() === 0){
            Display.alert("m1", "Error", "Machine must have at least one inital state.");
            return;
        }
        Controller.issueNames(m);
        EventHandler.toolSelect(m.id, "none");
        d3.select(".controls").style("display", "none");

        const copy = m.clone();
        Create.drawSubsetTable(m);

        const svg = d3.select("#m1");
        // Disable the listener for background clicks
        // as that will dismiss menus (which we don't want here).
        svg.on("mousedown", false);
        // It must be reinstated when we are done.
        const messageHolder = d3.select(".minimize-dialogue");
        const alphabet = copy.alphabet;

        const conversionObj = copy.convertToDFA();
        const transitionTable = conversionObj[0];
        let oldToNewMap; //Will map nodeSetIDs to nodes in the new machine.

        //Keep track of what is left to be done
        const rowsToAdd = {}; // Maps stateIDs to the cells linking to them
                             // This allows clicking on one to clear them all.
        Object.keys(transitionTable).forEach(id => rowsToAdd[id] = []);
        let emptyCellsLeft = 0;
        // Track the cell currently being filled:
        let currentCell = null;

        const highlightNodeSet = function(row, nodeArray, forceState){
            if(row.classed("temp-highlight") || forceState === "off"){
                row.classed("temp-highlight", false);
                Display.highlightNodes(svg,[],"#43a047",true);
            } else {
                row.classed("temp-highlight", true);
                Display.highlightNodes(svg,nodeArray,"#43a047",true);
            }
        };

        //Make all rows in the NFA table highlight on click/mouseover
        m.getNodeList().forEach(function(node){
            const row = d3.select("#subset-nfa-" + node.id);
            const cell = d3.select(row.node().firstChild);

            cell.on("mousedown", () => highlightNodeSet(row, [node], false))
                .on("mouseover", () => highlightNodeSet(row, [node], false))
                .on("mouseout", () => highlightNodeSet(row, [node], "off"));
        });

        const getSetName = function(nodes){
            // Takes an array of nodes and returns a display name of form "A, B, C"
            if(!nodes || nodes.length == 0){
                return "{ }";
            } else {
                const names = nodes.map( node => node.name).sort();
                return names.reduce((a,b) => `${a}, ${b}`);
            }
        };

        const nodeListEquals = function(nodesA, nodesB){
            // Takes two node arrays and tests them for equality by nodeID
            if(nodesA.length !== nodesB.length){
                return false;
            }
            nodesA = nodesA.map(node => node.id).sort();
            nodesB = nodesB.map(node => node.id).sort();
            for(let i = 0; i < nodesA.length; i++){
                if(nodesA[i] !== nodesB[i]){
                    return false;
                }
            }
            return true;
        };

        const nodeListDifference = function(nodesA, nodesB){
            // Takes two node arrays where nodeListEquals(nodesA, nodesB) is false.
            // returns ["additional", Node] if nodesB contains a node not in nodesA
            // or returns ["missing", Node] if nodesA has a node that is not in nodesB

            const aIDs = nodesA.map(node => node.id);

            // First, check for additional nodes in nodesB
            for(let i = 0; i < nodesB.length; i++){
                const bID = nodesB[i].id;
                if(aIDs.indexOf(bID) === -1){
                    return ["additional", nodesB[i]];
                }
            }

            const bIDs = nodesB.map(node => node.id);

            // Then, check for missing nodes
            for(let i = 0; i < nodesA.length; i++){
                const aID = nodesA[i].id;
                if(bIDs.indexOf(aID) === -1){
                    return ["missing", nodesA[i]];
                }
            }

            throw new Error("No difference found in nodeListDifference.");
        };

        const performConversion = function(){
            const nfaNodes = m.getNodeList();
            const conversionObj = Controller.convertToDFA(m, true);
            oldToNewMap = conversionObj[1]; //Maps the nodeSetIDs of reachable states in the old machine to nodes in the new one.
            const nfaNodeMap = conversionObj[2]; //Maps the nodeIDs of nodes in the old machine to an array of nodes in the new one.
            const nodeSetIDs = Object.keys(oldToNewMap);

            // Now we need to replace the highlight listeners, as they
            // are pointing at the old machine
            nfaNodes.forEach(function(node){
                // Do the NFA table first
                const row = d3.select("#subset-nfa-" + node.id);
                const cell = d3.select(row.node().firstChild);
                const dfaNodes = nfaNodeMap[node.id];

                cell.on("mousedown", () => highlightNodeSet(row, dfaNodes, false))
                    .on("mouseover", () => highlightNodeSet(row, dfaNodes, false))
                    .on("mouseout", () => highlightNodeSet(row, dfaNodes, "off"));
            });

            nodeSetIDs.forEach(function(nodeSetID){
                // Then do the reachable states table
                const row = d3.select("#subset-" + nodeSetID);
                const cell = d3.select(row.node().firstChild);
                const dfaNode = oldToNewMap[nodeSetID];

                cell.on("mousedown", () => highlightNodeSet(row, [dfaNode], false))
                    .on("mouseover", () => highlightNodeSet(row, [dfaNode], false))
                    .on("mouseout", () => highlightNodeSet(row, [dfaNode], "off"));
            });

            //Clear any highlights
            d3.selectAll("tr.highlight").classed("highlight", false);
            d3.selectAll("td.highlight").classed("highlight", false);

            // Clear the message box
            messageHolder.html("");

            // Give an option to toggle the blackhole state (if needed);
            if(!m.isCompletelySpecified()){
                const toggleBHButton = messageHolder.append("button")
                                                    .classed("pure-button", true)
                                                    .style("margin-right", "5%");
                const getHideFunction = function(node){
                    return function(){
                        toggleBHButton
                            .text("Show { }")
                            .on("click", showFunction);
                        Controller.deleteNode(node, true);
                    };
                };

                const showFunction = function(){
                    toggleBHButton
                        .text("Hide {}");
                    const bhNode = Controller.showBlackholeState(m, true);
                    toggleBHButton.on("click", getHideFunction(bhNode));
                };

                toggleBHButton
                    .text("Show { }")
                    .on("click", showFunction);
            }

            // Add a Finish button to dismiss the menu;

            messageHolder.append("button")
                .text("Finish")
                .classed("pure-button", true)
                .on("click", function(){
                    Create.clearMenus();
                });
        };

        const setContextHint = function(){
            // Gives the user a hint as to what is left to be done.
            // If there is nothing left, prompt them to transfrom the machine
            let hint;
            if(emptyCellsLeft > 0){
                hint = "<br><b>Hint</b>: Click on an empty cell to fill it.";
                messageHolder.append("div").html(hint);
                return;
            } else if(Object.keys(rowsToAdd).length > 0) {
                hint = "<br><b>Hint</b>: Click on a cell with a new state to add a row for it.";
                messageHolder.append("div").html(hint);
                return;
            } else {
                messageHolder.append("div").html("<br><b>Complete!<b><br>");
                messageHolder.append("button").text("Build DFA")
                    .on("click",performConversion);
            }

        };

        const addNodeSet = function(nodeSetID){
            // Adds a new row to the reachable states table, with event listeners
            // to allow the subset process to advance further.

            const rowObj = transitionTable[nodeSetID];
            const nodes = rowObj.nodes;
            const name = getSetName(nodes);

            if(!rowsToAdd[nodeSetID]){
                Display.alert("Row Exists", "The set " + name + " has already been added to the table.");
            } else {
                rowsToAdd[nodeSetID].forEach(function(cell){
                    cell.classed("to-add", false)
                        .on("click", null);
                });
                delete rowsToAdd[nodeSetID];
            }

            //Add a new empty row
            const newRow = d3.select("tbody.subset").append("tr");
            newRow.append("td").text("\u00A0");
            for(var i = 0; i < alphabet.length; i++){
                newRow.append("td")
                    .text("\u00A0") //non-breaking-space
                    .classed("alphabet-" + i, true);
            }

            //Clear existing highlights
            d3.selectAll("tr.highlight").classed("highlight", false);
            d3.selectAll("td.highlight").classed("highlight", false);

            // Fill first cell
            const row = d3.select(document.querySelector("tbody.subset").lastChild)
                            .attr("id", "subset-" + rowObj.id)
                            .classed("subset-" + rowObj.id, true)
                            .classed("highlight", true);
            const cell = d3.select(row.node().firstChild);
            cell.text(name);

            // Add listener to highlight nodes on mouseover/click
            const diagramNodes = nodes.map(node => m.nodes[node.id]);

            cell.on("mousedown", () => highlightNodeSet(row, diagramNodes, false))
                .on("mouseover", () => highlightNodeSet(row, diagramNodes, false))
                .on("mouseout", () => highlightNodeSet(row, diagramNodes, "off"));

            //Set a message explaining what we are doing
            messageHolder.html("Added a row for the reachable state <b>" + name + "</b>.");
            emptyCellsLeft += alphabet.length;

            setContextHint();

            // Make the other cells clickable
            // When clicked the user will be prompted to select the nodes reachable for that symbol

            alphabet.forEach(function(symbol, i){
                const cell = row.select(".alphabet-" + i);
                cell.classed("to-fill", true)
                    .on("click", function(){
                        d3.selectAll("tr.highlight").classed("highlight", false);
                        d3.selectAll("td.highlight").classed("highlight", false);
                        cell.classed("highlight", true);

                        if(currentCell){
                            // Clear any partially complete cell.
                            currentCell.text("")
                        }
                        currentCell = cell;

                        nodes.forEach(node => d3.select(`#subset-nfa-${node.id}`).classed("highlight", true));
                        messageHolder.html("");
                        messageHolder.append("span")
                            .attr("id", "select-prompt")
                            .html("On the NFA to the left, select the states reachable from <b>" + name + "</b> for input <b>" + symbol + "</b>.<br><br>");
                        messageHolder.append("span")
                            .attr("id", "select-feedback");

                        // Add a done button, with code to check the answer.
                        messageHolder.append("button")
                            .text("Done")
                            .classed("pure-button", true)
                            .on("click", function(){
                                // When the done button is clicked, check if the correct nodes have
                                // been selected.
                                const selectedNodes = m.getNodeList().filter(node => node.selected);
                                const solutionNodes = rowObj.transitions[symbol].nodes;
                                if(nodeListEquals(selectedNodes, solutionNodes)){
                                    // If they have, fill the cell
                                    cell.text(getSetName(solutionNodes))
                                        .classed("to-fill", false);

                                    emptyCellsLeft--;
                                    currentCell = null;

                                    // Clear the user's selection
                                    Display.makeNodesUnSelectable(m);

                                    // If this cell's value has not been added to the table, register a new click listener
                                    const targetID = rowObj.transitions[symbol].id; // The id the nodeSet this cell points to.
                                    if(rowsToAdd[targetID]){
                                        cell.classed("to-add", true)
                                            .on("click", function(){
                                                addNodeSet(targetID);
                                                cell.on("click", null)
                                                    .classed("to-add", false);
                                            });
                                        rowsToAdd[targetID].push(cell);
                                    } else {
                                        // clear event listener, as nothing left to do
                                        cell.on("click", null);

                                    }
                                    d3.selectAll("tr.highlight").classed("highlight", false);
                                    messageHolder.html(`Correct. Added the transition(s) from state <b>${name}</b> for input <b>${symbol}</b>.<br><br>`);
                                    setContextHint();
                                } else {
                                    // Answer is incorrect, give feedback.
                                    const setDifference = nodeListDifference(solutionNodes, selectedNodes);
                                    if(setDifference[0] === "missing"){
                                        const missingNodeName = setDifference[1].name;
                                        d3.select("#select-feedback")
                                            .html(`The state <b>${missingNodeName}</b> is <b>also</b> reachable, try again.<br>`);
                                    } else {
                                        const extraNodeName = setDifference[1].name;
                                        d3.select("#select-feedback")
                                            .html(`The state <b>${extraNodeName}</b> is <b>not</b> reachable, try again.<br>`);
                                    }
                                }
                            });
                        Display.makeNodesSelectable(m, function(node){
                            // Callback function is executed when a node is selected/deselected
                            // This is used to update the cell while nodes are being selected/
                            const selectedNodes = node.machine.getNodeList().filter(node => node.selected)
                            let selectedNodesName;
                            if (selectedNodes.length === 0){
                                // Want empty list name to be "" rather than
                                selectedNodesName = ""
                            } else {
                                selectedNodesName = getSetName(selectedNodes);
                            }
                            cell.text(selectedNodesName);
                        });
                    });
            });
        };

        const initialStateID = m.getInitialState().sort().reduce((a,b) => `${a}_${b}`);
        addNodeSet(initialStateID);
        messageHolder.html("Started the reachable states table with the initial state.<br><br> Click an empty cell to fill it.");
    },
    showSubset: function(){
        const m = Model.machines[0];
        //Check that the machine has an initial state, as we need that.
        if(m.getInitialNodeCount() === 0){
            Display.alert("m1", "Error", "Machine must have at least one inital state.");
            return;
        }
        Controller.issueNames(m);
        const copy = m.clone();
        Create.drawSubsetTable(copy);

        const svg = d3.select("#m1");
        const messageHolder = d3.select(".minimize-dialogue");
        const alphabet = copy.alphabet;

        // array of the ids of all nodes in the base machine
        const nfaNodeIDs = copy.getNodeList().map(node => node.id);

        const eventQueue = [];

        // First step – populate the base machine transition table
        // Either in one go or line-by-line
        const baseLineByLine = true;

        const initialTransitionTable = m.getTransitionTable();
        // Add a type to each transition object
        initialTransitionTable.forEach(obj => obj.type = "baseNode");
        // Add a message for each
        initialTransitionTable.forEach(obj => obj.message = `Added transitions for state <b id="ref-${obj.node.id}">${obj.node.name}</b>.`);
        // Add the nodes field:
        initialTransitionTable.forEach(obj => obj.nodes = [obj.node]);
        // Add the transitions to the queue
        initialTransitionTable.forEach(event => eventQueue.push(event));

        // Next event after base transition table – add the inital state
        const initialStateIDs = copy.getInitialState().sort();
        let initialStateID;
        if(initialStateIDs.length > 0){
            initialStateID = initialStateIDs.reduce((a,b) => `${a}_${b}`);
        } else {
            initialStateID = null;
        }
        const initialStates = initialStateIDs.map(id => m.nodes[id]);
        const initialStateNames = initialStateIDs.map(id => copy.nodes[id].name).sort();

        const initialState = {"type": "setAdded",
                              "id": initialStateID,
                              "names": initialStateNames,
                              "nodes": initialStates};
        eventQueue.push(initialState);

        const finish = function(){
            console.log("DONE");
        };

        const setName = function(names){
            if(names.length == 0){
                return "{ }";
            } else {
                return names.reduce((a,b) => `${a}, ${b}`);
            }
        };


        //This function will be called when the user clicks the advance button
        const advance = function(){
            if(eventQueue.length === 0){
                finish();
                return;
            }
            const event = eventQueue.shift();
            messageHolder.html(event.message);
            if(event.type === "baseNode"){
                // This is the transition table for the initial machine
                const tableRow = d3.select(`#subset-nfa-${event.id}`);
                event.transitions.forEach(function(transition, i){
                    tableRow.select(`.alphabet-${i}`)
                        .text(setName(transition.names))
                        .on("mouseover", function(){
                            // TODO: Also highlight rows in the reachable table (if they exist).
                            Display.highlightNodes(svg, transition.nodes, "#43a047", true);
                        })
                        .on("mouseout", function(){
                            Display.unhighlightNodes(svg);
                        });
                });
            }
        };



        // Add Advance Button
        d3.select("div.subset")
            .append("button")
            .attr("id", "subset-advance")
            .text("Advance")
            .classed("pure-button", true)
            .style("margin-left", "-50%")
            .style("margin-top", ".5em")
            .on("click", advance);
    },

    showSubsetOld: function(){
        //Process from users POV:
        // Add transition table row by row for states
        // Add initial state to reachable states,
        // From initial state, build up all reachable states

        const m = Model.machines[0];
        Controller.issueNames(m);
        const copy = m.clone();
        Create.drawSubsetTable(copy);
        const alphabet = copy.alphabet;

        //array of the ids of all nodes in the base machine
        const nfaNodeIDs = copy.getNodeList().map(node => node.id);

        //Create a initial state task to add to the top of the queue
        const initialStateIDs = copy.getInitialState().sort();
        let initialStateID;
        if(initialStateIDs.length > 0){
            initialStateID = initialStateIDs.reduce((a,b) => `${a}_${b}`);
        } else {
            initialStateID = null;
        }
        const initialStateNames = initialStateIDs.map(id => copy.nodes[id].name).sort();
        const initialState = {"type": "setAdded",
                              "id": initialStateID,
                              "names": initialStateNames};
        let subsetSteps = [initialState];

        const initialTransitionTable = copy.getTransitionTable();
        //Add a type to each transition object
        initialTransitionTable.forEach(obj => obj.type = "transitionsAdded");

        const conversionObj = copy.convertToDFA();

        const transitionTable = conversionObj.transitionTable;


        //Steps should be Initial state, then orginal transition table. Composite states will be added as they are found.
        subsetSteps = subsetSteps.concat(initialTransitionTable);

        //Keep track of state here
        const statesAdded = {};
        const transitionsAdded = {};




        //This function will be called when the user clicks the advance button
        const advance = function(){
            if(subsetSteps.length === 0){
                finish();
                return;
            }
            const step = subsetSteps.shift();
            if(step.type == "transitionsAdded"){
                // Add transitions to table
                // step object in form: {type: "transitionsAdded", id:"1", transitions: [{id:'1', names:["a"]}, {id:"1+2", names:["a","b"]}
                const rowID = step.id;
                const row = d3.selectAll(".subset-" + rowID); //Potentially select two rows here - one in the original listing, one in the reachable states listing
                if(rowID in transitionsAdded){
                    advance();
                    return;
                }

                const newStatesObj = {};  // record any new composite states. Obj just holds true
                const newStatesList = [];  // states stored in array to maintain order.

                //Draw the row
                for(let i = 0; i < alphabet.length; i++){
                    const cell = row.select(".alphabet-" + i);
                    const stateID = step.transitions[i].id;
                    let reachableNames = step.transitions[i].names.sort();
                    if(reachableNames.length == 0){
                        reachableNames = "{ }";
                    } else {
                        reachableNames = reachableNames.reduce((a,b) => `${a}, ${b}`);
                    }
                    cell.text(reachableNames);

                    //StateID not in states added or in newStates (and not null)
                    if(stateID && !(stateID in statesAdded) && !(stateID in newStatesObj)){
                        newStatesObj[stateID] = true;
                        newStatesList.push({type: "setAdded", id:stateID, names: step.transitions[i].names});
                    }
                }
                // Store id
                transitionsAdded[rowID] = step;
                // Add any new sets to the front of the queue
                newStatesList.forEach(stepObj => subsetSteps.unshift(stepObj));
                // Add filling each of those rows to the end of the queue (if the node is not in the base machine)
                newStatesList.map(step => step.id).filter(stateID => nfaNodeIDs.indexOf(stateID) == -1).forEach(stateID => subsetSteps.push(transitionTable[stateID]));
            } else{
                // Type must be "setAdded"
                // Step object in form: {type: "setAdded", id:"1_2", names:["a", "b"]}
                if(step.id in statesAdded){
                    advance();
                    return;
                }

                const name = step.names.sort().reduce((a,b) => `${a}, ${b}`);

                const row = d3.select(document.querySelector("tbody.subset").lastChild)
                                .attr("id", "subset-" + step.id)
                                .classed("subset-" + step.id, true);
                const cell = d3.select(row.node().firstChild);
                cell.text(name);

                //Check if this row has been written out already (ie it is one of the initial rows)
                if(step.id in transitionsAdded){
                    //Copy from above
                    const origRow = d3.select("#subset-nfa-" + step.id);
                    for(let i = 0; i < alphabet.length; i++){
                        const text = origRow.select(".alphabet-" + i).text();
                        row.select(".alphabet-" + i).text(text);
                    }
                }

                //Add a new empty row (TODO: only do this if the extra row will be needed(?))
                const newRow = d3.select("tbody.subset").append("tr");
                newRow.append("td").text("\u00A0");
                for(var i = 0; i < alphabet.length; i++){
                    newRow.append("td")
                        .text("\u00A0") //non-breaking-space
                        .classed("alphabet-" + i, true);
                }

                statesAdded[step.id] = true;

            }
        };

        //Add the initial state on first draw
        advance();

        const finish = function(){
            d3.select("#subset-advance").remove();
            Controller.convertToDFA(m);
            Controller.showBlackholeState(m);
            d3.select("#subset-cancel")
                .text("Done");
        };

        // Add Advance Button
        d3.select("div.subset")
            .append("button")
            .attr("id", "subset-advance")
            .text("Advance")
            .classed("pure-button", true)
            .style("margin-left", "-50%")
            .style("margin-top", ".5em")
            .on("click", advance);

        // Add cancel button
        d3.select("div.subset")
            .append("button")
            .attr("id", "subset-cancel")
            .text("Cancel")
            .classed("pure-button", true)
            .style("float", "right")
            .style("margin-top", ".5em")
            .style("margin-right", "10%")
            .on("click", () => d3.selectAll(".subset").remove());
    },

    saveMachine: function(){
        // Tests that localStorage is enabled
        if(!localStorage){
            return false;
        }

        // Saves the current machine to local storage.
        const m = Model.machines[0];
        const thumbnail = Display.getMachineSVG(m.id, true);
        const specification = m.getSpec();

        // Load existing machines and find a unique default name
        let name = "FSM-1";
        let savedMachines = {"__meta__":{"version": 1.0}};
        if(localStorage.getItem("savedFiniteStateMachines")){
            savedMachines = JSON.parse(localStorage.getItem("savedFiniteStateMachines"));
            let i = 2;
            while(savedMachines[name]){
                name = "FSM-" + i;
                i++;
            }
        }

        // Update and save the savedMachines object
        savedMachines[name] = {
            "timeSaved": Math.floor(Date.now() / 1000),
            thumbnail,
            specification
        };

        // Save the new string to local storage, then verify that the operation was successful
        // (Do this as some platforms will only pretend if out of memory) [citation needed]
        const newString = JSON.stringify(savedMachines);

        localStorage.setItem("savedFiniteStateMachines", newString);

        if(localStorage.getItem("savedFiniteStateMachines") === newString){
            return true;
        } else {
            return false;
        }

    },

    loadMachine: function(name){
        const savedMachines = JSON.parse(localStorage.getItem("savedFiniteStateMachines"));
        const thisSpec = savedMachines[name].specification;
        const machine = Model.machines[0];
        // Clear the current machine, and update the display.
        machine.deleteAllNodes();
        Display.forceTick(machine.id);
        Display.update(machine.id);

        // Build the current machine to the given specification.
        machine.build(thisSpec);
        // And update the display.
        Display.resetColours(machine.id);
        Display.forceTick(machine.id);
        Display.update(machine.id);
        Display.reheatSimulation(machine.id);

        // Log the event for analytics
        Logging.incrementSessionCounter("loadedMachine");
    },

    drawLoadMenu: function(pageN){
        if(!pageN){
            pageN = 0;
        }
        const svg = d3.select("#m1");
        //Check if load menu already exists, dismiss and return if it is.
        const existingMenu = svg.select(".load-menu");
        if(!existingMenu.empty()){
            existingMenu.remove();
            return;
        }

        Display.clearMenus(d3.select("#m1"));

        // Get the list of saved machines
        let savedMachines;
        let storageObj;
        if (!localStorage.getItem("savedFiniteStateMachines")){
            savedMachines = [];
        } else {
            storageObj = JSON.parse(localStorage.getItem("savedFiniteStateMachines"));
            const machineNames = Object.keys(storageObj).filter(name => name !== "__meta__");
            // Tell each machineObj its own name
            machineNames.forEach(name => storageObj[name].name = name);
            savedMachines = machineNames.map(name => storageObj[name]);
            savedMachines.sort((a,b) => b.timeSaved - a.timeSaved);
        }

        const menuWidth = 0.75 * svg.attr("width");
        const menuHeight = 0.5 * svg.attr("height");
        const fontSize = 10;
        const xBorder = 15;

        const x = (svg.attr("width") - menuWidth)/2;
        const y = 0.1 * svg.attr("height");
        const g = svg.append("g")
                    .classed("load-menu", true)
                    .classed("clearable-menu", true);

        g.append("rect")
         .attr("x", x)
         .attr("y", y)
         .attr("width", menuWidth)
         .attr("height", menuHeight)
         .attr("fill", "#FFFFFF")
         .attr("stroke", "#555555");

        const textX = x + xBorder;
        let textY = y + (2 * fontSize);

        // Add a title to the popup
        g.append("text")
            .text("Load Machine")
            .attr("x", textX)
            .attr("y", textY)
            .attr("font-size", 1.5 * fontSize);

        textY = textY + 4 * fontSize;

        if(savedMachines.length == 0){
            // No machines saved
            g.append("text")
                .text("No saved machines found.")
                .attr("x", textX)
                .attr("y", textY)
                .attr("font-size", 1 * fontSize);
        } else {
            // Draw selection dialogue
            const selection = g.append("g")
                                .classed("select-machine", true);

            const machinesPerPage = 4;
            const selectHeight = 0.55 * menuHeight;
            const selectWidth = 0.75 * menuWidth;

            const selectX = (svg.attr("width") - selectWidth)/2;
            const selectY = y + 3 * fontSize;

            // Add the rect that will hold the saved machines (selectBox)
            selection.append("rect")
                     .attr("x", selectX)
                     .attr("y", selectY)
                     .attr("width", selectWidth)
                     .attr("height", selectHeight)
                     .attr("fill", "#FFFFFF")
                     .attr("stroke", "#555555");

            // Add forward/backward arrows
            const arrowHeight = 0.6 * selectHeight;
            const arrowWidth = 0.15 * arrowHeight;
            const arrowMidY = selectY + selectHeight/2;
            const arrowXoffset = 0.02 * selectWidth; // Distance to selectBox (at closest point)

            const scroll = function(steps){
                g.remove();
                Create.drawLoadMenu(pageN + steps);
            };

            selection.append("path")
                    .attr("id", "load-back-arrow")
                    .classed("load-arrow", true)
                    // .classed("inactive", pageN === 0)
                    .classed("can-scroll", pageN !== 0)
                    .attr("d", `M${selectX - arrowXoffset} ${arrowMidY + arrowHeight/2} l${-arrowWidth} ${-arrowHeight/2} l${arrowWidth} ${-arrowHeight/2} Z`)
                    .on("click", function(){
                        if(pageN !== 0){
                            scroll(-1);
                        }
                    });

            selection.append("path")
                    .attr("id", "load-forward-arrow")
                    .classed("load-arrow", true)
                    // .classed("inactive", (1 + pageN) * machinesPerPage >= savedMachines.length)
                    .classed("can-scroll", (1 + pageN) * machinesPerPage < savedMachines.length)
                    .attr("d", `M${selectX + selectWidth + arrowXoffset} ${arrowMidY + arrowHeight/2} l${arrowWidth} ${-arrowHeight/2} l${-arrowWidth} ${-arrowHeight/2} Z`)
                    .on("click", function(){
                        if((1 + pageN) * machinesPerPage < savedMachines.length){
                            scroll(1);
                        }
                    });

            const drawSavedMachines = function(pageN){
                const offset = pageN * machinesPerPage;
                if(pageN * machinesPerPage >= savedMachines.length){
                    // Prevent empty page when the last entry on a page is removed
                    pageN = pageN - 1;
                }
                for(let i = 0; i < machinesPerPage && i + offset < savedMachines.length; i++){
                    const machineObj = savedMachines[i + offset];
                    const thumbnailBlob = new Blob([machineObj.thumbnail], {type:"image/svg+xml"});
                    const thumbnailURI = window.URL.createObjectURL(thumbnailBlob);
                    const machineG = selection.append("g")
                                        .classed("saved-machine", true);

                    // Add the machine thumbnail
                    machineG.append("image")
                            .attr("preserveAspectRatio", "xMidYMid slice")
                            .attr("href", thumbnailURI)
                            .attr("x", selectX + i * (selectWidth/machinesPerPage))
                            .attr("y", selectY)
                            .attr("width", selectWidth / machinesPerPage)
                            .attr("height", selectHeight * 0.8);

                     // Add a rect over the thumbnail and text to provde a border
                    machineG.append("rect")
                        .attr("x", selectX + i * (selectWidth/machinesPerPage))
                        .attr("y", selectY)
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight)
                        .style("stroke", "#555555")
                        .style("fill-opacity", "0");

                    // Add a rect over the thumbnail, and make it clickable
                    machineG.append("rect")
                        .attr("x", selectX + i * (selectWidth/machinesPerPage))
                        .attr("y", selectY)
                        .attr("id", "saved-machine-" + (i + 1))
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight * 0.8)
                        .style("stroke", "#555555")
                        .style("fill-opacity", "0")
                        .style("cursor", "pointer")
                        .on("click", function(){
                            g.remove();
                            Create.loadMachine(machineObj.name);
                        });

                    // Add the name of the saved machine
                    machineG.append("text")
                        .attr("x", 5 + selectX + i * (selectWidth/machinesPerPage))
                        .attr("y", selectY + 0.95 * selectHeight)
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight * 0.8)
                        .text(machineObj.name)
                        .attr("editable", "simple")
                        .style("font-size", fontSize);

                    // Add an option to edit the name
                    machineG.append("text")
                        .attr("x", selectX + (i + 0.7) * (selectWidth/machinesPerPage))
                        .attr("y", selectY + 0.95 * selectHeight)
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight * 0.8)
                        .text("✎")
                        .style("font-size", fontSize)
                        .style("cursor", "pointer")
                        .on("click", function(){
                            const newName = prompt("Enter new name", machineObj.name);
                            if(newName !== machineObj.name && newName !== null){
                                // Double check if overwriting
                                if(storageObj[newName]){
                                    if(!confirm(newName + " already exists. Overwrite?")){
                                        return;
                                    }
                                }
                                delete storageObj[machineObj.name];
                                storageObj[newName] = machineObj;
                                machineObj.name = newName;
                                localStorage.setItem("savedFiniteStateMachines", JSON.stringify(storageObj));
                                g.remove();
                                Create.drawLoadMenu(pageN);
                            }
                        });


                    // Add a delete option
                    machineG.append("text")
                        .attr("x", selectX + (i + 0.85) * (selectWidth/machinesPerPage))
                        .attr("y", selectY + 0.95 * selectHeight)
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight * 0.8)
                        .text("✖")
                        .style("font-size", fontSize)
                        .style("cursor", "pointer")
                        .on("click", function(){
                            const confirmDelete = confirm("Delete " + machineObj.name + "?");
                            if(confirmDelete){
                                delete storageObj[machineObj.name];
                                localStorage.setItem("savedFiniteStateMachines", JSON.stringify(storageObj));
                                g.remove();
                                Create.drawLoadMenu(pageN);
                            }
                        });
                }

            };

            drawSavedMachines(pageN);
        }

        //Add the cancel button
        const buttonText = "Cancel";
        const textWidth = Display.getTextLength(svg, buttonText, fontSize, "settings-button-text");
        const buttonWidth = 2 * textWidth;
        const buttonHeight = 1.5 * fontSize;
        const submitX = x + menuWidth - buttonWidth - xBorder;
        const submitY = y + menuHeight - fontSize - 15;
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
            .text(buttonText)
            .attr("x", submitX + 0.5 * buttonWidth - 0.5 * textWidth)
            .attr("y", submitY + buttonHeight - (0.5 * fontSize))
            .attr("font-size", fontSize)
            .classed("settings-button-text", true)
            .on("click", function(){
                g.remove();
            });
    }
};

// Start Create mode here
Create.setup();

//Declare global variables for ESlint
/*global d3*/
/*global Model*/
/*global Controller*/
/*global EventHandler*/
/*global Display*/
/*global Logging*/

