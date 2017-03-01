==== Prerequisites: ====
==Python 3==
--Jinja2--
Install for python3 (details will depend on your system).

Either as root to install globally
	$ pip3 install jinja2
Or without root to install for your user account
    $ pip3 install --user jinja2

==Node Package Manager==
From the FSM directory running
	$npm install
should fulfil all other dependencies.

To build:  $ python3 build.py

build.py arguments:
-b Babel - use babel to convert ES6 code to ES5
-m Minify - convert to ES5 using babel and then use UglifyJS2 and UglifyCSS to minify the JS and CSS files
-d Deploy - point resources to the absolute addresses specified in build.py rather than using relative addresses
-a Analytics Path - used to give a path to the web address of the analytics scripts.

eg: $ python3 build.py -m -d -a http://example.com/cgi/
