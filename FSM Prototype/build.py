# -*- coding: utf-8 -*-

import jinja2
import os
import json
from pprint import pprint
from operator import itemgetter
import sys
import subprocess
import shutil

# Pass in the address of the JS and CSS files
# Eg if fsm.js is at www.example.com/static/fsm.js then jsAddress would be http://www.example.com/static/

# An absolute reference is used to allow questions to be moved to different addresses without issue

# Different addresses are set if the files are being built for deployment

addresses = {}
sourceDir = ""
deployDir = ""
startDir = os.getcwd()

# Keep a list of questions to be used by the stats page
questionList = []

def setAddresses(toDeploy):
    # Pass in the address of the JS and CSS files
    # Eg if fsm.js is at www.example.com/static/fsm.js then jsAddress would be http://www.example.com/static/

    # An absolute reference is used to allow questions to be moved to different addresses without issue

    # Different addresses are set if the files are being built for deployment
    global addresses
    if toDeploy:
        addresses = {
            "jsAddress": "http://homepages.inf.ed.ac.uk/s1020995/",
            "cssAddress": "http://homepages.inf.ed.ac.uk/s1020995/",
            "iconAddress": "http://homepages.inf.ed.ac.uk/s1020995/img/Icons/",
            "imgAddress": "http://homepages.inf.ed.ac.uk/s1020995/img/"
        }
    else:
        addresses = {
            "jsAddress": "../",
            "cssAddress": "../",
            "iconAddress": "../img/Icons/",
            "imgAddress": "../img/"
        }

def setDirs():
    global sourceDir
    global deployDir
    global startDir

    sourceDir = os.path.join(startDir, "Source")
    deployDir = os.path.join(startDir, "Deploy")

def buildQuestionSet(jsonFilename, dirName, question_template, end_template):
    global deployDir
    global questionList

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

    i = 1;

    for question in data:
        print(question["filename"])
        questionList.append(question["filename"])
        question["question-number"] = i
        i = i + 1
        variables = {
            "nodes": question["data-nodes"].replace("'","&apos;" ),
            "links": question["data-links"].replace("'","&apos;" ),
            "options": question["data-options"].replace("'","&apos;" ),
            "question": question["data-question"].replace("'","&apos;" ),
            "title": "FSM - Question #" + str(question["question-number"]),
            "addresses": addresses
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
        variables["questionHTML"] = questionJSON["text"]
        variables["questionType"] = questionJSON["type"]
        if variables["questionType"] == "give-list":
            variables["lengths"] = questionJSON["lengths"]

        # Omit check button for some question types.
        if variables["questionType"] != "demo" and variables["questionType"] != "none":
            variables["hasCheck"] = True
        else:
            variables["hasCheck"] = False

        outputText = question_template.render(variables)
        filename = question["filename"] + ".html"
        f = open(filename, "w")
        if sys.version_info[0] > 2:
            f.write(outputText)
        else:
            f.write(outputText.encode("UTF-8"))
        f.close()

    # Output end.html
    variables = {"lastq": lastQuestion + ".html"}
    outputText = end_template.render(variables)
    f = open("end.html", "w")
    f.write(outputText)
    f.close()
    print("end.html")

def writeQuestionList():
    global questionList
    global deployDir

    os.chdir(deployDir)
    with open('questionlist.json', 'w') as outfile:
        json.dump(questionList, outfile, indent=4, separators=(',', ': '))

if __name__ == "__main__":

    # Check for deployment flag
    toDeploy = False
    for arg in sys.argv:
        if arg in ["-d", "-D", "--Deploy", "--deploy"]:
            toDeploy = True
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
        buildQuestionSet(questionSet["file"], questionSet["directory"], question_template, end_template)

    #Return to deploy directory
    os.chdir(deployDir)

    # Output index.html
    variables = {"q1": "inf1/demo1-intro-to-fsm" + ".html"}
    outputText = index_template.render(variables)
    f = open("index.html", "w")
    f.write(outputText)
    f.close()
    print("index.html")



    # Return to previous directory.
    os.chdir(startDir)

    # Minify css and JS if requested:
    minifyRequested = False
    for arg in sys.argv:
        if arg in ["-m", "-M", "--Minify"]:
            minifyRequested = True
            break
    if minifyRequested:
        os.chdir(sourceDir)
        sourceDir = os.getcwd()
        # Arguement to listdir is optional in python 3.2+ but used here for compatability with DICE
        jsFiles = [ f for f in os.listdir(sourceDir) if f[-3:] == ".js"]
        for f in jsFiles:
            newJS = subprocess.check_output("uglifyjs " + f + " --screw-ie8 --compress", shell=True)
            outname = os.path.join(deployDir, f)
            outfile = open(outname, "wb")
            outfile.write(newJS)
            outfile.close()
        os.chdir(sourceDir)
        cssFiles = [ f for f in os.listdir(sourceDir) if f[-4:] == ".css"]
        for f in cssFiles:
            newCSS = subprocess.check_output("uglifycss " + f, shell=True)
            outname = os.path.join(deployDir, f)
            outfile = open(outname, "wb")
            outfile.write(newCSS)
            outfile.close()
    else:
        # Copy JS and CSS unaltered
        os.chdir(sourceDir)
        sourceDir = os.getcwd()
        files = [f for f in os.listdir(sourceDir) if f[-4:] == ".css" or f[-3:] == ".js"]
        for f in files:
            shutil.copy(f, deployDir)

    #Regardless of minification, copy any html files and the .htaccess file to the deploy directory:
    os.chdir(sourceDir)
    files = [f for f in os.listdir(sourceDir) if f[-5:] == ".html" or f == ".htaccess"]
    for f in files:
        shutil.copy(f, deployDir)

    # Copy the img folder to the deploy directory
    # First, the existing folder must be removed:
    shutil.rmtree(os.path.join(deployDir, "img"), True)
    shutil.copytree(os.path.join(sourceDir, "img"), os.path.join(deployDir, "img"))


    writeQuestionList()

    # Return to original directory.
    os.chdir(startDir)







