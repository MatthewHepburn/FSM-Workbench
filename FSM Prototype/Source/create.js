create = {
    setup: function() {
        // Setup the creation environment.
        create.registerTraceButtonListener();
    },
    registerTraceButtonListener:function(){
        d3.select("#traceform-button")
            .on("click", function(){
                var input = model.parseInput(document.querySelector("#traceform").value);
                console.log(input);
            });
    }
}

// Start create mode here
create.setup()