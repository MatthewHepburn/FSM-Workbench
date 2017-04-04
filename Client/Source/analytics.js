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

const logging = {
    userID: undefined,
    loadTime: Math.floor(Date.now() / 1000),
    pageID: undefined,
    analyticsPath: document.querySelector("body").getAttribute("data-analytics-path"),
    generateUserID: function() {
        //Use local storage if it is available
        var hasStorage;
        if(typeof(localStorage) !== "undefined") {
            hasStorage = true;
            if (localStorage.getItem("userID") !== null){
                logging.userID = localStorage.getItem("userID");
                return;
            }
        } else {
            hasStorage = false;
        }
        var d = new Date().getTime();
        var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
            var r = (d + Math.random()*16)%16 | 0;
            d = Math.floor(d/16);
            return (c=="x" ? r : (r&0x3|0x8)).toString(16);
        });
        logging.userID = uuid;
        if (hasStorage){
            localStorage.setItem("userID", uuid);
        }
    },
    setPageID: function(){
        logging.pageID = document.querySelector("body").getAttribute("data-pageid");
    },
    sendInfo: function() {
        //Function for basic usage monitoring, called when the page is closed.
        var url = window.location.href;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        // Get time in seconds since the page was loaded.
        var timeOnPage = Math.floor(Date.now() / 1000) - logging.loadTime;
        if (logging.userID == undefined){
            logging.generateUserID();
        }
        if (logging.pageID === undefined){
            logging.setPageID();
        }
        var request = new XMLHttpRequest();

        var data = {
            "pageID": logging.pageID,
            "timeOnPage": timeOnPage,
            "url": url,
            "userID": logging.userID
        };

        var string =  "&data=" + encodeURIComponent(JSON.stringify(data));
        request.open("POST", logging.analyticsPath + "/usage.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    }
};

window.addEventListener("beforeunload", function(){
    logging.sendInfo();
});