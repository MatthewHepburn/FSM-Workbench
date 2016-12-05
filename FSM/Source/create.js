const create = {
    setup: function() {
        // Setup the creation environment.
        create.registerTraceButtonListener();
        create.registerAlphabetButtonListener();
        create.registerDFAbuttonListener();
        create.registerReverseButtonListener();
        create.registerMinimalDFAButtonListener();
        create.registerExportToSvgButtonListener();
        create.registerSubsetButtonListener();
    },
    registerSubsetButtonListener: function(){
        d3.select("#subset-button")
            .on("click", create.showSubset);
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
                create.setalphabet(alphabet);
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
    drawSubsetTable: function(machine){
        d3.selectAll(".subset").remove();
        //Add the div and table
        const subsetDiv = d3.select("body").append("div")
                        .classed("subset", true)
                        .style("width", "15%")
                        .style("float", "right")
        const table = subsetDiv.append("table")
                        .classed("minimize-table", true)
                        .style("table-layout", "fixed")
                        .style("width", "140%")
                        .style("margin-left", "-50%")
                        .style("margin-top", "12.45em");

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
            const row = body.append("tr")
                .attr("id", "subset-nfa-" + node.id)
                .classed("subset-" + node.id, true)
                .classed("minimize-table", true);
            row.append("td").text(node.name);
            //Add an empty cell for each alphabet symbol
            for(let i = 0; i < alphabet.length; i++){
                row.append("td")
                    .classed("alphabet-" + i, true)
                    .classed("subset-transition", true)
                    .text("");
            }
        });

        //Split table here - insert a blank line with no border
        body.append("tr")
            .style("border-style", "none")
            .append("td")
            .text("\u00A0")
            .style("border-style", "none")

        //Add new heading
        body.append("tr")
            .append("th")
            .attr("colspan", 1 + alphabet.length)
            .text("Reachable States")


        //Add a blank line
        const blankRow = body.append("tr")
        blankRow.append("td").text("\u00A0")
        for(var i = 0; i < alphabet.length; i++){
            blankRow.append("td")
                .classed("alphabet-" + i, true)
                .text("\u00A0"); //non-breaking-space
        }

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

    showSubset: function(){
        const m = Model.machines[0];
        Controller.issueNames(m);
        const copy = m.clone();
        create.drawSubsetTable(copy);
        const alphabet = copy.alphabet;

        // array of the ids of all nodes in the base machine
        const nfaNodeIDs = copy.getNodeList().map(node => node.id);

        const eventQueue = [];

        // First step – populate the base machine transition table
        // Either in one go or line-by-line
        const baseLineByLine = true;

        const initialTransitionTable = copy.getTransitionTable();
        // Add a type to each transition object
        initialTransitionTable.forEach(obj => obj.type = "baseNode");
        // Add a message for each
        initialTransitionTable.forEach(obj => obj.message = `Added transitions for node <b id="ref-${obj.node.id}">${obj.node.name}</b>.`);
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
        const initialStateNames = initialStateIDs.map(id => copy.nodes[id].name).sort();
        const initialState = {"type": "setAdded",
                              "id": initialStateID,
                              "names": initialStateNames};


    },

    showSubsetOld: function(){
        //Process from users POV:
        // Add transition table row by row for states
        // Add initial state to reachable states,
        // From initial state, build up all reachable states

        const m = Model.machines[0];
        Controller.issueNames(m);
        const copy = m.clone();
        create.drawSubsetTable(copy);
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
        initialTransitionTable.forEach(obj => obj.type = "baseNode");

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

        localStorage.setItem("savedFiniteStateMachines", JSON.stringify(savedMachines));
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

        // Get the list of saved machines
        let savedMachines;
        let storageObj;
        if (!localStorage.getItem("savedFiniteStateMachines")){
            savedMachines = [];
        } else {
            storageObj = JSON.parse(localStorage.getItem("savedFiniteStateMachines"));
            const machineNames = Object.keys(storageObj).filter(name => name !== "__meta__")
            // Tell each machineObj its own name
            machineNames.forEach(name => storageObj[name].name = name)
            savedMachines = machineNames.map(name => storageObj[name]);
            savedMachines.sort((a,b) => b.timeSaved - a.timeSaved);
        }

        const menuWidth = 0.75 * svg.attr("width");
        const menuHeight = 0.5 * svg.attr("height");
        const fontSize = 10;
        const xBorder = 15;

        const x = (svg.attr("width") - menuWidth)/2;
        const y = 0.1 * svg.attr("height");
        const g = svg.append("g").classed("load-menu", true);

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

        textY = textY + 4 * fontSize

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
                create.drawLoadMenu(pageN + steps);
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
                        .style("fill-opacity", "0")

                    // Add a rect over the thumbnail, and make it clickable
                    machineG.append("rect")
                        .attr("x", selectX + i * (selectWidth/machinesPerPage))
                        .attr("y", selectY)
                        .attr("width", selectWidth / machinesPerPage)
                        .attr("height", selectHeight * 0.8)
                        .style("stroke", "#555555")
                        .style("fill-opacity", "0")
                        .style("cursor", "pointer")
                        .on("click", function(){
                            g.remove();
                            create.loadMachine(machineObj.name);
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
                                create.drawLoadMenu(pageN);
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
                                create.drawLoadMenu(pageN);
                            }
                        });
                }

            };

            drawSavedMachines(pageN);
        }



        // for(let s in settings){
        //     // Add the setting description.
        //     g.append("text")
        //      .text(settings[s].description)
        //      .attr("x", textX)
        //      .attr("y", textY)
        //      .attr("font-size", fontSize);

        //     // Add the text for the currently set option
        //     var optionText = g.append("text")
        //                       .text(settings[s].value)
        //                       .attr("id", `settings-${s}-option`)
        //                       .classed("option", true)
        //                       .attr("x", x + menuWidth - longestOption - xBorder)
        //                       .attr("y", textY)
        //                       .attr("font-size", fontSize);

        //     // Add a box around the text to show that it is a dropdown menu
        //     var boxX = x + menuWidth - longestOption - xBorder - optionBorder;
        //     var boxY = textY - fontSize;
        //     const boxWidth = longestOption + 2 * optionBorder;
        //     g.append("rect")
        //      .attr("x", boxX)
        //      .attr("y", textY - fontSize)
        //      .attr("width", boxWidth)
        //      .attr("height", fontSize + 2 * optionBorder)
        //      .attr("fill", "#FFFFFF")
        //      .attr("fill-opacity", 0)
        //      .attr("stroke", "#444444")
        //      .on("click", Display.getDropdownOnClickFunction(svg, g, optionText, s, settings[s].options, 10,  boxX, boxY + fontSize + 2 * optionBorder, boxWidth));

        //     textY = textY  + 2 * fontSize;
        // }

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

// Start create mode here
create.setup();

//Declare global variables for ESlint
/*global d3*/
/*global Model*/
/*global Controller*/
/*global Display*/
/*global Logging*/

