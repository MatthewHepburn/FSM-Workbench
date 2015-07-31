# -*- coding: utf-8 -*-

import jinja2
import os
import json
from pprint import pprint
from operator import itemgetter
import sys

def getDir():
    currentDir = os.getcwd()
    return os.path.join(currentDir, "Templates")


if __name__ == "__main__":
        # Load in question data
    with open('questions.JSON') as data_file:
        data = json.load(data_file)

    # Setup Jinja
    templateLoader = jinja2.FileSystemLoader("Templates")
    templateEnv = jinja2.Environment(loader=templateLoader, trim_blocks=True)
    # Also add "lstrip_blocks=True" above if jinja2.7 or greater is available
    templatesDir = getDir()  # TODO work out what this does/if it does anything
    template = templateEnv.get_template("question.jinja")

    # # Change to /Questions directory
    # currentDir = os.getcwd()
    # os.chdir("Questions")

    #Sort data by question number
    sorted(data, key=itemgetter('question-number'))

    i = 1;

    for question in data:
        print(question["filename"])
        if question["question-number"] != i:
            print("--!!Warning - question #" + str(i) + " is missing in questions.JSON. This may break the next/previous links,")
        i = i + 1
        variables = {
            "nodes": question["data-nodes"],
            "links": question["data-links"],
            "options": question["data-options"],
            "question": question["data-question"],
            "title": "FSM - Question #" + str(question["question-number"])
        }
        # Set previous/next urls
        # NB - question numbering begins at 1.
        if question["question-number"] > 1:
            variables["previous"] = "href='" + data[question["question-number"]-2]["filename"] + ".html'"
        else:
            variables["previous"] = ""

        if question["question-number"] < len(data):
            variables["next"] = "href='" + data[question["question-number"]]["filename"] + ".html'"
        else:
            variables["next"] = ""

        outputText = template.render(variables)
        filename = question["filename"] + ".html"
        f = open(filename, "w")
        if sys.version_info[0] > 2:
            f.write(outputText)
        else:
            f.write(outputText.encode("UTF-8"))
        f.close()

    template = templateEnv.get_template("index.jinja")
    variables = {"q1": data[0]["filename"] + ".html"}
    outputText = template.render(variables)
    f = open("index.html", "w")
    f.write(outputText)
    f.close()
    print("index.html")

    # # Return to previous directory.
    # os.chdir(currentDir)
