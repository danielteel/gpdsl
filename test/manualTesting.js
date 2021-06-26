const {Interpreter, StringObj, NumberObj, BoolObj} = require('../Interpreter');
const {testCode} = require('./testCode');


//Define our functions we are going to import into the interpreter
const print = (popFn) => {
		console.log(popFn().value);
		return new BoolObj(null, false, false);
}
const time = () => {
	return new NumberObj(null, new Date().getTime(), false);
}
const not = (popFn) => {
	return new BoolObj(null, !popFn().value, false);
}
const reverse = (popFn) => {
	return new StringObj(null, popFn().value.split("").reverse().join(""), false);
}
const neg = (popFn) => {
	return new NumberObj(null, 0-popFn().value, false);
}

//Build function definitions to pass to the interpreter
const printFn = Interpreter.funcDef("print", print, "bool", "string");
const timeFn = Interpreter.funcDef("time", time, "double");
const notFn = Interpreter.funcDef("not", not, "bool", "bool");
const reverseFn = Interpreter.funcDef("reverse", reverse, "string", "string");
const negFn = Interpreter.funcDef("neg", neg, "double", "double");

//Define imported constant variables to the interpreter
const authorName = new StringObj("authorName", "Dan Teel", true);
const publicationYear = new NumberObj("publicationYear", 2020, true);
const isInterpreted = new BoolObj("isInterpreted", true, true);

//Define an imported number variable that the program will modify, we are able to access this after execution
const numberOfTestsPassed = new NumberObj("numberOfTestsPassed", 0, false);

let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted,  numberOfTestsPassed];

const interpreter = new Interpreter();
let retObj = interpreter.runCode( testCode, null, false, false, ...imports );
console.log(retObj.exitObject.value);
console.log("Number of passed tests: "+numberOfTestsPassed.value);