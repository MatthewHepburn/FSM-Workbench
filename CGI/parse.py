import os
import pprint
import re
from user_agents import parse
# required to parse user-agent strings: pip install pyyaml ua-parser user-agents

urls = {}
users = {}
logTime = 3 # Number of minutes between logs
pp = pprint.PrettyPrinter(indent=1)

def main():
    readFiles()

def analyseUsage():
    pass

def readFiles():
    files = os.listdir()
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
    analyseUsage()

def readAnswers(filename):
    f = open(filename, "r")
    questionName = filename.split(" ")[1][:-4]
    total = 0
    correct = 0
    for l in f:
        line = l.split("    ")
        userID = line[0][10:]
        if userID == "MHepburn": #Ignore testing activity
            continue
        total += 1
        isCorrect = line[6]
        if isCorrect == "true":
            correct += 1
        elif isCorrect != "false":
            print("Error expected 'true' or 'false' in: ", l)
            print("got: ", isCorrect)
    if not questionName in urls:
        urls[questionName] = {}
    urls[questionName]["correctAnswers"] = correct
    urls[questionName]["totalAnswers"] = total

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
    for l in f:
        line = l.split("    ")
        if len(line) < 7:
            print("Line too short: ", l)
            continue
        userID = line[0][10:]
        if userID == "MHepburn": #Ignore testing activity
            continue
        url = parseURL(line[1])
        agentString = line[6]
        agent = str(parse(agentString))
        if not userID in users:
            users[userID] = {"browser": agent,
                             url: 0}
        else:
            if url in users[userID]:
                users[userID][url] += logTime
            else:
                users[userID][url] = 0

    #pp.pprint(users)

def parseURL(url):
    if "http://" in url:
        # Extract the page name:
        url = url.split("/")[-1:][0][:-5]
    return url





if __name__ == '__main__':
    main()