#!/usr/bin/python
import cgi
import os
import cgitb
import time
import subprocess

# logdir = os.curdir
# os.path.join(logdir, "cgitb.log")
# cgitb.enable(display=0, logdir=logdir)

form = cgi.FieldStorage()

datafile = os.path.join(os.curdir, "stats.json")

print "Status: 200 OK"
print("Content-type: application/json\n\n")

# Determine if the data should be reparsed based on how much time has passed since it was last modifed:
modifedTime = int(os.path.getmtime(datafile))
currentTime = int(time.time())
if currentTime - modifedTime > 60 * 60 * 6: # 6 hours
	# Recreate stats.json
	# This process will output the json file directly
	subprocess.call(["python3", "parse.py"])
else:
	# Reuse existing json file
	f = open(datafile, "r")
	print(f.read())
