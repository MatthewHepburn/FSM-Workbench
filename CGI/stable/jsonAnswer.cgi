#!/usr/bin/python

import cgi
import os
import cgitb
import logging
import datetime
import time
import re
import json
import sys

def getQuestionName(questionID):
    with open('questionlist.json') as data_file:
        data = json.load(data_file)
        try:
            return data[questionID]
        except KeyError:
            return None

def returnError():
    print("Content-type: text/html")
    print("")
    print ("<html>Error</html>")
    sys.exit()


logdir = os.curdir
os.path.join(logdir, "cgitb.log")
cgitb.enable(display=0, logdir=logdir)

form = cgi.FieldStorage()

timeHuman = datetime.datetime.now().strftime("%I:%M%p on %B %d, %Y")
timeEpoch = time = str(int((time.time())))
date = str(datetime.date.today())
try:
    remoteIp = os.environ["REMOTE_ADDR"]
except KeyError:
    remoteIp = "unknown"
try:
    agent = os.environ["HTTP_USER_AGENT"]
except KeyError:
    agent = "unknown"
data = form.getfirst("data", "none")
# Try and parse json - break on error
if data == "none":
    returnError()
try:
    data = json.loads(data)
except ValueError:
    returnError()

# Extract question id:
try:
    questionID = data["questionID"]
    # Verify we have a valid questionID
    qnamedict = getQuestionName(data["questionID"])
    if qnamedict is None:
        returnError()
except KeyError:
    returnError()

#Add information form the header:
data["remoteIp"] = remoteIp
data["agentString"] = agent
data["timeEpoch"] = timeEpoch
data["timeHuman"] = timeHuman


with open("answers.log", "a") as myfile:
    myfile.write(json.dumps(data))
    myfile.write("\n")

print "Content-type: text/html"
print

print """<html>Done</html>"""


