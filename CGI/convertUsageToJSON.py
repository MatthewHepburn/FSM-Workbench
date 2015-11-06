import os
import json
try:
    from user_agents import parse
    hasUserAgents = True
except ImportError:
    hasUserAgents = False

def main():
    logs = readLogs()
    writeJSON(logs)

def parseURL(url):
    if "http://" in url:
        # Extract the page name:
        url = url.split("/")[-1:][0][:-5]
        if url == "":
            url = "index"
    return url

def writeJSON(logs):
    with open('usage.json', 'w') as outfile:
        json.dump(logs, outfile, indent=4, separators=(',', ': '))

def readLogs():
    logs = []

    files = os.listdir(os.getcwd())
    # Ignore files that are not .log
    files = [f for f in files if f[-4:] == ".log"]
    usageFiles = [f for f in files if f[:5] == "usage"]

    for filename in usageFiles:
        
        f = open(filename, "r")
        date = filename[6:16]
        datum = {}
        datum["date"] = date
        for l in f:
            datum = {
            "date": date
            }
            line = l.split("    ")
            if len(line) < 7:
                print("Line too short: ", l)
                continue
            userID = line[0][10:]
            if userID == "MHepburn" or userID == "debug": #Ignore testing activity
                continue
            datum["userID"] = userID
            datum["url"] = parseURL(line[1])
            datum["ipAddress"] = line[2]
            datum["epochTime"] = int(line[4])
            datum["timeStamp"] = line[5]
            datum["agentString"] = line[6][:-1] #avoid newline
            agentString = line[6]
            if (hasUserAgents):
                datum["agent"] = str(parse(agentString))
            logs += [datum]
    return logs    

if __name__ == '__main__':
    main()