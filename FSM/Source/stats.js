var data = {
    isLoaded: false,
    getData:function(){
        var xhr = new XMLHttpRequest();
        if (document.querySelector("body").dataset.dataaddress){
            var url = document.querySelector("body").dataset.dataaddress;
        } else{
            url = "http://homepages.inf.ed.ac.uk/cgi/s1020995/stable/getStats.cgi";
        }
        xhr.open("get", url, true);
        xhr.responseType = "json";
        xhr.onload = function(){
            data.json = xhr.response;
            data.isLoaded = true;
        };
        xhr.send();
    },
    getDateData:function(){
        var dates = [];
        for (var date in data.json.dates){
            var thisDate = {date: date, uniqueVisitors: data.json.dates[date].uniqueVisitors};
            dates.push(thisDate);
        }
        dates.sort(function(a, b){
            var keyA = a.date,
                keyB = b.date;
            // Compare the 2 dates
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
        return dates;
    },
    getPageVisitData: function(){
        var pageList = data.pageList;
        var pageData = [];
        for (var i = 0; i < pageList.length; i++){
            var pageID = pageList[i];
            var thisData = data.json.pages[pageID];
            if (thisData === undefined){
                continue;
            }
            var uniqueVisitors;
            if (thisData.hasOwnProperty("uniqueVisitors")){
                uniqueVisitors = thisData.uniqueVisitors;
            } else {
                uniqueVisitors = 0;
            }
            var thisPage = {"name":data.getName(pageID),
                            "uniqueVisitors": uniqueVisitors
                            };
            pageData.push(thisPage);
        }
        return pageData;

    },
    getMeanTimeData:function(){
        var pageList = data.pageList;
        var timeData = [];
        for (var i = 0; i < pageList.length; i++){
            var pageID = pageList[i];
            var thisData = data.json.pages[pageID];
            if (thisData === undefined){
                continue;
            }
            var uniqueVisitors;
            var totalTime;
            if (thisData.hasOwnProperty("uniqueVisitors")){
                uniqueVisitors = thisData.uniqueVisitors;
            } else {
                uniqueVisitors = 0;
            }

            if (thisData.hasOwnProperty("totalTime")){
                totalTime = thisData.totalTime;
            } else {
                totalTime = 0;
            }

            var thisPage;
            if(uniqueVisitors !== 0){
                thisPage = {"name":data.getName(pageID),
                            "meanTime": totalTime/(uniqueVisitors * 60)
                            };
            } else {
                thisPage = {"name":data.getName(pageID),
                            "meanTime": 0
                            };
            }
            timeData.push(thisPage);
        }
        return timeData;

    },
    getPageAnswersData: function(){
        var questionList = data.questionList;
        var pageData = [];
        for (var i = 0; i < questionList.length; i++){
            var pageID = questionList[i];
            var thisData = data.json.pages[pageID];
            if (thisData === undefined){
                continue;
            }
            var totalAnswers;
            var correctAnswers;
            var incorrectAnswers;
            var usersAttempted;
            var usersCorrect;
            var usersNotCorrect;
            if (thisData.hasOwnProperty("totalAnswers")){
                totalAnswers = thisData.totalAnswers;
            } else {
                totalAnswers = 0;
            }
            if (thisData.hasOwnProperty("correctAnswers")){
                correctAnswers = thisData.correctAnswers;
            } else {
                correctAnswers = 0;
            }
            if (thisData.hasOwnProperty("usersAttempted")){
                usersAttempted = thisData.usersAttempted;
            } else {
                usersAttempted = 0;
            }
            if (thisData.hasOwnProperty("usersCorrect")){
                usersCorrect = thisData.usersCorrect;
            } else {
                usersCorrect = 0;
            }
            incorrectAnswers = totalAnswers - correctAnswers;
            usersNotCorrect = usersCorrect - usersAttempted;
            var thisPage = {"name":data.getName(pageID),
                            "correctAnswers": correctAnswers,
                            "totalAnswers": totalAnswers,
                            "incorrectAnswers": incorrectAnswers,
                            "usersCorrect": usersCorrect,
                            "usersAttempted":usersAttempted,
                            "usersNotCorrect":usersNotCorrect
                            };
            pageData.push(thisPage);
        }
        return pageData;
    },
    getPageRatingData: function(){
        var questionList = data.questionList;
        var pageData = [];
        for (var i = 0; i < questionList.length; i++){
            var pageID = questionList[i];
            var thisData = data.json.pages[questionList[i]];
            if (thisData === undefined){
                continue;
            }
            var totalRatings;
            var yesRatings;
            if (thisData.hasOwnProperty("totalRatings")){
                totalRatings = thisData.totalRatings;
            } else {
                totalRatings = 0;
            }
            if (thisData.hasOwnProperty("yesRatings")){
                yesRatings = thisData.yesRatings;
            } else {
                yesRatings = 0;
            }
            var thisPage = {"name":data.getName(pageID),
                            "totalRatings": totalRatings,
                            "yesRatings": yesRatings
                            };
            pageData.push(thisPage);
        }
        return pageData;
    },
    getMaxAnswersPerPage:function(){
        var max = 0;
        for (var url in data.json.pages){
            var answers = data.json.pages[url].totalAnswers;
            if (answers > max) {
                max = answers;
            }
        }
        return max;

    },
    getMaxMeanTimePerPage:function(){
        //Returns max mean time per page in minutes
        var max = 0.0;
        for (var url in data.json.pages){
            var meanTime = data.json.pages[url].totalTime/(data.json.pages[url].uniqueVisitors * 60);
            if (meanTime > max) {
                max = meanTime;
            }
        }
        return max;

    },
    getMaxUsersAttemptedPerPage:function(){
        var max = 0;
        for (var url in data.json.pages){
            var answers = data.json.pages[url].usersAttempted;
            if (answers > max) {
                max = answers;
            }
        }
        return max;

    },
    getMaxRatingsPerPage:function(){
        var max = 0;
        for (var url in data.json.pages){
            var ratings = data.json.pages[url].totalRatings;
            if (ratings > max) {
                max = ratings;
            }
        }
        return max;

    },
    getMaxVisitorPerDate:function(){
        var max = 0;
        for (var date in data.json.dates){
            var visits = data.json.dates[date].uniqueVisitors;
            if (visits > max) {
                max = visits;
            }
        }
        return max;
    },
    getMaxVisitorPerPage: function(){
        var max = 0;
        for (var url in data.json.pages){
            var visits = data.json.pages[url].uniqueVisitors;
            if (visits > max) {
                max = visits;
            }
        }
        return max;
    },
    getName:function(pageID){
        var pageData = data.json.pages[pageID];
        if (pageData.isQuestion){
            return pageData.set + " - " + pageData.name;
        } else{
            return pageData.name;
        }

    },
    setLists:function(){
        //Create the page and question lists
        data.pageList = []; //list of all pageIDs
        data.questionList = []; //list of all pageIDs corresponding to questions
        for (var pageID in data.json.pages){
            if(data.json.pages[pageID].isQuestion){
                data.questionList.push(pageID);
            }
            data.pageList.push(pageID);
        }
    },
    sortLists:function(){
        var sort =  function(a, b){
            //Sort by set, then by question-number, then by uniques
            var aSet = data.json.pages[a].set !== undefined? data.json.pages[a].set : "zz";
            var bSet = data.json.pages[b].set !== undefined? data.json.pages[b].set : "zz";
            if (aSet < bSet){return -1;}
            if (aSet > bSet){return 1;}

            //Set is equal, compare question-numbers
            var aQN = data.json.pages[a]["question-number"] !== undefined? data.json.pages[a]["question-number"] : -1;
            var bQN = data.json.pages[b]["question-number"] !== undefined? data.json.pages[b]["question-number"] : -1;
            if (aQN < bQN){return -1;}
            if (aQN > bQN){return 1;}

            //QuestionNumbers are equal - sort by uniques
            var aUniques = data.json.pages[a].uniqueVisitors;
            var bUniques = data.json.pages[b].uniqueVisitors;
            if (aUniques < bUniques){return 1;}
            if (aUniques > bUniques){return -1;}
            return 0;

        };
        data.questionList.sort(sort);
        data.pageList.sort(sort);
    }
};

data.getData();

var display = {
    width: 900,
    height: 600,
    setupCanvas: function(){
        d3.select("#canvas-div").append("svg")
            .attr("width", display.width)
            .attr("height", display.height)
            .attr("id", "canvas");
    },
    drawDateBarChart: function(){
        // Draw title
        d3.select("#title")
            .html("Daily Unique Visitors")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxVisitorPerDate();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var dateData = data.getDateData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * dateData.length;
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
                    .attr("width", function(d) { return scale(d.uniqueVisitors); })
                    .attr("height", barHeight);

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.date; });

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) - 3; })
            .attr("y", barHeight/2)
            .attr("dy", ".35em")
            .text(function(d){
                if (scale(d.uniqueVisitors)> 15){
                    return d.uniqueVisitors;
                } else {
                    return "";
                }
            });

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

        var max = Math.ceil(data.getMaxVisitorPerPage());
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var pageData = data.getPageVisitData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
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
                    .attr("width", function(d) { return scale(d.uniqueVisitors); })
                    .attr("height", barHeight);

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.name; });

        bar.append("text")
            .attr("x", function(d) { return scale(d.uniqueVisitors) - 3; })
            .attr("y", barHeight/2)
            .attr("dy", ".35em")
            .text(function(d){
                if (scale(d.uniqueVisitors)> 15){
                    return d.uniqueVisitors;
                } else {
                    return "";
                }
            });

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
    drawMeanTimeBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("Mean Time Spent by Question")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxMeanTimePerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var pageData = data.getMeanTimeData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
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
                    .attr("width", function(d) { return scale(d.meanTime); })
                    .attr("height", barHeight);

        bar.append("text")
            .attr("x", function(d) { return scale(d.meanTime) + 6; })
            .attr("y", barHeight / 2)
            .attr("dy", ".35em")
            .classed("right-label", true)
            .text(function(d) { return d.name; });

        bar.append("text")
            .attr("x", function(d) { return scale(d.meanTime) - 3; })
            .attr("y", barHeight/2)
            .attr("dy", ".35em")
            .text(function(d){
                if (d.meanTime > 0.025 * max){
                    return d.meanTime.toFixed(1);
                } else {
                    return "";
                }
            });

        var xAxis = d3.svg.axis()
                        .scale(scale)
                        .orient("bottom");
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Mean time (minutes)")
            .attr("style", "width: " + (display.width - 200) + "px;");

    },
    drawPageAnswersBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("Correct vs Total Answers by Question")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxAnswersPerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var pageData = data.getPageAnswersData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
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
            .attr("width", function(d) { return scale(d.totalAnswers);})
            .attr("height", barHeight)
            .classed("total", true);

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.correctAnswers); })
                    .attr("height", barHeight);



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

        var max = data.getMaxRatingsPerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var pageData = data.getPageRatingData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
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
            .attr("width", function(d) { return scale(d.totalRatings);})
            .attr("height", barHeight)
            .classed("total", true);

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.yesRatings);})
                    .attr("height", barHeight);

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
    drawPageUserOutcomesBarChart:function(){
        // Draw title
        d3.select("#title")
            .html("User Outcomes by Question")
            .attr("style", "width: " + (display.width - 200) + "px;");

        var max = data.getMaxUsersAttemptedPerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        var pageData = data.getPageAnswersData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
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
            .attr("width", function(d) { return scale(d.usersAttempted);})
            .attr("height", barHeight)
            .classed("total", true);

        bar.append("rect")
                    .attr("width", function(d) { return scale(d.usersCorrect);})
                    .attr("height", barHeight);

        bar.append("text")
            .attr("x", function(d) { return scale(d.usersAttempted) + 6; })
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
            .html("Number of <i class='blue'>users who give a correct answer</i> and <i class='red'>users attempting the question but not giving a correct answer</i>")
            .attr("style", "width: " + (display.width - 200) + "px;");
        d3.selectAll(".y .axis");
    },
    writeLogSize:function(){
        var div = document.querySelector("#logsize");
        div.innerHTML = ("Log size: ") + data.json.meta.logSize;
    },
    writeTimeStamp:function(){
        var div = document.querySelector("#timestamp");
        div.innerHTML = ("Logs parsed at ") + data.json.meta.timeStamp;
    }
};

var control = {
    initialDraw:function(){
        if (!data.isLoaded){
            setTimeout(control.initialDraw, 100);
            return;
        }
        data.setLists();
        data.sortLists();
        display.drawDateBarChart();
        display.writeTimeStamp();
        display.writeLogSize();
    }
};

window.onload = function(){
    display.setupCanvas();
    control.initialDraw();
};


//Declare d3 as global readonly for ESLint
/*global d3*/