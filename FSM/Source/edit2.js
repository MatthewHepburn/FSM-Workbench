//Declare global readonlys for ESLint
/*global d3*/
/*global Controller*/
/*global Model*/

var edit = {
    question: {},
    questionTypes: ["demo", "does-accept", "give-list", "give-equivalent", "satisfy-definition","satisfy-list", "satisfy-regex", "select-states"],
    questionSchema: {
        "common":{
            "text": {"description": "Text of the question. HTML tags allowed.", "optional": false, "expectStr":true},
            "alphabetType": {"description": "Should the machine take input a character at a time (char) or consider longer strings as a single symbol (symbol).", "optional":false,"expectStr":true},
            "alphabet": {"description": 'A list of the symbols that the machine operates on. Include ε if allowed. Eg ["a","b", "ε"]', "optional":false, "default":'["a","b","ε"]', "expectStr":false},
            "isTransducer":{"description": "Is the machine a transducer?", "optional":false, "expectStr":false, "default":false},
            "outAlphabet": {"description": "The output alphabet of the machine. Only recquired if the machine is a transducer.", "optional":true, "default":"", "expectStr":false}
        },
        "does-accept":{
            "strList": {"description": 'A list of strings for the user to determine if the machine accepts. Eg ["a","aab","abb"]', "optional":false, "default":'["a","aab"]', "expectStr":false}
        },
        "give-list":{
            "lengths": {"description": "A list of integers, each representing a target length of accepted input for the user to provide. Eg [3,3,6]", "optional": false, "default":"[1,2]","expectStr":false},
            "prefill": {"description": "An option to automatically fill in some of the fields. Eg {'0': 'aab'} would fill the first field with the string 'aab'.", "optional":true, "default":"", "expectStr":false}
        },
        "select-states":{
            "initialState" : {"description": "A list of the IDs of states that the machine is in at the start of the question. The start state has ID 0.", "optional": false, "default":"[0]", "expectStr":false},
            "nSteps": {"description": "The number of steps to execute before selecting states. Eg  - 1 would be the set of states directly after initialState", "optional":false, "default":"1", "expectStr":false},
            "input": {"description": "The input to be considered for this question", "optional":false, "default":'["a","b","b"]', "expectStr":false}
        },
        "satisfy-list":{
            "acceptList": {"description": 'A list of strings that the machine should accept. Eg ["a","aab","abb"]', "optional":false, "default":'["a","aab"]', "expectStr":false},
            "rejectList": {"description": 'A list of strings that the machine should reject. Eg ["b","bba"]', "optional":false, "default":'["b","bba"]', "expectStr":false}
        },
        "satisfy-definition":{

        },
        "satisfy-regex":{
            "regex": {"description": "Regular expression that the machine should accept. In the format accepted by JavaScript regexes. Eg abb(abb)*", "optional":false, "default":"a(a|b)*", "expectStr":true},
            "minAcceptLength": {"description": "The length of the shortest string that the regex accepts.", "optional":false, "default":4, "expectStr":false},
            "deterministic": {"description": "Optional parameter. If true, the machine must be deterministic, if false the machine must be nondeterministic. If not specified, either is acceptable", "optional":true, "default":"", "expectStr":false},
            "maxStates": {"description": "Optional parameter. Maximum number of states the machine is allowed to have. NB, allowing too many states can lead to crashes.", "optional":true, "default":4, "expectStr":false}
        },
        "demo":{
            "hasGoal": {"description": "If true - the user is correct if they enter a sequence ending on an accepting state", "optional":false, "default":false, "expectStr":false, "isBoolean":true},
            "goalType": {"description": "Only needed if hasGoal = true. Can be 'accepting' - the user must get the machine to an accepting state - or 'output' - the user must make the machine give a particular output", "optional":true, "default":"accepting", "expectStr":true, "isBoolean":false},
            "outputTarget" :{"description": "Only needed if goalType=output. The output string the user must make the machine output", "optional":true, "default":"abccba", "expectStr":true, "isBoolean":false}
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
        d3.select(".questiontypedropdown").on("change", function(){edit.questionOptions()});
    },
    questionOptions:function(){
        d3.select(".questiondata").html("")
        edit.askQuestionText(edit.questionSchema.common.text.description)
        edit.askQuestionCharType(edit.questionSchema.common.alphabetType.description)

        var alphabetQ = edit.questionSchema.common.alphabet
        edit.askQuestionOption("alphabet", alphabetQ.description, alphabetQ["default"], alphabetQ.optional)
        d3.select("#alphabet").on("change", edit.setAlphabet)

        edit.askQuestionTransducer(edit.questionSchema.common.isTransducer.description)

        var alphabetQ = edit.questionSchema.common.outAlphabet
        edit.askQuestionOption("outAlphabet", alphabetQ.description, alphabetQ["default"], alphabetQ.optional)
        d3.select("#outAlphabet").on("change", edit.setOutAlphabet)

        var qType = document.querySelector(".questiontypedropdown").value
        if (qType == "give-equivalent"){
            edit.showTwoMachines();
        } else {
            edit.showOneMachine();
        }
        var q = edit.questionSchema[qType]
        var fields = Object.keys(q)
        for (var i = 0; i< fields.length; i++){
            var name = fields[i]
            var description = q[name].description
            var isOptional = q[name].optional
            var defaultValue = q[name]["default"]
            var isBoolean = false;
            if (q[name].isBoolean != undefined){
                isBoolean = q[name].isBoolean
            }
            edit.askQuestionOption(name, description, defaultValue, isOptional, isBoolean)
        }
        var button = "<a class='pure-button' id='getjson'>Get JSON</a>"
        document.querySelector(".buttondiv").innerHTML = button;
        document.querySelector("#getjson").addEventListener("click", edit.getJSON);
    },
    askQuestionOption:function(name, description,defaultValue, isOptional, isBoolean){
        var html = "<p>" + name
        if (isBoolean){
            if (defaultValue == true){
                html += "<select id='" + name +"'><option selected='selected' value=true>True</option><option value=false>False</option></select>"
            } else{
                html += "<select id='" + name +"'><option value=true>True</option><option selected='selected' value=false>False</option></select>"
            }
        }
        else{
            if (!isOptional){
            html += "* "
            }
            html += ": <input type='text' id='" + name +"' value='" + defaultValue + "''>"
        }
        html += "<a id='desc" + name + "'>  ?</a></p>"

        // Use method below as inserting normally resets the event listeners
        var siblings = document.querySelector(".questiondata").children
        var lastSibling = siblings[siblings.length - 1]
        lastSibling.insertAdjacentHTML("afterend",html)

        var id = "#desc" + name
        f = function(){alert(description);};
        d3.select(id)
            .classed("showdesc", true)
        document.querySelector(id).addEventListener("click", f);

    },

    askQuestionText:function(defaultValue){
        var html = d3.select(".questiondata").html()
        html += "<p>text* : <textarea cols='120' id='text' >"+ defaultValue +"</textarea></p>"
        html += "<a class='pure-button' id='previewtext'>Preview</a>"
        d3.select(".questiondata").html(html)
        console.log(document.getElementById("previewtext"))
        var button = document.getElementById("previewtext")
        button.addEventListener("click", edit.previewQuestion)
    },

    previewQuestion: function() {
        var text = document.querySelector("#text").value.replace(/\n/g, "<br>")
        document.querySelector(".question").innerHTML = text

    },

    escapeHTML: function (text) {
        //Escape HTML to allow it to be displayed:
        text = text.replace(/</g, "&lt;");
        text = text.replace(/\\\\n/g, "&lt;br>");
        return text;
    },

    askQuestionCharType:function(description){
        var html = "<p>Alphabet Type* : <select id='alphabettype'><option value='char'>char</option><option value='symbol'>symbol</option></select><a id='descchartype'>   ?</a></p>"
        // Use method below as inserting normally resets the event listener created on the textpreview button
        var siblings = document.querySelector(".questiondata").children
        var lastSibling = siblings[siblings.length - 1]
        lastSibling.insertAdjacentHTML("afterend",html)

        d3.select("#descchartype").on("click", function(){alert(description)}).classed("showdesc", true)
    },
    askQuestionTransducer:function(description){
        var html = "<p>isTransducer* : <select id='istransducer'><option value=false>false</option><option value=true>true</option></select><a id='descistransducer'>   ?</a></p>"
        // Use method below as inserting normally resets the event listener created on the textpreview button
        var siblings = document.querySelector(".questiondata").children
        var lastSibling = siblings[siblings.length - 1]
        lastSibling.insertAdjacentHTML("afterend",html)

        d3.select("#descistransducer").on("click", function(){alert(description)}).classed("showdesc", true)
        d3.select("#istransducer").on("change", function(){
            var transducerMode = JSON.parse(this.value);
            model.question.isTransducer = transducerMode;
            if (transducerMode){
                edit.setAlphabet()
                config.displayConstrainedLinkRename = true;
            } else {
                edit.resetOutput();
            }
        });
    },
    getJSON:function(){
        var modelJSON = model.generateJSON3()
        var q = {}
        // Store common variables
        q.text = document.querySelector("#text").value;
        q.alphabetType = document.querySelector("#alphabettype").value;
        q.alphabet = JSON.parse(document.querySelector("#alphabet").value);
        q.isTransducer = JSON.parse(document.querySelector("#istransducer").value);
        if(q.isTransducer){
            q.outAlphabet = JSON.parse(document.querySelector("#outAlphabet").value);
        }

        var qType = document.querySelector(".questiontypedropdown").value
        q.type = qType
        var schema = edit.questionSchema[qType]
        var fields = Object.keys(schema)
        var error = false
        for (i = 0; i< fields.length; i++){
            var val = document.querySelector("#" + fields[i]).value
            if (val == {} || val == ""){
                if (!schema[fields[i]].optional){
                    var error = "ERROR - " + fields[i] + " cannot be blank."
                    document.querySelector(".jsonout").innerHTML = error
                    error = true
                } else {
                    continue
                }
            }
            if (!schema[fields[i]].expectStr){
                val = JSON.parse(val)
            }
            q[fields[i]] = val
        }

        if (!error){
            modelJSON["filename"] = ""
            modelJSON["data-question"] = JSON.stringify(q)
            modelJSON["data-options"] = "{}"
            var div = document.querySelector(".jsonout").innerHTML = edit.escapeHTML(JSON.stringify(modelJSON));
        }

    },
    setAlphabet:function(){
        var alphabet = JSON.parse(document.querySelector("#alphabet").value)
        model.question.alphabet = alphabet
    },
    setOutAlphabet:function(){
        var outAlphabet = JSON.parse(document.querySelector("#outAlphabet").value);
        model.question.outAlphabet = outAlphabet
    },
    resetOutput: function(){
        for (var i = 0; i< model.links.length; i++){
            model.links[i].output = [];
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
        Controller.deleteMachine("m2")

    }

}

window.onload = function(){
    edit.createQuestionPrompt()
}