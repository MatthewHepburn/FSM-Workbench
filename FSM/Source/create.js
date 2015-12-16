var create = {
    setup: function() {
        // Setup the creation environment.
        create.registerTraceButtonListener();
        create.registerAlphabetButtonListener();
    },
    registerTraceButtonListener:function(){
        d3.select("#traceform-button")
            .on("click", function(){
                var input = model.parseInput(document.querySelector("#traceform").value);
                display.showTrace(input);
                console.log(input);
            });
    },
    registerAlphabetButtonListener:function(){
        d3.select("#setalphabet-button")
            .on("click", function(){
                var alphabet = document.querySelector("#setalphabet").value;
                create.setalphabet(alphabet);
                console.log(alphabet);
            });
    },
    setalphabet: function(string){
        try{
            var alphabet = JSON.parse(string);
            document.querySelector("#alphabeterror").innerHTML = "";
            if(alphabet.constructor !== Array){
                throw new Error("alphabet must be an array.");
            }
            if (alphabet.indexOf("ε") == -1){
                alphabet.push("ε");
            }
            var alphabetType = "char";
            for (i = 0; i < alphabet.length; i++){
                if(alphabet[i].length > 1){
                    alphabetType = "symbol";
                }
            }
            model.question.alphabetType = alphabetType;
            model.question.alphabet = alphabet;
            var purgeAlphabet = function(link){
                var newAlphabet = alphabet;
                link.input = link.input.filter(function(symbol){
                    return newAlphabet.indexOf(symbol) != -1;
                });
            };
            for(var i = 0; i < model.links.length; i++){
                purgeAlphabet(model.links[i]);
                display.updateLinkLabel(model.links[i].id);
            }
            setTimeout(restart, 250);
             // Reinstate draggable nodes if they are allowed by the current tool:
            if(global.toolsWithDragAllowed.indexOf(model.toolMode) != -1){
                // Need to wait, otherwise this doesn't work
                window.setTimeout(function(){
                    global.circle.call(global.force.drag);
                }, 300);
            }
        }
        catch(e){
            document.querySelector("#alphabeterror").innerHTML = 'Parse error - enter alphabet in form ["a", "b"]';
        }

    }
};

// Start create mode here
create.setup();