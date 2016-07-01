"use strict";
//Declare global readonlys for ESLint
/*global d3*/
/*global Controller*/
/*global Model*/

var edit = {
    question: {},
    questionTypes: ["give-list", "give-equivalent", "satisfy-list"],
    questionSchema: {
        common:{
            text: {description: "Text of the question. HTML tags allowed.", optional: false, expectStr: true},
            filename:{description: "The filename this question should have", optional: true, expectStr: true, default: "filename"},
            questionTitle:{description: "The title of this question", optional: true, expectStr: true, default: "Question Title"},
            alphabet: {description: 'A list of the symbols that the machine operates on. Eg ["a","b"]', optional:false, default:'["a","b"]', expectStr:false},
            allowEpsilon: {description: "Does the machine permit epsilon transitions?", optional:false, default:true, expectStr:false},
            splitSymbol: {description: "Symbol that sepates input. Blank to split on every character", optional:false, default:"", expectStr:true}

        },
        "give-list":{
            "splitSymbol": {"description": "The symbol used to split input into discrete tokens. Leave blank to split on the empty string (ie treat each character as a separate token) or enter ',' for comma separated tokens or ' ' for space separated tokens.", "optional": true, "default": "", "expectStr": true},
            "lengths": {"description": "A list of integers, each representing a target length of accepted input for the user to provide. Eg [3,3,6]", "optional": false, "default":"[1,2]","expectStr":false},
            "prefill": {"description": "An option to automatically fill in some of the fields. Eg {'0': 'aab'} would fill the first field with the string 'aab'.", "optional":true, "default":"{ }", "expectStr":false}
        },
        "satisfy-list":{
            "acceptList": {"description": 'A list of strings that the machine should accept. Eg ["a","aab","abb"]', "optional":false, "default":'["a","aab"]', "expectStr":false},
            "rejectList": {"description": 'A list of strings that the machine should reject. Eg ["b","bba"]', "optional":false, "default":'["b","bba"]', "expectStr":false}
        },
        "give-equivalent":{

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
        edit.askQuestionOption("alphabet", alphabetQ.description, alphabetQ["default"], alphabetQ.optional);
        d3.select("#alphabet").on("change", edit.setAlphabet);

        var epsQ = edit.questionSchema.common.allowEpsilon
        edit.askQuestionOption("allowEpsilon", epsQ.description, epsQ.default, epsQ.isOptional, true);
        d3.select("#allowEpsilon").on("change", edit.setAlphabet);

        var splitQ = edit.questionSchema.common.splitSymbol
        edit.askQuestionOption("splitSymbol", splitQ.description, splitQ.default, splitQ.isOptional, false);

        var filenameQ = edit.questionSchema.common.filename;
        edit.askQuestionOption("filename", filenameQ.description, filenameQ["default"], filenameQ.optional);

        var titleQ = edit.questionSchema.common.questionTitle;
        edit.askQuestionOption("questionTitle", titleQ.description, titleQ["default"], titleQ.optional);

        var qType = document.querySelector(".questiontypedropdown").value;
        if (qType == "give-equivalent"){
            edit.showTwoMachines();
        } else {
            edit.showOneMachine();
        }
        var q = edit.questionSchema[qType];
        var fields = Object.keys(q);
        for (var i = 0; i< fields.length; i++){
            var name = fields[i];
            var description = q[name].description;
            var isOptional = q[name].optional;
            var defaultValue = q[name]["default"];
            var isBoolean = false;
            if (q[name].isBoolean != undefined){
                isBoolean = q[name].isBoolean;
            }
            edit.askQuestionOption(name, description, defaultValue, isOptional, isBoolean);
        }
        var button = "<a class='pure-button' id='getjson'>Get JSON</a>";
        document.querySelector(".buttondiv").innerHTML = button;
        document.querySelector("#getjson").addEventListener("click", edit.getJSON);
    },
    askQuestionOption:function(name, description,defaultValue, isOptional, isBoolean){
        var html = "<p>" + name;
        if (isBoolean){
            if (defaultValue == true){
                html += ": <select id='" + name +"'><option selected='selected' value=true>True</option><option value=false>False</option></select>";
            } else{
                html += ": <select id='" + name +"'><option value=true>True</option><option selected='selected' value=false>False</option></select>";
            }
        }
        else{
            if (!isOptional){
                html += "* ";
            }
            html += ": <input type='text' id='" + name +"' value='" + defaultValue + "''>";
        }
        html += "<a id='desc" + name + "'>  ?</a></p>";

        // Use method below as inserting normally resets the event listeners
        var siblings = document.querySelector(".questiondata").children;
        var lastSibling = siblings[siblings.length - 1];
        lastSibling.insertAdjacentHTML("afterend",html);

        var id = "#desc" + name;
        var f = function(){alert(description);};
        d3.select(id)
            .classed("showdesc", true);
        document.querySelector(id).addEventListener("click", f);

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
        outObj["data-machinelist"] = Model.getMachineList();
        var questionObj = {"type": qType};
        // Store common variables
        questionObj.text = document.querySelector("#text").value;

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
            var jsonOutDiv = d3.select(".jsonout").text(edit.escapeHTML(JSON.stringify(outObj)));
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
            var machine = Model.machines[i]
            Controller.setAlphabet(machine, alphabet, allowEpsilon)
        }
    },
    showTwoMachines: function(){
        // First check if a second machine already exists
        if (d3.select("#m2").size == 1){
            return;
        }
        // Setup the new machine as a clone of the original
        var specObj = Model.machines[0].getSpec();
        // Tell the controller to create a new machine - this will create an SVG element as well as a Machine object
        Controller.addMachine(specObj);
    },
    showOneMachine: function(){
        // First check if a second machine already exists
        if (d3.select("#m2").size == 0){
            return;
        }
        Controller.deleteMachine("m2");

    }

};

window.onload = function(){
    edit.createQuestionPrompt();
};