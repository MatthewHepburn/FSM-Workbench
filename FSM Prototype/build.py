# -*- coding: utf-8 -*-

import jinja2
import os
import json
from pprint import pprint
from operator import itemgetter
import sys
import subprocess
import shutil

def getDir():
    currentDir = os.getcwd()
    return os.path.join(currentDir, "Source")


if __name__ == "__main__":
    # Load in question data
    with open('questions.JSON') as data_file:
        data = json.load(data_file)

    # Setup Jinja
    templateLoader = jinja2.FileSystemLoader("Source")
    templateEnv = jinja2.Environment(loader=templateLoader, trim_blocks=True)
    # Also add "lstrip_blocks=True" above if jinja2.7 or greater is available
    templatesDir = getDir()  # TODO work out what this does/if it does anything
    question_template = templateEnv.get_template("question.jinja")
    index_template = templateEnv.get_template("index.jinja")
    end_template = templateEnv.get_template("end.jinja")

    # Change to /Questions directory
    currentDir = os.getcwd()
    os.chdir("Deploy")
    deployDir = os.getcwd()

    i = 1;

    for question in data:
        print(question["filename"])
        question["question-number"] = i
        i = i + 1
        variables = {
            "nodes": question["data-nodes"].replace("'","&apos;" ),
            "links": question["data-links"].replace("'","&apos;" ),
            "options": question["data-options"].replace("'","&apos;" ),
            "question": question["data-question"].replace("'","&apos;" ),
            "title": "FSM - Question #" + str(question["question-number"])
        }
        # Set previous/next urls
        # NB - question numbering begins at 1.
        if question["question-number"] > 1:
            variables["previous"] = "href='" + data[question["question-number"]-2]["filename"] + ".html'"
        else:
            variables["previous"] = "href='index.html'"

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

    # Output index.html
    variables = {"q1": data[0]["filename"] + ".html"}
    outputText = index_template.render(variables)
    f = open("index.html", "w")
    f.write(outputText)
    f.close()
    print("index.html")

    # Output end.html
    variables = {"lastq": lastQuestion + ".html"}
    outputText = end_template.render(variables)
    f = open("end.html", "w")
    f.write(outputText)
    f.close()
    print("end.html")

    # Return to previous directory.
    os.chdir(currentDir)

    # Minify css and JS if requested:
    minifyRequested = False
    for arg in sys.argv:
        if arg in ["-m", "-M", "--Minify"]:
            minifyRequested = True
            break
    if minifyRequested:
        os.chdir("Source")
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
        os.chdir("Source")
        sourceDir = os.getcwd()
        files = [f for f in os.listdir(sourceDir) if f[-4:] == ".css" or f[-3:] == ".js"]
        for f in files:
            shutil.copy(f, deployDir)

    #Regardless of minification, copy any html files present in source unaltered:
    os.chdir(sourceDir)
    files = [f for f in os.listdir(sourceDir) if f[-5:] == ".html"]
    for f in files:
        shutil.copy(f, deployDir)

    # Return to original directory.
    os.chdir(currentDir)





