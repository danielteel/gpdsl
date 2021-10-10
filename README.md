# General Purpose Domain Specific Language

This is an interpreter written in javascript for GPDSL. This can be added to a project where some form of scripting ability for the user would be convenient. It's probably pretty safe considering its an interpreted language being ran in javascript. Not much room for exploits, but what do I know.

It's relatively lightweight, it has zero production dependencies and just a few for testing (jest and family).

To see it in action, clone the project from github, cd into the directory, and 'node test/manualtesting'. This file will test compiling and running of a GPDSL program. test/testCode.js demonstrates pretty much every element of the language. manualTesting.js demonstrates how to run code and how to pass in functions and variables for the program to read/write/call.

View github page for more specific language documentation.

[![Node.js CI](https://github.com/danielteel/gpdsl/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/danielteel/gpdsl/actions/workflows/node.js.yml)