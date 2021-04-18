
const {Interpreter, StringObj, NumberObj, BoolObj} = require('./Interpreter');
const testCode=require('./testcode');

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
const authorName = new StringObj("authorName", "Dan Teel", false);
const publicationYear = new NumberObj("publicationYear", 2020, false);
const isInterpreted = new BoolObj("isInterpreted", true, false);

describe("Interpreter tests",()=>{

	it("Passes runtime tests without optimization",()=>{
		let interpreter = new Interpreter();
		let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted];
		let retObj = interpreter.runCode( testCode, false, ...imports );

		expect(retObj.error).toEqual(undefined);
		expect(consoleStream.includes("All tests passed.")).toEqual(true);
	})
	it("Passes runtime tests with optimization",()=>{
		let interpreter = new Interpreter();
		let imports = [timeFn, printFn, notFn, reverseFn, negFn, authorName, publicationYear, isInterpreted];
		let retObj = interpreter.runCode( testCode, true, ...imports );

		expect(retObj.error).toEqual(undefined);
		expect(consoleStream.includes("All tests passed.")).toEqual(true);
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

	it("Runtime failure",()=>{
		let interpreter = new Interpreter();
		let retObj = interpreter.runCode("double a=null; a=a+100;", false);

		expect(retObj.error).not.toEqual(undefined);
	})



	it("Fails to compile test",()=>{
		let interpreter = new Interpreter();

		let retObj = interpreter.runCode("asdad3423sdf@#$#sd", false);
		expect(retObj.error).not.toEqual(undefined);
		
		retObj = interpreter.runCode("'", false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode('"', false);

		expect(retObj.error).not.toEqual(undefined);
		retObj = interpreter.runCode(`
		double a=100;
		double b=200;
		a=a-b-
		`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`
		double a=100;
		a=a-a-`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`
		double a=100;
		a=a-true`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`if 100=200 exit 1;`, false);
		expect(retObj.error).not.toEqual(undefined);
		
		retObj = interpreter.runCode(`double a(){`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`bool a=true+false;`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`while(0){}d`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`for(;0;){}d`, false);
		expect(retObj.error).not.toEqual(undefined);
		retObj = interpreter.runCode(`loop{}while(0);d`, false);
		expect(retObj.error).not.toEqual(undefined);
		retObj = interpreter.runCode(`exit;a;`, false);
		expect(retObj.error).not.toEqual(undefined);
		retObj = interpreter.runCode(`bool a(){return;}return`, false);
		expect(retObj.error).not.toEqual(undefined);

		retObj = interpreter.runCode(`{double a=100;} }`, true);
		expect(retObj.error).not.toEqual(undefined);
	})

	it("Tokenizer stuff",()=>{
		let interpreter = new Interpreter();

		let retObj = interpreter.runCode(".", false);
		expect(retObj.error).not.toEqual(undefined);
	})

})