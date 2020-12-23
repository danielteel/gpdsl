const Utils = require("./Utils");

const TokenType = {
	LineDelim: Symbol(";"),
	NewLine: Symbol("newline"),

	Double: Symbol("double"),
	String: Symbol("string"),
	Bool: Symbol("bool"),

	DoubleLiteral: Symbol("number_literal"),
	StringLiteral: Symbol("string_literal"),
	BoolLiteral: Symbol("bool_literal"),

	Ident: Symbol("ident"),

	True: Symbol("true"),
	False: Symbol("false"),
	Nil: Symbol("nil"),

	LeftParen: Symbol("("),
	RightParen: Symbol(")"),
	LeftSqaure: Symbol("["),
	RightSqaure: Symbol("]"),

	Comma: Symbol(","),

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
	StrCmp: Symbol("strcmp"),
	StrICmp: Symbol("stricmp"),
	SubStr: Symbol("substr"),


	ToDouble: Symbol("todouble"),
	ToString: Symbol("tostring"),

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


class Tokenizer {
	static newTokenObj(type, value, line) {
		return {type: type, value: value, line: line};
	}

	static get TokenType(){
		return TokenType;
	}

	constructor(code) {
		this.setCode(code);
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

	tokenize() {
		this.setCode(this.code);

		while (this.isNotEnd()) {
			if (!this.next()) break;
		}
	
		this.addToken(TokenType.NewLine, this.currentLineText?.trim());

		return this.errorObj;
	}

	setError(message) {
		this.errorObj = Utils.newErrorObj(this.currentCodeLine, message);
		return false;
	}

	addToken(type, value = null) {
		this.tokens.push(Tokenizer.newTokenObj(type, value, this.currentCodeLine));
		return true;
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
		while (this.isNotEnd() && Utils.isSpace(this.look)) {
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
		while (this.isNotEnd() && notDone === true) {
			notDone = false;
			if (Utils.isDigit(this.look)) {
				num += this.look;
				notDone = true;
			}
			if (this.look === '.' && hasDec === false) {
				num += this.look;
				hasDec = true;
				notDone = true;
			}
			if (notDone === true) this.getChar();
		}

		if (num.length < 2 && hasDec === true) return this.setError("Expected number but found lone decimal.");
		
		return this.addToken(TokenType.DoubleLiteral, Number(num));
	}

	stringLiteral(stringTerminator) {
		let str = "";
		this.getChar();
		while (this.isNotEnd() && this.look !== stringTerminator) {
			str += this.look;
			this.getChar();
		}
		if (this.isNotEnd()) {
			if (this.look !== stringTerminator) return this.setError("Expected string but found end of code.");
		}
		this.getChar();
		return this.addToken(TokenType.StringLiteral, str);
	}

	ident() {
		let name = "";
		let notDone = true;

		while (this.isNotEnd() && notDone === true) {
			notDone = false;
			if (Utils.isAlpha(this.look) || Utils.isDigit(this.look) || this.look === '_' || this.look === '.') {
				name += this.look;
				notDone = true;
				this.getChar();
			}
		}

		if (name.length === 0) return this.setError("Expected identifier but got nothing");
		

		switch (name) {
			case "if":
				return this.addToken(TokenType.If);
			case "while":
				return this.addToken(TokenType.While);
			case "for":
				return this.addToken(TokenType.For);
			case "loop":
				return this.addToken(TokenType.Loop);
			case "else":
				return this.addToken(TokenType.Else);
			case "break":
				return this.addToken(TokenType.Break);

			case "return":
				return this.addToken(TokenType.Return);

			case "exit":
				return this.addToken(TokenType.Exit);

			case "floor":
				return this.addToken(TokenType.Floor);
			case "ceil":
				return this.addToken(TokenType.Ceil);
			case "min":
				return this.addToken(TokenType.Min);
			case "max":
				return this.addToken(TokenType.Max);
			case "clamp":
				return this.addToken(TokenType.Clamp);
			case "abs":
				return this.addToken(TokenType.Abs);

			case "lcase":
				return this.addToken(TokenType.LCase)
			case "ucase":
				return this.addToken(TokenType.UCase)
			case "trim":
				return this.addToken(TokenType.Trim)
			case "len":
				return this.addToken(TokenType.Len)
			case "strcmp":
				return this.addToken(TokenType.StrCmp)
			case "stricmp":
				return this.addToken(TokenType.StrICmp)
			case "substr":
				return this.addToken(TokenType.SubStr)

			case "todouble":
				return this.addToken(TokenType.ToDouble);
			case "tostring":
				return this.addToken(TokenType.ToString);

			case "double":
				return this.addToken(TokenType.Double);
			case "string":
				return this.addToken(TokenType.String);
			case "bool":
				return this.addToken(TokenType.Bool);

			case "true":
				return this.addToken(TokenType.True);
			case "false":
				return this.addToken(TokenType.False);
				
			case "nil":
			case "null":
				return this.addToken(TokenType.Nil);
		}
		return this.addToken(TokenType.Ident, name);
	}


	next() {
		this.skipWhite();
		if (this.isNotEnd()) {
			if (Utils.isDigit(this.look) || this.look === '.') {
				return this.doubleLiteral();
			} else if (Utils.isAlpha(this.look) || this.look === '_') {
				return this.ident();
			} else if (this.look === '"' || this.look === "'") {
				return this.stringLiteral(this.look);
			} else {
				let symbol = this.look;
				this.getChar();
				switch (symbol) {
					case ';':
						return this.addToken(TokenType.LineDelim);
					case ',':
						return this.addToken(TokenType.Comma);

					case '?':
						return this.addToken(TokenType.Question);
					case ':':
						return this.addToken(TokenType.Colon);

					case '{':
						return this.addToken(TokenType.LeftCurly);
					case '}':
						return this.addToken(TokenType.RightCurly);

					case '[':
						return this.addToken(TokenType.LeftSqaure);
					case ']':
						return this.addToken(TokenType.RightSqaure);

					case '(':
						return this.addToken(TokenType.LeftParen);
					case ')':
						return this.addToken(TokenType.RightParen);

					case '^':
						return this.addToken(TokenType.Exponent);
					case '%':
						return this.addToken(TokenType.Mod);
					case '+':
						return this.addToken(TokenType.Plus);
					case '-':
						return this.addToken(TokenType.Minus);
					case '*':
						return this.addToken(TokenType.Multiply);
					case '/':
						if (this.isNotEnd() && this.look === '/') {
							this.getChar();
							while (this.isNotEnd() && this.look !== '\n') {
								this.getChar();
							}
							return true;
						}
						return this.addToken(TokenType.Divide);

					case '|':
						if (this.isNotEnd() && this.look === '|') {
							this.getChar();
							return this.addToken(TokenType.Or);
						}
						return this.setError("Incomplete OR operator found, OR operators must be of boolean type '||'");
					case '&':
						if (this.isNotEnd() && this.look === '&') {
							this.getChar();
							return this.addToken(TokenType.And);
						}
						return this.setError("Incomplete AND operator found, AND operators must be of boolean type '&&'");
					case '!':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							return this.addToken(TokenType.NotEquals);
						}
						return this.addToken(TokenType.Not);

					case '=':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							return this.addToken(TokenType.Equals);
						}
						return this.addToken(TokenType.Assignment);
					case '>':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							return this.addToken(TokenType.GreaterEquals);
						}
						return this.addToken(TokenType.Greater);
					case '<':
						if (this.isNotEnd() && this.look === '=') {
							this.getChar();
							return this.addToken(TokenType.LesserEquals);
						}
						return this.addToken(TokenType.Lesser);

					default:
						return this.setError("Unexpected symbol found, " + symbol);
				}
			}
		}
		return true;
	}

}
module.exports = Tokenizer;
