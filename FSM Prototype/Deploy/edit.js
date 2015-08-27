edit = {
	question = {}
	questionTypes :["give-list", "satisfy-definition","satisfy-list", "satisfy-regex", "select-states"],
	questionSchema: {
		"common":{
			"text": {"description": "Text of the question. HTML tags allowed.", "optional": false},
			"alphabetType" {"description": "Should the machine take input a character at a time (char) or consider longer strings as a single symbol (symbol", "optional":false},

		},
		"give-list":{
			"lengths": {"description": "A list of integers, each representing a target length of accepted input for the user to provide. Eg [3,3,6]", "optional": false},
			"prefill": {"description": "An option to automatically fill in some of the fields. Eg {'0': 'aab'} would fill the first field with the string 'aab'.", "optional":false}
			}
	}
	createQuestionPrompt:function() {
		var html = "Select question type: <select class='questiontypedropdown'><option value='none'></option>"
		for (var i = 0; i < edit.questionTypes.length; i++){
			html += '<option value="' + edit.questionTypes[i] + '">' + edit.questionTypes[i] + "</option>\n"
		}
		html += "</select>"
		d3.select(".questiontype").html(html)
		d3.select(".questiontypedropdown").on("change", function(){alert("YO")})
	},
	questionOptions:function(type){
		d3.select(".questiondata").html("")

	}

}

window.onload = function(){
	edit.createQuestionPrompt()
}