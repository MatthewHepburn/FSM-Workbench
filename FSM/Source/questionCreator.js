"use strict";
/*eslint-env es6 */
//Declare global readonlys for ESLint
/*global d3*/
/*global Controller*/
/*global Model*/

const edit = {
    question: {},
    questionTypes: ["give-equivalent", "give-input", "give-list", "satisfy-list", "select-states", "does-accept", "satisfy-definition"].sort(),
    questionSchema: {
        common:{
            text: {description: "Text of the question. HTML tags allowed.", optional: false, expectStr: true},
            filename:{description: "The filename this question should have", optional: true, expectStr: true, default: "filename"},
            questionTitle:{description: "The title of this question", optional: true, expectStr: true, default: "Question Title"},
            alphabet: {description: 'A list of the symbols that the machine operates on. Eg ["a","b"]', optional:false, default:'["a","b"]', expectStr:false},
            allowEpsilon: {description: "Does the machine permit epsilon transitions?", optional:false, default:true, isBoolean:true, expectStr:false},
            splitSymbol: {description: "The symbol used to split input into discrete tokens. Leave blank to split on the empty string (ie treat each character as a separate token) or enter ',' for comma separated tokens or ' ' for space separated tokens.", optional:true, default:"", expectStr:true}

        },
        "give-list":{
            "lengths": {"description": "A list of integers, each representing a target length of accepted input for the user to provide. Eg [3,3,6]", "optional": false, "default":"[2,2,3]","expectStr":false},
            "prefill": {"description": "An option to automatically fill in some of the fields. Eg {\"0\": 'aab'} would fill the first field with the string 'aab'.", "optional":true, "default":"{\"0\": \"aa\"}", "expectStr":false}
        },
        "satisfy-list":{
            "shouldAccept": {"description": 'A list of strings that the machine should accept. Eg ["a","aab","abb"]', "optional":false, "default":'["a","aab"]', "expectStr":false},
            "shouldReject": {"description": 'A list of strings that the machine should reject. Eg ["b","bba"]', "optional":false, "default":'["b","bba"]', "expectStr":false}
        },
        "give-equivalent":{},
        "give-input":{
            target: {description: "The success condition for the question. 'accept' means the user must enter an accepted sequence, 'output' means the user must enter a sequence that produces a particular output.", optional:false, default: "accept", expectStr:true, options:["accept", "none", "output"]},
            outputSequence: {description: "The sequence to output if the target is 'output'. In form ['a', 'b', 'b'].", optional:true, default:"[]", expectStr: false}

        },
        "select-states":{
            initialSequence: {description: "The input sequence given to the machine prior to the user's interaction", default:'["a"]', expectStr:false},
            targetSequence: {description: "The input sequence that moves the machine from the state it is in after processing initialSequence to the target", default: '["b"]', expectStr: false}
        },
        "does-accept":{
            sequences:{description: "An array of input sequences. For each he user must determine if the machine accepts them", optional: false, expectStr: false, default:'["aa", "aab"]'}
        },
        "satisfy-definition":{

        }
    },
    createQuestionPrompt:function() {
        var html = "Select question type: <select class='questiontypedropdown'><option value='none'></option>";
        for (var i = 0; i < edit.questionTypes.length; i++){
            html += '<option value="' + edit.questionTypes[i] + '">' + edit.questionTypes[i] + "</option>\n";
        }
        html += "</select>";
        d3.select(".questiontype").html(html);
        d3.select(".questiontypedropdown").on("change", function(){edit.questionOptions();});
    },
    questionOptions:function(){
        d3.select(".questiondata").html("");
        edit.askQuestionText(edit.questionSchema.common.text.description);

        var alphabetQ = edit.questionSchema.common.alphabet;
        edit.askQuestionOption("alphabet", alphabetQ);
        d3.select("#alphabet").on("change", edit.setAlphabet);

        var epsQ = edit.questionSchema.common.allowEpsilon;
        edit.askQuestionOption("allowEpsilon", epsQ);
        d3.select("#allowEpsilon").on("change", edit.setAlphabet);

        var splitQ = edit.questionSchema.common.splitSymbol;
        edit.askQuestionOption("splitSymbol", splitQ);

        var filenameQ = edit.questionSchema.common.filename;
        edit.askQuestionOption("filename", filenameQ);

        var titleQ = edit.questionSchema.common.questionTitle;
        edit.askQuestionOption("questionTitle", titleQ);

        var qType = document.querySelector(".questiontypedropdown").value;

        var q = edit.questionSchema[qType];
        var fields = Object.keys(q);
        for (var i = 0; i< fields.length; i++){
            var name = fields[i];
            var obj = q[name];
            edit.askQuestionOption(name, obj);
        }
        var button = "<a class='pure-button' id='getjson'>Get JSON</a>";
        document.querySelector(".buttondiv").innerHTML = button;
        document.querySelector("#getjson").addEventListener("click", edit.getJSON);

        if (qType === "give-equivalent"){
            edit.showTwoMachines("Initial machine", "Target machine");
            edit.showTestRegex();
        } else if(qType === "satisfy-definition"){
            edit.showTwoMachines("Initial machine", "Specified machine");
            edit.showGetFormalDefinition();
        } else {
            edit.showOneMachine();
        }

    },
    askQuestionOption:function(name, obj){
        var description = obj.description;
        var defaultValue = obj.default;
        var isOptional = obj.optional === true;
        var isBoolean = obj.isBoolean === true;
        var isDropdown = obj.options !== undefined;
        if(isBoolean){
            isDropdown = true;
            var options = [true, false];
        } else if(isDropdown){
            options = obj.options;
        }
        //description,defaultValue, isOptional, isBoolean, isDropdown
        var div = d3.select(".questiondata")
                    .append("div")
                        .attr("id", `${name}-outer-div`)
                        .classed("option-holder", true)
                            .append("div")
                            .classed("form-item", true)
                            .classed("pure-form", true)
                            .attr("id", `${name}-div`)
                            .text(`${name} : `);
        if (isDropdown){
            var select = div.append("select")
                            .attr("id", name);

            options.forEach(function(optStr){
                var option = select.append("option")
                  .attr("value", optStr)
                  .text(optStr);

                if(defaultValue === optStr){
                    option.attr("selected", "true");
                }
            });

        }
        else{
            if (!isOptional){
                div.text(name + "* : ");
            }
            div.append("input")
               .attr("type", "text")
               .attr("id", name)
               .attr("value", defaultValue);
        }
        var help = div.append("a")
                      .attr("id", "desc"+name)
                      .classed("help", true)
                      .classed("pure-button", true)
                      .text(" ? ");

        var showDescription = function(){
            //Check if description is already there
            var desc = d3.select(`#${name}-desc`);
            if(desc.empty()){
                d3.select(`#${name}-outer-div`).append("span")
                    .attr("id", `${name}-desc`)
                    .classed("desc-text", true)
                    .text(description);
            } else {
                desc.remove();
            }
        };

        help.on("click", showDescription);

    },

    askQuestionText:function(defaultValue){
        var html = d3.select(".questiondata").html();
        html += "<p>text* : <textarea cols='120' id='text' >"+ defaultValue +"</textarea></p>";
        html += "<a class='pure-button' id='previewtext'>Preview</a>";
        d3.select(".questiondata").html(html);
        var button = document.getElementById("previewtext");
        button.addEventListener("click", edit.previewQuestion);
    },

    previewQuestion: function() {
        var text = document.querySelector("#text").value.replace(/\n/g, "<br>");
        document.querySelector(".question").innerHTML = text;

    },

    escapeHTML: function (text) {
        //Escape HTML to allow it to be displayed:
        text = text.replace(/</g, "&lt;");
        text = text.replace(/\\\\n/g, "&lt;br>");
        return text;
    },

    askQuestionCharType:function(description){
        var html = "<p>Alphabet Type* : <select id='alphabettype'><option value='char'>char</option><option value='symbol'>symbol</option></select><a id='descchartype'>   ?</a></p>";
        // Use method below as inserting normally resets the event listener created on the textpreview button
        var siblings = document.querySelector(".questiondata").children;
        var lastSibling = siblings[siblings.length - 1];
        lastSibling.insertAdjacentHTML("afterend",html);

        d3.select("#descchartype").on("click", function(){alert(description);}).classed("showdesc", true);
    },

    getJSON:function(){
        var qType = document.querySelector(".questiontypedropdown").value;
        var outObj = {"data-question": undefined,
                       "data-machinelist": undefined,
                       "data-options": {},
                       "filename": document.querySelector("#filename").value,
                       "name":document.querySelector("#questionTitle").value,
                       "id": edit.getGUID()};
        if(qType === "give-equivalent" || qType === "satisfy-definition"){
            //Don't want to also have the target machine
            outObj["data-machinelist"] = [Model.machines[0].getSpec()];
        } else {
            outObj["data-machinelist"] = Model.getMachineList();
        }
        var questionObj = {"type": qType};
        // Store common variables
        questionObj.text = document.querySelector("#text").value.replace(/\n/g, "<br>");
        questionObj.allowEpsilon = document.querySelector("#allowEpsilon").value;
        questionObj.splitSymbol = document.querySelector("#splitSymbol").value;

        if(qType === "give-equivalent"){
            questionObj.targetMachineSpec = Model.machines[1].getSpec();
        }
        if(qType === "satisfy-definition"){
            questionObj.defintion = edit.getFormalDefinition();
        }


        var schema = edit.questionSchema[qType];
        var fields = Object.keys(schema);
        var error = false;
        for (var i = 0; i< fields.length; i++){
            var val = document.querySelector("#" + fields[i]).value;
            if (val == {} || val == ""){
                if (!schema[fields[i]].optional){
                    error = "ERROR - " + fields[i] + " cannot be blank.";
                    document.querySelector(".jsonout").innerHTML = error;
                    error = true;
                }
            }
            if (!schema[fields[i]].expectStr){
                val = JSON.parse(val);
            }
            questionObj[fields[i]] = val;
        }

        if (!error){
            outObj["data-question"] = questionObj;
            var jsonOutDiv = d3.select(".jsonout").text("");
            jsonOutDiv.append("pre").text(JSON.stringify(outObj));
            var saveDiv = jsonOutDiv.append("div").classed("savediv", true);
            if (localStorage.getItem("password") !==  null){
                saveDiv.text("Save to server");
                saveDiv.append("a")
                .classed("pure-button", true)
                .on("click", function(){edit.saveToServer(outObj);});
            }

        }

    },

    getGUID: function(){
        return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == "x" ? r : (r&0x3|0x8);
            return v.toString(16);
        });

    },

    saveToServer: function(outObj){
        var string =  "&question=" + encodeURIComponent(JSON.stringify(outObj)) + "&password=" + localStorage.getItem("password");
        var request = new XMLHttpRequest();
        request.open("POST", "/cgi/s1020995/dev/savequestion.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    },

    setAlphabet:function(){
        var alphabet = JSON.parse(document.querySelector("#alphabet").value);
        var allowEpsilon = JSON.parse(document.querySelector("#allowEpsilon").value);
        for(var i = 0; i < Model.machines.length; i++){
            var machine = Model.machines[i];
            Controller.setAlphabet(machine, alphabet, allowEpsilon);
        }
    },
    showTwoMachines: function(labelLeft, labelRight){
        // check if a second machine already exists
        if (d3.select("#m2").size() == 1){
            d3.select("#m1-label").text(labelLeft);
            d3.select("#m2-label").text(labelRight);
            return;
        }

        // Setup the new machine as a clone of the original
        var specObj = Model.machines[0].getSpec();
        // Tell the controller to create a new machine - this will create an SVG element as well as a Machine object
        var machineID = Controller.addMachine(specObj);

        //add labels
        if(d3.select("#m1-label").empty()){
            d3.select("#m1").append("text")
              .text(labelLeft)
              .attr("id", "m1-label")
              .attr("x", 350)
              .attr("y", 25);
        } else {
            d3.select("#m1-label").text(labelLeft);
        }
        if(d3.select("#m2-label").empty()){
            d3.select(`#${machineID}`).append("text")
              .text(labelRight)
              .attr("id", "m2-label")
              .attr("x", 350)
              .attr("y", 25);
        }
    },
    showOneMachine: function(){
        d3.select("#m1-label").text("");
        d3.select("#m2-label").text("");

        // First check if a second machine already exists
        if (d3.select("#m2").size == 0){
            return;
        }
        Controller.deleteMachine("m2");

    },

    showGetFormalDefinition: function(){
        const div = d3.select(".questiondata").append("div").attr("id", "get-definition-div");

        const button = div.append("a")
                        .attr("id", "get-definition-button")
                        .classed("pure-button", true)
                        .text("Get Definition");

        const span = div.append("span")
            .attr("id", "get-definition-output");


        button.on("click", function(){
            const spec = edit.getFormalDefinitionString();
            span.text(spec);
        });
    },

    getFormalDefinition: function(){
        const machine = Model.machines[1];
        const states = machine.getNodeList();
        const spec = {};

        spec.states = states.map(node => node.name);
        spec.alphabet = machine.alphabet;
        spec.initialStates = states.filter(node => node.isInitial).map(node => node.name);
        spec.acceptingStates = states.filter(node => node.isAccepting).map(node => node.name);
        //Split links so that each symbol is its own object
        spec.links = [];
        for(const linkID in machine.links){
            const link = machine.links[linkID];
            const to = link.target.name;
            const from = link.source.name;
            for(let i = 0; i < link.input.length; i++){
                spec.links.push({to, from, symbol:link.input[i]});
            }
        }

        return spec;

    },

    getFormalDefinitionString: function(){
        const spec = edit.getFormalDefinition();
        //Check that all states have names:
        if(spec.states.includes("")){
            return "All nodes must have a name";
        }
        const states = spec.states;
        const alphabet = spec.alphabet;
        const initialStates = spec.initialStates;
        const acceptingStates = spec.acceptingStates;
        const links = spec.links;

        const linkStrings = links.map(link => `(${link.from},${link.symbol},${link.to})`).sort();

        var prettyPrintArray = function(name, array){
            let outString =  `<em>${name}</em> = {`;
            if(array.length > 0){
                outString += array.reduce((x,y)=>x + "," + y);
            }
            return outString +"}";
        };

        let specStr = "";
        specStr += prettyPrintArray("Q", states.sort()) + "<br>";
        specStr += prettyPrintArray("Σ", alphabet) + "<br>";
        specStr += prettyPrintArray("s<sub>0</sub>", initialStates.sort()) + "<br>";
        specStr += prettyPrintArray("F", acceptingStates.sort()) + "<br>";
        specStr += prettyPrintArray("δ", linkStrings);
        return specStr;


    },

    showTestRegex: function(){
        const div = d3.select(".questiondata").append("div").attr("id", "test-regex-div");

        div.append("input")
               .attr("type", "text")
               .attr("id", "test-regex-input")
               .attr("value", "a*b*");

        const button = div.append("a")
                        .attr("id", "test-regex-button")
                        .classed("pure-button", true)
                        .text("Test Regex");

        const span = div.append("span")
            .attr("id", "test-regex-feedback");


        button.on("click", function(){
            const input = document.querySelector("#test-regex-input").value;
            let message = edit.testRegex(input);
            if(message === true){
                message = "✓";
            }
            span.text(message);
        });

    },

    testRegex: function(str){
        //Tests the given regex string on the second machine, using the inefficient but serviceable approach from v1
        var m = Model.machines[1];
        var alphabet = m.alphabet;
        if(m.getAcceptingNodeCount() === 0){
            return "No accepting states";
        }
        var toString = x => x.reduce((x,y) => x + y, "");
        var nStates = m.getNodeCount();
        var sequences = [[]];
        var regex = new RegExp(str);
        while(sequences[0].length <= 2 * nStates){
            var newSequences = [];
            for(var i = 0; i < sequences.length; i++){
                var thisSequence = sequences[i];
                var string = toString(thisSequence);
                var regexAccepts = true;
                if (regex.exec(string) == null || regex.exec(string)[0] != string){
                    regexAccepts = false;
                }
                var machineAccepts = m.accepts(thisSequence);
                if(regexAccepts && !machineAccepts){
                    return `Machine rejects '${string}' which regex accepts`;
                }
                if(!regexAccepts && machineAccepts){
                    return `Regex rejects '${string}' which machine accepts`;
                }

                //Populate newSequences
                for(var j = 0; j< alphabet.length; j++){
                    var symbol = alphabet[j];
                    var newSequence = thisSequence.concat([symbol]);
                    newSequences.push(newSequence);
                }
            }
            sequences = newSequences;
        }
        return true;

    }

};

window.onload = function(){
    edit.createQuestionPrompt();
};