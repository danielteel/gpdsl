const {Interpreter, StringObj, NumberObj, BoolObj} = require('../Interpreter');
const testCode=require('./testCode');

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
const printFn = Interpreter.funcDef("print", print, "bool", "string");
const timeFn = Interpreter.funcDef("time", time, "double");
const notFn = Interpreter.funcDef("not", not, "bool", "bool");
const reverseFn = Interpreter.funcDef("reverse", reverse, "string", "string");
const negFn = Interpreter.funcDef("neg", neg, "double", "double");
const authorName = new StringObj("authorName", "Dan Teel", true);
const publicationYear = new NumberObj("publicationYear", 2020, true);
const isInterpreted = new BoolObj("isInterpreted", true, true);

let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted];

const interpreter = new Interpreter();
let retObj = interpreter.runCode( testCode, false, false, ...imports );