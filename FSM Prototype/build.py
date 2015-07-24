# -*- coding: utf-8 -*-

import jinja2
import os
import json
from pprint import pprint

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

    for question in data:
        variables = {
            "nodes": question["data-nodes"],
            "links": question["data-links"],
            "options": question["data-options"],
            "question": question["data-question"]
        }
        outputText = template.render(variables)
        filename = question["filename"] + ".html"
        f = open(filename, "w")
        f.write(outputText)
        f.close()
