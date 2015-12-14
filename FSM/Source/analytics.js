var logging = {
    userID: undefined,
    loadTime: Math.floor(Date.now() / 1000),
    pageID: undefined,
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
        request.open("POST", "/cgi/s1020995/stable/usage.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(string);
    }
};

window.addEventListener("beforeunload", function(){
    logging.sendInfo();
});