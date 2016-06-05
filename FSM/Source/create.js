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
            Controller.setAlphabet(Model.machines[0], alphabet)
        }
        catch(e){
            document.querySelector("#alphabeterror").innerHTML = 'Parse error - enter alphabet in form ["a", "b"]';
        }

    }
};

// Start create mode here
create.setup();