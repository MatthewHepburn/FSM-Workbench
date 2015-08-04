#!/usr/bin/python

import cgi
import os
import cgitb
import logging
import datetime
import time

logdir = os.curdir
os.path.join(logdir, "cgitb.log")
cgitb.enable(display=0, logdir=logdir)

form = cgi.FieldStorage()

timeHuman = datetime.datetime.now().strftime("%I:%M%p on %B %d, %Y")
timeEpoch = time = str(int((time.time())))
try:
	remoteIp = os.environ["REMOTE_ADDR"]
except KeyError:
	remoteIp = "unknown"
try:
	remoteHost = os.environ["REMOTE_HOST"]
except KeyError:
	remoteHost = "unknown"
try:
	agent = os.environ["HTTP_USER_AGENT"]
except KeyError:
	agent = "unknown"
userID = form.getfirst("userID", "none")
userID = form.getfirst("userID", "none")
url = form.getfirst("url", "none")

string = userID + "    "+url+"    "+remoteIp+"    "+remoteHost+"    "+timeEpoch+"    "+timeHuman+"    "+agent

date = str(datetime.date.today())


logging.basicConfig(filename='usage ' + date +'.log',level=logging.INFO)

logging.info(string)

print "Content-type: text/html"
print

print """<html>Done</html>"""


