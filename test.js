const {Interpreter, StringObj, NumberObj, BoolObj} = require('./Interpreter');


let code = `
double reverseInteger(double number) { 
		double newNumber=0;
		while (number!=0){
				newNumber=newNumber*10+number%10;
				if (number>0){
					number=floor(number/10);
				}else{
					number=ceil(number/10);
				}
		}
		return newNumber;
}

exit reverseInteger(this);
`;


const print = (popFn) => {
		let str=popFn();

		console.log(str.value);
		return new BoolObj(null, false, false);
}

let interpreter=new Interpreter();
let thisObj = new NumberObj("this", 123456789, true);
let imports = [thisObj, Interpreter.funcDef("print", print, "bool", "string")];

let retObj = interpreter.runCode( code, false, ...imports );

if (retObj.error){
	console.log("ERROR @ "+retObj.error.line+": "+retObj.error.message)
}else{
	console.log(retObj.return.objType, retObj.return.value);
}
 