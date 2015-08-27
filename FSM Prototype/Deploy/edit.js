edit = {
	question: {},
	questionTypes: ["give-list", "satisfy-definition","satisfy-list", "satisfy-regex", "select-states"],
	questionSchema: {
		"common":{
			"text": {"description": "Text of the question. HTML tags allowed.", "optional": false},
			"alphabetType": {"description": "Should the machine take input a character at a time (char) or consider longer strings as a single symbol (symbol).", "optional":false},

		},
		"give-list":{
			"lengths": {"description": "A list of integers, each representing a target length of accepted input for the user to provide. Eg [3,3,6]", "optional": false, "default":"[1,2]"},
			"prefill": {"description": "An option to automatically fill in some of the fields. Eg {'0': 'aab'} would fill the first field with the string 'aab'.", "optional":true, "default":"{}"}
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
	},
	askQuestionOption:function(name, description,defaultValue, isOptional){
		var html = "<p>" + name
		if (!isOptional){
			html += "* "
		}
		html += ": <input type='text' id='" + name +"' value='" + defaultValue + "''><a id='desc" + name + "'>  ?</a></p>"
		// Use method below as inserting normally resets the event listeners
		document.querySelector(".questiondata").insertAdjacentHTML("afterend",html)
		var id = "#desc" + name
		console.log(id)
		f = function(){alert(description);};
		d3.select(id)
			.classed("showdesc", true)
		document.querySelector(id).addEventListener("click", f);

	},

	askQuestionText:function(defaultValue){
		var html = d3.select(".questiondata").html()
		html += "<p>text* : <textarea cols='120' id='" + name +"' >"+ defaultValue +"</textarea></p>"
		d3.select(".questiondata").html(html)
	},

	askQuestionCharType:function(description){
		var html = d3.select(".questiondata").html()
		html += "<p>Alphabet Type* : <select id='alphabettype'><option value='char'>char</option><option value='symbol'>symbol</option></select><a id='descchartype'>   ?</a></p>"
		d3.select(".questiondata").html(html)
		d3.select("#descchartype").on("click", function(){alert(description)}).classed("showdesc", true)
	}

}

window.onload = function(){
	edit.createQuestionPrompt()
}