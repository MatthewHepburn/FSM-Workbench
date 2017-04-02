// FSM Workbench - a graphical finite state machine editor and simulator
// Copyright (C) 2017  Matthew Hepburn

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

"use strict";

var data = {
    isLoaded: false,
    getData:function(){
        var xhr = new XMLHttpRequest();
        const dataURL = d3.select("body").attr("data-analytics-path") + "/getStats.cgi";
        xhr.open("get", dataURL, true);
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
    getMeanTimeData(){
        const pageList = data.pageList;
        const timeData = []; // will be in form [[pagename, mean]]
        pageList.forEach(function(pageID){
            const pageData = data.json.pages[pageID];
            if(!pageData){
                return;
            }
            if (pageData.hasOwnProperty("uniqueVisitors") && pageData.hasOwnProperty("totalTime")){
                const meanTime = pageData["totalTime"] / pageData["uniqueVisitors"];
                const pageName = data.getName(pageID);
                timeData.push([pageName, meanTime]);
            }
        });
        return timeData;
    },
    getMedianTimeData(){
        const pageList = data.pageList;
        const timeData = []; // will be in form [[pagename, mean]]
        pageList.forEach(function(pageID){
            const pageData = data.json.pages[pageID];
            if(!pageData){
                return;
            }
            if (pageData.hasOwnProperty("medianTotalTime")){
                const medianTime = pageData["medianTotalTime"];
                const pageName = data.getName(pageID);
                timeData.push([pageName, medianTime]);
            }
        });
        return timeData;
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
    get width(){
        //Width and height functions based on http://stackoverflow.com/a/1038781
        const fraction = 0.8
        if (self.innerWidth) {
            return self.innerWidth * fraction;
        }
        if (document.documentElement && document.documentElement.clientWidth) {
            return document.documentElement.clientWidth * fraction;
        }
        if (document.body) {
            return document.body.clientWidth * fraction;
        }
    },
    get height(){
        const fraction = 0.9
        if (self.innerHeight) {
            return self.innerHeight * fraction;
        }
        if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientHeight * fraction;
        }
        if (document.body) {
            return document.body.clientHeight * fraction;
        }
    },
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
        d3.selectAll(".removable").remove();
        var dateData = data.getDateData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * dateData.length;
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scaleLinear()
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

        const xAxis = d3.axisBottom(scale);

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

        var max = data.getMaxVisitorPerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        d3.selectAll(".removable").remove();
        var pageData = data.getPageVisitData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scaleLinear()
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

        const xAxis = d3.axisBottom(scale);

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

        var max = data.getMaxAnswersPerPage();
        var barMargin = 2;
        var xMargin = 4;
        d3.select("#canvas")
            .html("");
        d3.selectAll(".removable").remove();
        var pageData = data.getPageAnswersData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scaleLinear()
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

        const xAxis = d3.axisBottom(scale);

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
        d3.selectAll(".removable").remove();
        var pageData = data.getPageRatingData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scaleLinear()
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

        const xAxis = d3.axisBottom(scale);

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
        d3.selectAll(".removable").remove();
        var pageData = data.getPageAnswersData();
        var barHeight = 30;
        var axisWidth = 20;
        var height = axisWidth + (barHeight + barMargin) * pageData.length;
        var chart = d3.select("#canvas");
        chart
            .attr("height", height);
        var scale = d3.scaleLinear()
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

        var xAxis = d3.axisBottom(scale);

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ xMargin + "," + (height - axisWidth) + ")")
            .call(xAxis);

        d3.select("#x-axis-title")
            .html("Number of <i class='blue'>users who give a correct answer</i> and <i class='red'>users attempting the question but not giving a correct answer</i>")
            .attr("style", "width: " + (display.width - 200) + "px;");
        d3.selectAll(".y .axis");
    },
    drawMeanTimeBarChart: function(){
        const chartData = data.getMeanTimeData();
        const barLabels = chartData.map(x => x[0]);
        const barValuesFull = chartData.map(x => x[1]/60);

        const valueDisplayFunction = function(time){
            if(time < 1){
                return Math.round(time * 60) + " sec";
            } else if (time < 60){
                return String(time.toFixed(1)) + " min";
            } else if (time < 24 * 60){
                return String((time/60).toFixed(1)) + " hour"
            } else{
                return String((time/(60 * 24)).toFixed(1)) + " day"
            }
        };

        const chartObj = {
            chartTitle: "Mean Total Time Spent per Page",
            barLabels,
            barValuesFull,
            xAxisLabel: "Mean total time (minutes)",
            yAxisLabel: "Page name",
            valueDisplayFunction,
            minHeight: 950
        };

        display.drawHorizontalBarChart(chartObj);
    },
    drawMedianTimeBarChart(){
        const chartData = data.getMedianTimeData();
        const barLabels = chartData.map(x => x[0]);
        const barValuesFull = chartData.map(x => x[1]/60);

        const valueDisplayFunction = function(time){
             if(time < 1){
                 return Math.round(time * 60) + " sec";
             } else if (time < 60){
                 return String(time.toFixed(1)) + " min";
             } else if (time < 24 * 60){
                 return String((time/60).toFixed(1)) + " hour"
             } else{
                 return String((time/(60 * 24)).toFixed(1)) + " day"
             }
         };

        const chartObj = {
            chartTitle: "Median Total Time Spent per Page",
            barLabels,
            barValuesFull,
            xAxisLabel: "Median total time (minutes)",
            yAxisLabel: "Page name",
            valueDisplayFunction,
            minHeight: 950
        };

        display.drawHorizontalBarChart(chartObj);
    },
    drawTest001BarChart: function(){
        const testData = data.json.tests.test001;

        const chartObj = {
            chartTitle: "Test001 (in progress)",
            barLabels: ["A", "B"],
            barValuesFull: [testData.aMean, testData.bMean],
            xAxisLabel: "Test group",
            yAxisLabel: "Mean number of questions answered correctly",
            maxWidth: 600,
            maxHeight: 500
        };

        display.drawVerticalBarChart(chartObj);

        //Add a table giving additional data about this test.
        const resultsTable = d3.select("body")
                               .insert("table", "#title + *")
                               .classed("removable", true);

        //Add a header to the table
        const tableHeader = resultsTable.append("thead").append("tr");
        ["Group", "Number of Users",
         "Mean questions answered correctly", "Standard deviation"].forEach(d => tableHeader.append("td").text(d));

        //Add the data
        const tBody = resultsTable.append("tbody");
        ["a", "b"].forEach(function(group){
            const row = tBody.append("tr");
            row.append("td").text(group.toUpperCase());
            row.append("td").text(testData[group+"Users"]);
            row.append("td").text(testData[group+"Mean"]);
            row.append("td").text(testData[group+"SD"]);
        });

        //style the table
        resultsTable
            .style("margin", "40px")
            .selectAll("td")
                .style("border-style", "solid")
                .style("border-color", "black")
                .style("border-width", "thin")
                .style("text-align", "center")
                .style("padding", "0px 7px 0px 7px");

    },
    drawHorizontalBarChart(chartObj){
        // Expect chartObj to include properties (* denotes optional):
        // chartTitle, barLabels, barValuesFull, barValuesSplit*,  xAxisLabel, yAxisLabel,
        // maxWidth*, maxHeight*, minWidth*, minHeight*, valueDisplayFunction

        //Configure width/height
        let width = display.width;
        let height = display.height;
        if(chartObj.maxWidth){
            width = Math.min(chartObj.maxWidth, width);
        }
        if(chartObj.minWidth){
            width = Math.max(chartObj.minWidth, width);
        }

        if(chartObj.maxHeight){
            height = Math.min(chartObj.maxHeight, height);
        }
        if(chartObj.minHeight){
            height = Math.max(chartObj.minHeight, height);
        }

        //Clear existing chart;
        d3.selectAll(".removable").remove();
        const chart = d3.select("#canvas");
        chart.html("")
            .attr("width", width)
            .attr("height", height);
        d3.select("#x-axis-title").html("").text("");


        // Draw title
        d3.select("#title")
            .text(chartObj.chartTitle)
            .attr("style", "width: " + (width) + "px;");

        // Calculate highest value
        const maxVal = chartObj.barValuesFull.reduce((x,y)=>Math.max(x, y));

        // Define constants
        const nValues = chartObj.barValuesFull.length;
        const yMargin = 100 / (nValues + 1);
        const x0 = 20;
        const xMax = width - 150;
        const y0 = 80; // y of top of chart
        const barHeight = (height - y0 - 100) / nValues;

        const scale = d3.scaleLinear()
                        .clamp(true)
                        .nice()
                        .domain([0, maxVal])
                        .range([0, xMax]);


        // Adds the bars
        const bars = d3.select("#canvas").selectAll("g")
                        .data(chartObj.barValuesFull)
                        .enter()
                            .append("g")
                            .classed("bar", true)
                            .attr("id", (d,i) => "bar-" + i);
        bars.append("rect")
            .attr("x", x0)
            .attr("y", (d, i) => y0 + i * (barHeight + yMargin))
            .attr("width", d => scale(d))
            .attr("height", barHeight);

        // Label the bars
        const fontSize = Math.min(barHeight - 4, 18);

        for(let i = 0; i < chartObj.barLabels.length; i++){
            const label = chartObj.barLabels[i];
            const value = chartObj.barValuesFull[i];
            let valueLabel = value;
            if(chartObj.valueDisplayFunction){
                valueLabel = chartObj.valueDisplayFunction(value);
            }
            const barEndX = scale(value) + x0;
            const barMidY = (y0 + i * (barHeight + yMargin)) + barHeight/2;
            const g = d3.select("#bar-" + i);
            // Add the name
            g.append("text")
                .text(label)
                .style("fill", "#000000")
                .attr("x", barEndX + 5)
                .attr("y", barMidY)
                .style("text-anchor", "start")
                .style("dominant-baseline", "central")
                .style("font", "sans-serif")
                .style("font-size", fontSize);

            // Add the value
            if(barEndX > (x0 + 60)){
                g.append("text")
                    .text(valueLabel)
                    .style("fill", "#FFFFFF")
                    .attr("x", barEndX - 5)
                    .attr("y", barMidY)
                    .style("text-anchor", "end")
                    .style("dominant-baseline", "central")
                    .style("font", "sans-serif")
                    .style("font-size", fontSize);
            }

        }

        //Add the xAxis
        const xAxisGenerator = d3.axisTop(scale);
        const yGap = 10; //Gap between xAxis and first bar
        const labelX = (x0 + xMax)/2;
        const labelY = - y0 / 2;

        chart.append("g")
            .attr("transform", `translate(${x0},${y0-yGap})`)
            .attr("class", "x axis")
            .call(xAxisGenerator)
            .append("text") //Add the axis label
                .text(chartObj.xAxisLabel)
                .style("fill", "#000000")
                .attr("x", labelX)
                .attr("y", labelY)
                .style("text-anchor", "middle")
                .style("dominant-baseline", "central")
                .style("font", "sans-serif")
                .style("font-size", 18);
    },
    drawVerticalBarChart(chartObj) {
        // Expect chartObj to include properties (* denotes optional):
        // chartTitle, barLabels, barValuesFull, barValuesSplit*,  xAxisLabel, yAxisLabel,
        // maxWidth*, maxHeight*, minWidth*, minHeight*

        //Configure width/height
        let width = display.width;
        let height = display.height;
        if(chartObj.maxWidth){
            width = Math.min(chartObj.maxWidth, width);
        }
        if(chartObj.minWidth){
            width = Math.max(chartObj.minWidth, width);
        }

        if(chartObj.maxHeight){
            height = Math.min(chartObj.maxHeight, height);
        }
        if(chartObj.minHeight){
            height = Math.max(chartObj.minHeight, height);
        }

        //Clear existing chart;
        d3.selectAll(".removable").remove();
        const chart = d3.select("#canvas");
        chart.html("")
            .attr("width", width)
            .attr("height", height);
        d3.select("#x-axis-title").html("").text("");


        // Draw title
        d3.select("#title")
            .text(chartObj.chartTitle)
            .attr("style", "width: " + (width) + "px;");



        // Calculate highest y value
        const maxVal = chartObj.barValuesFull.reduce((x,y)=>Math.max(x, y));

        // Define constants
        const nValues = chartObj.barValuesFull.length;
        const xMargin = 100 / (nValues + 1);
        const barWidth = (width - 200) / nValues;
        const x0 = 80;
        const y0 = height - 80; //y of bottom of chart
        const yTop = 10; //y of top of axis. NB yTop is lower than y0



        const scale = d3.scaleLinear()
                        .clamp(true)
                        .nice()
                        .domain([0, maxVal])
                        .range([y0, yTop]);


        //Adds the bars
        const barCentreXs = []; //Track the centre of each bar to draw labels
        d3.select("#canvas").selectAll("g")
            .data(chartObj.barValuesFull)
            .enter()
                .append("g")
                .classed("bar", true)
                .attr("id", (d,i) => "bar" + i)
                    .append("rect")
                        .attr("x", (d, i) => x0 + i * (barWidth + xMargin))
                        .attr("y", d => scale(d))
                        .attr("width", barWidth)
                        .attr("height", d => y0 - scale(d))
                        .each(function(){barCentreXs.push(Number(d3.select(this).attr("x")) + barWidth/2);}); //record x-coord of centre


        //Add the yAxis
        const yAxisGenerator = d3.axisLeft(scale);
        const xGap = 10; //Gap between xAxis and first bar
        const labelX = - 50;
        const labelY = (yTop + y0) / 2;

        chart.append("g")
            .attr("transform", `translate(${x0-xGap},0)`)
            .attr("class", "y axis")
            .call(yAxisGenerator)
            .append("text") //Add the axis label
                .text(chartObj.yAxisLabel)
                .attr("transform", `rotate(270, ${labelX}, ${labelY})`)
                .style("fill", "#000000")
                .attr("x", labelX)
                .attr("y", labelY)
                .style("text-anchor", "middle")
                .style("dominant-baseline", "central")
                .style("font", "sans-serif")
                .style("font-size", 18);

        //Add the xAxis
        const xAxisWidth = xGap + nValues * barWidth + (nValues -1) * xMargin;
        const xAxisStart = x0 - xGap; // x coordinate for the start of the axis
        const xAxisEnd = xAxisWidth + (x0 - xGap); //x coordinate for the end of the axis
        const xAxisLabels = [""].concat(chartObj.barLabels).concat([""]);
        const xAxisRange = [xAxisStart].concat(barCentreXs).concat([xAxisEnd]);

        const xAxisScale = d3.scaleOrdinal()
                             .domain(xAxisLabels)
                             .range(xAxisRange);

        const xAxisGenerator = d3.axisBottom(xAxisScale);


        const xAxis = chart.insert("g", ":first-child")
                            .attr("transform", `translate(0, ${y0})`)
                            .classed("x", true)
                            .classed("axis", true)
                            .call(xAxisGenerator);

        //Tweak the ticks on the x-axis
        const xAxisTickFontSize = 50 / (nValues - 1);
        xAxis.selectAll(".tick text")
             .style("font-size", xAxisTickFontSize)
             .style("text-anchor", "middle");


        xAxis.append("text") //add the axis label)
            .text(chartObj.xAxisLabel)
            .style("fill", "#000000")
            .attr("x", (xAxisWidth / 2) + x0 )
            .attr("y", xAxisTickFontSize + 10)
            .style("text-anchor", "middle")
            .style("dominant-baseline", "central")
            .style("font", "sans-serif")
            .style("font-size", 18);
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