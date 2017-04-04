#!/usr/bin/python

import cgi
import json
import hashlib
import cgitb
import os

# This script saves the submited question object to the question set: questionSet.json, creating the set if it does not exist
# Only users providing a password are allowed to write to the file
cgitb.enable(display=1, logdir=os.curdir)


def main(form):
    # Password is required to write to the file.
    password = form.getfirst("password", "")
    if not isCorrectPassword(password):
        print "Content-type: text/html\n\n<html>Password Incorrect</html>"
        return
    questionList = getQuestionList()
    newQuestion = form.getfirst("question", "")
    try:
        newQuestionObj = json.loads(newQuestion)
    except ValueError:
        print "Content-type: text/html\n\n<html>JSON Error</html>"
        return
    try:
        questionList.append(newQuestionObj)
        saveQuestionList(questionList)
    except:
        print "Content-type: text/html\n\n<html>Save Error</html>"
        return
    print "Content-type: text/html\n\n<html>Success</html>";

def isCorrectPassword(password):
    # Simple password scheme - one correct password
    # Verifed by comparing to the SHA512 hash
    # Uses a salt, which is public (via Github) but still protects against rainbow tables
    # Not secure as password sent in clear, but good enough for this application
    salt = "5d4cd22973184058b30df5bcf1d55466"
    pw_bytes = password.encode('utf-8')
    salt_bytes = salt.encode('utf-8')
    correctHash = 'd24f826022246df8a1a9645a1bb78e3c45b2e83b859143dea7b64f62a634254f170d0175308f78aa0621298aaf5c5510f322026df059f78043697d8d0ca6dd36'
    h = hashlib.sha512()
    h.update(pw_bytes + salt_bytes)
    return h.hexdigest() == correctHash;

def getQuestionList():
    # Loads the current question list from the datafile, if it exists.
    jsonFilename = "savedQuestions.json"
    with open(jsonFilename, "rw") as data_file:
        try:
            data = json.load(data_file)
        except ValueError:
            data = []
        except IOError:
            data = []
    return data

def saveQuestionList(questionList):
    jsonFilename = "savedQuestions.json"
    with open(jsonFilename, "w+") as outfile:
        json.dump(questionList, outfile, indent=4, separators=(',', ': '))


form = cgi.FieldStorage()
main(form)
