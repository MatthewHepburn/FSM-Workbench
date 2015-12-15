#!/usr/bin/python
import cgi
import os
import cgitb
import time
import subprocess

logdir = os.curdir
os.path.join(logdir, "cgitb.log")
cgitb.enable(display=0, logdir=logdir)

form = cgi.FieldStorage()

datafile = os.path.join(os.curdir, "stats.json")

print("Status: 200 OK")
print("Access-Control-Allow-Origin: *")
print("Content-type: application/json\n")


# Determine if the data should be reparsed based on how much time has passed since it was last modifed:
try:
	modifedTime = int(os.path.getmtime(datafile))
except OSError:
	# If file doesn't exist, create it.
	subprocess.call(["python", "parse.py"])
	modifedTime = int(os.path.getmtime(datafile))
currentTime = int(time.time())
if currentTime - modifedTime > 60 * 5: # 5 minutes
	# Recreate stats.json
	subprocess.call(["python", "parse.py"])
# Output the file.
f = open(datafile, "r")
print(f.read())
quit()
