var data = {
    isLoaded: false,
    getData:function(){
        var xhr = new XMLHttpRequest();
        xhr.open('get', "http://homepages.inf.ed.ac.uk/cgi/s1020995/getStats.cgi", true);
        xhr.responseType = 'json';
        xhr.onload = function(){
            data.json = xhr.response;
            data.isLoaded = true;
        }
        xhr.send()
    },
    getDateData:function(){
        dates = []
        for (date in data.json.dates){
            thisDate = {date: date, uniqueVisitors: data.json.dates[date].uniqueVisitors}
            dates.push(thisDate)
        }
        console.log(dates)
        dates.sort(function(a, b){
            var keyA = a.date,
            keyB = b.date;
            // Compare the 2 dates
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
        return dates
    },
    getMaxVisitorPerDate:function(){
        var max = 0;
        for (date in data.json.dates){
            var visits = data.json.dates[date].uniqueVisitors;
            if (visits > max) {
                max = visits;
            }
        }
        return max;
    }
}

data.getData();

var display = {
    width: 900,
    height: 600,
    setupCanvas: function(){
        d3.select("#canvas-div").append("svg")
            .attr("width", display.width)
            .attr("height", display.height)
            .attr("id", "canvas")
    },
    drawDateBarChart: function(){
        // Draw title
        d3.select("#title")
            .html("Daily Unique Visitors")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxVisitorPerDate()
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("")
        dateData = data.getDateData()
        var barHeight = 30
        axisWidth = 20
        var height = axisWidth + (barHeight + barMargin) * dateData.length
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scale.linear()
                    .domain([0, max])
                    .range([0, display.width - 200]);

        var bar = d3.select("#canvas").selectAll("g")
                    .data(dateData)
                .enter().append("g")
                    .attr("transform", function(d, i) { return "translate(" + xMargin + "," + i * (barHeight + 2) + ")"; })
                    .classed("bar", true);

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.uniqueVisitors) })
                    .attr("height", barHeight)

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) - 3; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .text(function(d) { return d.date; });

        var xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom");
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Number of Unique Visitors per Day")
            .attr("style", "width: " + (display.width - 200) + "px;");
    }
}

var control = {
    initialDraw:function(){
        if (!data.isLoaded){
            setTimeout(control.initialDraw, 100)
            return
        }
        display.drawDateBarChart()
    }

}

window.onload = function(){
    display.setupCanvas()
    control.initialDraw()
}
