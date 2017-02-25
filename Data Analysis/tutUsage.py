#! /bin/python3
import json
import os
import math


def main():
    statsObj = getStats()
    users = statsObj["users"]

    visitedAllTut5 = 0
    visitedOneTut5 = 0

    visitedAllTut6 = 0
    visitedOneTut6 = 0

    visitedAllBoth = 0
    visitedOneBoth = 0

    tut5IDs = getTutorialQuestionIDs(5)
    tut6IDs = getTutorialQuestionIDs(6)

    for userID in users:
        # Ignore users with non-standard IDs
        if len(userID) != 36:
            continue

        user = users[userID]

        if visitedOne(user, tut5IDs):
            visitedOneTut5 += 1
            if visitedAll(user, tut5IDs):
                visitedAllTut5 += 1

        if visitedOne(user, tut6IDs):
            visitedOneTut6 += 1
            if visitedAll(user, tut6IDs):
                visitedAllTut6 += 1

        if visitedOne(user, tut5IDs) and visitedOne(user, tut6IDs):
            visitedOneBoth += 1
            if visitedAll(user, tut5IDs) and visitedAll(user, tut6IDs):
                visitedAllBoth += 1

    print("Users visiting at least one page for tutorial 5: ", visitedOneTut5)
    print("Users visiting all pages for tutorial 5:         ", visitedAllTut5)

    print("Users visiting at least one page for tutorial 6: ", visitedOneTut6)
    print("Users visiting all pages for tutorial 6:         ", visitedAllTut6)

    print("Users visiting at least one page for both tutorials: ", visitedOneBoth)
    print("Users visiting all pages for both tutorials:         ", visitedAllBoth)



def visitedAll(user, tutorialIDs):
    pagesVisited = user["totalTimeOnPage"]

    for tutID in tutorialIDs:
        if tutID not in pagesVisited:
            return False
    return True

def visitedOne(user, tutorialIDs):
    pagesVisited = user["totalTimeOnPage"]

    for tutID in tutorialIDs:
        if tutID in pagesVisited:
            return True
    return False



def getStats():
    with open("full_stats.json", "r") as dataFile:
        stats = json.load(dataFile)
        return stats

def getTutorialQuestionIDs(tutorialN):
    IDs = []
    with open("questionlist.json", "r") as dataFile:
        questions = json.load(dataFile)
        for qID in questions:
            if questions[qID]["set"] == "tut" + str(tutorialN):
                IDs.append(qID)
    idSet = set(IDs)
    return idSet

if __name__ == '__main__':
    main()