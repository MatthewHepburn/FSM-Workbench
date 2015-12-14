import os
import pprint
import re
import json
import datetime
import time
import sys
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
ignoredIDs = [] #UserIDs to ignore - eg to exclude developer actions from stats
startDir = os.getcwd()


def main():
    readPrevStats()
    setPageDict()
    setQuestionData()
    readFiles()
    analyseUsage()
    writeFullJSON()
    writePublicJSON()
    # archiveLogs()

def addIfNotPresent(list, item):
    # Can't use sets as they cannot be stored as JSON
    if item not in list:
        list.append(item)

def addPage(pageID):
    global pages
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

def isQuestion(pageID):
    return "set" in pageDict[pageID]

def analyseUsage():
    # First, set to zero all stats that are calculated here:
    for pageID in pages:
        pages[pageID]["uniqueVisitors"] = 0
        pages[pageID]["totalTime"] = 0
        if pages[pageID]["isQuestion"]:
            pages[pageID]["yesRatings"] = 0
            pages[pageID]["totalRatings"] = 0
            pages[pageID]["usersAttempted"] = 0
            pages[pageID]["usersCorrect"] = 0
    for userID in users:
        u = users[userID]
        for pageID in u["totalTimeOnPage"]:
            pages[pageID]["totalTime"] += u["totalTimeOnPage"][pageID]
            pages[pageID]["uniqueVisitors"] += 1
        for pageID in u["questionRatings"]:
            pages[pageID]["totalRatings"] += 1
            if u["questionRatings"][pageID] == True:
                pages[pageID]["yesRatings"] += 1
        for pageID in u["questionsAttempted"]:
            pages[pageID]["usersAttempted"] += 1
        for pageID in u["questionsCorrect"]:
            pages[pageID]["usersCorrect"] += 1



def archiveLogs():
    files = os.listdir(os.getcwd())
    # Ignore files that are not .log
    files = [f for f in files if f[-4:] == ".log"]
    usageFiles = [f for f in files if f[:5] == "usage"]
    answerFiles = [f for f in files if f[:6] == "answer"]
    ratingFiles = [f for f in files if f[:6] == "rating"]
    for file in usageFiles:
        archiveUsage(file)
    for file in answerFiles:
        archiveAnswers(file)
    for file in ratingFiles:
        archiveRatings(file)

def archiveUsage(file):
    # Add files to the log archive and remove them from the current directory.
    f = open(file, "r")
    os.chdir("log_archive")
    os.chdir("Usage by date")
    a = open(file, "w")
    for line in f:
        a.write(line)
    os.chdir(startDir)
    f.close()
    a.close()
    os.remove(file)

def archiveAnswers(file):
    # Add files to the log archive and remove them from the current directory.
    f = open(file, "r")
    os.chdir("log_archive")
    os.chdir("Answers by question")
    a = open(file, "w")
    for line in f:
        a.write(line)
    os.chdir(startDir)
    f.close()
    a.close()
    os.remove(file)

def archiveRatings(file):
    # Add files to the log archive and remove them from the current directory.
    f = open(file, "r")
    os.chdir("log_archive")
    os.chdir("Ratings by question")
    a = open(file, "w")
    for line in f:
        a.write(line)
    os.chdir(startDir)
    f.close()
    a.close()
    os.remove(file)





def readFiles():
    readUsage("usage.log")
    readAnswers("answers.log")
    readRatings("ratings.log")


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
            if "urls" in data:
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

def writePublicJSON():
    # Remove nonpublic data:
    for date in dates:
        del dates[date]["dailyUniquesList"]
    # Calculate Timestamp:
    now = datetime.datetime.now()
    timeStamp = now.strftime('%Y-%m-%d %H:%M:%S')
    out = {"pages":pages, "dates":dates, "meta":{"timeStamp":timeStamp}}
    with open('stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

def writeFullJSON():
    out = {"pages":pages, "dates":dates, "users":users}
    with open('full_stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

if __name__ == '__main__':
    main()