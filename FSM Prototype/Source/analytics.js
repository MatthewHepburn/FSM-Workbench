var logging = {
    userID: undefined,
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
    sendInfo: function() {
        var url = window.location.href;
        if (url.slice(0,5) == "file:"){
            // Don't try to log if accessing locally.
            return;
        }
        if (!isActive){
            // Don't log if the window is not active
            return;
        }
        if (logging.userID == undefined){
            logging.generateUserID();
        }
        var data = "url=" + encodeURIComponent(url) + "&userID=" +encodeURIComponent(logging.userID);
        var request = new XMLHttpRequest();
        request.open("POST", "/cgi/s1020995/logging.cgi", true);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
        request.send(data);
    }
};
// Keep track of whether the tab is active
var isActive = true;

window.onfocus = function () { 
  isActive = true; 
}; 

window.onblur = function () { 
  isActive = false;
}; 
logging.sendInfo();
setInterval(logging.sendInfo, 120000);