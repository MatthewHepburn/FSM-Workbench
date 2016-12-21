#!/bin/python3
import os
import json

def main():
    cleanUsage()
    cleanAnswers()

def cleanUsage():
    origPath = os.path.join(os.curdir, "logs-raw", "usage.log")
    outPath = os.path.join(os.curdir, "logs-cleaned", "usage.log")
    with open(origPath, "r") as inFile:
        with open(outPath, "w") as outFile:
            for line in inFile:
                obj = json.loads(line)

                #Ignore entries with non-standard userIDs
                if len(obj["userID"]) != 36:
                    continue

                # Assign a pageID to the create page if it is absent
                createID = "3534ba18adb84dc4bd6d94b9d2110cd1"
                if obj["pageID"] is None and obj["url"].split("/")[-1] == "create.html":
                    obj["pageID"] = createID


                # Finished, write to output
                outString = json.dumps(obj) + "\n"
                outFile.write(outString)


def cleanAnswers():
    origPath = os.path.join(os.curdir, "logs-raw", "answers.log")
    outPath = os.path.join(os.curdir, "logs-cleaned", "answers.log")
    with open(origPath, "r") as inFile:
        with open(outPath, "w") as outFile:
            for line in inFile:
                obj = json.loads(line)

                #Ignore entries with non-standard userIDs
                if len(obj["userID"]) != 36:
                    continue

                # Finished, write to output
                outString = json.dumps(obj) + "\n"
                outFile.write(outString)


if __name__ == '__main__':
    main()