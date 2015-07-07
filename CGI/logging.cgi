#!/usr/bin/python

import cgi
import os
import cgitb
import logging
import datetime

logdir = os.curdir
os.path.join(logdir, "cgitb.log")
cgitb.enable(display=0, logdir=logdir)

#form = cgi.FieldStorage()

time = datetime.datetime.now().strftime("%I:%M%p on %B %d, %Y")

logging.basicConfig(filename='usage.log',level=logging.INFO)

logging.info("Accessed at " + time)

print "Content-type: text/html"
print

print """<html>Done</html>"""


