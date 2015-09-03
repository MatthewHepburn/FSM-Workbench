edit = {
	question: {},
	questionTypes: ["give-list", "satisfy-definition","satisfy-list", "satisfy-regex", "select-states"],
	questionSchema: {
		"common":{
			"text": {"description": "Text of the question. HTML tags allowed.", "optional": false, "expectStr":true},
			"alphabetType": {"description": "Should the machine take input a character at a time (char) or consider longer strings as a single symbol (symbol).", "optional":false,"expectStr":true}
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
			"rejectList": {"description": 'A list of strings that the machine should reject. Eg ["b","bba"]', "optional":false, "default":'["b","bba"]', "expectStr":false},
			"alphabet": {"description": 'A list of the symbols that the machine operates on. Include ε if allowed. Eg ["a","b", "ε"]', "optional":false, "default":'["a","b","ε"]', "expectStr":false}
		},
		"satisfy-definition":{
			"alphabet": {"description": 'A list of the symbols that the machine operates on. Include ε if allowed. Eg ["a","b", "ε"]', "optional":false, "default":'["a","b","ε"]', "expectStr":false}
		},
		"satisfy-regex":{
			"regex": {"description": "Regular expression that the machine should accept. In the format accepted by JavaScript regexes. Eg abb(abb)*", "optional":false, "default":"a(a|b)*", "expectStr":true},
			"alphabet": {"description": 'A list of the symbols that the machine operates on. Include ε if allowed. Eg ["a","b", "ε"]', "optional":false, "default":'["a","b","ε"]', "expectStr":false},
			"minAcceptLength": {"description": "The length of the shortest string that the regex accepts.", "optional":false, "default":4, "expectStr":false}
		}
	},
	createQuestionPrompt:function() {
		var html = "Select question type: <select class='questiontypedropdown'><option value='none'></option>"
		for (var i = 0; i < edit.questionTypes.length; i++){
			html += '<option value="' + edit.questionTypes[i] + '">' + edit.questionTypes[i] + "</option>\n"
		}
		html += "</select>"
		d3.select(".questiontype").html(html)
		d3.select(".questiontypedropdown").on("change", function(){edit.questionOptions()});
	},
	questionOptions:function(){
		d3.select(".questiondata").html("")
		edit.askQuestionText(edit.questionSchema.common.text.description)
		edit.askQuestionCharType(edit.questionSchema.common.alphabetType.description)
		var qType = document.querySelector(".questiontypedropdown").value
		var q = edit.questionSchema[qType]
		var fields = Object.keys(q)
		for (var i = 0; i< fields.length; i++){
			var name = fields[i]
			var description = q[name].description
			var isOptional = q[name].optional
			var defaultValue = q[name]["default"]
			edit.askQuestionOption(name, description, defaultValue, isOptional)
		}
		var button = "<a class='pure-button' id='getjson'>Get JSON</a>"
		document.querySelector(".buttondiv").innerHTML = button;
		document.querySelector("#getjson").addEventListener("click", edit.getJSON);
	},
	askQuestionOption:function(name, description,defaultValue, isOptional){
		var html = "<p>" + name
		if (!isOptional){
			html += "* "
		}
		html += ": <input type='text' id='" + name +"' value='" + defaultValue + "''><a id='desc" + name + "'>  ?</a></p>"
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
	getJSON:function(){
		var modelJSON = model.generateJSON3()
		var q = {}
		// Store common variables
		q.text = document.querySelector("#text").value
		q.alphabetType = document.querySelector("#alphabettype").value

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

	}

}

window.onload = function(){
	edit.createQuestionPrompt()
}