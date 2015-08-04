#!/usr/bin/python

import cgi
import os
import cgitb
import logging
import datetime
import time
import re

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
url = form.getfirst("url", "none")
if url != "none":
	#Extract the file name using regex
	url = re.search("[^/]*(?=\.html$)", url).group(0)
rating = form.getfirst("rating", "none")

string = userID + "    "+url+"    "+remoteIp+"    "+remoteHost+"    "+timeEpoch+"    "+timeHuman+"    "+agent+"    "+rating

date = str(datetime.date.today())


logging.basicConfig(filename='rating ' + url +'.log',level=logging.INFO)

logging.info(string)

print "Content-type: text/html"
print

print """<html>Done</html>"""


