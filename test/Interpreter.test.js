const {Interpreter, StringObj, NumberObj, BoolObj} = require('../Interpreter');
const {testCode} = require('./testCode');

let consoleStream = "";
const print = (popFn) => {
		consoleStream+=popFn().value+'\n';
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
const numberOfTestsPassed = new NumberObj("numberOfTestsPassed", 0, false);

describe("Interpreter",()=>{
	let interpreter;
	beforeEach(()=>{
		interpreter=new Interpreter();
		consoleStream="";
	})

	it("Passes runtime tests without optimization",()=>{
		let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted, numberOfTestsPassed];
		let retObj = interpreter.runCode(testCode, null, false, true, ...imports );

		if (!consoleStream.includes("All tests passed.")){
			console.log(consoleStream);
		}
		expect(retObj.error).toEqual(undefined);
		expect(consoleStream.includes("All tests passed.")).toEqual(true);
	})

	it("Passes runtime tests with optimization",()=>{
		let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted, numberOfTestsPassed];
		let retObj = interpreter.runCode( testCode, null, true, false, ...imports );

		if (!consoleStream.includes("All tests passed.")){
			console.log(consoleStream);
		}
		expect(retObj.error).toEqual(undefined);
		expect(consoleStream.includes("All tests passed.")).toEqual(true);
	})

	it("Modifications to imported variables persists",()=>{
		let boolImport = new BoolObj("boolImport", false, false);
		let stringImport = new StringObj("stringImport","ALL CAPS", false);
		let numberImport = new NumberObj("numberImport", 123, false);

		const code=`boolImport=!boolImport; stringImport=lcase(stringImport); numberImport=numberImport+100;`;
		let retObj = interpreter.runCode(code, null, true, false, boolImport, stringImport, numberImport);
		expect(retObj.error).toEqual(undefined);

		expect(boolImport.value).toEqual(true);
		expect(stringImport.value).toEqual("all caps");
		expect(numberImport.value).toEqual(223);
	})

	it("Modifications to constant imported variables fails during runtime",()=>{
		let boolImport = new BoolObj("boolImport", false, true);
		let stringImport = new StringObj("stringImport","ALL CAPS", true);
		let numberImport = new NumberObj("numberImport", 123, true);

		let retObj = interpreter.runCode('boolImport=false;', null, true, false, boolImport);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode('stringImport="yolo";', null, true, false, stringImport);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode('numberImport=534;', null, true, false, numberImport);
		expect(retObj.error).not.toEqual(undefined);
	})

	it("funcDef failures",()=>{
		try {
			const printFn = Interpreter.funcDef("print", print, "yolo", "string");
			expect(1).toEqual(0);
		}catch (e){
			expect(1).toEqual(1);
		}
		try {
			const printFn = Interpreter.funcDef("print", print, "string", "yolo");
			expect(1).toEqual(0);
		}catch (e){
			expect(1).toEqual(1);
		}
	})

	it("Doenst fail test code with no externals",()=>{
		let retObj = interpreter.runCode('double a=1;exit a;', null, true, false);
		expect(retObj.error).toEqual(undefined);
		expect(retObj.exitObject.value).toEqual(1);
	})

	it("Returns disassembled code when asked",()=>{
		let retObj = interpreter.runCode('double a=1;', null, true, false);
		let retObj2 = interpreter.runCode('double a=1;', null, true, true);
		expect(retObj.disassembled).not.toEqual(retObj2.disassembled);
	})
})