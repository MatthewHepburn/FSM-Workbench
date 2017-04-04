#!/usr/bin/python

import cgi
import cgitb
import datetime
import json
import os
import time

errorStr = "Content-type: text/html\n\n<html>Error</html>"
successStr = "Content-type: text/html\n\n<html>Done</html>"

# cgiFields is expected to be the output of cgi.FieldStorage()
def log(cgiFields, logfilename):
    logdir = os.curdir
    os.path.join(logdir, "cgitb.log")
    cgitb.enable(display=0, logdir=logdir)

    form = cgiFields

    timeHuman = datetime.datetime.now().strftime("%I:%M%p on %B %d, %Y")
    timeEpoch = int((time.time()))
    date = str(datetime.date.today())
    try:
        remoteIp = os.environ["REMOTE_ADDR"]
        ipComponents = remoteIp.split(".")[:-1] #Discard last octet
        remoteIp = ""
        for n in ipComponents:
            remoteIp = remoteIp + n + "."
        remoteIp = remoteIp[:-1] #Discard last '.'
    except KeyError:
        remoteIp = "unknown"
    try:
        agent = os.environ["HTTP_USER_AGENT"]
    except KeyError:
        agent = "unknown"
    data = form.getfirst("data", "none")
    # Try and parse json - return on error
    if data == "none":
        return errorStr
    try:
        data = json.loads(data)
    except ValueError:
        return errorStr

    #Add information from the header:
    data["remoteIp"] = remoteIp
    data["agentString"] = agent
    data["timeEpoch"] = timeEpoch
    data["timeHuman"] = timeHuman

    with open(logfilename, "a") as myfile:
        myfile.write(json.dumps(data))
        myfile.write("\n")

    return successStr

