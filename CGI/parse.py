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


def main():
    readFiles()
    analyseUsage()
    writeJSON()

def analyseUsage():
    for user in users:
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
    f = open(filename, "r")
    questionName = filename.split(" ")[1][:-4]
    total = 0
    correct = 0
    usersAttempted = 0
    usersCorrect = 0
    for l in f:
        line = l.split("    ")
        userID = line[0][10:]
        if userID == "MHepburn": #Ignore testing activity
            continue
        unixTime = int(line[3])
        #Ignore logs before the cutoffTime
        if unixTime < cutoffTime:
            continue
        if userID not in users:
            user[userID] = {
                attemptedQuestions: [],
                correctQuestions: []
            }
        if questionName not in users[userID]["attemptedQuestions"]:
            users[userID]["attemptedQuestions"] += [questionName]
            usersAttempted += 1
        total += 1
        isCorrect = line[6]
        if isCorrect == "true":
            if questionName not in users[userID]["correctQuestions"]:
                users[userID]["correctQuestions"] += [questionName]
                usersCorrect += 1
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

def readRatings(filename):
    f = open(filename, "r")
    questionName = filename.split(" ")[1][:-4]
    total = 0
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
    f = open(filename, "r")
    date = filename[6:16]
    dailyUniques = []
    uniquesCount = 0
    for l in f:
        line = l.split("    ")
        if len(line) < 7:
            print("Line too short: ", l)
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

    # Add to dates only if uniques count > 0
    if date not in dates and uniquesCount > 0:
        dates[date] = {"uniqueVisitors":uniquesCount}

    #pp.pprint(users)

def parseURL(url):
    if "http://" in url:
        # Extract the page name:
        url = url.split("/")[-1:][0][:-5]
    return url

def writeJSON():
    # Calculate Timestamp:
    now = datetime.datetime.now()
    timeStamp = str(now.hour) + ":" + str(now.minute) + ":" + str(now.second)
    out = {"urls":urls, "dates":dates, "meta":{"timeStamp":timeStamp}}
    with open('stats.json', 'w') as outfile:
        json.dump(out, outfile, indent=4, separators=(',', ': '))


if __name__ == '__main__':
    main()