#!/usr/bin/python

import cgi
import logger

form = cgi.FieldStorage()
print logger.log(form, "usage.log")



