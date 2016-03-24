This directory contains:
- CGI scripts written in Python 2 used to save analytics data (answer.cgi, rating.cgi, usage.cgi)
- logger.py, which contain the logging logic that the CGI scripts import
- getStats.cgi which serves a summary of the anlytics data to the stats page
- parse.py which creates the summary of used by getStats.cgi
- questionlist.json – used to create the summary, contains data about each question
- savequestion.cgi allows questions to be saved to the server from the question creator