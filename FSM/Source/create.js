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
        const table = d3.select("body").append("div")
                        .classed("subset", true)
                        .style("width", "15%")
                        .style("float", "right")
                            .append("table")
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


        //Add a blank lines
        const blankRow = body.append("tr")
        blankRow.append("td").text("\u00A0")
        for(var i = 0; i < alphabet.length; i++){
            blankRow.append("td")
                .classed("alphabet-" + i, true)
                .text("\u00A0"); //non-breaking-space
        }
    },
    showSubset: function(){
        //Process from users POV:
        // Add initial state to reachable states,
        // Add transition table row by row for states

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
    }
};

// Start create mode here
create.setup();

//Declare global variables for ESlint
/*global d3*/
/*global Model*/
/*global Controller*/
/*global Display*/

