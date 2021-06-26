import Interpreter, {StringObj, NumberObj, BoolObj} from '../Interpreter';

//Define our functions we are going to import into the interpreter
const print = (popFn) => {
		console.log(popFn().value);
		return new BoolObj(null, false, false);
}

const printFn = Interpreter.funcDef("print", print, "bool", "string");

const interpreter = new Interpreter();
let retObj = interpreter.runCode( `print(string(double("")));`, null, false, false, printFn );
if (retObj.error){
    console.log(retObj.error);
}else{
    console.log(retObj.exitObject.value);
}