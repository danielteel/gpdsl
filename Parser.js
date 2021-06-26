import {IdentityType} from "./Utils";
import Program from "./Program";
import {TokenType} from "./Tokenizer";


export {IdentityType};

export default class Parser {
	constructor(tokens){
		this.tokens=tokens;

		this.tokenIndex=0;
		this.token=this.tokens[0];
		this.tokenEndIndex=this.tokens.length;

		this.branchCounter=1;

		this.scopeIndex=0;
		this.scopes=[[]];

		this.externalsScopeIndex=0;

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
		throw new Error("Parser error on line "+errorLine+": "+message);
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
		return !(a===b || ((a===IdentityType.Null || b===IdentityType.Null) && strict===false));
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
			if (!this.isNotEnd()) return;
			this.token = this.tokens[this.tokenIndex];
			while (this.token?.type===TokenType.NewLine){
				this.program.addCodeLine(this.token.value);
				this.tokenIndex++;
				if (!this.isNotEnd()) return;
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
	
	parse(optimize, expectedExitType, externals){
		this.expectedExitType=expectedExitType;
		this.tokenEndIndex=this.tokens.length;
		this.firstToken();

		this.externalsScopeIndex=0;

		this.branchCounter=1;

		this.scopeIndex=0;
		this.scopes=[[]];

		this.allocScope=[0];
		this.allocScopeIndex=0;
		this.maxScopeDepth=0;

		this.program = new Program();

		if (externals && externals.length>0){
			for (let i=0;i<externals.length;i++){
				this.addToCurrentScope(externals[i].name, externals[i].type, i, externals[i].params, externals[i].returnType);
			}
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
		this.program.code.splice(entryPointAddress+1, 0, ...mainPreamble);

		this.popAllocScope();
		
		//Link and optionally optimize the byte code
		this.program.link(optimize);

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
		let obj={name: name, type: type, branch: branch, params: params, returnType: returnType, scope: this.allocScopeIndex, index: (this.allocScopeIndex===0) ? this.externalsScopeIndex : this.allocScope[this.allocScopeIndex]};
		this.scopes[this.scopeIndex].push(obj);
		if (this.allocScopeIndex===0){
			this.externalsScopeIndex++;
		}
		switch (type){
			case IdentityType.Bool:
			case IdentityType.Double:
			case IdentityType.String:
				this.allocScope[this.allocScopeIndex]++;
				break;
			default:
		}
		return obj;
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
		default:
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
			default:
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
		if (!identObj) this.throwError("tried to call undefined function'"+funcName+"'");
		if (identObj.type!==IdentityType.Function) this.throwError("tried to call a function named '"+funcName+"' that doesnt exist");

		if (needsIdentMatched) this.match(TokenType.Ident);

		this.match(TokenType.LeftParen);

		for (let i=0;i<identObj.params.length;i++){
			let type=this.doExpression();
			this.program.addPush( Program.unlinkedReg("eax") );

			this.matchType(identObj.params[i], type);

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
			default:
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
				this.matchType(type, IdentityType.Double, true);
				this.program.addNeg( Program.unlinkedReg("eax") );
				return IdentityType.Double;

			case TokenType.Not:
				this.match(TokenType.Not);
				type=this.doFactor();
				this.matchType(type, IdentityType.Bool, true);
				this.program.addNot( Program.unlinkedReg("eax") );
				return IdentityType.Bool;

			case TokenType.Question:
				this.match(TokenType.Question);
				type=this.doFactor();
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNull() );
				this.program.addSE( Program.unlinkedReg("eax") );
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
				this.doExpression();
				if (this.token?.type===TokenType.Comma){
					this.match(TokenType.Comma);
					this.program.addPush( Program.unlinkedReg("eax") );
					type=this.doExpression();
					if (!this.typesDontMatch(type, IdentityType.String)) this.throwError("cannot do string:decimal conversion on a string");
					
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
				this.matchType(type, IdentityType.Double, true);
				
				this.program.addCeil( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Floor:
				this.match(TokenType.Floor);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.matchType(type, IdentityType.Double, true);
				this.program.addFloor( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Abs:
				this.match(TokenType.Abs);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.matchType(type, IdentityType.Double, true);
				this.program.addAbs( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Min:
				this.match(TokenType.Min);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.program.addPush( Program.unlinkedReg("eax") );
				this.matchType(type, IdentityType.Double, true);
				this.match(TokenType.Comma);
				type=this.doExpression();
				this.matchType(type, IdentityType.Double, true);
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Max:
				this.match(TokenType.Max);
				this.match(TokenType.LeftParen);
				type=this.doExpression();
				this.program.addPush( Program.unlinkedReg("eax") );
				this.matchType(type, IdentityType.Double, true);
				this.match(TokenType.Comma);
				type=this.doExpression();
				this.matchType(type, IdentityType.Double, true);
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Clamp:

				this.match(TokenType.Clamp);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.Double, true);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double, true);
		
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double, true);
		
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.Len:
				this.match(TokenType.Len);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String, true);
				this.program.addLen( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.Double;

			case TokenType.SubStr:
				this.match(TokenType.SubStr);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String, true);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double, true);
		
				this.program.addPush( Program.unlinkedReg("eax") );
		
				this.match(TokenType.Comma);
				this.matchType(this.doExpression(), IdentityType.Double, true);

				this.program.addMov( Program.unlinkedReg("ecx"), Program.unlinkedReg("eax") );
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addPop( Program.unlinkedReg("eax") );
				this.program.addSubStr( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"), Program.unlinkedReg("ecx") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.Trim:
				this.match(TokenType.Trim);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String, true);
				this.program.addTrim( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.LCase:
				this.match(TokenType.LCase);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String, true);
				this.program.addLCase( Program.unlinkedReg("eax") );
				this.match(TokenType.RightParen);
				return IdentityType.String;

			case TokenType.UCase:
				this.match(TokenType.UCase);
				this.match(TokenType.LeftParen);
				this.matchType(this.doExpression(), IdentityType.String, true);
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
			this.matchType(leftType, IdentityType.Double, true);
			this.matchType(this.doFactor(), IdentityType.Double, true);

			this.program.addPop( Program.unlinkedReg("ebx") );

			switch (powerOp){
				case TokenType.Exponent:
					this.program.addExponent( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
				default:
			}
		}

		return leftType;
	}

	doTerm(){
		let leftType=this.doExponentiation();
		
		while (this.isNotEnd() && this.isTermOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			let termOp=this.token.type;
			this.match(termOp);

			this.matchType(leftType, IdentityType.Double, true);
			this.matchType(this.doExponentiation(), IdentityType.Double, true);

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
				default:
			}
		}

		return leftType;
	}

	doAdd(){
		let leftType=this.doTerm();

		while (this.isNotEnd() && this.isAddOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			let addOp=this.token.type;
			this.match(addOp);

			this.matchType(leftType, this.doTerm());

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
					this.matchType(leftType, IdentityType.Double, true);
					
					this.program.addSub( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					this.program.addNeg( Program.unlinkedReg("eax") );
					break;
				default:
			}
		}

		return leftType;
	}

	doCompare(){
		let leftType=this.doAdd();

		while (this.isNotEnd() && this.isCompareOp()){
			this.program.addPush( Program.unlinkedReg("eax") );
			let compareOp=this.token.type;
			this.match(compareOp);

			this.matchType(leftType, this.doAdd());

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
					this.matchType(leftType, IdentityType.Double, true);
					this.program.addSA( Program.unlinkedReg("eax") );
					break;
				case TokenType.GreaterEquals:
					this.matchType(leftType, IdentityType.Double, true);
					this.program.addSAE( Program.unlinkedReg("eax") );
					break;
				case TokenType.Lesser:
					this.matchType(leftType, IdentityType.Double, true);
					this.program.addSB( Program.unlinkedReg("eax") );
					break;
				case TokenType.LesserEquals:
					this.matchType(leftType, IdentityType.Double, true);
					this.program.addSBE( Program.unlinkedReg("eax") );
					break;
				default:
			}

			leftType=IdentityType.Bool;
		}

		return leftType;
	}

	doAnd(){
		let leftType=this.doCompare();

		while (this.isNotEnd() && this.isAndOp()){
			this.matchType(leftType, IdentityType.Bool);

			let shortCircuitBranch=this.newBranch();
			this.program.addTest( Program.unlinkedReg("eax") );
			this.program.addJE( shortCircuitBranch );


			this.match(TokenType.And);

			this.matchType(this.doCompare(), IdentityType.Bool);

			this.program.addLabel( shortCircuitBranch );
		}

		return leftType;
	}

	doOr(){
		let leftType=this.doAnd();

		while (this.isNotEnd() && this.isOrOp()){
			this.matchType(leftType, IdentityType.Bool);

			let shortCircuitBranch=this.newBranch();
			this.program.addTest( Program.unlinkedReg("eax") );
			this.program.addJNE( shortCircuitBranch );

			this.match(TokenType.Or);

			this.matchType(this.doAnd(), IdentityType.Bool);

			this.program.addLabel( shortCircuitBranch );
		}

		return leftType;
	}

	doExpression(){
		let returnType=this.doOr();

		while (this.isNotEnd() && this.isTernaryOp()){
			this.matchType(returnType, IdentityType.Bool);

			this.match(TokenType.Question);

			let falseBranch=this.newBranch();
			let doneBranch=this.newBranch();
			this.program.addTest( Program.unlinkedReg("eax") );
			this.program.addJE( falseBranch );

			returnType=this.doExpression();

			this.match(TokenType.Colon);

			this.program.addJmp( doneBranch );
			this.program.addLabel( falseBranch );

			this.matchType(returnType, this.doExpression());

			this.program.addLabel( doneBranch );
		}

		return returnType;
	}

	doIf(breakToBranch, returnToBranch, returnType){
		const elseLabel = this.newBranch();
		
		this.match(TokenType.If);
		this.match(TokenType.LeftParen);

		if (this.doExpression()!==IdentityType.Bool){
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
		this.match(TokenType.LeftParen);

		this.program.addLabel( loopLabel );

		if (this.doExpression()!==IdentityType.Bool){
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
			if (this.doExpression()!==IdentityType.Bool){
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

		if (this.doExpression()!==IdentityType.Bool){
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
			const exitType=this.doExpression();
			if (this.expectedExitType){
				this.matchType(exitType, this.expectedExitType);
			}
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
			const varName = this.token?.value;
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
					this.matchType(declareType, expType);
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

		const paramTypes=[];
		const paramIdents=[];
		const paramObjs=[];

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
		
		const identObj = this.addFunction(name, type, funcBlockBranch, paramTypes);
		if (!identObj) this.throwError("failed to add function '"+name+"' to ident list");

		this.pushScope();
		for (let i=0;i<paramIdents.length;i++){
			const obj=this.addVar(paramIdents[i], paramTypes[i]);
			if (!obj) this.throwError("attempted to push null param to list on function '"+name+"'")
			paramObjs.push(obj);
		}

		this.doBlock(null, returnToBranch, true, true, true, type);

		this.popScope();
		this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNull() );

		this.program.addLabel( returnToBranch );
		this.program.addPopScope( this.allocScopeIndex );
		this.program.addRet();

		const funcPreamble=[];
		funcPreamble.push(this.program.addPushScope( this.allocScopeIndex, this.allocScope[this.allocScopeIndex], true ));

		for (let i=paramObjs.length-1;i>=0;i--){
			const unlinkedParam=Program.unlinkedVariable(paramObjs[i].type, paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name);
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
			const expressionType=this.doExpression();
			this.matchType(expressionType, returnType);
		}else{
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNull() );
		}

		this.program.addJmp( returnToBranch );
		this.match(TokenType.LineDelim);
	}
	
	doAssignment(wantsDelim=true){
		const varName=this.token.value;

		this.match(TokenType.Ident);
		const identObj = this.getIdentity(varName);
		if (!identObj) this.throwError("tried to assign to undefined '"+varName+"'");

		this.match(TokenType.Assignment);

		const expressionType=this.doExpression();
		this.matchType(identObj.type, expressionType);

		this.program.addMov( Program.unlinkedVariable(identObj.type, identObj.scope, identObj.index, varName), Program.unlinkedReg("eax") );

		if (wantsDelim===true) this.match(TokenType.LineDelim);
	}

	doIdentStatement(){
		const identName = this.token.value;

		const identObj = this.getIdentity(identName);
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
				if (returnToBranch!==null && returnToBranch!==undefined){
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

		if (ifNeedsCurlys){
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
