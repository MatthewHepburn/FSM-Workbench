#coding: utf-8
import os
import pprint
import re
import json
import datetime
import time
import sys
import pdb
import subprocess #Required to determine directory size
try:
    from user_agents import parse
    hasUserAgents = True
except ImportError:
    hasUserAgents = False
# required to parse user-agent strings: pip install pyyaml ua-parser user-agents

dates = {}
pages = {}
questions = {}
users = {}
pageDict = {}
cutoffTime = 1439447160 # Ignore entries before this timestamp
maxTimeOnPage = 7200

logTime = 3 # Number of minutes between logs
pp = pprint.PrettyPrinter(indent=1)
crawlerAgents = ["Googlebot", "Google Page Speed Insights", "Google Search Console", "Google PP Default"]
ignoredIDs = ["DEBUG"] #UserIDs to ignore - eg to exclude developer actions from stats
startDir = os.getcwd()


def main():
    readPrevStats()
    setPageDict()
    setQuestionData()
    readFiles()
    analyseUsage()
    writeFullJSON()
    addPageData()
    writePublicJSON()
    archiveLogs()

def addIfNotPresent(list, item):
    # Can't use sets as they cannot be stored as JSON
    if item not in list:
        list.append(item)

def addPage(pageID):
    global pages
    if pageID not in pageDict:
        # Ignore pages not in pageDict – they no longer exist.
        return
    if isQuestion(pageID):
        pages[pageID] = {
            "correctAnswers": 0,
            "isQuestion": True,
            "name": pageDict[pageID]["name"],
            "numOfTimeToCorrectRecorded":0,
            "totalAnswers": 0,
            "totalRatings": 0,
            "totalTime": 0,
            "totalTimeToCorrect":0,
            "uniqueVisitors": 0,
            "usersAttempted": 0,
            "usersCorrect":0,
            "yesRatings": 0
            }
    else:
        pages[pageID] = {
            "isQuestion": False,
            "name": pageDict[pageID]["name"],
            "totalTime": 0,
            "uniqueVisitors": 0
            }

def addPageData():
    global pages
    for pageID in pages:
        if pageID not in pageDict:
            del pages[pageID]
        t = pages[pageID].copy()
        pages[pageID] = dict(t, **pageDict[pageID])



def isQuestion(pageID):
    return "set" in pageDict[pageID]

def analyseUsage():
    # First, set to zero all stats that are calculated here:
    for pageID in pages:
        if pageID not in pageDict:
            # pageID may not by in pageDict if the page has been removed.
            continue
        pages[pageID]["uniqueVisitors"] = 0
        pages[pageID]["totalTime"] = 0
        if pages[pageID]["isQuestion"]:
            pages[pageID]["yesRatings"] = 0
            pages[pageID]["totalRatings"] = 0
            pages[pageID]["usersAttempted"] = 0
            pages[pageID]["usersCorrect"] = 0
    for userID in users:
        if userID in ignoredIDs:
            continue
        u = users[userID]
        for pageID in u["totalTimeOnPage"]:
            if pageID not in pageDict:
                continue
            if pageID not in pages:
                addPage(pageID)
            pages[pageID]["totalTime"] += u["totalTimeOnPage"][pageID]
            pages[pageID]["uniqueVisitors"] += 1
        for pageID in u["questionRatings"]:
            if pageID not in pageDict:
                continue
            if pageID not in pages:
                addPage(pageID)
            pages[pageID]["totalRatings"] += 1
            if u["questionRatings"][pageID] == True:
                pages[pageID]["yesRatings"] += 1
        for pageID in u["questionsAttempted"]:
            if pageID not in pageDict:
                continue
            if pageID not in pages:
                    addPage(pageID)
            pages[pageID]["usersAttempted"] += 1
        for pageID in u["questionsCorrect"]:
            if pageID not in pageDict:
                continue
            if pageID not in pages:
                    addPage(pageID)
            pages[pageID]["usersCorrect"] += 1



def archiveLogs():
    archive("usage.log")
    archive("ratings.log")
    archive("answers.log")

def archive(file):
    # Add files to the log archive and remove them from the current directory.
    try:
        with open(file, "r") as current:
            try:
                os.chdir("logArchive")
            except OSError:
                os.mkdir("logArchive")
                os.chdir("logArchive")
            with open(file, "a") as archive:
                for line in current:
                    archive.write(line)
        os.chdir(startDir)
        os.remove(file)
    except IOError:
        pass
def readFiles():
    try:
        readUsage("usage.log")
    except IOError:
        pass
    try:
        readAnswers("answers.log")
    except IOError:
        pass
    try:
        readRatings("ratings.log")
    except IOError:
        pass


def readPrevStats():
    global dates
    global pages
    global users
    try:
        with open('full_stats.json') as data_file:
            data = json.load(data_file)
            if "users" in data:
                users = data["users"]
            if "dates" in data:
                dates = data["dates"]
            if "pages" in data:
                pages = data["pages"]
    except (ValueError, IOError):
        dates = {}
        pages = {}
        questions = {}
        users = {}


def readRatings(filename):
    global users
    currentTime = int((time.time()))
    requiredFields = ["userID", "pageID", "rating", "url", "agentString", "timeEpoch"]
    with open(filename, "r") as datafile:
        for line in datafile:
            try:
                rating = json.loads(line)
                # Validate data:
                assert hasRequiredFields(dict=rating, fields=requiredFields), "Fields missing in " + line

                if rating["userID"] in ignoredIDs:
                    continue

                # Ensure that the time is reasonable
                timeRecorded = int(rating["timeEpoch"])
                assert cutoffTime < timeRecorded and timeRecorded < currentTime, "Time out of range in " + line

                # Check rating is an allowed value
                assert rating["rating"] in ["yes", "no"], "Invalid rating: " + rating
                isYes = rating["rating"] == "yes"

                #Ensure that pageID is valid
                pageID = str(rating["pageID"])
                assert pageID in pageDict, "Invalid pageID of : " + pageID

                #Ensure that the page is a question:
                assert isQuestion(pageID), "Not a question: " + pageID

                #Record data in users
                userID = str(rating["userID"])
                if userID not in users:
                    addUser(userID)
                users[userID]["questionRatings"][pageID] = isYes

                #Ensure pageID is in pages
                if pageID not in pages:
                    addPage(pageID)

            except AssertionError:
                pass
            except ValueError:
                pass



def addDate(datestamp):
    global dates
    if datestamp in dates:
        return
    else:
        dates[datestamp] = {
            "dailyUniquesList": [],
            "totalTimeOnAllPages": 0
        }

def addUser(userID):
    global users
    if userID in users:
        return
    else:
        users[userID] = {
            "browser": None,
            "questionRatings": {},
            "questionsAttempted": [],
            "questionsCorrect": [],
            "totalTimeOnPage": {}
        }


def readAnswers(filename):
    global pages
    global users
    currentTime = int((time.time()))
    requiredFields = ["userID", "pageID", "timeElapsed", "isCorrect", "url", "agentString", "timeEpoch"]
    with open(filename, "r") as datafile:
        for line in datafile:
            try:
                answer = json.loads(line)
                # Validate data:
                assert hasRequiredFields(dict=answer, fields=requiredFields), "Fields missing in " + line

                if answer["userID"] in ignoredIDs:
                    continue

                # Ensure that the time is not too far in the future or past
                timeRecorded = int(answer["timeEpoch"])
                assert cutoffTime < timeRecorded and timeRecorded < currentTime, "Time out of range in " + line

                # Enfore bound of [0 - maxTimeOnPage] on timeElapsed
                timeElapsed = int(answer["timeElapsed"])
                assert 0 <= timeElapsed, "Time on page cannot be negative"
                if timeElapsed > maxTimeOnPage:
                    timeElapsed = maxTimeOnPage

                #Ensure that pageID is valid
                pageID = str(answer["pageID"])
                assert pageID in pageDict, "Invalid pageID of : " + pageID

                #Ensure that the page is a question:
                assert isQuestion(pageID), "Not a question: " + pageID

                #Ensure that isCorrect is a boolean:
                isCorrect = answer["isCorrect"]
                assert type(isCorrect) is bool

                datestamp = str(datetime.date.today())
                userID = str(answer["userID"])

                # Record data in users:
                if userID not in users:
                    addUser(userID)
                addIfNotPresent(users[userID]["questionsAttempted"], pageID)
                if isCorrect:
                    addIfNotPresent(users[userID]["questionsCorrect"], pageID)
                if users[userID]["browser"] is None:
                    agentString = str(answer["agentString"])
                    if hasUserAgents:
                        users[userID]["browser"] = str(parse(agentString))
                    else:
                        users[userID]["browser"] = str(agentString)

                # Record data in pages:
                if pageID not in pages:
                    addPage(pageID)
                pages[pageID]["totalAnswers"] += 1
                pages[pageID]["totalTimeToCorrect"] += timeElapsed
                pages[pageID]["numOfTimeToCorrectRecorded"] += 1
                if isCorrect:
                    pages[pageID]["correctAnswers"] += 1

            except AssertionError:
                pass
            except ValueError:
                pass






def readUsage(filename):
    global dates
    global pages
    global users
    currentTime = int((time.time()))
    requiredFields = ["userID", "pageID", "timeOnPage", "url", "agentString", "timeEpoch"]
    with open(filename, "r") as datafile:
        for line in datafile:
            try:
                usage = json.loads(line)
                # Validate data:
                assert hasRequiredFields(dict=usage, fields=requiredFields), "Fields missing in " + line

                if usage["userID"] in ignoredIDs:
                    continue

                if "sessionData" not in usage:
                    usage["sessionData"] = {}

                # Ensure that the time is not too far in the future or past
                timeRecorded = int(usage["timeEpoch"])
                assert cutoffTime < timeRecorded and timeRecorded < currentTime, "Time out of range in " + line

                timeOnPage = int(usage["timeOnPage"])
                assert 0 <= timeOnPage, "Time on page cannot be negative"
                if timeOnPage > maxTimeOnPage:
                    timeOnPage = maxTimeOnPage

                #Ensure that pageID is valid
                pageID = str(usage["pageID"])
                assert pageID in pageDict, "Invalid pageID of :" + pageID

                datestamp = str(datetime.date.today())
                userID = str(usage["userID"])
                # Record data in dates
                if datestamp not in dates:
                    addDate(datestamp)
                if userID not in dates[datestamp]["dailyUniquesList"]:
                    addIfNotPresent(dates[datestamp]["dailyUniquesList"], userID)
                dates[datestamp]["totalTimeOnAllPages"] += timeOnPage
                # Record data in users
                if userID not in users:
                    addUser(userID)
                if pageID not in users[userID]["totalTimeOnPage"]:
                    users[userID]["totalTimeOnPage"][pageID] = timeOnPage
                else:
                    users[userID]["totalTimeOnPage"][pageID] += timeOnPage

                if users[userID]["browser"] is None:
                    agentString = str(usage["agentString"])
                    if hasUserAgents:
                        users[userID]["browser"] = str(parse(agentString))
                    else:
                        users[userID]["browser"] = str(agentString)

                # Handle data from sessionData:
                if "sessionData" not in users[userID]:
                    users[userID]["sessionData"] = {}

                counters = ["context-click-node-toggleInitial", "context-click-node-allItems", "context-click-node-toggleAccepting",
                            "context-click-node-renameState", "context-click-node-deleteState", "context-click-link-changeConditions",
                            "context-click-link-allItems", "context-click-link-deleteLink", "context-click-link-reverseLink"];
                for counterName in counters:
                    if counterName in usage["sessionData"]:
                        counterValue = int(usage["sessionData"][counterName])
                        if counterName not in users[userID]["sessionData"]:
                            users[userID]["sessionData"][counterName] = counterValue
                        else:
                            users[userID]["sessionData"][counterName] += counterValue
                # Record data in pages:
                if pageID not in pages:
                    addPage(pageID)
                pages[pageID]["totalTime"] += timeOnPage

            except AssertionError:
                pass
            except ValueError:
                pass



def setPageDict():
    global pageDict
    # pageDict is the union of pagelist and questionlist
    with open('pagelist.json') as pagefile:
        pageList = json.load(pagefile)
    with open('questionlist.json') as questionfile:
        questionList = json.load(questionfile)
    pageDict = dict(pageList, **questionList)


def setQuestionData():
    global questionData
    with open('questionlist.json') as data_file:
        questionData = json.load(data_file)

def hasRequiredFields(dict={}, fields=[]):
    for field in fields:
        if field not in dict:
            return False
    return True

def parseURL(url):
    if "http://" in url:
        # Extract the page name:
        url = url.split("/")[-1:][0][:-5]
    return url

def getVisitors(userIDList):
    count = 0
    for userID in userIDList:
        if userID not in ignoredIDs:
            count += 1
    return count

def getLogSize():
    # Return a string representing the size of the log directory
    os.chdir(startDir)
    # This is a nicer way to do this, but won't work until DICE upgrages to python version >= 2.7
    if False and hasattr(subprocess, "check_output"):
        output = subprocess.check_output(["du", "-sb"])
        bytes = int(output.split("\t")[0])
    else:
        # So fall back to this
        from subprocess import PIPE,Popen
        p = Popen(['du', '-sb'], stdout=PIPE)
        output = p.communicate()[0]
        bytes = int(output.split("\t")[0])

    KiB = bytes/1024.0
    if KiB < 1024:
        return str(round(KiB, 1)) + " KiB"
    else:
        MiB = KiB/1024.0
        return str(round(MiB, 1)) + "MiB"


def writePublicJSON():
    # Remove nonpublic data:
    for date in dates:
        dates[date]["uniqueVisitors"] = getVisitors(dates[date]["dailyUniquesList"])
        del dates[date]["dailyUniquesList"]
    # Calculate Timestamp:
    now = datetime.datetime.now()
    timeStamp = now.strftime('%Y-%m-%d %H:%M:%S')
    logSize = getLogSize()
    out = {"pages":pages, "dates":dates, "meta":{"timeStamp":timeStamp, "logSize": logSize}}
    with open('stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

def writeFullJSON():
    out = {"pages":pages, "dates":dates, "users":users}
    with open('full_stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

if __name__ == '__main__':
    main()