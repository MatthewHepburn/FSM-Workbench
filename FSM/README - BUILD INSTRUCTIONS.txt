==== Prequisites: ====
==Python 3==
--Jinja2--
Install under python3 (details will depend on your system)
	$pip install jinja2

==Node==
From the FSM directory running
	$sudo npm install --unsafe-perm
should fulfill all dependencies. Note the unsafe-perm is required as the current setup requires UglifyJS and UglifyCSS to be installed globally.
They are:
UglifyJS2
UglifyCSS
Babel
Babel ES2015 preset

To build: $python build.py OR $python3 build.py

build.py arguements:
-b use babel to convert ES6 code
-m use UglifyJS2 and UglifyCSS to minify the JS and CSS files
-d point resources to the absolute addresses specified in build.py rather than using relative addresses

eg: $python3 build.py -b -m -d

NOTE: it is not currently possible to use both -m and -b at the same time
