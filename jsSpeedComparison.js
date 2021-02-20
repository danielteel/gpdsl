class Utils{
	static isAboutEquals(a,b){
		if (Math.abs(a-b)<0.0000001){
			return true;
		}
		return false;
	}
}

const IdentityType = {
	Null: Symbol("Null"),

	Bool: Symbol("Bool"),
	Double: Symbol("Double"),
	String: Symbol("String"),

	Function: Symbol("Function")
}


const OpObjType={
	bool: Symbol("bool"),
	num: Symbol("number"),
	string: Symbol("string"),
	register: Symbol("register"),
	null: Symbol("null")
};


const TokenType = {
	LineDelim: Symbol(";"),
	NewLine: Symbol("newline"),

	Forward: Symbol("forward"),
	Void: Symbol("void"),
	Double: Symbol("double"),
	String: Symbol("string"),
	Bool: Symbol("bool"),

	DoubleLiteral: Symbol("number_literal"),
	StringLiteral: Symbol("string_literal"),
	BoolLiteral: Symbol("bool_literal"),

	Ident: Symbol("ident"),

	True: Symbol("true"),
	False: Symbol("false"),
	Null: Symbol("null"),

	LeftParen: Symbol("("),
	RightParen: Symbol(")"),
	LeftSqaure: Symbol("["),
	RightSqaure: Symbol("]"),

	Comma: Symbol(","),
	Dot: Symbol("."),

	Not: Symbol("!"),
	And: Symbol("&&"),
	Or: Symbol("||"),
	Plus: Symbol("+"),
	Minus: Symbol("-"),
	Divide: Symbol("/"),
	Multiply: Symbol("*"),
	Mod: Symbol("%"),
	Exponent: Symbol("^"),

	Question: Symbol("?"),
	Colon: Symbol(":"),

	Assignment: Symbol("="),
	Equals: Symbol("=="),
	NotEquals: Symbol("!="),
	Lesser: Symbol("<"),
	Greater: Symbol(">"),
	LesserEquals: Symbol("<="),
	GreaterEquals: Symbol(">="),

	Min: Symbol("min"),
	Max: Symbol("max"),
	Abs: Symbol("abs"),
	Clamp: Symbol("clamp"),
	Floor: Symbol("floor"),
	Ceil: Symbol("ceiling"),

	LCase: Symbol("lcase"),
	UCase: Symbol("ucase"),
	Trim: Symbol("trim"),
	Len: Symbol("len"),
	SubStr: Symbol("substr"),

	While: Symbol("while"),
	For: Symbol("for"),
	Loop: Symbol("loop"),
	If: Symbol("if"),
	Else: Symbol("else"),
	Break: Symbol("break"),
	LeftCurly: Symbol("{"),
	RightCurly: Symbol("}"),

	Return: Symbol("return"),
	Exit: Symbol("exit")
};


function isDigit(character){
	const charCode=character.charCodeAt(0);
	if (charCode>=48 && charCode<=57){
		return true;
	}
	return false;
}

function isAlpha(character){
	const charCode=character.charCodeAt(0);
	if ((charCode>=65 && charCode<=90) || (charCode>=97 && charCode<=122)){
		return true;
	}
	return false;
}

function isAlNum(character){
	return Utils.isAlpha(character) || Utils.isDigit(character);
}
 
function isSpace(character){
	if (character.charCodeAt(0)<=32) return true;
	return false;
}

class Tokenizer {
	static newTokenObj(type, value, line) {
		return {type: type, value: value, line: line};
	}

	static get TokenType(){
		return TokenType;
	}

	setCode(code) {
		this.code = code;

		this.lookIndex = 0;
		this.look = this.code[0];
		this.codeEndIndex = this.code.length;
		this.currentCodeLine = 1;
		this.errorObj = null;

		this.tokens = [];

		this.currentLineText=this.look;
	}

	tokenize(code) {
		this.setCode(code);

		while (this.isNotEnd()) {
			this.next();
		}
	
		this.addToken(TokenType.NewLine, this.currentLineText?.trim());

		return this.tokens;
	}

	throwError(message) {
		throw Error("Tokenizer error on line "+this.currentCodeLine+": "+message);
	}

	addToken(type, value = null) {
		this.tokens.push(Tokenizer.newTokenObj(type, value, this.currentCodeLine));
	}

	isNotEnd() {
		return this.lookIndex < this.codeEndIndex;
	}

	getChar() {
		if (this.isNotEnd()) {
			this.lookIndex++;
			this.look = this.code[this.lookIndex];

			if (this.look) this.currentLineText+=this.look;
		}
	}

	skipWhite() {
		while (this.isNotEnd() && isSpace(this.look)) {
			if (this.look === '\n') {
				this.currentCodeLine++;
				this.addToken(TokenType.NewLine, this.currentLineText.trimEnd());
				this.currentLineText="";
			}
			this.getChar();
		}
	}

	doubleLiteral() {
		let hasDec = false;
		let notDone = true;
		let num = "";

		while (this.isNotEnd() && notDone) {
			notDone = false;
			if (isDigit(this.look)) {
				num += this.look;
				notDone = true;
			}
			if (this.look === '.' && !hasDec) {
				num += this.look;
				hasDec = true;
				notDone = true;
			}
			if (notDone) this.getChar();
		}

		if (num.length===1 && hasDec){
			this.addToken(TokenType.Dot);

		} else if (num.length>0){
			this.addToken(TokenType.DoubleLiteral, Number(num));

		}else{
			this.throwError("expected number but found '"+this.look+"'");
		}
	}

	stringLiteral() {
		let stringTerminator=this.look;
		let str = "";
		this.getChar();
		while (this.isNotEnd() && this.look !== stringTerminator) {
			str += this.look;
			this.getChar();
		}
		if (this.isNotEnd()) {
			if (this.look !== stringTerminator) this.throwError("expected string but found end of code.");
		}
		this.getChar();
		this.addToken(TokenType.StringLiteral, str);
	}

	ident() {
		let name = "";
		let notDone = true;

		while (this.isNotEnd() && notDone === true) {
			notDone = false;
			if (isAlpha(this.look) || isDigit(this.look) || this.look === '_' || this.look === '.') {
				name += this.look;
				notDone = true;
				this.getChar();
			}
		}

		if (name.length === 0) this.throwError("expected identifier but got nothing");
		
		switch (name) {
			case "if":
				this.addToken(TokenType.If);
				break;
			case "while":
				this.addToken(TokenType.While);
				break;
			case "for":
				this.addToken(TokenType.For);
				break;
			case "loop":
				this.addToken(TokenType.Loop);
				break;
			case "else":
				this.addToken(TokenType.Else);
				break;
			case "break":
				this.addToken(TokenType.Break);
				break;

			case "return":
				this.addToken(TokenType.Return);
				break;

			case "exit":
				this.addToken(TokenType.Exit);
				break;

			case "floor":
				this.addToken(TokenType.Floor);
				break;
			case "ceil":
				this.addToken(TokenType.Ceil);
				break;
			case "min":
				this.addToken(TokenType.Min);
				break;
			case "max":
				this.addToken(TokenType.Max);
				break;
			case "clamp":
				this.addToken(TokenType.Clamp);
				break;
			case "abs":
				this.addToken(TokenType.Abs);
				break;

			case "lcase":
				this.addToken(TokenType.LCase);
				break;
			case "ucase":
				this.addToken(TokenType.UCase);
				break;
			case "trim":
				this.addToken(TokenType.Trim);
				break;
			case "len":
				this.addToken(TokenType.Len);
				break;
			case "substr":
				this.addToken(TokenType.SubStr);
				break;

			case "forward":
				this.addToken(TokenType.Forward);
				break;
			case "void":
				this.addToken(TokenType.Void);
				break;
			case "double":
				this.addToken(TokenType.Double);
				break;
			case "string":
				this.addToken(TokenType.String);
				break;
			case "bool":
				this.addToken(TokenType.Bool);
				break;

			case "true":
				this.addToken(TokenType.True);
				break;
			case "false":
				this.addToken(TokenType.False);
				break;
				
			case "null":
				this.addToken(TokenType.Null);
				break;

			default:
				return this.addToken(TokenType.Ident, name);
		}
	}


	next() {
		this.skipWhite();
		if (this.isNotEnd()) {

			if (isDigit(this.look) || this.look === '.') {
				this.doubleLiteral();

			} else if (isAlpha(this.look) || this.look === '_') {
				this.ident();

			} else if (this.look === '"' || this.look === "'") {
				this.stringLiteral();

			} else {
				let symbol = this.look;
				this.getChar();
				switch (symbol) {
					case ';':
						this.addToken(TokenType.LineDelim);
						break;
					case ',':
						this.addToken(TokenType.Comma);
						break;

					case '?':
						this.addToken(TokenType.Question);
						break;
					case ':':
						this.addToken(TokenType.Colon);
						break;

					case '{':
						this.addToken(TokenType.LeftCurly);
						break;
					case '}':
						this.addToken(TokenType.RightCurly);
						break;

					case '[':
						this.addToken(TokenType.LeftSqaure);
						break;
					case ']':
						this.addToken(TokenType.RightSqaure);
						break;

					case '(':
						this.addToken(TokenType.LeftParen);
						break;
					case ')':
						this.addToken(TokenType.RightParen);
						break;

					case '^':
						this.addToken(TokenType.Exponent);
						break;
					case '%':
						this.addToken(TokenType.Mod);
						break;
					case '+':
						this.addToken(TokenType.Plus);
						break;
					case '-':
						this.addToken(TokenType.Minus);
						break;
					case '*':
						this.addToken(TokenType.Multiply);
						break;
					case '/':
						if (this.isNotEnd() && this.look === '/') {
							this.getChar();
							while (this.isNotEnd() && this.look !== '\n') {
								this.getChar();
							}
							break;
						}
						this.addToken(TokenType.Divide);
						break;

					case '|':
						if (this.isNotEnd() && this.look === '|') {
							this.getChar();
							this.addToken(TokenType.Or);
							break;
						}
						this.throwError("incomplete OR operator found, OR operators must be of boolean type '||'");
						break;

					case '&':
						if (this.isNotEnd() && this.look === '&') {
							this.getChar();
							this.addToken(TokenType.And);
							break;
						}
						this.throwError("incomplete AND operator found, AND operators must be of boolean type '&&'");
						break;

					case '!':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							this.addToken(TokenType.NotEquals);
							break;
						}
						this.addToken(TokenType.Not);
						break;

					case '=':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							this.addToken(TokenType.Equals);
							break;
						}
						this.addToken(TokenType.Assignment);
						break;

					case '>':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							this.addToken(TokenType.GreaterEquals);
							break;
						}
						this.addToken(TokenType.Greater);
						break;
					case '<':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							this.addToken(TokenType.LesserEquals);
							break;
						}
						this.addToken(TokenType.Lesser);
						break;

					default:
						this.throwError("Unexpected symbol found, " + symbol);
				}
			}
		}
	}

}



class OpObj {
	constructor(name="", objType=null, value=null, isConstant=false){
		this._name=name;
		this._objType=objType;
		this._value=value;
		this._isConstant=isConstant;
	}

	get name(){
		return this._name;	
	}

	get objType(){
		return this._objType;
	}

	get isConstant(){
		return this._isConstant;
	}

	get value(){
		return this._value;
	}
}

class RegisterObj extends OpObj {
	constructor(name){
		super(name, OpObjType.register, null, false);
		this._curValType=OpObjType.num;
		this.stringObj=new StringObj(null, null, false);
		this.boolObj=new BoolObj(null, null, false);
		this.numberObj=new NumberObj(null, null, false);
		this.nullObj = new NullObj();
	}

	getCopy(asNative){
		if (asNative){
			return this.getNativeObj();
		}
		let newObj=new RegisterObj(this.name+"Copy");
		newObj._curValType=this._curValType;
		newObj._value=this._value;
		newObj._isConstant=this._isConstant;
		return newObj;
	}

	setTo(obj){
		if (obj instanceof OpObj === false) return "Tried to set register to invalid type";

		if (obj._objType===OpObjType.register){
			this._curValType=obj._curValType;
		}else{
			this._curValType=obj._objType;
		}
		this._value=obj._value;
		return null;
	}

	getNativeObj(){
		switch (this._curValType){
		case OpObjType.null:
			return this.nullObj;
		case OpObjType.string:
			this.stringObj._value=this._value;
			return this.stringObj;
		case OpObjType.bool:
			this.boolObj._value=this._value;
			return this.boolObj;
		case OpObjType.num:
			this.numberObj._value=this._value;
			return this.numberObj;
		}
	}

	eqaulTo(obj){
		return this.getNativeObj().eqaulTo(obj);
	}
	notEqualTo(obj){
		return this.getNativeObj().notEqualTo(obj);
	}
	smallerThan(obj){
		return this.getNativeObj().smallerThan(obj);
	}
	greaterThan(obj){
		return this.getNativeObj().greaterThan(obj);
	}
	smallerOrEqualThan(obj){
		return this.getNativeObj().smallerOrEqualThan(obj);
	}
	greaterOrEqualThan(obj){
		return this.getNativeObj().greaterOrEqualThan(obj);
	}
}

class NullObj extends OpObj {
	constructor(){
		super(null, OpObjType.null, null, true);
	}

	getCopy(){
		return this;
	}
	setTo(obj){
		throw new Error("tried to write to null");
	}

	eqaulTo(obj){
		if (obj._value !== null) return false;
		return true;
	}
	notEqualTo(obj){
		return !this.eqaulTo(obj);
	}
	smallerThan(obj){
		return false;
	}
	greaterThan(obj){
		return false;
	}
	smallerOrEqualThan(obj){
		return false;
	}
	greaterOrEqualThan(obj){
		return false;
	}
}

class BoolObj extends OpObj {
	constructor(name, initialVal=false, isConstant=false){
		super(name, OpObjType.bool, initialVal===null?null:Boolean(initialVal), isConstant);
	}
	
	getCopy(){
		return new BoolObj(this.name, this._value, this._isConstant);
	}

	setTo(obj){
		if (this._isConstant) return "Tried to write to constant bool";
		if (obj instanceof OpObj === false) return "Tried to set bool to invalid type";
		
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		switch (type){
		case OpObjType.null:
			this._value=null;
			break;
		case OpObjType.bool:
			this._value=obj._value;
			break;
		case OpObjType.num:
			this._value=obj._value===null ? null : Boolean(obj._value);
			break;
		default:
			return "Tried to set bool to invalid type";
		}
		
		return null;
	}
	eqaulTo(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		switch (type){
		case OpObjType.null:
			return this.value===null;
		case OpObjType.bool:
			return this._value===obj._value;
		case OpObjType.num:
			return Utils.isAboutEquals(Number(this._value), obj._value);
		default:
			throw new Error("Tried to do comparison to invalid type");
		}
	}    
	notEqualTo(obj){
		return !this.eqaulTo(obj);
	}
	smallerThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		switch (type){
		case OpObjType.bool:
			return this._value<obj._value;
		case OpObjType.num:
			return Number(this._value)<obj._value;
		default:
			throw new Error("Tried to do comparison to invalid type");
		}
	}
	greaterThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		switch (type){
		case OpObjType.bool:
			return this._value>obj._value;
		case OpObjType.num:
			return Number(this._value)>obj._value;
		default:
			throw new Error("Tried to do comparison to invalid type");
		}
	}
	smallerOrEqualThan(obj){
		return this.smallerThan(obj)||this.eqaulTo(obj);
	}
	greaterOrEqualThan(obj){
		return this.greaterThan(obj)||this.eqaulTo(obj);
	}
}

class NumberObj extends OpObj {
	constructor(name, initialVal=null, isConstant=false){
		super(name, OpObjType.num,  initialVal===null?null:Number(initialVal), isConstant);
	}
	
	getCopy(){
		return new NumberObj(this.name, this._value, this._isConstant);
	}

	setTo(obj){
		if (this._isConstant) return "Tried to write to constant number";
		if (obj instanceof OpObj === false) return "Tried to set number to invalid type";
		
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		switch (type){
			case OpObjType.null:
				this._value=null;
				break;
			case OpObjType.bool:
				this._value=obj._value===null ? null : Number(obj._value);
				break;
			case OpObjType.num:
				this._value=obj._value;
				break;
			default:
				return "Tried to set number to invalid type";
		}
		if (!isFinite(this._value)) this._value=null;
		return null;
	}
	eqaulTo(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		if (obj._value===null && this._value!==null) return false;
		if (this._value===null && obj._value!==null) return false;
		switch (type){
			case OpObjType.null:
				return this._value===null;
			case OpObjType.bool:
				return this._value===Number(obj._value);
			case OpObjType.num:
				return Utils.isAboutEquals(this._value, obj._value);
			default:
				throw new Error("Tried to do comparison to invalid type");
		}
	}    
	notEqualTo(obj){
		return !this.eqaulTo(obj);
	}
	smallerThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		switch (type){
			case OpObjType.bool:
				return this._value<Number(obj._value);
			case OpObjType.num:
				return this._value<obj._value;
			default:
				throw new Error("Tried to do comparison to invalid type");
		}
	}
	greaterThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		switch (type){
			case OpObjType.bool:
				return this._value>Number(obj._value);
			case OpObjType.num:
				return this._value>obj._value;
			default:
				throw new Error("Tried to do comparison to invalid type");
		}
	}
	smallerOrEqualThan(obj){
		return this.smallerThan(obj)||this.eqaulTo(obj);
	}
	greaterOrEqualThan(obj){
		return this.greaterThan(obj)||this.eqaulTo(obj);
	}
}

class StringObj extends OpObj {
	constructor(name, initialVal="", isConstant=false){
		super(name, OpObjType.string,  initialVal===null?null:String(initialVal), isConstant);
	}

	getCopy(){
		return new StringObj(this.name, this._value, this._isConstant);
	}

	setTo(obj){
		if (this._isConstant) return "Tried to write to constant string";
		if (obj instanceof OpObj === false) return "Tried to set string to invalid type";
		
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		switch (type){
			case OpObjType.null:
				this._value=null;
				break;
			case OpObjType.string:
				this._value=obj._value;
				break;
			default:
				return "Tried to set string to invalid type";
		}
		return null;
	}

	eqaulTo(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		if (obj._value===null && this._value!==null) return false;
		if (this._value===null && obj._value!==null) return false;

		switch (type){
			case OpObjType.null:
				return this._value===null;
			case OpObjType.string:
				return this._value===obj._value;
			default:
				throw new Error("Tried to do comparison to invalid type");
		}
	}
	notEqualTo(obj){
		return !this.eqaulTo(obj);
	}
	smallerThan(obj){
		throw new Error("Tried to do invalid comparison");
	}
	greaterThan(obj){
		throw new Error("Tried to do invalid comparison");
	}
	smallerOrEqualThan(obj){
		throw new Error("Tried to do invalid comparison");
	}
	greaterOrEqualThan(obj){
		throw new Error("Tried to do invalid comparison");
	}
}


class Parser {
	constructor(tokens){
		this.tokens=tokens;

		this.tokenIndex=0;
		this.token=this.tokens[0];
		this.tokenEndIndex=this.tokens.length;

		this.branchCounter=1;

		this.scopeIndex=0;
		this.scopes=[[]];

		this.allocScope=[0];
		this.allocScopeIndex=0;
		this.maxScopeDepth=0;

		this.program=null;
	}

	newBranch(){
		return this.branchCounter++;
	}

	throwError(message) {
		let errorLine;
		if (this.token){
			errorLine=this.token.line;
		}else{
			errorLine=this.tokens[this.tokens.length-1].line;//Probably ran to the end of the token buffer, so just grab the last code line
		}
		let error=new Error("Parser error on line "+errorLine+": "+message);
		throw error;
	}

	symbolToString(sym){
		return sym?.toString().replace("Symbol","");
	}

	typeMismatch(expectedType, foundType){
		this.throwError("expected type "+this.symbolToString(expectedType)+" but found type "+this.symbolToString(foundType));
	}
	
	matchType(whatToTest, typeItShouldBe, strict=false){
		if (this.typesDontMatch(whatToTest, typeItShouldBe, strict)) this.typeMismatch(typeItShouldBe, whatToTest);
	}

	typesDontMatch(a, b, strict=false){
		return !(a===b || (a===IdentityType.Null || b===IdentityType.Null && strict===false));
	}

	match(type) {
		if (this.token?.type === type) {
			this.getToken();
		}else{
			if (this.token){
				this.throwError("expected token type "+ this.symbolToString(type) + " but found "+this.symbolToString(this.token?.type)+" instead");
			}else{
				this.throwError("expected token type "+ this.symbolToString(type) + " but found nothing!");
			}
		}
	}

	isNotEnd() {
		return this.tokenIndex < this.tokenEndIndex;
	}

	getToken() {
		if (this.isNotEnd()) {
			this.tokenIndex++;
			this.token = this.tokens[this.tokenIndex];
			while (this.token?.type===TokenType.NewLine){
				this.program.addCodeLine(this.token.value);
				this.tokenIndex++;
				this.token = this.tokens[this.tokenIndex];
			}
		}
	}

	firstToken(){
		this.tokenIndex=0;
		this.token=this.tokens[0];
		
		while (this.token?.type===TokenType.NewLine){
			this.tokenIndex++;
			this.token = this.tokens[this.tokenIndex];
		}
	}
	
	parse(externals){
		
		this.tokenEndIndex=this.tokens.length;
		this.firstToken();


		this.branchCounter=1;

		this.scopeIndex=0;
		this.scopes=[[]];

		this.allocScope=[0];
		this.allocScopeIndex=0;
		this.maxScopeDepth=0;

		this.program = new Program();

		for (let i=0;i<externals.length;i++){
			this.addToCurrentScope(externals[i].name, externals[i].type, i, externals[i].params, externals[i].returnType);
		}

		this.pushAllocScope();

		const entryPoint = this.newBranch();
		const entryPointAddress=this.program.addLabel(entryPoint);
		this.program.addCodeLine(null);

		this.doBlock(null, null, false, false, true);
		
		this.program.addCodeLine(null);
		
		this.program.addExit( Program.unlinkedNull() );

		let mainPreamble=[];
		mainPreamble.push(this.program.addScopeDepth(this.maxScopeDepth, true));
		if (this.allocScope[this.allocScopeIndex]){
			mainPreamble.push(this.program.addPushScope(this.allocScopeIndex, this.allocScope[this.allocScopeIndex], true));
		}
		this.program.code.splice(mainPreamble+1, 0, ...mainPreamble);

		this.popAllocScope();
		return this.program;
	}
	
	pushAllocScope(){
		this.allocScope[++this.allocScopeIndex]=0;
		this.maxScopeDepth=Math.max(this.maxScopeDepth, this.allocScopeIndex);
	}
	popAllocScope(){
		this.allocScope[this.allocScopeIndex--]=undefined;
	}

	pushScope(){
		this.scopes[++this.scopeIndex]=[];
	}
	popScope(){
		this.scopes[this.scopeIndex--]=undefined;
	}
	addToCurrentScope(name, type, branch=null, params=null, returnType=null){
		const alreadyExists=this.getIdentity(name, true);
		if (alreadyExists !== null) this.throwError("Duplicate define, "+name+" already exists in current scope as "+alreadyExists.name+":"+alreadyExists.type.toString());
		let obj={name: name, type: type, branch: branch, params: params, returnType: returnType, scope: this.allocScopeIndex, index: this.allocScope[this.allocScopeIndex]};
		this.scopes[this.scopeIndex].push(obj);
		switch (type){
			case IdentityType.Bool:
			case IdentityType.Double:
			case IdentityType.String:
				this.allocScope[this.allocScopeIndex]++;
				break;
		}
		return obj;
	}

	getFromStringPool(string){
		let stringIndex=this.stringPool.indexOf(string);
		if (stringIndex<0){
			this.stringPool.push(string);
			stringIndex=this.stringPool.length-1;
		}
		return stringIndex;
	}

	

	getIdentity(name, onlyInCurrentScope=false){
		for (let i = this.scopeIndex;i>=0;i--){
			let identity = this.scopes[i].find( current => name === current.name );
			if (identity) return identity;
			if (onlyInCurrentScope) break;
		}
		return null;
	}

	addVar(name, type){
		return this.addToCurrentScope(name, type);
	}

	addFunction(name, returnType, branch, params){
		return this.addToCurrentScope(name, IdentityType.Function, branch, params, returnType);
	}


	isPowerOp(){
		if (this.token.type===TokenType.Exponent) return true;
		return false;
	}

	isTermOp(){
		switch (this.token.type){
		case TokenType.Multiply:
		case TokenType.Divide:
		case TokenType.Mod:
			return true;
		}
		return false;
	}

	isAddOp(){
		if (this.token.type===TokenType.Plus || this.token.type===TokenType.Minus) return true;
		return false;
	}

	isCompareOp(){
		switch (this.token.type){
			case TokenType.Lesser:
			case TokenType.LesserEquals:
			case TokenType.Greater:
			case TokenType.GreaterEquals:
			case TokenType.Equals:
			case TokenType.NotEquals:
				return true;
		}
		return false;
	}

	isAndOp(){
		if (this.token.type===TokenType.And) return true;
		return false;
	}

	isOrOp(){
		if (this.token.type===TokenType.Or) return true;
		return false;
	}

	isTernaryOp(){
		if (this.token.type===TokenType.Question) return true;
		return false;
	}

	doFuncCall(funcName=null){
		let needsIdentMatched=false;
		if (funcName===null){
			funcName=this.token?.value;
			needsIdentMatched=true;
		}
		let identObj = this.getIdentity(funcName);
		if (identObj.type!==IdentityType.Function) this.throwError("tried to call a function named '"+funcName+"' that doesnt exist");
		if (!identObj) this.throwError("tried to call undefined function'"+funcName+"'");

		if (needsIdentMatched) this.match(TokenType.Ident);

		this.match(TokenType.LeftParen);

		for (let i=0;i<identObj.params.length;i++){
			let type=this.doExpression();
			this.program.addPush( Program.unlinkedReg("eax") );

			if (this.typesDontMatch(type, identObj.params[i])) this.typeMismatch(identObj.params[i], type);
			
			if (i<identObj.params.length-1){
				this.match(TokenType.Comma);
			}
		}

		this.match(TokenType.RightParen);

		if (identObj.scope===0){
			this.program.addExCall(identObj.branch, "fxn "+identObj.name);
		}else{
			this.program.addCall(identObj.branch, "fxn "+identObj.name);
		}

		return identObj.returnType;
	}

	doIdent(){
		const varName=this.token.value;
		const identObj = this.getIdentity(varName);
		this.match(TokenType.Ident);
		if (!identObj) this.throwError("tried to access undefined '"+varName+"'");

		switch (identObj.type){
			case IdentityType.Function:
				return this.doFuncCall(varName);

			case IdentityType.String:
			case IdentityType.Bool:
			case IdentityType.Double:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedVariable(identObj.type, identObj.scope, identObj.index, varName) );
				return identObj.type;
		}
		this.throwError("unknown ident type "+varName+":"+identObj.type.toString());
	}

	doFactor(){
		let type=null;
		switch (this.token?.type){
			case TokenType.Ident:
				return this.doIdent();

			case TokenType.Minus:
				this.match(TokenType.Minus);
				type=this.doFactor();
				if (this.typesDontMatch(IdentityType.Double, type)) this.typeMismatch(IdentityType.Double, type);
				this.program.addNeg( Program.unlinkedReg("eax") );
				return IdentityType.Double;

			case TokenType.Not:
				this.match(TokenType.Not);
				type=this.doFactor();
				if (this.typesDontMatch(IdentityType.Bool, type)) this.typeMismatch(IdentityType.Bool, type);
				this.program.addNot( Program.unlinkedReg("eax") );
				return IdentityType.Bool;

			case TokenType.Question:
				this.match(TokenType.Question);
				type=this.doFactor();
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNull() );
				this.program.addSNE( Program.unlinkedReg("eax") );
				return IdentityType.Bool;

			case TokenType.LeftParen:
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.match(TokenType.RightParen);
				return type;
				
			case TokenType.Null:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNull() );
				this.match(TokenType.Null);
				return IdentityType.Null;

			case TokenType.True:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true) );
				this.match(TokenType.True);
				return IdentityType.Bool;
			
			case TokenType.False:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, false) );
				this.match(TokenType.False);
				return IdentityType.Bool;

			case TokenType.DoubleLiteral:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Double, this.token.value) );
				this.match(TokenType.DoubleLiteral);
				return IdentityType.Double;
			
			case TokenType.StringLiteral:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.String, this.token.value) );
				this.match(TokenType.StringLiteral);
				return IdentityType.String;

			case TokenType.Bool:
				this.match(TokenType.Bool);
				this.match(TokenType.LeftParen);
				type = this.doExpression();
				if (this.typesDontMatch(IdentityType.Bool, type)){
					this.program.addToBool( Program.unlinkedReg("eax") );
				}
				this.match(TokenType.RightParen);
				return IdentityType.Bool;

			case TokenType.Double:
				this.match(TokenType.Double);
				this.match(TokenType.LeftParen);
				type = this.doExpression();
				if (this.typesDontMatch(IdentityType.Double, type)){
					this.program.addToDouble( Program.unlinkedReg("eax") );
				}
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.String:
				this.match(TokenType.String);
				this.match(TokenType.LeftParen);
				type = this.doExpression();
				if (this.token?.type===TokenType.Comma){
					this.match(TokenType.Comma);
					this.program.addPush( Program.unlinkedReg("eax") );
					type=this.doExpression();
					if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
					this.program.addPop( Program.unlinkedReg("ebx") );
					this.program.addToString( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				} else {
					this.program.addToString( Program.unlinkedReg("eax"), Program.unlinkedNull() );
				}
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.Ceil:
				this.match(TokenType.Ceil);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.program.addCeil( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Floor:
				this.match(TokenType.Floor);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.program.addFloor( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Abs:
				this.match(TokenType.Abs);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.program.addAbs( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Min:
				this.match(TokenType.Min);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.program.addPush( Program.unlinkedReg("eax") );
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.match(TokenType.Comma);
				type=this.doExpression();
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Max:
				this.match(TokenType.Max);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.program.addPush( Program.unlinkedReg("eax") );
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.match(TokenType.Comma);
				type=this.doExpression();
				if (this.typesDontMatch(type, IdentityType.Double)) this.typeMismatch(IdentityType.Double, type);
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Clamp:

				this.match(TokenType.Clamp);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.Double);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double);
		
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double);
		
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Len:
				this.match(TokenType.Len);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String);
				this.program.addLen( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.SubStr:
				this.match(TokenType.SubStr);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double);

				this.program.addMov( Program.unlinkedReg("ecx"), Program.unlinkedReg("eax") );
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addPop( Program.unlinkedReg("eax") );
				this.program.addSubStr( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"), Program.unlinkedReg("ecx") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.Trim:
				this.match(TokenType.Trim);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String);
				this.program.addTrim( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.LCase:
				this.match(TokenType.LCase);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String);
				this.program.addLCase( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.UCase:
				this.match(TokenType.UCase);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String);
				this.program.addUCase( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			default:
				this.throwError("expected factor but found "+this.symbolToString(this.token.type));
		}
	}

	doExponentiation(){
		let leftType=this.doFactor();
		
		while (this.isNotEnd() && this.isPowerOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			let powerOp=this.token.type;
			this.match(powerOp);
			let rightType=this.doFactor();
			if (this.typesDontMatch(leftType, IdentityType.Double)) this.typeMismatch(IdentityType.Double, leftType);
			if (this.typesDontMatch(rightType, IdentityType.Double)) this.typeMismatch(IdentityType.Double, rightType);

			this.program.addPop( Program.unlinkedReg("ebx") );

			switch (powerOp){
				case TokenType.Exponent:
					this.program.addExponent( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
			}

			leftType=rightType;
		}

		return leftType;
	}

	doTerm(){
		let leftType=this.doExponentiation();
		
		while (this.isNotEnd() && this.isTermOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			let termOp=this.token.type;
			this.match(termOp);
			let rightType=this.doExponentiation();
			if (this.typesDontMatch(leftType, IdentityType.Double)) this.typeMismatch(IdentityType.Double, leftType);
			if (this.typesDontMatch(rightType, IdentityType.Double)) this.typeMismatch(IdentityType.Double, rightType);

			this.program.addPop( Program.unlinkedReg("ebx") );

			switch (termOp){
				case TokenType.Multiply:
					this.program.addMul( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
				case TokenType.Divide:
					this.program.addDiv( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
				case TokenType.Mod:
					this.program.addMod( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
			}

			leftType=rightType;
		}

		return leftType;
	}

	doAdd(){
		let leftType=this.doTerm();

		while (this.isNotEnd() && this.isAddOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			let addOp=this.token.type;
			this.match(addOp);
			let rightType=this.doTerm();

			if (this.typesDontMatch(leftType, rightType)) this.typeMismatch(leftType, rightType);

			this.program.addPop( Program.unlinkedReg("ebx") );
			
			switch (addOp){
				case TokenType.Plus:
					if (leftType===IdentityType.String){
						this.program.addConcat( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
						this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					}else if (leftType===IdentityType.Double){
						this.program.addAdd( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					}else{
						this.throwError("'+' operator only valid for strings or doubles");
					}
					break;
				case TokenType.Minus:
					if (leftType!==IdentityType.Double) this.throwError("'-' operator only valid for doubles");
					this.program.addSub( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					this.program.addNeg( Program.unlinkedReg("eax") );
					break;
			}

			leftType=rightType;
		}

		return leftType;
	}

	doCompare(){
		let leftType=this.doAdd();

		while (this.isNotEnd() && this.isCompareOp()){
			this.program.addPush( Program.unlinkedReg("eax") );
			let compareOp=this.token.type;
			this.match(compareOp);
			let rightType=this.doAdd();

			if (this.typesDontMatch(leftType, rightType)) this.typeMismatch(leftType, rightType);


			this.program.addPop( Program.unlinkedReg("ebx") );
			this.program.addCmp( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );

			switch (compareOp){
				case TokenType.Equals:
					this.program.addSE( Program.unlinkedReg("eax") );
					break;
				case TokenType.NotEquals:
					this.program.addSNE( Program.unlinkedReg("eax") );
					break;
				case TokenType.Greater:
					if (leftType!==IdentityType.Double) this.throwError("'>' operator only valid for double types");
					this.program.addSA( Program.unlinkedReg("eax") );
					break;
				case TokenType.GreaterEquals:
					if (leftType!==IdentityType.Double) this.throwError("'>=' operator only valid for double types");
					this.program.addSAE( Program.unlinkedReg("eax") );
					break;
				case TokenType.Lesser:
					if (leftType!==IdentityType.Double) this.throwError("'<' operator only valid for double types");
					this.program.addSB( Program.unlinkedReg("eax") );
					break;
				case TokenType.LesserEquals:
					if (leftType!==IdentityType.Double) this.throwError("'<=' operator only valid for double types");
					this.program.addSBE( Program.unlinkedReg("eax") );
					break;
			}

			leftType=IdentityType.Bool;
		}

		return leftType;
	}

	doAnd(){
		let leftType=this.doCompare();

		while (this.isNotEnd() && this.isAndOp()){
			if (this.typesDontMatch(IdentityType.Bool, leftType)) this.typeMismatch(IdentityType.Bool, leftType);

			let shortCircuitBranch=this.newBranch();
			this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true) );
			this.program.addJNE( shortCircuitBranch );

			this.program.addPush( Program.unlinkedReg("eax") );

			this.match(TokenType.And);

			let rightType=this.doCompare();
			if (this.typesDontMatch(IdentityType.Bool, rightType)) this.typeMismatch(IdentityType.Bool, rightType);

			this.program.addPop( Program.unlinkedReg("ebx") );
			this.program.addAnd( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
			this.program.addLabel( shortCircuitBranch );
		}

		return leftType;
	}

	doOr(){
		let leftType=this.doAnd();

		while (this.isNotEnd() && this.isOrOp()){
			if (this.typesDontMatch(IdentityType.Bool, leftType)) this.typeMismatch(IdentityType.Bool, leftType);

			let shortCircuitBranch=this.newBranch();
			this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true) );
			this.program.addJE( shortCircuitBranch );

			this.program.addPush( Program.unlinkedReg("eax") );
			
			this.match(TokenType.Or);

			let rightType=this.doAnd();
			if (this.typesDontMatch(IdentityType.Bool, rightType)) this.typeMismatch(IdentityType.Bool, rightType);

			this.program.addPop( Program.unlinkedReg("ebx") );
			this.program.addOr( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
			this.program.addLabel( shortCircuitBranch );
		}

		return leftType;
	}

	doExpression(){
		let leftType=this.doOr();
		let returnType=null;

		while (this.isNotEnd() && this.isTernaryOp()){
			if (this.typesDontMatch(IdentityType.Bool, leftType)) this.typeMismatch(IdentityType.Bool, leftType);

			
			this.match(TokenType.Question);

			let falseBranch=this.newBranch();
			let doneBranch=this.newBranch();
			this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true) );
			this.program.addJNE( falseBranch );

			let trueType=this.doExpression();

			if (returnType && this.typesDontMatch(returnType, trueType)) this.throwError("expected chained ternary operators to evaluate to same type");
			if (!returnType) returnType=trueType;

			this.match(TokenType.Colon);

			this.program.addJmp( doneBranch );
			this.program.addLabel( falseBranch );

			let falseType=this.doExpression();

			if (this.typesDontMatch(trueType, falseType))  this.throwError("expected ternary true/false branches to evaluate to same type");

			this.program.addLabel( doneBranch );
		}

		if (returnType){
			return returnType;
		}else{
			return leftType;
		}
	}

	doIf(breakToBranch, returnToBranch, returnType){
		const elseLabel = this.newBranch();
		
		this.match(TokenType.If);

		this.match(TokenType.LeftParen);
		let type=this.doExpression();
		if (type!==IdentityType.Bool){
			this.program.addToBool( Program.unlinkedReg("eax") );
		}

		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJE( elseLabel );
		this.match(TokenType.RightParen);

		this.doBlock(breakToBranch, returnToBranch, false, true, false, returnType);

		if (this.isNotEnd() && this.token.type === TokenType.Else) {
			const endLabel = this.newBranch();
			this.program.addJmp( endLabel );
			this.program.addLabel( elseLabel );

			this.match(TokenType.Else);
			
			this.doBlock(breakToBranch, returnToBranch, false, true, false, returnType);
			
			this.program.addLabel( endLabel );
		}else{
			this.program.addLabel( elseLabel );
		}

		this.program.addCodeLine(null);
	}

	doWhile(returnToBranch, returnType){
		const loopLabel = this.newBranch();
		const endLabel = this.newBranch();
		

		this.match(TokenType.While);

		this.program.addLabel( loopLabel );

		this.match(TokenType.LeftParen);
		let type=this.doExpression();
		if (type!==IdentityType.Bool){
			this.program.addToBool( Program.unlinkedReg("eax") );
		}
		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJE( endLabel );
		this.match(TokenType.RightParen);
		
		this.doBlock(endLabel, returnToBranch, false, true, false, returnType);
		
		this.program.addJmp( loopLabel );
		this.program.addLabel( endLabel );
		this.program.addCodeLine(null);
	}

	doFor(returnToBranch, returnType){
		const compareLabel = this.newBranch();
		const incLabel = this.newBranch();
		const blockLabel = this.newBranch();
		const endLabel = this.newBranch();


		this.pushScope();

		this.match(TokenType.For);//								for
		this.match(TokenType.LeftParen);//							(

		if (this.token?.type!==TokenType.LineDelim){//				[allocate || init]
			this.doAssignOrDeclare(true);
		}else{
			this.match(TokenType.LineDelim);//						;
		}

		this.program.addLabel( compareLabel );

		if (this.token?.type!==TokenType.LineDelim){//				[expression]
			let type=this.doExpression();
			if (type!==IdentityType.Bool){
				this.program.addToBool( Program.unlinkedReg("eax") );
			}
			this.program.addTest( Program.unlinkedReg("eax") );
			this.program.addJE( endLabel );
		}
		
		this.program.addJmp( blockLabel );
		this.program.addLabel( incLabel );

		this.match(TokenType.LineDelim);//							;

		if (this.token?.type!==TokenType.RightParen){//				[assignment] 
			this.doAssignment(false);
		}

		this.program.addJmp( compareLabel );

		this.match(TokenType.RightParen);//							)

		this.program.addLabel( blockLabel );

		this.doBlock(endLabel, returnToBranch, false, true, false, returnType);//{ block }

		this.program.addJmp( incLabel );
		this.program.addLabel( endLabel );

		this.popScope();
		this.program.addCodeLine(null);
	}

	doLoop(returnToBranch, returnType){
		const loopLabel = this.newBranch();
		const endLabel = this.newBranch();

		this.program.addLabel( loopLabel );

		this.match(TokenType.Loop);

		this.doBlock(endLabel, returnToBranch, false, true, false, returnType);//{ block }
		
		this.match(TokenType.While);
		this.match(TokenType.LeftParen);

		let type=this.doExpression();
		if (type!==IdentityType.Bool){
			this.program.addToBool( Program.unlinkedReg("eax") );
		}
		
		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJNE( loopLabel );
		this.program.addLabel( endLabel );

		this.match(TokenType.RightParen);
	}

	doBreak(breakToBranch){
		this.match(TokenType.Break);
		if (breakToBranch===null || breakToBranch===undefined) this.throwError("no loop to break from");
		this.program.addJmp( breakToBranch );

		this.match(TokenType.LineDelim);
	}

	doExit(){
		this.match(TokenType.Exit);
		if (this.token?.type !== TokenType.LineDelim){
			this.doExpression();
			this.program.addExit( Program.unlinkedReg("eax") );
		}else{
			this.program.addExit( Program.unlinkedNull() );
		}
		this.match(TokenType.LineDelim);
	}
	
	doAssignOrDeclare(cantBeFunction=false){
		switch (this.token.type){
			case TokenType.Bool:
			case TokenType.Double:
			case TokenType.String:
				 this.doDeclare(cantBeFunction);
				 break;
			default:
				this.doAssignment(true); 
				break;
		}
	}

	doDeclare(cantBeFunction=false){
		let declareType=null;
		switch (this.token?.type){
			case TokenType.Double:
				declareType=IdentityType.Double;
				break;
			case TokenType.Bool:
				declareType=IdentityType.Bool;
				break;
			case TokenType.String:
				declareType=IdentityType.String;
				break;
			default:
				this.throwError("unknown data type in declaration");
		}
		this.match(this.token.type);
		
		let isFirstOne=true;

		do {
			let varName = this.token?.value;
			this.match(TokenType.Ident);

			if (cantBeFunction===false && isFirstOne && this.token?.type===TokenType.LeftParen){
				this.doFunction(varName, declareType);
				return;
			}else{
				let identObj=this.addVar(varName, declareType);
				let unlinkedVar=Program.unlinkedVariable(declareType, identObj.scope, identObj.index, varName);
				switch (declareType){
					case IdentityType.Double:
						this.program.addDouble( unlinkedVar );
						break;
					case IdentityType.Bool:
						this.program.addBool( unlinkedVar );
						break;
					case IdentityType.String:
						this.program.addString( unlinkedVar );
						break;
					default:
						this.throwError("unknown data type in declaration");
				}
				if (this.token?.type===TokenType.Assignment){
					this.match(TokenType.Assignment);
					let expType=this.doExpression();
					if (this.typesDontMatch(expType,declareType)) this.typeMismatch(declareType, expType);
					this.program.addMov( unlinkedVar, Program.unlinkedReg("eax") );
				}
			}
			if (this.token?.type===TokenType.Comma) this.match(TokenType.Comma);

			isFirstOne=false;
		} while (this.isNotEnd() && this.token.type!==TokenType.LineDelim)
		this.match(TokenType.LineDelim);
	}


	doFunction(name, type){
		const returnToBranch=this.newBranch();
		const skipFuncBranch = this.newBranch();
		const funcBlockBranch = this.newBranch();

		this.program.addJmp( skipFuncBranch );

		this.pushAllocScope();
		const funcAddress=this.program.addLabel( funcBlockBranch );

		let paramTypes=[];
		let paramIdents=[];
		let paramObjs=[];

		this.match(TokenType.LeftParen);
		while (this.isNotEnd() && this.token.type!==TokenType.RightParen){
			switch (this.token.type){
				case TokenType.Double:
					paramTypes.push(IdentityType.Double);
					break;
				case TokenType.Bool:
					paramTypes.push(IdentityType.Bool);
					break;
				case TokenType.String:
					paramTypes.push(IdentityType.String);
					break;
				default:
					this.throwError("unexpected token in parameter list "+this.token.type.toString());
			}
			this.match(this.token.type);

			paramIdents.push(this.token?.value);
			this.match(TokenType.Ident);
			
			if (this.token?.type === TokenType.Comma){
				this.match(TokenType.Comma);
				if (this.token?.type===TokenType.RightParen) this.throwError("expected another parameter, but got a )");
			}
		}
		this.match(TokenType.RightParen);
		
		let identObj = this.addFunction(name, type, funcBlockBranch, paramTypes);
		if (!identObj) this.throwError("failed to add function '"+name+"' to ident list");

		this.pushScope();
		for (let i=0;i<paramIdents.length;i++){
			let obj=this.addVar(paramIdents[i], paramTypes[i]);
			if (!obj) this.throwError("attempted to push null param to list on function '"+name+"'")
			paramObjs.push(obj);
		}

		this.doBlock(null, returnToBranch, true, true, true, type);

		this.popScope();
		this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNull() );

		this.program.addLabel( returnToBranch );
		this.program.addPopScope( this.allocScopeIndex );
		this.program.addRet();

		let funcPreamble=[];
		funcPreamble.push(this.program.addPushScope( this.allocScopeIndex, this.allocScope[this.allocScopeIndex], true ));

		for (let i=paramObjs.length-1;i>=0;i--){
			let unlinkedParam=Program.unlinkedVariable(paramObjs[i].type, paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name);
			switch (paramObjs[i].type){
			case IdentityType.Bool:
				funcPreamble.push(this.program.addBool( unlinkedParam, true ));
				break;
			case IdentityType.Double:
				funcPreamble.push(this.program.addDouble( unlinkedParam, true ));
				break;
			case IdentityType.String:
				funcPreamble.push(this.program.addString( unlinkedParam, true ));
				break;
			default:
				this.throwError("unexpected type in parameter list allocation "+paramTypes[i].toString());
			}
			funcPreamble.push(this.program.addPop( unlinkedParam, true ));
		}

		this.program.code.splice(funcAddress+1,0,...funcPreamble);


		this.popAllocScope();
		this.program.addLabel( skipFuncBranch );
		this.program.addCodeLine(null);
	}

	doReturn(returnToBranch, returnType){
		this.match(TokenType.Return);

		if (this.token?.type!==TokenType.LineDelim){
			let expressionType=this.doExpression();
			if (this.typesDontMatch(expressionType, returnType)) this.typeMismatch(returnType, expressionType);
		}else{
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNull() );
		}

		this.program.addJmp( returnToBranch );
		this.match(TokenType.LineDelim);
	}
	
	doAssignment(wantsDelim=true){
		let varName=this.token.value;

		this.match(TokenType.Ident);
		let identObj = this.getIdentity(varName);
		if (!identObj) this.throwError("tried to assign to undefined '"+varName+"'");

		this.match(TokenType.Assignment);

		let expressionType=this.doExpression();
		if (this.typesDontMatch(expressionType, identObj.type)) this.typeMismatch(identObj.type, expressionType);

		this.program.addMov( Program.unlinkedVariable(identObj.type, identObj.scope, identObj.index, varName), Program.unlinkedReg("eax") );

		if (wantsDelim===true) this.match(TokenType.LineDelim);
	}

	doIdentStatement(){
		let identName = this.token.value;

		let identObj = this.getIdentity(identName);
		if (!identObj) this.throwError("trying to operate on undefined '"+identName+"'");

		switch (identObj.type){
			case IdentityType.Double:
			case IdentityType.Bool:
			case IdentityType.String:
				this.doAssignment();
				break;
			case IdentityType.Function:
				this.doFuncCall();
				this.match(TokenType.LineDelim);
				break;
			default:
				this.throwError("Invalid identity type "+identName+":"+this.symbolToString(identObj.type));
		}
	}

	doStatement(breakToBranch, returnToBranch, returnType){
		switch (this.token.type){
			case TokenType.If:
				this.doIf(breakToBranch, returnToBranch, returnType);
				break;
			case TokenType.While:
				this.doWhile(returnToBranch, returnType);
				break;
			case TokenType.For:
				this.doFor(returnToBranch, returnType);
				break;
			case TokenType.Loop:
				this.doLoop(returnToBranch, returnType);
				break;
			case TokenType.Break:
				this.doBreak(breakToBranch);
				break;

			case TokenType.Exit:
				this.doExit();
				break;

			case TokenType.Return:
				if (returnToBranch!=null && returnToBranch!=undefined){
					this.doReturn(returnToBranch, returnType);
				}else{
					this.throwError("not allowed to return outside of a function");
				}
				break;

			case TokenType.Double:
			case TokenType.String:
			case TokenType.Bool:
				this.doDeclare();
				break;

			case TokenType.Ident:
				this.doIdentStatement();
				break;
				
			case TokenType.LeftCurly:
				this.doBlock(breakToBranch, returnToBranch, true, false, false, returnType);
				break;

			case TokenType.LineDelim:
				this.match(TokenType.LineDelim);
				break;

			default:
				this.throwError("Unexpected token in block, "+this.symbolToString(this.token.type));
		}
	}

	doBlock(breakToBranch, returnToBranch, ifNeedsCurlys, couldBeStatment, dontPushScope=false, returnType=null){
		if (!dontPushScope) this.pushScope();


		let hasCurlys = false;

		if (!ifNeedsCurlys && !this.isNotEnd()) return;//End of the program, and we're not expecting a closing '}'

		if (ifNeedsCurlys || this.token?.type===TokenType.LeftCurly){
			this.match(TokenType.LeftCurly);
			hasCurlys=true;
		}  

		while (this.isNotEnd()){
			if (this.token.type===TokenType.RightCurly){
				if (hasCurlys){
					this.match(TokenType.RightCurly);
					hasCurlys=false;
					break;
				} 
				this.throwError("Unexpected token in block, "+this.symbolToString(this.token.type));
			}
			this.doStatement(breakToBranch, returnToBranch, returnType);

			if (couldBeStatment && hasCurlys===false) break;
		}

		if (hasCurlys) this.throwError("Got to the end of the file without getting an expected "+this.symbolToString(TokenType.RightCurly));

		if (!dontPushScope) this.popScope();
	}
}


const OpCode = {
	label:		Symbol("label"),
	jmp:		Symbol("jmp"),

	cmp:		Symbol("cmp"),
	test:		Symbol("test"),
	
	je:			Symbol("je"),
	jne:		Symbol("jne"),
	ja:			Symbol("ja"),
	jae:		Symbol("jae"),
	jb:			Symbol("jb"),
	jbe:		Symbol("jbe"),

	se:			Symbol("se"),
	sne:		Symbol("sne"),
	sa:			Symbol("sa"),
	sae:		Symbol("sae"),
	sb:			Symbol("sb"),
	sbe:		Symbol("sbe"),

	exit:		Symbol("exit"),
	ceil:		Symbol("ceil"),
	floor:		Symbol("floor"),
	abs:		Symbol("abs"),
	min:		Symbol("min"),
	max:		Symbol("max"),
	clamp:		Symbol("clamp"),
	excall:		Symbol("excall"),
	call:		Symbol("call"),
	ret:		Symbol("ret"),
	todouble:	Symbol("todouble"),
	tobool:		Symbol("tobool"),
	len:		Symbol("len"),
	lcase:		Symbol("lcase"),
	ucase:		Symbol("ucase"),
	trim:		Symbol("trim"),
	substr:		Symbol("substr"),
	tostring:	Symbol("tostring"),
	concat:		Symbol("concat"),
	double:		Symbol("double"),
	bool:		Symbol("bool"),
	string:		Symbol("string"),
	pushscope:	Symbol("pushscope"),
	popscope:	Symbol("popscope"),
	push:		Symbol("push"),
	pop:		Symbol("pop"),
	codeline:	Symbol("codeLine"),
	mov:		Symbol("mov"),
	and:		Symbol("and"),
	or:			Symbol("or"),
	add:		Symbol("add"),
	sub:		Symbol("sub"),
	mul:		Symbol("mul"),
	div:		Symbol("div"),
	mod:		Symbol("mod"),
	exponent:	Symbol("exponent"),
	not:		Symbol("not"),
	neg:		Symbol("neg"),
	scopedepth:	Symbol("scopedepth")
}

const UnlinkedType={
	register:	Symbol("register"),
	variable:	Symbol("variable"),
	literal:	Symbol("literal"),
	null:	Symbol("null"),
}



class Program {
	static regSymbols = {eax: Symbol("eax"), ebx: Symbol("ebx"), ecx: Symbol("ecx")};
	static unlinkedReg(registerName){
		switch (registerName.trim().toLowerCase()){
				case "eax":	return {type: UnlinkedType.register, register: Program.regSymbols.eax, debugName:"eax"}
				case "ebx":	return {type: UnlinkedType.register, register: Program.regSymbols.ebx, debugName:"ebx"}
				case "ecx":	return {type: UnlinkedType.register, register: Program.regSymbols.ecx, debugName:"ecx"}
		}
		return null;
	}
	static unlinkedVariable(type, scope, index, debugName=null)	{ return {type: UnlinkedType.variable,	identType: type,	scope, index, debugName}; }
	static unlinkedLiteral(type, value)							{ return {type: UnlinkedType.literal,	literalType: type,	value}; }
	static unlinkedNull()										{ return {type: UnlinkedType.null}; }

	static CodeState = {
		BUILDING:	Symbol("Building"),
		OPTIMIZED:	Symbol("Optimized"),
		READY:		Symbol("Ready"),
	}

	constructor(){
		this.errorObj=null;
		this.code=[];

		this.codeState=Program.CodeState.BUILDING;

		this.debugCodeLine=1;

		this.eax=new RegisterObj("eax");
		this.ebx=new RegisterObj("ebx");
		this.ecx=new RegisterObj("ecx");
		this.true=new BoolObj("true", true, true);
		this.false=new BoolObj("false", false, true);
		this.zero=new NumberObj("zero",0,true);
		this.null=new NullObj();
	}


	unlinkedsEqual(obj, obj1){
		if (obj.type!==obj1.type) return false;

		if (obj.type===UnlinkedType.register){
			if (obj.register!==obj1.register) return false;
			return true;
		} else if (obj.type=== UnlinkedType.variable){
			if (obj.scope!==obj1.scope || obj.index!==obj1.index) return false;
			return true;
		} else if (obj.type===UnlinkedType.literal){
			if (obj.value!==obj1.value) return false;
			return true;
		}

		return true;//must be a null literal			
	}

	isBOnAOp(opcode){
		switch (opcode.type){
			case OpCode.tostring:
			case OpCode.concat:
			case OpCode.min:
			case OpCode.max:
			case OpCode.and:
			case OpCode.or:
			case OpCode.add:
			case OpCode.sub:
			case OpCode.mul:
			case OpCode.div:
			case OpCode.mod:
			case OpCode.exponent: 
				return true;
		}
		return false;
	}

	isSetOpCode(opCode){
		if ([OpCode.se, OpCode.sne, OpCode.sa, OpCode.sae, OpCode.sb, OpCode.sbe].includes(opCode.type)){
			return true;
		}
		return false;
	}

	optimizeSetToJmp(setOpCode, jmpOpCode){
		if (jmpOpCode.type!==OpCode.je && jmpOpCode.type!==OpCode.jne) return null;
		const opp = jmpOpCode.type===OpCode.je;
		let jmpOp = {type: null, id: jmpOpCode.id};

		switch (setOpCode.type){
		case OpCode.se:
			jmpOp.type = opp ? OpCode.jne : OpCode.je;
			break;
		case OpCode.sne:
			jmpOp.type = opp ? OpCode.je : OpCode.jne;
			break;
		case OpCode.sa:
			jmpOp.type = opp ? OpCode.jbe : OpCode.ja;
			break;
		case OpCode.sae:
			jmpOp.type = opp ? OpCode.jb : OpCode.jae;
			break;
		case OpCode.sb:
			jmpOp.type = opp ? OpCode.jae : OpCode.jb;
			break;
		case OpCode.sbe:
			jmpOp.type = opp ? OpCode.ja : OpCode.jbe;
			break;
		default:
			return null;
		}
		return jmpOp;
	}

	optimize(){
		for (let i=0;i<this.code.length;i++){//Remove codelines, only good for debuggings
			if (this.code[i].type===OpCode.codeline){
				this.code.splice(i, 1);
				i=i-1;
			}
		}

		let stillOptimizing=true;
		while (stillOptimizing){
			stillOptimizing=false;
			for (let i=0;i<this.code.length-1;i++){
				let cur=this.code[i];
				let nxt=this.code[i+1];
				let nxtnxt=i<this.code.length-2?this.code[i+2]:null;
				let nxtnxtnxt=i<this.code.length-3?this.code[i+3]:null;

				switch (cur.type){
					case OpCode.cmp:
						if (this.isSetOpCode(nxt) && nxtnxt.type===OpCode.test && (nxtnxtnxt.type===OpCode.je || nxtnxtnxt.type===OpCode.jne)){
							if (nxt.obj0.type===UnlinkedType.register && this.unlinkedsEqual(nxt.obj0, nxtnxt.obj0)){
								let newJmpOp = this.optimizeSetToJmp(nxt, nxtnxtnxt);
								if (newJmpOp){
									this.code[i+1]=newJmpOp;
									this.code.splice(i+2,2);
									i--;
									stillOptimizing=true;
								}
							}
						}
						break;
					case OpCode.push:
						if (nxt.type===OpCode.mov && nxtnxt?.type===OpCode.pop){
							if (!this.unlinkedsEqual(cur.obj0, nxt.obj0)){
								this.code[i+2]={type: OpCode.mov, obj0: nxtnxt.obj0, obj1: cur.obj0};
								this.code.splice(i,1);
								i--;
								stillOptimizing=true;
							}
						}
						break;
					case OpCode.mov:
						if (this.unlinkedsEqual(cur.obj0, cur.obj1)){ 	// mov(X, X) => nothing
							this.code.splice(i,1);
							stillOptimizing=true;
						}else if (nxt.type===OpCode.neg && cur.obj0.type===UnlinkedType.register && this.unlinkedsEqual(cur?.obj0, nxt?.obj0) && cur.obj1.literalType===IdentityType.Double){
							cur.obj1.value=0-cur.obj1.value;
							this.code.splice(i+1,1);
							i--;
							stillOptimizing=true;
						}else if (nxt.type===OpCode.add && nxtnxt?.type===OpCode.mov &&// MOV ADD MOV => ADD
							nxt.obj0.type===UnlinkedType.register && nxt.obj1.type===UnlinkedType.register &&
							this.unlinkedsEqual(nxt.obj0, nxtnxt.obj1) && (this.unlinkedsEqual(cur.obj0, nxt.obj1) || this.unlinkedsEqual(cur.obj0, nxt.obj0))){

							if (this.unlinkedsEqual(cur.obj1, nxtnxt.obj0)){
								if (this.unlinkedsEqual(cur.obj0, nxt.obj1)){
									nxt.obj1=nxt.obj0;
								}
								nxt.obj0=nxtnxt.obj0;
								this.code.splice(i,1);
								this.code.splice(i+1,1);
								i--;
								stillOptimizing=true;
							}
						}else if (nxt.type===OpCode.mov && this.isBOnAOp(nxtnxt) && cur.obj0.type===UnlinkedType.register
										&& this.unlinkedsEqual(cur.obj0, nxtnxt.obj1) && this.unlinkedsEqual(nxt.obj0, nxtnxt.obj0)
										&& !this.unlinkedsEqual(cur.obj0, nxt.obj1) && !this.unlinkedsEqual(cur.obj0, nxt.obj0)){
							
							nxtnxt.obj1=cur.obj1;
							this.code.splice(i,1);
							i--;
							stillOptimizing=true;
						}else if (this.isBOnAOp(nxt) && nxtnxt?.type===OpCode.mov && // MOV BONA MOV => BONA
										nxt.obj0.type===UnlinkedType.register && nxt.obj1.type===UnlinkedType.register &&
										this.unlinkedsEqual(cur.obj0, nxt.obj0) && this.unlinkedsEqual(cur.obj0, nxtnxt.obj1)){

							if (this.unlinkedsEqual(cur.obj1, nxtnxt.obj0)){
								nxt.obj0=cur.obj1;
								this.code.splice(i,1);
								this.code.splice(i+1,1);
								i--;
								stillOptimizing=true;
							}
						// } else if (nxt.type===OpCode.cmp && cur.obj0.type==UnlinkedType.register && (this.unlinkedsEqual(cur.obj0, nxt.obj0) || this.unlinkedsEqual(cur.obj0, nxt.obj1))){// mov(eax, X) + cmp(eax, Y) => cmp(X, Y)
						// 	if (this.unlinkedsEqual(cur.obj0, nxt.obj0)){ 
						// 		nxt.obj0=cur.obj1;
						// 		this.code.splice(i,1);
						// 		i--;
						// 		stillOptimizing=true;
						// 	}else if (this.unlinkedsEqual(cur.obj0, nxt.obj1)){	// mov(eax, X) + cmp(Y, eax) => cmp(Y, X)
						// 		nxt.obj1=cur.obj1;
						// 		this.code.splice(i,1);
						// 		i--;
						// 		stillOptimizing=true;
						// 	}
						} else if (this.isBOnAOp(nxt) && cur.obj0.type===UnlinkedType.register && cur.obj0.type===UnlinkedType.register){// mov(eax, X) + add(Y, eax) => add(Y, X)
							if (this.unlinkedsEqual(cur.obj0, nxt.obj1)){
								nxt.obj1=cur.obj1;					
								this.code.splice(i,1);
								i--;
								stillOptimizing=true;
							}
						} else if (nxt.type===OpCode.push && cur.obj0.type===UnlinkedType.register && cur.obj1.type!==UnlinkedType.register){
							if (nxt.obj0.register===cur.obj0.register){
								nxt.obj0=cur.obj1;
								this.code.splice(i,1);
								i--;
								stillOptimizing=true;
							}
						}else if (nxt.type===OpCode.mov && cur.obj0.type===UnlinkedType.register && this.unlinkedsEqual(cur.obj0, nxt.obj1) && cur.obj1!==UnlinkedType.register){
							nxt.obj1=cur.obj1;
							this.code.splice(i,1);
							i--;
							stillOptimizing=true;
						}
						break;
				}
			}			
		}


		this.codeState=Program.CodeState.OPTIMIZED;
	}

	link(optimize){
		if (this.codeState===Program.CodeState.READY) return null;
		if (this.codeState===Program.CodeState.BUILDING && optimize){
			this.optimize();
			if (this.codeState!==Program.CodeState.OPTIMIZED) this.otherError("error optimizing");
		}

		const labelMap = new Map();
		for (let i=0;i<this.code.length;i++){//Make a map of all the labels and there indexes
			if (this.code[i].type===OpCode.label){
				if (labelMap.has(this.code[i].id)){
					this.otherError("error linking, "+this.code[i].id+" was already defined")
				}
				labelMap.set(this.code[i].id, i);

				this.code.splice(i,1);
				i--;
			}
		}

		for (let i=0;i<this.code.length;i++){//Now go through and update the id's of all the codes that can/will jump
			switch (this.code[i].type){
				case OpCode.jmp:
				case OpCode.je:
				case OpCode.jne:
				case OpCode.ja:
				case OpCode.jae:
				case OpCode.jb:
				case OpCode.jbe:
				case OpCode.call:
					this.code[i].id=labelMap.get(this.code[i].id);
					break;
			}
		}
		this.codeState=Program.CodeState.READY;
	}

	linkedObject(obj, scopes){
		switch (obj.type){
			case UnlinkedType.register:
				switch (obj.register){
					case Program.regSymbols.eax:
						return this.eax;
					case Program.regSymbols.ebx:
						return this.ebx;
					case Program.regSymbols.ecx:
						return this.ecx;
				}
				this.executionError("unknown register");

			case UnlinkedType.variable:
				return scopes[obj.scope][scopes[obj.scope].length-1][obj.index];

			case UnlinkedType.literal:
				switch (obj.literalType){
					case IdentityType.Bool:
						if (obj.value===true) return this.true;
						return this.false;
					case IdentityType.Double:
						return new NumberObj(null, obj.value, true);
					case IdentityType.String:
						return new StringObj(null, obj.value, true);
					default:
						this.executionError("unknown unlinked literal type");
				}

			case UnlinkedType.null:
				return this.null;
		}		
		this.executionError("unknown unlinked object type");
	}

	otherError(message){
		throw Error("Pre-execution error: "+message);
	}

	executionError(message){
		throw Error(message);
	}

	execute(externals){
		let eip = 0;
		let trace=[];
		try {
			const link = (obj) => this.linkedObject(obj, scopes);

			if (this.codeState!==Program.CodeState.READY) this.executionError("tried executing on unlinked code")
		
			this.debugCodeLine=1;

			let notDone=true;

			let scopes=[[externals]];

			let callStack=[];
			let stack=[];

			let flag_e=false;
			let flag_a=false;
			let flag_b=false;
		
			while (notDone && eip<this.code.length){
				let opcode=this.code[eip];
				let obj0=null;
				let obj1=null;
				let obj2=null;
				switch (opcode.type){
					case OpCode.label:
						break;

					case OpCode.excall:
						this.eax.setTo(externals[opcode.id]( () => stack.pop() ));
						break;
					case OpCode.call:
						trace.push({debugName: opcode.debugName, address: opcode.id});
						callStack.push(eip+1);
						eip=opcode.id;
						continue;
					case OpCode.ret:
						trace.pop();
						eip=callStack.pop();
						continue;

					case OpCode.exit:
						return (link(opcode.obj0).getCopy(true));

					case OpCode.jmp:
						eip=opcode.id;
						continue;
					case OpCode.test:
						flag_e=!link(opcode.obj0).value;
						break;
					case OpCode.cmp:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						flag_e=obj0.eqaulTo(obj1);
						if (((obj0.objType===OpObjType.register && obj0._curValType===OpObjType.num) || obj0.objType===OpObjType.num) &&
							((obj1.objType===OpObjType.register && obj1._curValType===OpObjType.num) || obj1.objType===OpObjType.num)){
								
							flag_a=obj0.greaterThan(obj1);
							flag_b=obj0.smallerThan(obj1);
						}else{
							flag_a=false;
							flag_b=false;
						}
						break;

					case OpCode.je:
						if (flag_e){
							eip=opcode.id;
							continue;
						}
						break;
					case OpCode.jne:
						if (!flag_e){
							eip=opcode.id;
							continue;
						}
						break;
					case OpCode.ja:
						if (flag_a){
							eip=opcode.id;
							continue;
						}
						break;
					case OpCode.jae:
						if (flag_a || flag_e){
							eip=opcode.id;
							continue;
						}
						break;
					case OpCode.jb:
						if (flag_b){
							eip=opcode.id;
							continue;
						}
						break;
					case OpCode.jbe:
						if (flag_b || flag_e){
							eip=opcode.id;
							continue;
						}
						break;

					case OpCode.se:
						link(opcode.obj0).setTo(flag_e?this.true:this.false)
						break;
					case OpCode.sne:
						link(opcode.obj0).setTo(!flag_e?this.true:this.false)
						break;
					case OpCode.sa:
						link(opcode.obj0).setTo(flag_a?this.true:this.false)
						break;
					case OpCode.sae:
						link(opcode.obj0).setTo(flag_a||flag_e?this.true:this.false)
						break;
					case OpCode.sb:
						link(opcode.obj0).setTo(flag_b?this.true:this.false)
						break;
					case OpCode.sbe:
						link(opcode.obj0).setTo(flag_b||flag_e?this.true:this.false)
						break;
						
					case OpCode.ceil:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to do ceil on null value");
						obj0.setTo(new NumberObj(null, Math.ceil(obj0.value), true));
						break;
					case OpCode.floor:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to do floor on null value");
						obj0.setTo(new NumberObj(null, Math.floor(obj0.value), true));
						break;
					case OpCode.abs:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to do abs on null value");
						obj0.setTo(new NumberObj(null, Math.abs(obj0.value), true));
						break;
					case OpCode.min:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) this.executionError("tried to do min on null value");	
						if (obj1.value===null) this.executionError("tried to do min on null value");	
						obj0.setTo( new NumberObj(null, Math.min(obj0.value, obj1.value), true) );
						break;
					case OpCode.max:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) this.executionError("tried to do max on null value");	
						if (obj1.value===null) this.executionError("tried to do max on null value");	
						obj0.setTo( new NumberObj(null, Math.max(obj0.value, obj1.value), true) );
						break;
					case OpCode.clamp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) this.executionError("tried to do clamp on null value");
						if (obj1.value===null) this.executionError("tried to do clamp on null value");
						if (obj2.value===null) this.executionError("tried to do clamp on null value");
						obj0.setTo( new NumberObj(null, Math.min(Math.max(obj0.value, obj1.value), obj2.value), true) );
						break;
					case OpCode.todouble:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to convert null to double");	
						obj0.setTo(new NumberObj(null, Number(obj0.value), true));
						break;
					case OpCode.tobool:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to convert null to bool");
						obj0.setTo(new BoolObj(null, Boolean(obj0.value), true));
						break;
					case OpCode.len:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to get length of null string");
						obj0.setTo(new NumberObj(null, obj0.value.length, true));
						break;

					case OpCode.lcase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to set null string to lower case");
						obj0.setTo( new StringObj(null, obj0.value.toLowerCase(), true) );
						break;
					case OpCode.ucase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to set null string to upper case");
						obj0.setTo( new StringObj(null, obj0.value.toUpperCase(), true) );
						break;
					case OpCode.trim:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to trim null string");
						obj0.setTo( new StringObj(null, obj0.value.trim(), true) );
						break;
					case OpCode.substr:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) this.executionError("tried to get substring of null string");
						if (obj1.value===null) this.executionError("tried to get substring with null index");
						if (obj2.value===null) this.executionError("tried to get substring with null length");
						obj0.setTo( new StringObj(null, obj0.value.substr(obj1.value, obj2.value), true) );
						break;
					case OpCode.tostring:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) this.executionError("tried to convert null to string");
						let val=obj0.value;
						if (obj1.value!==null){
							if (obj1.value>=0) val=Number(val).toFixed(obj1.value);
							if (obj1.value<0){
								const multiplier=10**Math.abs(obj1.value);
								val=String(Math.round(val/multiplier)*multiplier);
							}
						}else{
							val=String(val);
						}
						obj0.setTo( new StringObj(null, val, true) );
						break;
					case OpCode.concat:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) this.executionError("tried to concat null to string");
						if (obj1.value===null) this.executionError("tried to concat string to null");
						obj0.setTo( new StringObj(null, obj0.value+obj1.value, true) );
						break;
					case OpCode.double:
						scopes[opcode.obj0.scope][scopes[opcode.obj0.scope].length-1][opcode.obj0.index]=new NumberObj(null, null, false);
						break;
					case OpCode.bool:
						scopes[opcode.obj0.scope][scopes[opcode.obj0.scope].length-1][opcode.obj0.index]=new BoolObj(null, null, false);
						break;
					case OpCode.string:
						scopes[opcode.obj0.scope][scopes[opcode.obj0.scope].length-1][opcode.obj0.index]=new StringObj(null, null, false);
						break;
					case OpCode.pushscope:
						scopes[opcode.scope].push(new Array(opcode.size));
						break;
					case OpCode.popscope:
						scopes[opcode.scope].pop();
						break;
					case OpCode.push:
						stack.push(link(opcode.obj0).getCopy());
						break;
					case OpCode.pop:
						link(opcode.obj0).setTo(stack.pop());
						break;
					case OpCode.codeline:
						//essentially a nop
						//used for debugging, shows when there was a line break in the original code
						if (opcode.code!==null){
							this.debugCodeLine++;
						}
						break;
					case OpCode.mov:
						link(opcode.obj0).setTo(link(opcode.obj1));
						break;
					case OpCode.and:
						obj0=link(opcode.obj0);
						obj0.setTo( new BoolObj(null, obj0.value && link(opcode.obj1).value, true) );
						break;
					case OpCode.or:
						obj0=link(opcode.obj0);
						obj0.setTo( new BoolObj(null, obj0.value || link(opcode.obj1).value, true) );
						break;
					case OpCode.add:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to add null");
						obj0.setTo( new NumberObj(null, obj0.value + obj1.value, true) );
						break;
					case OpCode.sub:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to sub null");
						obj0.setTo( new NumberObj(null, obj0.value - obj1.value, true) );
						break;
					case OpCode.mul:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						obj0.setTo( new NumberObj(null, obj0.value * obj1.value, true) );
						break;
					case OpCode.div:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to div with a null value");
						
						if (Utils.isAboutEquals(obj1.value,0)){//divide by zero! set it to null
							obj0.setTo( this.null );
						}else{
							obj0.setTo( new NumberObj(null, obj0.value / obj1.value, true) );
						}
						break;
					case OpCode.mod:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to mod with a null value");

						if (Utils.isAboutEquals(obj1.value,0)){//divide by zero! set it to null
							obj0.setTo( this.null );
						}else{
							obj0.setTo( new NumberObj(null, obj0.value % obj1.value, true) );
						}
						break;
					case OpCode.exponent:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to do exponentiation with a null value");
						obj0.setTo( new NumberObj(null, obj0.value ** obj1.value, true) );
						break;
					case OpCode.not:
						obj0=link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to not a null value");
						obj0.setTo( new BoolObj(null, !obj0.value, true) );
						break;
					case OpCode.neg:
						obj0=link(opcode.obj0);
						if (obj0.value===null) this.executionError("tried to neg null value");
						obj0.setTo( new NumberObj(null, 0-obj0.value, true) );
						break;
					case OpCode.scopedepth:
						for (let i=0;i<opcode.size;i++){
							scopes.push([[]]);
						}
						break;
				}
				eip++;
			}

			return new BoolObj(null, true, true);
		} catch (error) {
			let callTraceMsg="\n";
			for (let callData of trace.reverse()){
				callTraceMsg+="\tat "+callData.debugName+" address: "+callData.address+"\n";
			}
			throw Error("Execution error at address "+eip+": "+error.message+"\n"+callTraceMsg);
		}
	}

	addRet			(dontInsert=false)						{ const op={type: OpCode.ret};return dontInsert?op:this.code.push( op )-1; }
	addLabel		(id,dontInsert=false)					{ const op={type: OpCode.label,		id: id};return dontInsert?op:this.code.push( op )-1; }
	addJmp			(id,dontInsert=false)					{ const op={type: OpCode.jmp,		id: id};return dontInsert?op:this.code.push( op )-1; }
	addJE			(id,dontInsert=false)					{ const op={type: OpCode.je,		id: id};return dontInsert?op:this.code.push( op )-1; }
	addJNE			(id,dontInsert=false)					{ const op={type: OpCode.jne,		id: id};return dontInsert?op:this.code.push( op )-1; }
	addScopeDepth	(size,dontInsert=false)					{ const op={type: OpCode.scopedepth,size: size};return dontInsert?op:this.code.push( op )-1; }
	addTest			(obj0,dontInsert=false)					{ const op={type: OpCode.test,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSE			(obj0,dontInsert=false)					{ const op={type: OpCode.se,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSNE			(obj0,dontInsert=false)					{ const op={type: OpCode.sne,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSA			(obj0,dontInsert=false)					{ const op={type: OpCode.sa,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSAE			(obj0,dontInsert=false)					{ const op={type: OpCode.sae,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSB			(obj0,dontInsert=false)					{ const op={type: OpCode.sb,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addSBE			(obj0,dontInsert=false)					{ const op={type: OpCode.sbe,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addExit			(obj0,dontInsert=false)					{ const op={type: OpCode.exit,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addCeil			(obj0,dontInsert=false)					{ const op={type: OpCode.ceil,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addFloor		(obj0,dontInsert=false)					{ const op={type: OpCode.floor,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addAbs			(obj0,dontInsert=false)					{ const op={type: OpCode.abs,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addToDouble		(obj0,dontInsert=false)					{ const op={type: OpCode.todouble,	obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addToBool		(obj0,dontInsert=false)					{ const op={type: OpCode.tobool,	obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addLen			(obj0,dontInsert=false)					{ const op={type: OpCode.len,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addLCase		(obj0,dontInsert=false)					{ const op={type: OpCode.lcase,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addUCase		(obj0,dontInsert=false)					{ const op={type: OpCode.ucase,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addTrim			(obj0,dontInsert=false)					{ const op={type: OpCode.trim,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addDouble		(obj0,dontInsert=false)					{ const op={type: OpCode.double,	obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addBool			(obj0,dontInsert=false)					{ const op={type: OpCode.bool,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addString		(obj0,dontInsert=false)					{ const op={type: OpCode.string,	obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addPush			(obj0,dontInsert=false)					{ const op={type: OpCode.push,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addPop			(obj0,dontInsert=false)					{ const op={type: OpCode.pop,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addNot			(obj0,dontInsert=false)					{ const op={type: OpCode.not,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addNeg			(obj0,dontInsert=false)					{ const op={type: OpCode.neg,		obj0: obj0};return dontInsert?op:this.code.push( op )-1; }
	addCodeLine		(code,dontInsert=false)					{ const op={type: OpCode.codeline,	code: code};return dontInsert?op:this.code.push( op )-1; }
	addPopScope		(scope,dontInsert=false)				{ const op={type: OpCode.popscope,	scope: scope};return dontInsert?op:this.code.push( op )-1; }
	addToString		(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.tostring,	obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addCmp			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.cmp,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addConcat		(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.concat,	obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addMin			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.min,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addMax			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.max,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addMov			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.mov,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addAnd			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.and,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addOr			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.or,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addAdd			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.add,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addSub			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.sub,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addMul			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.mul,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addDiv			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.div,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addMod			(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.mod,		obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addExponent		(obj0, obj1,dontInsert=false)			{ const op={type: OpCode.exponent,	obj0: obj0, obj1: obj1};return dontInsert?op:this.code.push( op )-1; }
	addPushScope	(scope, size,dontInsert=false)			{ const op={type: OpCode.pushscope,	scope: scope, size: size};return dontInsert?op:this.code.push( op )-1; }
	addCall			(id, debugName,dontInsert=false)		{ const op={type: OpCode.call,		id: id, debugName: debugName};return dontInsert?op:this.code.push( op )-1; }
	addExCall		(id, debugName,dontInsert=false)		{ const op={type: OpCode.excall,	id: id, debugName: debugName};return dontInsert?op:this.code.push( op )-1; }
	addSubStr		(obj0, obj1, obj2,dontInsert=false)		{ const op={type: OpCode.substr,	obj0: obj0, obj1: obj1, obj2: obj2};return dontInsert?op:this.code.push( op )-1; }
	addClamp		(obj0, obj1, obj2,dontInsert=false)		{ const op={type: OpCode.clamp,		obj0: obj0, obj1: obj1, obj2: obj2};return dontInsert?op:this.code.push( op )-1; }



	//debugger stuff
	//unlinkedObj to english
	linkToEnglish(obj){
		switch (obj.type){
			case UnlinkedType.register:
				return " "+obj.debugName;
			case UnlinkedType.variable:
				return " _"+obj.debugName;
			case UnlinkedType.literal:
				return obj.value.toString();
			case UnlinkedType.null:
				return "null";
		}		
		return null;										
	}

	getDebugOutput(onlyPrintOpCodes=false){
		let codeLine=0;
		const codeLength=this.code.reduce((prev, cur)=>(prev+(cur.type!==OpCode.codeline && cur.type!==OpCode.label)),0);
		let output=String("DISASSEMBLED VIEW - Length: "+codeLength+"\n");
		let asm="";
		for (let eip=0;eip<this.code.length;eip++){
			let opcode=this.code[eip];
			asm+=String(eip)+"\t\t";
			switch (opcode.type){
				case OpCode.label:
					asm+=String(opcode.id)+":";
					break;
				case OpCode.jmp:
					asm+="jmp "+opcode.id;
					break;

				case OpCode.je:
					asm+="je "+opcode.id;
					break;
				case OpCode.jne:
					asm+="jne "+opcode.id;
					break;
				case OpCode.ja:
					asm+="ja "+opcode.id;
					break;
				case OpCode.jae:
					asm+="jae "+opcode.id;
					break;
				case OpCode.jb:
					asm+="jb "+opcode.id;
					break;
				case OpCode.jbe:
					asm+="jbe "+opcode.id;
					break;

				case OpCode.test:
					asm+="test "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.cmp:
					asm+="cmp "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.se:
					asm+="se "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.sne:
					asm+="sne "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.sa:
					asm+="sa "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.sae:
					asm+="sae "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.sb:
					asm+="sb "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.sbe:
					asm+="sbe "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.exit:
					asm+="exit "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.ceil:
					asm+="ceil "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.floor:
					asm+="floor "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.abs:
					asm+="abs "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.min:
					asm+="min "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.max:
					asm+="max "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.clamp:
					asm+="clamp "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1)+", "+this.linkToEnglish(opcode.obj2);
					break;
				case OpCode.excall:
					asm+="excall "+opcode.id+"; "+opcode.debugName;
					break;
				case OpCode.call:
					asm+="call "+opcode.id+"; "+opcode.debugName;
					break;
				case OpCode.ret:
					asm+="ret";
					break;
				case OpCode.todouble:
					asm+="todouble "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.tobool:
					asm+="tobool "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.len:
					asm+="len "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.lcase:
					asm+="lcase "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.ucase:
					asm+="ucase "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.trim:
					asm+="trim "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.substr:
					asm+="substr "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1)+", "+this.linkToEnglish(opcode.obj2);
					break;
				case OpCode.tostring:
					asm+="tostring "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.concat:
					asm+="concat "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.pushscope:
					asm+="pushscope "+opcode.scope+", "+opcode.size;
					break;
				case OpCode.popscope:
					asm+="popscope "+opcode.scope;
					break;
				case OpCode.push:
					asm+="push "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.pop:
					asm+="pop "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.codeline:
					if (onlyPrintOpCodes) break;
					
					asm+="cl";
					if (opcode.code!==null){
						codeLine++;
						output+="\n-"+String(codeLine)+"-\t"+opcode.code.trim();
					}
					if (asm!=="") output+=asm.trimEnd();
					asm="";
					break;
				case OpCode.mov:
					asm+="mov "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.and:
					asm+="and "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.or:
					asm+="or "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.add:
					asm+="add "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.sub:
					asm+="sub "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.mul:
					asm+="mul "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.div:
					asm+="div "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.mod:
					asm+="mod "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.exponent:
					asm+="exp "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.not:
					asm+="not "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.neg:
					asm+="neg "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.scopedepth:
					asm+="scopedepth "+opcode.size;
					break;
				case OpCode.double:
					asm+="double "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.bool:
					asm+="bool "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.string:
					asm+="string "+this.linkToEnglish(opcode.obj0);
					break;
				default:
					asm+="UNKNOWN INSTRUCTION\n";
			}
			asm+="\n";
		}
		output+=asm;
		output+="END DISASSEMBLED VIEW - Length: "+codeLength;
		return output;
	}

}

class Interpreter {

	static funcDef(name, func, returnType, ...params){
		let builtDef={name, func, type: IdentityType.Function};

		builtDef.params=[];

		let type=returnType.toLowerCase().trim();
		switch (type){
			case "bool":
				builtDef.returnType=IdentityType.Bool;
				break;
			case "double":
				builtDef.returnType=IdentityType.Double;
				break;
			case "string":
				builtDef.returnType=IdentityType.String;
				break;
			default:
				throw Error("Invalid func return type: '"+returnType+"', it can be bool, double, or string.");
		}

		for (let i=0;i<params.length;i++){
			type=params[i].toLowerCase().trim();
			switch (type){
				case "bool":
					builtDef.params.push(IdentityType.Bool);
					break;
				case "double":
					builtDef.params.push(IdentityType.Double);
					break;
				case "string":
					builtDef.params.push(IdentityType.String);
					break;
				default:
					throw Error("Invalid func parameter type: '"+type+"', it can be bool, double, or string.");
			}
		}
		
		return builtDef;
	}

	runCode(code, optimize, ...externals){
		let disassembled="";
		try {

			//Build the external parsing list and execution list
			const parserExternList=[];
			const executeExternList=[];
			if (externals){
				for (let i=0;i<externals.length;i++){
					if (externals[i] instanceof StringObj){
						parserExternList.push({name: externals[i].name, type: IdentityType.String});
						executeExternList.push(externals[i]);
					}else if (externals[i] instanceof NumberObj){
						parserExternList.push({name: externals[i].name, type: IdentityType.Double});
						executeExternList.push(externals[i]);
					}else if (externals[i] instanceof BoolObj){
						parserExternList.push({name: externals[i].name, type: IdentityType.Bool});
						executeExternList.push(externals[i]);
					}else{
						parserExternList.push(externals[i]);
						executeExternList.push(externals[i].func);
					}
				}
			}

			//Tokenize
			let tokenizer=new Tokenizer();
			let tokenList=tokenizer.tokenize(code);

			//Parse and generate byte code
			let parser=new Parser(tokenList);
			const program=parser.parse(parserExternList);

			//Link and optionally optimize the byte code
			program.link(optimize);

			//Grab the disassembled byte code for debugging
			disassembled = program.getDebugOutput();

			//Execute the byte code
			let exitObject=program.execute(executeExternList);

			return {exitObject: exitObject, disassembled: disassembled};
		} catch (error){
			if (disassembled){
				return {error: error, disassembled};
			}
			return {error: error};
		}
	}
}



let code = `
string failedTests="";
double failedTestCount=0;
string reportTest(string testName, bool passed){
	if (!passed) {
		failedTests=failedTests+testName+" ";
		failedTestCount=failedTestCount+1;
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
	if (?null==true) return false;
	if (!?null==false) return false;
	if (?"hi"==false) return false;
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

double startTime=time();
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
print("Testing time = "+string(time()-startTime)+"ms");
exit testDone();
`;

const print = (popFn) => {
		let str=popFn();

		console.log(str.value);
		return new BoolObj(null, false, false);
}

const time = (popFn) => {
	return new NumberObj(null, new Date().getTime(), false);
}

let interpreter=new Interpreter();
const printFn = Interpreter.funcDef("print", print, "bool", "string");
const timeFn = Interpreter.funcDef("time", time, "double");
let imports = [timeFn, printFn];

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