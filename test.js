let code = `
string reportTest(string testName, bool passed){
	print(testName+" test: "+(passed?"passed":"failed"));
}

bool testAnd(){
	double calledTimes=0;
	bool called(){
		calledTimes=calledTimes+1;
		return true;
	}

	if (false && false) return false;
	if (true && false) return false;
	if (false && true) return false;
	if (!(true && true)) return false;
	if (false && called()) return false;//short circuit, shouldnt call called()
	if (calledTimes!=0) return false;
	if (called() && false) return false;//short circuit, should call called()
	if (calledTimes!=1) return false;
	return true;
}

bool testOr(){
	double calledTimes=0;
	bool called(){
		calledTimes=calledTimes+1;
		return true;
	}

	if (!(true || true)) return false;
	if (!(true || false)) return false;
	if (!(false || true)) return false;
	if (!(true || called())) return false;//Test short circuiting, shouldnt call called
	if (calledTimes!=0) return false;
	if (!(called() || true)) return false;//Test short circuiting, should call called
	if (calledTimes!=1) return false;
	return true;
}

bool testAdd(){
	if (1.0+2.0 != 3) return false;
	if (-2.0+1.0 != -1) return false;
	if (123456+654321 != 777777) return false;
	if (0.123+-.123+45.5 != 45.5) return false;
	return true;
}

bool testSub(){
	if (1.0-2.0 != -1) return false;
	if (-2.0-1.0 != -3) return false;
	if (123456-654321 != -530865) return false;
	if (0.123--.123-45.5 != -45.254) return false;
	return true;
}

bool testMultiply(){
	if (10*0.5 != 5) return false;
	if (-100.1 * 23.25 != -2327.325) return false;
	if (-68 * -34 != 2312) return false;
	if (8*4*10 != 320) return false;
	return true;
}

bool testDivide(){
	if (10/0.5 != 20) return false;
	if (-45 / 32 != -1.40625) return false;
	if (-2565 / -45 != 57) return false;
	if (100/10/2.5 != 4) return false;
	return true;
}

bool testMod(){
	if (10 % 7 != 3) return false;
	if (-45 % 32 != -13) return false;//C style mod
	if (-2565 % -45 != 0) return false;
	if (100 % 33 % 3 != 1) return false;
	return true;
}

bool testExponentiation(){
	if (5 ^ 2 != 25) return false;
	if (-10.5 ^ 3 != -1157.625) return false;//C style mod
	if (2 ^ -2 != 0.25) return false;
	if (4 ^ 4 ^ 0.5 != 16) return false;
	return true;
}

bool testAE(){
	if (!(10>=10)) return false;
	if (!(16>=9)) return false;
	if (-10>=10) return false;
	if (9>=9.1) return false;
	return true;
}
bool testA(){
	if (!(11>10)) return false;
	if (!(9>-16)) return false;
	if (-10>10) return false;
	if (9>9.1) return false;
	return true;
}
bool testBE(){
	if (!(10<=10)) return false;
	if (16<=9) return false;
	if (!(-10<=10)) return false;
	if (!(9<=9.1)) return false;
	return true;
}
bool testB(){
	if (11<10) return false;
	if (9<-16) return false;
	if (!(10<11)) return false;
	if (!(-9<9)) return false;
	return true;
}

bool testE(){
	if (!("HI"=="HI")) return false;
	if ("abc"=="ABC") return false;
	if (!(true==true)) return false;
	if (!(false==false)) return false;
	if (!(10==10)) return false;
	if (1==2) return false;
	return true;
}
bool testNE(){
	if (!("HI"=="HI")) return false;
	if ("abc"=="ABC") return false;
	if (!(true==true)) return false;
	if (!(false==false)) return false;
	if (!(10==10)) return false;
	if (1==2) return false;
	return true;
}

bool testTernary(){
	if (true?false:true) return false;
	if (false?true:false) return false;
	if (!(false?false:true)) return false;
	if (!(true?true:false)) return false;
	return true;
}

reportTest("?:", testTernary());
reportTest(">=", testAE());
reportTest(">", testA());
reportTest("<=", testBE());
reportTest("<", testB());
reportTest("==", testE());
reportTest("!=", testNE());
reportTest("And", testAnd());
reportTest("Or", testOr());
reportTest("Add", testAdd());
reportTest("Sub", testSub());
reportTest("Mul", testMultiply());
reportTest("Div", testDivide());
reportTest("Mod", testMod());
reportTest("Exp", testExponentiation());
`;

const {Interpreter, StringObj, NumberObj, BoolObj} = require('./Interpreter');


const print = (popFn) => {
		let str=popFn();

		console.log(str.value);
		return new BoolObj(null, false, false);
}

let interpreter=new Interpreter();
let thisObj = new NumberObj("this", 123456, true);
let imports = [thisObj, Interpreter.funcDef("print", print, "bool", "string")];

let retObj = interpreter.runCode( code, true, ...imports );

if (retObj.error){
	if (retObj.disassembled){
		console.log(retObj.disassembled);
	}
	console.log(retObj.error)
}else{
	//console.log(retObj.disassembled);
	console.log(retObj.exitObject.objType, retObj.exitObject.value);
}