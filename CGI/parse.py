import os
import pprint
import re
import json
import datetime
try:
    from user_agents import parse
    hasUserAgents = True
except ImportError:
    hasUserAgents = False
# required to parse user-agent strings: pip install pyyaml ua-parser user-agents

urls = {}
users = {}
dates = {}
cutoffTime = 1439447160 # Time url was distributed, ignore entries before this time
logTime = 3 # Number of minutes between logs
pp = pprint.PrettyPrinter(indent=1)
crawlerAgents = ["Googlebot", "Google Page Speed Insights", "Google Search Console", "Google PP Default"]
startDir = os.getcwd()


def main():
    readJSON()
    readFiles()
    analyseUsage()
    writeFullJSON()
    writePublicJSON()
    archiveLogs()

def addToURLs(name):
    global urls
    urls[name] = {
        "totalAnswers": 0,
        "correctAnswers": 0,
        "usersAttempted": 0,
        "usersCorrect":0,
        "yesRatings": 0,
        "totalRatings": 0,
        "uniqueVisitors": 0,
        "totalTime": 0,
        "totalTimeToCorrect":0,
        "numOfTimeToCorrectRecorded":0
        }

def analyseUsage():
    for user in users:
        if "pages" not in users[user]:
            users[user]["pages"] = []
        for page in users[user]["pages"]:
            if page not in urls:
                urls[page] = {}
            if "uniqueVisitors" not in urls[page]:
                urls[page]["uniqueVisitors"] = 1
                urls[page]["totalTime"] = users[user]["pages"][page]
            else:
                urls[page]["uniqueVisitors"] += 1
                urls[page]["totalTime"] += users[user]["pages"][page]
    # Combine entries for page "" with "index"
    if "" in urls:
        urls["index"]["uniqueVisitors"] = urls["index"]["uniqueVisitors"] + urls[""]["uniqueVisitors"]
        urls[""]["totalTime"] = urls["index"]["totalTime"] + urls[""]["totalTime"]
        urls.pop("", None)

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
    files = os.listdir(os.getcwd())
    # Ignore files that are not .log
    files = [f for f in files if f[-4:] == ".log"]
    usageFiles = [f for f in files if f[:5] == "usage"]
    answerFiles = [f for f in files if f[:6] == "answer"]
    ratingFiles = [f for f in files if f[:6] == "rating"]
    for file in usageFiles:
        readUsage(file)
    for file in answerFiles:
        readAnswers(file)
    for file in ratingFiles:
        readRatings(file)

def readAnswers(filename):
    global urls
    f = open(filename, "r")
    questionName = filename.split(" ")[1][:-4]
    if questionName not in urls:
        addToURLs(questionName)

    if "totalAnswers" in urls[questionName]:
        total = urls[questionName]["totalAnswers"]
    else:
        total = 0
        urls[questionName]["totalAnswers"] = 0

    if "correctAnswers" in urls[questionName]:
        correct = urls[questionName]["correctAnswers"]
    else:
        correct = 0
        urls[questionName]["correctAnswers"] = 0

    if "usersAttempted" in urls[questionName]:
        usersAttempted = urls[questionName]["usersAttempted"]
    else:
        usersAttempted = 0
        urls[questionName]["usersAttempted"] = 0

    if "usersCorrect" in urls[questionName]:
        usersCorrect = urls[questionName]["usersCorrect"]
    else:
        usersCorrect = 0
        urls[questionName]["usersCorrect"] = 0


    for l in f:
        line = l.split("    ")
        if len(line) < 9:
            print("Line too short in + ", filename, ": ", l)
            continue
        userID = line[0][10:]
        if userID == "MHepburn": #Ignore testing activity
            continue
        unixTime = int(line[3])
        #Ignore logs before the cutoffTime
        if unixTime < cutoffTime:
            continue
        if userID not in users:
            users[userID] = {
                "attemptedQuestions": [],
                "correctQuestions": []
            }
        if questionName not in users[userID]["attemptedQuestions"]:
            users[userID]["attemptedQuestions"] += [questionName]
            usersAttempted += 1
        total += 1
        isCorrect = line[6]
        timeToCorrect = line[8]
        try:
            timeToCorrect = int(timeToCorrect)
        except ValueError:
            timeToCorrect = None
        if timeToCorrect > 60 * 60: #cap time at 1 hour
            timeToCorrect = None
        if isCorrect == "true":
            if questionName not in users[userID]["correctQuestions"]:
                users[userID]["correctQuestions"] += [questionName]
                usersCorrect += 1
                if timeToCorrect != None:
                    if "totalTimeToCorrect" not in urls[questionName]:
                        urls[questionName]["totalTimeToCorrect"] = 0
                        urls[questionName]["numOfTimeToCorrectRecorded"] = 0
                    urls[questionName]["totalTimeToCorrect"] += timeToCorrect
                    urls[questionName]["numOfTimeToCorrectRecorded"] += 1
            correct += 1
        elif isCorrect != "false":
            print("Error expected 'true' or 'false' in: ", l)
            print("got: ", isCorrect)
    if not questionName in urls:
        urls[questionName] = {}
    urls[questionName]["correctAnswers"] = correct
    urls[questionName]["totalAnswers"] = total
    urls[questionName]["usersCorrect"] = usersCorrect
    urls[questionName]["usersAttempted"] = usersAttempted

def readJSON():
    global users
    global dates
    global urls
    with open('full_stats.json') as data_file:
        data = json.load(data_file)
        if "users" in data:
            users = data["users"]
        if "dates" in data:
            dates = data["dates"]
        if "urls" in data:
            urls = data["urls"]

def readRatings(filename):
    global urls
    f = open(filename, "r")
    questionName = filename.split(" ")[1][:-4]
    if questionName not in urls:
        addToURLs(questionName)
    if "totalRatings" in urls[questionName]:
        total = urls[questionName]["totalRatings"]
    else:
        total = 0
    if "yesRatings" in urls[questionName]:
        yes =  urls[questionName]["yesRatings"]
    else:
        yes = 0
    for l in f:
        line = l.split("    ")
        userID = line[0][10:]
        if userID == "MHepburn": #Ignore testing activity
            continue
        unixTime = int(line[4])
        if unixTime < cutoffTime:
            continue
        total += 1
        rating = line[7]
        if "yes" in rating:
            yes += 1
        elif "no" not in rating:
            print("Error expected 'yes' or 'no' in: ", l)
            print("got: ", rating)
    if not questionName in urls:
        urls[questionName] = {}
    urls[questionName]["yesRatings"] = yes
    urls[questionName]["totalRatings"] = total



def readUsage(filename):
    global dates
    f = open(filename, "r")
    date = filename[6:16]
    if date not in dates:
        dates[date] = {
        "uniqueVisitors": 0,
        "dailyUniquesList": []
        }
    if "dailyUniquesList" not in dates[date]:
        dates[date]["dailyUniquesList"] = []
    if "uniqueVisitors" not in dates[date]:
        dates[date]["uniqueVisitors"] = 0
    dailyUniques = dates[date]["dailyUniquesList"]
    uniquesCount = dates[date]["uniqueVisitors"]
    for l in f:
        line = l.split("    ")
        if len(line) < 7:
            print("Line too short in + ", filename, ": ", l)
            continue
        userID = line[0][10:]
        if userID == "MHepburn" or userID == "debug": #Ignore testing activity
            continue
        agentString = line[6]
        ignore = False
        for agent in crawlerAgents:
            if agent in agentString:
                ignore = True
                break
        if (ignore):
            continue
        unixTime = int(line[4])
        if unixTime < cutoffTime:
            continue
        if userID not in dailyUniques:
            dailyUniques += [userID]
            uniquesCount += 1
        url = parseURL(line[1])
        if (hasUserAgents):
            agent = str(parse(agentString))
        else:
            agent = agentString
        if not userID in users:
            users[userID] = {"browser": agent,
                             "pages": {url:0},
                             "attemptedQuestions":[],
                             "correctQuestions":[]}
        else:
            if url in users[userID]["pages"]:
                users[userID]["pages"][url] += logTime
            else:
                users[userID]["pages"][url] = 0


    dates[date]["uniqueVisitors"] = uniquesCount
    dates[date]["dailyUniquesList"] = dailyUniques
    #pp.pprint(users)

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
    timeStamp = str(now.hour) + ":" + str(now.minute) + ":" + str(now.second)
    out = {"urls":urls, "dates":dates, "meta":{"timeStamp":timeStamp}}
    with open('stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

def writeFullJSON():
    out = {"urls":urls, "dates":dates, "users":users}
    with open('full_stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))

if __name__ == '__main__':
    main()