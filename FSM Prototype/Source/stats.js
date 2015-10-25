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
        var dates = []
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
    getPageVisitData: function(){
        var pageList = data.pageList;
        var pageData = []
        for (var i = 0; i < pageList.length; i++){
            var thisData = data.json.urls[pageList[i]];
            if (thisData === undefined){
                continue;
            }
            var uniqueVisitors;
            if (thisData.hasOwnProperty("uniqueVisitors")){
                uniqueVisitors = thisData.uniqueVisitors
            } else {
                uniqueVisitors = 0;
            }
            var thisPage = {"name":pageList[i],
                            "uniqueVisitors": uniqueVisitors
                            };
            pageData.push(thisPage)
        }
        return pageData;

    },
    getPageAnswersData: function(){
        var questionList = data.questionList;
        var pageData = []
        for (var i = 0; i < questionList.length; i++){
            var thisData = data.json.urls[questionList[i]];
            if (thisData === undefined){
                continue;
            }
            var totalAnswers;
            var correctAnswers;
            var incorrectAnswers;
            if (thisData.hasOwnProperty("totalAnswers")){
                totalAnswers = thisData.totalAnswers
            } else {
                totalAnswers = 0;
            }
            if (thisData.hasOwnProperty("correctAnswers")){
                correctAnswers = thisData.correctAnswers
            } else {
                correctAnswers = 0;
            }
            incorrectAnswers = totalAnswers - correctAnswers
            var thisPage = {"name":questionList[i],
                            "correctAnswers": correctAnswers,
                            "totalAnswers": totalAnswers,
                            "incorrectAnswers": incorrectAnswers
                            };
            pageData.push(thisPage)
        }
        return pageData;
    },
    getPageRatingData: function(){
        var questionList = data.questionList
        var pageData = []
        for (var i = 0; i < questionList.length; i++){
            var thisData = data.json.urls[questionList[i]];
            if (thisData === undefined){
                continue;
            }
            var totalRatings;
            var yesRatings;
            if (thisData.hasOwnProperty("totalRatings")){
                totalRatings = thisData.totalRatings
            } else {
                totalRatings = 0;
            }
            if (thisData.hasOwnProperty("yesRatings")){
                yesRatings = thisData.yesRatings
            } else {
                yesRatings = 0;
            }
            var thisPage = {"name":questionList[i],
                            "totalRatings": totalRatings,
                            "yesRatings": yesRatings,
                            };
            pageData.push(thisPage)
        }
        return pageData;
    },
    getMaxAnswersPerPage:function(){
        var max = 0;
        for (url in data.json.urls){
            var answers = data.json.urls[url].totalAnswers;
            if (answers > max) {
                max = answers;
            }
        }
        return max;

    },
    getMaxRatingsPerPage:function(){
        var max = 0;
        for (url in data.json.urls){
            var ratings = data.json.urls[url].totalRatings;
            if (ratings > max) {
                max = ratings;
            }
        }
        return max;

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
    },
    getMaxVisitorPerPage: function(){
        var max = 0;
        for (url in data.json.urls){
            var visits = data.json.urls[url].uniqueVisitors;
            if (visits > max) {
                max = visits;
            }
        }
        return max;
    },
    setLists:function(){
        //Create the page and question lists
        data.pageList = [];
        data.questionList = [];
        var nonQuestions = ["index", "help", "about", "stats", "end"] //Pages which are not questions
        //Populate questionList with all the question names from the JSON file.
        for (property in data.json.urls){
            if(nonQuestions.indexOf(property) == -1){
                data.questionList.push(property)
            }
        }
        //Sort questionList by number of unique visitors
        data.questionList.sort(data.sortPages);
        //Construct pageList by adding the non-questions
        data.pageList = nonQuestions.concat(data.questionList);
    },
    sortPages:function(a, b){
        //Sort function to sort URLS by number of unique visitors in descending order
        var aUniques = data.json.urls[a].uniqueVisitors;
        var bUniques = data.json.urls[b].uniqueVisitors;
        if (aUniques < bUniques){
            return 1;
        }
        if (aUniques == bUniques){
            return 0;
        }
        return -1;
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
        var dateData = data.getDateData()
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
    },
    drawPageVisitsBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("Total Unique Visitors per Page")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxVisitorPerPage()
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("")
        pageData = data.getPageVisitData()
        var barHeight = 30
        axisWidth = 20
        var height = axisWidth + (barHeight + barMargin) * pageData.length
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scale.linear()
                    .domain([0, max])
                    .range([0, display.width - 200]);

        var bar = d3.select("#canvas").selectAll("g")
                    .data(pageData)
                .enter().append("g")
                    .attr("transform", function(d, i) { return "translate(" + xMargin + "," + i * (barHeight + 2) + ")"; })
                    .classed("bar", true);

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.uniqueVisitors) })
                    .attr("height", barHeight)

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.name; });

        var xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom");
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Number of Unique Visitors")
            .attr("style", "width: " + (display.width - 200) + "px;");

    },
    drawPageAnswersBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("Correct vs Total Answers by Question")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxAnswersPerPage()
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("")
        pageData = data.getPageAnswersData()
        var barHeight = 30
        axisWidth = 20
        var height = axisWidth + (barHeight + barMargin) * pageData.length
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scale.linear()
                    .domain([0, max])
                    .range([0, display.width - 200]);

        var bar = d3.select("#canvas").selectAll("g")
                    .data(pageData)
                .enter().append("g")
                    .attr("transform", function(d, i) { return "translate(" + xMargin + "," + i * (barHeight + 2) + ")"; })
                    .classed("bar", true);

        bar.append("rect")
            .attr("width", function(d) { return scale(d.totalAnswers) })
            .attr("height", barHeight)
            .classed("total", true)

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.correctAnswers) })
                    .attr("height", barHeight)



        bar.append("text")
            .attr("x", function(d) { return scale(d.totalAnswers) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.name; });

        var xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom");
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Number of <i class='blue'>Correct Answers</i> and <i class='red'>Incorrect Answers</i>")
            .attr("style", "width: " + (display.width - 200) + "px;");
    },
    drawPageRatingBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("Positive vs Total Ratings by Question")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxRatingsPerPage()
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("")
        pageData = data.getPageRatingData()
        var barHeight = 30
        axisWidth = 20
        var height = axisWidth + (barHeight + barMargin) * pageData.length
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scale.linear()
                    .domain([0, max])
                    .range([0, display.width - 200]);

        var bar = d3.select("#canvas").selectAll("g")
                    .data(pageData)
                .enter().append("g")
                    .attr("transform", function(d, i) { return "translate(" + xMargin + "," + i * (barHeight + 2) + ")"; })
                    .classed("bar", true);

        bar.append("rect")
            .attr("width", function(d) { return scale(d.totalRatings) })
            .attr("height", barHeight)
            .classed("total", true)

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.yesRatings) })
                    .attr("height", barHeight)



        bar.append("text")
            .attr("x", function(d) { return scale(d.totalRatings) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.name; });

        var xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom");
        if (max < 5){
            xAxis.tickValues([1,2,3,4,5])
                .tickFormat(d3.format(",.0f"));
        }
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Number of <i class='blue'>Positive Ratings</i> and <i class='red'>Negative Ratings</i>")
            .attr("style", "width: " + (display.width - 200) + "px;");

    },
    writeTimeStamp:function(){
        var div = document.querySelector("#timestamp");
        div.innerHTML = ("Logs parsed at ") + data.json.meta.timeStamp;
    }
}

var control = {
    initialDraw:function(){
        if (!data.isLoaded){
            setTimeout(control.initialDraw, 100);
            return;
        }
        data.setLists();
        display.drawDateBarChart();
        display.writeTimeStamp();
    }

}

window.onload = function(){
    display.setupCanvas();
    control.initialDraw();
}
