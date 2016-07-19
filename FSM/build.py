# -*- coding: utf-8 -*-

import jinja2
import os
import json
from pprint import pprint
from operator import itemgetter
import sys
import subprocess
import shutil
import platform

addresses = {}
sourceDir = ""
deployDir = ""
startDir = os.getcwd()

# Keep a dict of questions, with their guid as key
questionDict = {}

def setAddresses(toDeploy):
    # Pass in the address of the JS and CSS files
    # Eg if fsm.js is at www.example.com/static/fsm.js then jsAddress would be http://www.example.com/static/

    # An absolute reference is used to allow questions to be moved to different addresses without issue

    # Different addresses are set if the files are being built for deployment
    global addresses
    if toDeploy:
        addresses = {
            "jsAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/",
            "cssAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/",
            "iconAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/img/icons/",
            "imgAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/img/"
        }
    else:
        addresses = {
            "jsAddress": "../",
            "cssAddress": "../",
            "iconAddress": "../img/icons/",
            "imgAddress": "../img/"
        }

def setDirs():
    global sourceDir
    global deployDir
    global startDir

    sourceDir = os.path.join(startDir, "Source")
    deployDir = os.path.join(startDir, "Deploy")

def changePrefillFormat(lengths, prefill):
    # Returns a list of strings of the same length as lengths
    # eg. {"0": "abb", "2": "bb"} => ["abb", "", "bb"]
    # This makes it easier to populate the fields using Jinja
    newPrefill = []
    for i in range(0, len(lengths)):
        if str(i) in prefill:
            newPrefill.append(prefill[str(i)])
        else:
            newPrefill.append("")
    return newPrefill

def buildQuestionDict(jsonData, dirName):
    questions = {}
    i = 0;
    for q in jsonData:
        i = i + 1
        questions[q["id"]] = {
            "filename": q["filename"],
            "name" : q["name"],
            "question-number": i,
            "set":dirName,
            "url": q["filename"] + ".html"
        }
    return questions


def buildQuestionSet(jsonFilename, dirName, question_template, end_template, endPageID):
    global deployDir
    global questionDict

    # Load in the question data for this questionSet
    os.chdir(startDir)
    with open(jsonFilename) as data_file:
        data = json.load(data_file)

    # Change to /Deploy directory
    os.chdir(deployDir)
    # Create a directory dirName if it doesn't exist:
    if os.path.exists(dirName):
        os.chdir(dirName)
    else:
        os.makedirs(dirName)
        os.chdir(dirName)

    thisQuestionDict = buildQuestionDict(data, dirName)
    questionDict.update(thisQuestionDict)
    thisQuestionList = getQuestionList(thisQuestionDict)

    i = 1
    for question in data:
        print(question["filename"])
        question["question-number"] = i
        #Remove the html from the question object to avoid issues escaping it
        questionText = question["data-question"].pop("text")
        i = i + 1
        variables = {
            "addresses": addresses,
            "machinelist": json.dumps(question["data-machinelist"]),
            "options": json.dumps(question["data-options"]),
            "question": json.dumps(question["data-question"]),
            "pageID": question["id"],
            "questionDict": thisQuestionDict,
            "questionList": thisQuestionList,
            "showSidebar": True,
            "title": "FSM - Question #" + str(question["question-number"]),
            "url": question["filename"] + ".html"
        }
        # Set previous/next urls
        # NB - question numbering begins at 1.
        if question["question-number"] > 1:
            variables["previous"] = "href='" + data[question["question-number"]-2]["filename"] + ".html'"
        else:
            variables["previous"] = "href='../index.html'"

        if question["question-number"] < len(data):
            variables["next"] = "href='" + data[question["question-number"]]["filename"] + ".html'"
        else:
            variables["next"] = "href ='end.html'"
            lastQuestion = question["filename"]

        # Extract information to do some server-side rendering
        questionJSON = json.loads(variables["question"])
        variables["questionHTML"] = questionText

        variables["questionType"] = questionJSON["type"]
        if variables["questionType"] == "give-list":
            variables["lengths"] = questionJSON["lengths"]
            variables["prefill"] = changePrefillFormat(variables["lengths"], questionJSON["prefill"])

        if variables["questionType"] == "satisfy-list":
            longestLength = max(len(questionJSON["shouldAccept"]), len(questionJSON["shouldReject"]))
            variables["shouldAccept"] = questionJSON["shouldAccept"]
            variables["shouldReject"] = questionJSON["shouldReject"]
            variables["longestLength"] = longestLength

        if variables["questionType"] == "does-accept":
            variables["sequences"] = questionJSON["sequences"]

        if variables["questionType"] == "give-input":
            variables["inputAlphabet"] = question["data-machinelist"][0]["attributes"]["alphabet"]


        # Omit check button for some question types.
        if variables["questionType"] in ["none", "give-input"]:
            variables["hasCheck"] = False
        else:
            variables["hasCheck"] = True

        outputText = question_template.render(variables)
        filename = question["filename"] + ".html"
        f = open(filename, "w")
        if sys.version_info[0] > 2:
            f.write(outputText)
        else:
            f.write(outputText.encode("UTF-8"))
        f.close()

    # Output end.html
    variables = {"lastq": lastQuestion + ".html", "pageID": endPageID}
    outputText = end_template.render(variables)
    f = open("end.html", "w")
    f.write(outputText)
    f.close()
    print("end.html")

def writeQuestionDict():
    global questionDict
    global deployDir

    os.chdir(deployDir)
    with open('questionlist.json', 'w') as outfile:
        json.dump(questionDict, outfile, indent=4, separators=(',', ': '))

def getQuestionList(qDict):
    #Return a list of questionIDs sorted by questionNumber
    keys = qDict.keys()
    newList = sorted(keys, key=lambda pageID: qDict[pageID]["question-number"])
    return newList

def padList(inList, targetLength, symbol):
    #Returns a copy of the provided list, padded out to the target length if it is shorter using symbol
    #e.g. padList([1,2], 3, "") => [1,2,""]
    returnList = list(inList)
    nToAdd = targetLength - len(returnList)
    if nToAdd < 1:
        return returnList
    return returnList + ([symbol] * nToAdd);



if __name__ == "__main__":

    # Check for deployment flag
    toDeploy = False
    for arg in sys.argv:
        if arg in ["-d", "-D", "--Deploy", "--deploy"]:
            toDeploy = True
            break

    # Check for Babel flag
    # Babel is used in this project to allow ES6 features to be used by backporting them to ES5
    toBabel = False
    for arg in sys.argv:
        if arg in ["-b", "-b", "--babel", "--Babel"]:
            toBabel = True
            break
    # Set the address global
    setAddresses(toDeploy)

    # Set up the local directory globals
    setDirs()

    # Create the deploy directory if it doesn't already exist:
    if not os.path.isdir(deployDir):
        os.mkdir(deployDir)

    # Load in the list of question files - which contains the filename of each question set's json file.
    with open('questionFiles.json') as data_file:
        data = json.load(data_file)

    # Setup Jinja
    templateLoader = jinja2.FileSystemLoader("Source")
    templateEnv = jinja2.Environment(loader=templateLoader, trim_blocks=True)
    # Also add "lstrip_blocks=True" above if jinja2.7 or greater is available
    templatesDir = sourceDir  # TODO work out what this does/if it does anything
    question_template = templateEnv.get_template("question.jinja")
    index_template = templateEnv.get_template("index.jinja")
    end_template = templateEnv.get_template("end.jinja")

    for questionSet in data:
        buildQuestionSet(questionSet["file"], questionSet["directory"], question_template, end_template, questionSet["endPageID"])

    #Return to deploy directory
    os.chdir(deployDir)

    # Output index.html
    variables = {"ex1": "inf1/give-input-intro-to-fsm.html",
                 "pp1": "inf1-revision/2014-Dec-5-a.html"}
    outputText = index_template.render(variables)
    f = open("index.html", "w")
    f.write(outputText)
    f.close()
    print("index.html")



    # Return to previous directory.
    os.chdir(startDir)

    # Minify css and JS if requested:
    minifyRequested = False
    babelRequested = False
    for arg in sys.argv:
        if arg in ["-m", "-M", "--Minify"]:
            minifyRequested = True
        if arg in["-b", "-B", "--Babel"]:
            minifyRequested = True

    # First copy JS and CSS unaltered
    os.chdir(sourceDir)
    files = [f for f in os.listdir(sourceDir) if f[-4:] == ".css" or f[-3:] == ".js"]
    for f in files:
        shutil.copy(f, deployDir)

    # Copy any html files and the .htaccess file to the deploy directory:
    os.chdir(sourceDir)
    files = [f for f in os.listdir(sourceDir) if f[-5:] == ".html" or f == ".htaccess"]
    for f in files:
        shutil.copy(f, deployDir)

    # Copy the img folder to the deploy directory
    # First, the existing folder must be removed:
    shutil.rmtree(os.path.join(deployDir, "img"), True)
    shutil.copytree(os.path.join(sourceDir, "img"), os.path.join(deployDir, "img"))


    writeQuestionDict()

    if toBabel:
        os.chdir(startDir)
        # "babel" script is defined in package.json
        # Detect windows and handle slightly differently - Not sure why this is necessary but not an issue of great importance
        useShell = False
        if platform.system() == "Windows":
            useShell = True
        subprocess.call(["npm", "run-script", "babel"], shell=useShell)

    if minifyRequested:
        os.chdir(deployDir)
        useShell = True

        files = [f for f in os.listdir(deployDir) if f[-3:] == ".js"]
        for f in files:
            path = os.path.join(deployDir, f)
            # "uglifyjs" script is defined in package.json
            subprocess.call(["npm run-script uglifyjs -- -o '" + path +"' '" + path + "'"], shell=useShell)


    # Return to original directory.
    os.chdir(startDir)







