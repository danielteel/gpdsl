const testCode = `
string failedTests="";
double failedTestCount=0;
numberOfTestsPassed=0;

string reportTest(string testName, bool passed){
	if (!passed) {
		failedTests=failedTests+testName+" ";
		failedTestCount=failedTestCount+1;
	}else{
		numberOfTestsPassed=numberOfTestsPassed+1;
	}
	print(testName+" test: "+(passed?"✓":"FAIL"));
}
string testDone(){
	print("--------");
	string message;
	if (failedTestCount){
		print("Tests that failed: "+trim(string(failedTests)));
		message=string(failedTestCount)+" test(s) failed.";
		print(message);
	}else{
		message="All tests passed.";
		print(message);
	}
	return message;
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
	if (!(true && called())) return false;//short circuit, should call called()
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
	if ("HI"!="HI") return false;
	if (!("abc"!="ABC")) return false;
	if (true!=true) return false;
	if (false!=false) return false;
	if (!(false!=true)) return false;
	if (10!=10) return false;
	if (!(1!=2)) return false;
	if (not(true)) return false;
	if (!not(false)) return false;
	return true;
}

bool testTernary(){
	if (true?false:true) return false;
	if (false?true:false) return false;
	if (!(false?false:true)) return false;
	if (!(true?true:false)) return false;
	string name="Bob";
	if ((
		name=="Jeff"	?	"Yo Jeff!"	:
		name=="Bob"		?	"Hi Bob!"	:
		name=="Dan"		?	"Hello Dan!":
							"Go away stranger!"
		)!="Hi Bob!") return false;
	return true;
}

bool testUnarys(){
	if (-5!=-5) return false;
	if (!true!=false) return false;
	if (!(!true==false)) return false;
	if (!?null==true) return false;
	if (?null==false) return false;
	if (?"hi"==true) return false;
	if (?true==true) return true;
	if (?false==true) return true;
	return true;
}

bool testConversions(){
	if (string(500)!="500") return false;
	if (string(123456.789, 2)!="123456.79") return false;
	if (string(true)!="true") return false;
	if (string(false)!="false") return false;
	if (double("0123.4")!=123.4) return false;
	if (double("-.456")!=-.456) return false;
	if (double(true)!=1) return false;
	if (double(false)!=0) return false;
	if (bool("gsfg5dfg")!=true) return false;
	if (bool("")!=false) return false;
	if (bool(100) != true) return false;
	if (bool(0) != false) return false;
	return true;
}

bool testStd(){
	if (ceil(0.3) != 1) return false;
	if (ceil(100.7) != 101) return false;
	if (ceil(-0.3) != 0) return false;
	if (ceil(-100.7) != -100 ) return false;
	if (floor(0.3) != 0) return false;
	if (floor(100.7) != 100) return false;
	if (floor(-0.3) != -1) return false;
	if (floor(-100.7) != -101 ) return false;
	if (abs(100) != 100) return false;
	if (abs(-100) != 100) return false;
	if (min(100, -100) != -100) return false;
	if (min(-100, 100) != -100) return false;
	if (max(100, -100) != 100) return false;
	if (max(-100, 100) != 100) return false;
	if (clamp(-200, -100, 100) != -100) return false;
	if (clamp(200, -100, 100) != 100) return false;
	if (len("123"+"456") != 6) return false;
	if (len("") != 0) return false;
	if (trim("  234 ")!="234") return false;
	if (ucase("aBcD")!="ABCD") return false;
	if (lcase("AbCd")!="abcd") return false;
	if (substr("123456", 1, 2) !="23") return false;
	if (substr("123456", -2, 1) !="5") return false;
	return true;
}

string scopeTestVar="top level scope";
bool testScopes(){
	string scopeTestVar="What";
	string nestedFunc(string scopeTestVar){
		string b(string scopeTestVar){
			return lcase(scopeTestVar);
		}
		return b(scopeTestVar)+b(scopeTestVar);
	}
	for (string scopeTestVar="0";double(scopeTestVar)<double("8");scopeTestVar=string(double(scopeTestVar)+1)){
		if (nestedFunc(scopeTestVar)!=scopeTestVar+scopeTestVar) return false;
	}
	
	if (scopeTestVar!="What") return false;
	return true;
}

bool testForLoop(){
	double loopCount=0;
	for (double i=-10;i<=10;i=i+1){
		loopCount=loopCount+1;
	}
	if (loopCount!=21) return false;

	double i;
	for (i=0;i<10;i=i+2);
	if (i!=10) return false;

	i=0;
	for (;;){
		i=i+1;
		break;
	}
	if (i!=1) return false;

	bool breakItAll=false;
	for (double x=-50; x<=50; x=x+10){
		for (double y=-50; y<=50; y=y+10){
			i=i+1;
			double getSame(double a){
				return a+1;
			}
			if (getSame(i)==100){
				breakItAll=true;
				break;
			}
		}
		if (breakItAll) break;
	}
	if (i!=99 || breakItAll==false) return false;

	return true;
}

bool testLoop(){
	double i=0;
	loop {
		i=i+1;
	} while (false)
	if (i!=1) return false;

	i=0;
	loop {
		i=i+1;
		if (i==10) break;
	} while (true);
	if (i!=10) return false;

	i=0;
	loop {
		i=i+1;
	} while (i<10)
	if (i!=10) return false;

	i=0;
	loop {
		loop {
			i=i+1;
		} while (false)
	} while (false)
	if (i!=1) return false;

	return true;
}

bool testWhile(){
	double i=-50;
	while (i<100) i=i+1;
	if (i!=100) return false;

	i=0;
	while (true){
		i=i+1;
		if (i==100) break;
	}
	if (i!=100) return false;

	i=0;
	double calledCount=0;
	while (i<101){
		double addTwo(double i){
			calledCount=calledCount+1;
			return i+2;
		}
		while (i<50) i=addTwo(i);
		while (i<100) {
			i=addTwo(i);
		}
		i=i+1;
	}
	if (i!=101 || calledCount!=50) return false;

	return true;
}


bool testRecursive(){
	double doRecursion(double number){
		number=number-1;
		if (number>0) number=doRecursion(number);
		return number;
	}
	if (doRecursion(100)!=0) return false;

	double fib(double n) {
		if (n < 2) return n;
		return fib(n - 1) + fib(n - 2); 
	}
	if (fib(20)!=6765) return false;
	return true;
}

bool testVarNames(){
	double _5(){
		return 123;
	}
	
	double a123bc_d=123;
	if (a123bc_d!=123) return false;
	if (_5()!=123) return false;

	return true;
}

bool testImportedVariables(){
	if (authorName!="Dan Teel") return false;
	if (publicationYear!=2020) return false;
	if (isInterpreted!=true) return false;
	return true;
}

bool testImportedFunctions(){
	if (string( neg(123)) != "-123") return false;
	if (double( reverse("123")) != 321) return false;
	return true;
}

double startTime=time();
reportTest("Variable names", testVarNames() );
reportTest("Recursive test", testRecursive() );
reportTest("While loop", testWhile());
reportTest("Loop while", testLoop());
reportTest("For loop", testForLoop());
reportTest("Scope", testScopes());
reportTest("Std", testStd());
reportTest("Conversions", testConversions());
reportTest("Unary", testUnarys());
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
reportTest("Imported variables", testImportedVariables());
reportTest("Imported functions", testImportedFunctions());
print("Testing time = "+string(time()-startTime)+"ms");
exit testDone();
`;

export default testCode;