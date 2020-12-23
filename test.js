let code = `double reverseInteger(double number) { 
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

for (double i=0;i<=1000000;i=i+1){
	 reverseInteger(i);
}
double i;
print( tostring(?i, null) );
`;

code=`
bool a=0;
bool b=0;
bool c=0;
bool d=0;

double A=1, B=2, C=3, D=4, EL=5;
exit    a ? A
			: b ? B
			: c ? C
			: d ? D
			: EL;
`;

const {Interpreter, StringObj, NumberObj, BoolObj} = require('./Interpreter');

function print(popFn){
		let str=popFn();

		console.log(str.value);
		return new BoolObj(null, false, false);
}

let interpreter=new Interpreter();

interpreter.runCode( 
										code,                                                   //The code to run
										Interpreter.funcDef("print", print, "bool", "string"),  //importing print (returns a bool, accepts a string)
									 );
