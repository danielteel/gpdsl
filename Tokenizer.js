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
		if (!this.isNotEnd()) {
			if (this.look !== stringTerminator) this.throwError("expected string terminator but found end of code.");
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
module.exports = Tokenizer;
