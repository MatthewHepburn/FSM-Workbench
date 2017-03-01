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
import pdb

addresses = {}
sourceDir = ""
deployDir = ""
startDir = os.path.split(os.path.realpath(__file__))[0] #Don't use os.getcwd() as script may be invoked from a different directory.
                                                        #This gets the path where this file is located (should be "../CAL/FSM")
# Keep a dict of questions, with their guid as key
questionDict = {}

def setAddresses(toDeploy, analyticsPath="None"):
    # Pass in the address of the JS and CSS files
    # Eg if fsm.js is at www.example.com/static/fsm.js then jsAddress would be http://www.example.com/static/

    # An absolute reference is used to allow questions to be moved to different addresses without issue

    # Different addresses are set if the files are being built for deployment
    global addresses
    if toDeploy:
        #If deploying, point to web addresses
        addresses = {
            "jsAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/",
            "cssAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/",
            "iconAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/img/icons/",
            "imgAddress": "http://homepages.inf.ed.ac.uk/s1020995/dev/img/",
            "d3Address": "https://cdnjs.cloudflare.com/ajax/libs/d3/4.1.1/d3.min.js",
            "pureCSSAddress": "http://yui.yahooapis.com/pure/0.6.0/pure-min.css",
            "analyticsPath": analyticsPath
        }
    else:
        #If not deploying, point to local resources.
        addresses = {
            "jsAddress": deployDir + os.sep,
            "cssAddress": deployDir + os.sep,
            "iconAddress": os.path.join(deployDir, "img", "icons") + os.sep,
            "imgAddress": os.path.join(deployDir, "img") + os.sep,
            "d3Address": os.path.join(startDir, "node_modules", "d3", "build", "d3.js"),
            "pureCSSAddress": os.path.join(startDir, "node_modules", "purecss", "build", "pure.css"),
            "analyticsPath": analyticsPath
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
    if not os.path.exists(dirName):
        os.makedirs(dirName)

    questionDir = os.path.join(deployDir, dirName)
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

        variables["svgHeight"] = 300;
        if variables["questionType"] == "minimize-table":
            variables["svgWidth"] = 400;
            variables["svgClasses"] = "shrink"
        else:
            variables["svgWidth"] = 500;
            variables["svgClasses"] = ""

        # Omit check button for some question types.
        if variables["questionType"] in ["none", "give-input", "dfa-convert", "minimize-table"]:
            variables["hasCheck"] = False
        else:
            variables["hasCheck"] = True

        outputTemplate(question_template, variables, questionDir, question["filename"])

    # Output end.html
    variables = {"lastq": lastQuestion + ".html",
                 "pageID": endPageID,
                 "addresses": addresses}
    outputTemplate(end_template, variables, questionDir, "end")

def writeQuestionDict():
    global questionDict
    global deployDir

    os.chdir(deployDir)
    os.chdir("..") #/CAL/FSM
    os.chdir("..") #/CAL
    os.chdir("CGI")
    os.chdir("dev")
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

def outputTemplate(template, variables, path, filename):
    filePath = os.path.join(path, filename + ".html")
    outputText = template.render(variables)
    f = open(filePath, "w")
    if sys.version_info[0] > 2:
        f.write(outputText)
    else:
        f.write(outputText.encode("UTF-8"))
    f.close()
    print(filename + ".html")

def copyVictorJS():
    #Copy VictorJS to the deploy directory, renaming it from index.js to victor.js, and commenting out the export statement.
    victorPath = os.path.join(startDir, "node_modules", "victor", "index.js")
    outputPath = os.path.join(deployDir, "victor.js")
    if not os.path.isfile(victorPath):
        print("ERROR" + victorPath + " not found. Ensure that Victor.js is installed. Try $npm install victor")
        return
    with open(victorPath, "r") as inFile:
        with open(outputPath, "w") as outFile:
            line1 = "//" + inFile.readline(); #comment out first line.
            outFile.write(line1)
            outFile.write("//THIS FILE IS CREATED BY THE BUILD PROCESS. ANY CHANGES MADE WILL BE OVERWRITTEN")
            for line in inFile:
                outFile.write(line)

def copyBabelPolyfill():
#Copy the babel polyfill to the deploy directory
    polyPath = os.path.join(startDir, "node_modules", "babel-polyfill", "dist", "polyfill.min.js")
    outputPath = os.path.join(deployDir, "polyfill.min.js")
    if not os.path.isfile(polyPath):
        print("ERROR:" + polyPath + " not found. Ensure that babel-polyfill is installed. Try $npm install babel-polyfill")
        return
    with open(polyPath, "r") as inFile:
        with open(outputPath, "w") as outFile:
            outFile.write("//THIS FILE IS CREATED BY THE BUILD PROCESS. ANY CHANGES MADE WILL BE OVERWRITTEN\n")
            for line in inFile:
                outFile.write(line)




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

    # Check for analytics path
    analyticsPath = "None"
    for i in range(0, len(sys.argv) - 1):
            if sys.argv[i] in ["-a", "-A", "--analytics-path"]:
                analyticsPath = sys.argv[i + 1]
                break

    # Set up the local directory globals
    setDirs()
    os.chdir(startDir)

    # Set the address global
    setAddresses(toDeploy, analyticsPath)

    # Create the deploy directory if it doesn't already exist:
    if not os.path.isdir(deployDir):
        os.mkdir(deployDir)

    # Load in the list of question files - which contains the filename of each question set's json file.
    with open('questionFiles.json') as data_file:
        data = json.load(data_file)

    # Setup Jinjaf
    templateLoader = jinja2.FileSystemLoader("Source")
    templateEnv = jinja2.Environment(loader=templateLoader, trim_blocks=True)
    # Also add "lstrip_blocks=True" above if jinja2.7 or greater is available
    question_template = templateEnv.get_template("question.jinja")
    index_template = templateEnv.get_template("index.jinja")
    end_template = templateEnv.get_template("end.jinja")

    for questionSet in data:
        buildQuestionSet(questionSet["file"], questionSet["directory"], question_template, end_template, questionSet["endPageID"])

    # Output index.html
    variables = {"ex1": "inf1/give-input-intro-to-fsm.html",
                 "pp1": "inf1-revision/2014-Dec-5-a.html",
                 "addresses": addresses}
    outputTemplate(index_template, variables, deployDir, "index")

    # Output other templated files
    os.chdir(startDir)
    otherTemplates = [f for f in os.listdir(sourceDir) if f[-6:] == ".jinja" and f not in ["question.jinja", "end.jinja", "index.jinja"]]
    variables = {"addresses": addresses}
    for filename in otherTemplates:
        name = filename[:-6]
        template = templateEnv.get_template(filename)
        outputTemplate(template, variables, deployDir, name)


    # Return to previous directory.
    os.chdir(startDir)

    # Minify css and JS if requested:
    minifyRequested = False
    for arg in sys.argv:
        if arg in ["-m", "-M", "--Minify"]:
            minifyRequested = True
            toBabel = True #UglifyJS requires that the code is first transpiled.

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

    copyVictorJS()
    copyBabelPolyfill()


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

        jsFiles = [f for f in os.listdir(deployDir) if f[-3:] == ".js" and f[-7:] != ".min.js"] #Don't minimize files with name ending .min.js
        # Overwrite js and css files in the deploy directory with minified versions.
        for f in jsFiles:
            path = os.path.join(deployDir, f)
            # "uglifyjs" script is defined in package.json
            subprocess.call(["npm run-script uglifyjs -- -o '{0}' '{0}'".format(path)], shell=useShell)

        cssFiles = [f for f in os.listdir(deployDir) if f[-4:] == ".css"]
        for f in cssFiles:
            path = os.path.join(deployDir, f)
            # Get the location of the uglifycss binary using npm bin
            # Do it this way, as uglifycss does not have an option to output to file
            command = "cat '{0}' | `npm bin`/uglifycss > '{0}'".format(path)
            print(command)
            subprocess.call([command], shell=useShell)


    # Return to original directory.
    os.chdir(startDir)







