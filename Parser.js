const Utils = require("./Utils");
const TokenType=require("./Tokenizer").TokenType;
const {Program} = require("./Program");

const IdentityType = {
	Bool: Symbol("Bool"),
	Double: Symbol("Double"),
	String: Symbol("String"),

	BoolFunction: Symbol("Bool function"),
	DoubleFunction: Symbol("Double function"),
	StringFunction: Symbol("String function")
}

class Parser {
	constructor(tokens){
		this.tokens=tokens;

		this.tokenIndex=0;
		this.token=this.tokens[0];
		this.tokenEndIndex=this.tokens.length;
		this.errorObj=null;

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
	
	match(type) {
		if (this.token?.type === type) {
			this.getToken();
			return true;
		}
		if (this.token){
			return this.setError("Expected token type "+ type.toString().replace("Symbol","") + " but found "+this.token?.type.toString().replace("Symbol","")+" instead");
		}
		return  this.setError("Expected token type "+ type.toString().replace("Symbol","") + " but found nothing!");
	}

	setError(message) {
		let errorLine;
		if (this.token){
			errorLine=this.token.line;
		}else{
			errorLine=this.tokens[this.tokens.length-1].line;//Probably ran to the end of the token buffer, so just grab the last code line
		}
		this.errorObj = Utils.newErrorObj(errorLine, message);
		return false;
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

		this.errorObj=null;

		this.branchCounter=1;

		this.scopeIndex=0;
		this.scopes=[[]];

		this.allocScope=[0];
		this.allocScopeIndex=0;
		this.maxScopeDepth=0;

		this.program = new Program();

		for (let i=0;i<externals.length;i++){
			this.addToCurrentScope(externals[i].name, externals[i].type, null, externals[i].params);
		}

		this.pushAllocScope();

		const pushGlobalScopeBranch = this.newBranch();
		const comeBackBranch = this.newBranch();

		this.program.addJmp(pushGlobalScopeBranch);
		this.program.addLabel(comeBackBranch);

		this.program.addCodeLine(null);
		if (!this.doBlock(null, null, false, false, true)){
			//report default error message
		}
		this.program.addCodeLine(null);
		
		this.program.addExit( Program.unlinkedNilBool() );
		this.program.addLabel(pushGlobalScopeBranch);

		this.program.addScopeDepth(this.maxScopeDepth);
		if (this.allocScope[this.allocScopeIndex]){
			this.program.addPushScope(this.allocScopeIndex, this.allocScope[this.allocScopeIndex]);
		}
		this.program.addJmp(comeBackBranch);

		this.popAllocScope();
		if (this.errorObj) return this.errorObj;
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
	addToCurrentScope(name, type, branch=null, params=null){
		const alreadyExists=this.getIdentity(name, true);
		if (alreadyExists !== null) return this.setError("Duplicate define, "+name+" already exists in current scope as "+alreadyExists.name+":"+alreadyExists.type.toString());
		let obj={name: name, type: type, branch: branch, params: params, scope: this.allocScopeIndex, index: this.allocScope[this.allocScopeIndex]};
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
		let index=0;
		for (let i = this.scopeIndex;i>=0;i--){
			let identity = this.scopes[i].find( (current, i) => {index=i; return name === current.name} );
			if (identity) return identity;
			if (onlyInCurrentScope) break;
		}
		return null;
	}

	addBool(name){
		return this.addToCurrentScope(name, IdentityType.Bool);
	}
	addDouble(name){
		return this.addToCurrentScope(name, IdentityType.Double);
	}
	addString(name){
		return this.addToCurrentScope(name, IdentityType.String);
	}
	addFunction(name, functionType, branch, params){
		return this.addToCurrentScope(name, functionType, branch, params);
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

	doCeil(){
		if (!this.match(TokenType.Ceil)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addCeil( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}
	
	doFloor(){
		if (!this.match(TokenType.Floor)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addFloor( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}

	doAbs(){
		if (!this.match(TokenType.Abs)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addAbs( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}

	doMin(){
		if (!this.match(TokenType.Min)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;

		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );

		return this.match(TokenType.RightParen);
	}

	doMax(){
		if (!this.match(TokenType.Max)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;

		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );

		return this.match(TokenType.RightParen);
	}

	doClamp(){
		if (!this.match(TokenType.Clamp)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;

		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addMax( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;

		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addMin( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );

		return this.match(TokenType.RightParen);
	}

	doFuncCall(allowBool, allowDouble, allowString, funcName=null){
		let needsIdentMatched=false;
		if (funcName===null){
			funcName=this.token.value;
			needsIdentMatched=true;
		}
		let identObj = this.getIdentity(funcName);
		if (!identObj) return this.setError("Tried to call undefined function'"+funcName+"'");

		if (identObj.type===TokenType.BoolFunction && allowBool===false) return this.setError("Cant call a function ("+funcName+") of type bool right here");
		if (identObj.type===TokenType.DoubleFunction && allowDouble===false) return this.setError("Cant call a function ("+funcName+") of type double right here");
		if (identObj.type===TokenType.StringFunction && allowString===false) return this.setError("Cant call a function ("+funcName+") of type string right here");

		if (needsIdentMatched) {
			if (!this.match(TokenType.Ident)) return false;
		}
		if (!this.match(TokenType.LeftParen)) return false;

		for (let i=0;i<identObj.params.length;i++){
			switch (identObj.params[i]){
				case IdentityType.Double:
					if (!this.doExpression()) return false;
					break;
				case IdentityType.Bool:
					if (!this.doExpression()) return false;
					break;
				case IdentityType.String:
					if (!this.doStringExpression()) return false;
					break;
				default:
					return this.setError("Invalid data type in function call parameter list "+identObj.params[i].toString());
			}
			
			this.program.addPush( Program.unlinkedReg("eax") );

			if (i<identObj.params.length-1){
				if (!this.match(TokenType.Comma)) return false;
			}
		}

		if (!this.match(TokenType.RightParen)) return false;
		if (identObj.scope===0){
			this.program.addExCall(identObj.index, "fxn "+identObj.name);
		}else{
			this.program.addCall(identObj.branch, "fxn "+identObj.name);
		}
		return true;
	}

	doIdent(){
		const varName=this.token.value;
		const identObj = this.getIdentity(varName);
		if (!identObj) return this.setError("Tried to access undefined '"+varName+"'");

		switch (identObj.type){
			case IdentityType.Double:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedDouble(identObj.scope, identObj.index, varName) );
				return this.match(TokenType.Ident);

			case IdentityType.Bool:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedBool(identObj.scope, identObj.index, varName) );
				return this.match(TokenType.Ident);

			
			case IdentityType.DoubleFunction:
			case IdentityType.BoolFunction:
				return this.doFuncCall(true, true, false);
		}
		return this.setError("Invalid type in expression "+varName+":"+identObj.type.toString());
	}
	
	doIsNil(){
		if (!this.match(TokenType.Question)) return false;
		const varToken=this.token;
		if (!this.match(TokenType.Ident)) return false;
		const varName=varToken.value;
		const identObj = this.getIdentity(varName);
		if (!identObj) return this.setError("Tried to access undefined '"+varName+"'");

		switch (identObj.type){
			case IdentityType.Double:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedDouble(identObj.scope, identObj.index, varName) );
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNilDouble() );
				this.program.addSNE( Program.unlinkedReg("eax") );
				return true;

			case IdentityType.Bool:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedBool(identObj.scope, identObj.index, varName) );
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNilBool() );
				this.program.addSNE( Program.unlinkedReg("eax") );
				return true;

			case IdentityType.String:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedString(identObj.scope, identObj.index, varName) );
				this.program.addStrCmp( Program.unlinkedReg("eax"), Program.unlinkedNilString() );
				this.program.addNot( Program.unlinkedReg("eax") );
				return true;
			
			case IdentityType.DoubleFunction:
				if (!this.doFuncCall(false, true, false, varName)) return false;
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNilDouble() );
				this.program.addSNE( Program.unlinkedReg("eax") );
				return true;

			case IdentityType.BoolFunction:
				if (!this.doFuncCall(true, false, false, varName)) return false;
				this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedNilBool() );
				this.program.addSNE( Program.unlinkedReg("eax") );
				return true;

			case IdentityType.StringFunction:
				if (!this.doFuncCall(false, false, true, varName)) return false;
				this.program.addStrCmp( Program.unlinkedReg("eax"), Program.unlinkedNilString() );
				this.program.addNot( Program.unlinkedReg("eax") );
				return true;

		}
		return this.setError("Invalid type in isnil "+varName+":"+identObj.type.toString());
	}


	doToDouble(){
		if (!this.match(TokenType.ToDouble)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;

		this.program.addToDouble( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen)
	}

	
	doLen(){
		if (!this.match(TokenType.Len)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;

		this.program.addLen( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}
	doStrCmp(){
		if (!this.match(TokenType.StrCmp)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		
		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doStringExpression()) return false;
		
		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addStrCmp( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		
		return this.match(TokenType.RightParen);
	}
	doStrICmp(){
		if (!this.match(TokenType.StrICmp)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		
		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doStringExpression()) return false;

		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addStrICmp( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );

		return this.match(TokenType.RightParen);
	}

	doFactor(){
		switch (this.token?.type){        
		case TokenType.DoubleLiteral:
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedDoubleLiteral(this.token.value) );

			return this.match(TokenType.DoubleLiteral);
			
		case TokenType.Ident:
			return this.doIdent();
		
		case TokenType.Question:
			return this.doIsNil();
			
		case TokenType.LeftParen:
			if (!this.match(TokenType.LeftParen)) return false;
			if (!this.doExpression()) return false;
			if (!this.match(TokenType.RightParen)) return false;
			return true;
			
		case TokenType.Not:
			if (!this.match(TokenType.Not)) return false;
			if (!this.doFactor()) return false;

			this.program.addNot( Program.unlinkedReg("eax") );
			return true;

		case TokenType.Minus:
			if (!this.match(TokenType.Minus)) return false;
			if (!this.doFactor()) return false;

			this.program.addNeg( Program.unlinkedReg("eax") );
			return true;
			
		case TokenType.Nil:
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilDouble() );
			return this.match(TokenType.Nil);

		case TokenType.True:
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedBoolLiteral(true) );
			return this.match(TokenType.True);

		case TokenType.False:
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedBoolLiteral(false) );
			return this.match(TokenType.False);    

		case TokenType.Min:
			return this.doMin();
		case TokenType.Max:
			return this.doMax();
		case TokenType.Clamp:
			return this.doClamp();
		case TokenType.Abs:
			return this.doAbs();
		case TokenType.Floor:
			return this.doFloor();
		case TokenType.Ceil:
			return this.doCeil();

		case TokenType.Len:
			return this.doLen();
		case TokenType.StrCmp:
			return this.doStrCmp();
		case TokenType.StrICmp:
			return this.doStrICmp();

		case TokenType.ToDouble:
			return this.doToDouble();
		}
		if (this.token){
			return this.setError("Expected factor but found "+this.token.type.toString()+":"+this.token.value);
		}
		return this.setError("Expected factor but found nothing!");
	}


	doPower(){
		if (!this.doFactor()) return false;
		while (this.isNotEnd() && this.isPowerOp()){

			this.program.addPush( Program.unlinkedReg("eax") );

			switch (this.token.type){
				case TokenType.Exponent:
					if (!this.match(TokenType.Exponent)) return false;
					if (!this.doFactor()) return false;

					this.program.addMov( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
					this.program.addPop( Program.unlinkedReg("eax") );
					this.program.addExponent( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
					break;
			}
		}
		return true;
	}
	
	doTerm(){
		if (!this.doPower()) return false;
		while (this.isNotEnd() && this.isTermOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			switch (this.token.type){
			case TokenType.Multiply:
				if (!this.match(TokenType.Multiply)) return false;
				if (!this.doPower()) return false;
				this.program.addPop( Program.unlinkedReg("ebx"));
				this.program.addMul( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				break;
			case TokenType.Divide:
				if (!this.match(TokenType.Divide)) return false;
				if (!this.doPower()) return false;
				this.program.addMov( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
				this.program.addPop( Program.unlinkedReg("eax"));
				this.program.addDiv( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				break;
			case TokenType.Mod:
				if (!this.match(TokenType.Mod)) return false;
				if (!this.doPower()) return false;
				this.program.addMov( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
				this.program.addPop( Program.unlinkedReg("eax"));
				this.program.addMod( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				break;
			}
		}
		return true;
	}

	doAdd(){
		if (!this.doTerm()) return false;
		while (this.isNotEnd() && this.isAddOp()){
			this.program.addPush( Program.unlinkedReg("eax") );

			switch (this.token.type){
			case TokenType.Plus:
				if (!this.match(TokenType.Plus)) return false;
				if (!this.doTerm()) return false;
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addAdd( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				break;
			case TokenType.Minus:
				if (!this.match(TokenType.Minus)) return false;
				if (!this.doTerm()) return false;
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addSub( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
				this.program.addNeg( Program.unlinkedReg("eax") );
				break;
			}
		}
		return true;
	}

	doCompare(){
		if (!this.doAdd()) return false;
		while (this.isNotEnd() && this.isCompareOp()){

			this.program.addPush( Program.unlinkedReg("eax") );
			
			let compareType=this.token.type;
			if (!this.match(compareType)) return false;
			if (!this.doAdd()) return false;
			
			this.program.addPop( Program.unlinkedReg("ebx") );
			this.program.addCmp( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );

			switch (compareType){
			case TokenType.Equals:
				this.program.addSE( Program.unlinkedReg("eax") );
				break;
			case TokenType.NotEquals:
				this.program.addSNE( Program.unlinkedReg("eax") );
				break;
			case TokenType.Greater:
				this.program.addSA( Program.unlinkedReg("eax") );
				break;
			case TokenType.GreaterEquals:
				this.program.addSAE( Program.unlinkedReg("eax") );
				break;
			case TokenType.Lesser:
				this.program.addSB( Program.unlinkedReg("eax") );
				break;
			case TokenType.LesserEquals:
				this.program.addSBE( Program.unlinkedReg("eax") );
				break;
			}
		}
		return true;
	}


	doAnd(){
		if (!this.doCompare()) return false;
		
		while (this.isNotEnd() && this.isAndOp()){

			this.program.addPush( Program.unlinkedReg("eax") );
			
			if (this.token.type===TokenType.And){
				if (!this.match(TokenType.And)) return false;
				if (!this.doCompare()) return false;
				
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addAnd( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
			}
		}
		return true;
	}

	doOr(){
		if (!this.doAnd()) return false;
		
		while (this.isNotEnd() && this.isOrOp()){

			this.program.addPush( Program.unlinkedReg("eax") );

			if (this.token.type===TokenType.Or){
				if (!this.match(TokenType.Or)) return false;
				if (!this.doAnd()) return false;
				this.program.addPop( Program.unlinkedReg("ebx") );
				this.program.addOr( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
			}
		}
		return true;
	}

	doExpression(){//Does the ternary operator
		if (!this.doOr()) return false;
		
		while (this.isNotEnd() && this.isTernaryOp()){
			if (!this.match(TokenType.Question)) return false;
			let falseBranch=this.newBranch();
			let doneBranch=this.newBranch();

			this.program.addCmp( Program.unlinkedReg("eax"), Program.unlinkedBoolLiteral(false) );
			this.program.addJE( falseBranch );

			if (!this.doExpression()) return false;
			this.program.addJmp( doneBranch );

			if (!this.match(TokenType.Colon)) return false;

			this.program.addLabel( falseBranch );
			if (!this.doExpression()) return false;
			this.program.addLabel( doneBranch );
		}
		return true;
	}


	doStringExpressionIdent(){
		let varName=this.token.value;
		let identObj = this.getIdentity(varName);
		if (!identObj) return this.setError("Tried to access undefined '"+varName+"'");

		switch (identObj.type){
			case IdentityType.String:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedString(identObj.scope, identObj.index, varName) )
				return this.match(TokenType.Ident);

			case IdentityType.StringFunction:
				return this.doFuncCall(true, true, false);
		}
		return this.setError("Invalid type in expression "+varName+":"+identObj.type.toString());
	}

	doLCase(){
		if (!this.match(TokenType.LCase)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		this.program.addLCase( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}
	doUCase(){
		if (!this.match(TokenType.UCase)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		this.program.addUCase( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}
	doTrim(){
		if (!this.match(TokenType.Trim)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		this.program.addTrim( Program.unlinkedReg("eax") );

		return this.match(TokenType.RightParen);
	}
	doSubStr(){
		if (!this.match(TokenType.SubStr)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doStringExpression()) return false;
		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;
		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;
		this.program.addMov( Program.unlinkedReg("ecx"), Program.unlinkedReg("eax") );
		this.program.addPop( Program.unlinkedReg("ebx") );
		this.program.addPop( Program.unlinkedReg("eax") );
		this.program.addSubStr( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"), Program.unlinkedReg("ecx") );

		return this.match(TokenType.RightParen);
	}
	doToString(){ 
		if (!this.match(TokenType.ToString)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;

		this.program.addPush( Program.unlinkedReg("eax") );

		if (!this.match(TokenType.Comma)) return false;
		if (!this.doExpression()) return false;
		this.program.addMov( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
		this.program.addPop( Program.unlinkedReg("eax") );
		this.program.addToString( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		return this.match(TokenType.RightParen);
	}

	isStringExpressionToken(){
		switch (this.token?.type){
			case TokenType.StringLiteral:
				return true;
			case TokenType.Nil:
				return true;
			case TokenType.Ident:
				const identObj = this.getIdentity(this.token.value, false);
				if (!identObj) return this.setError("Trying to use undefined "+this.token.value);
				switch (identObj.type){
					case IdentityType.String:
					case IdentityType.StringFunction:
						return true;
				}
				return false;
			case TokenType.LCase:
				return true;
			case TokenType.UCase:
				return true;
			case TokenType.Trim:
				return true;
			case TokenType.SubStr:
				return true;
			case TokenType.ToString:
				return true;
		}
		return false;
	}

	doStringFactor(){
		switch (this.token?.type){
			case TokenType.StringLiteral:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedStringLiteral(this.token.value) );
				return this.match(TokenType.StringLiteral);
			case TokenType.Nil:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilString() );
				return this.match(TokenType.Nil);
			case TokenType.Ident:
				return this.doStringExpressionIdent();
			case TokenType.LCase:
				return this.doLCase();
			case TokenType.UCase:
				return this.doUCase();
			case TokenType.Trim:
				return this.doTrim();
			case TokenType.SubStr:
				return this.doSubStr();
			case TokenType.ToString:
				return this.doToString();
		}
		return this.setError("Expected string factor, but got "+this.token.type.toString());
	}

	doStringExpression(){
		if (!this.doStringFactor()) return false;
		
		while (this.isNotEnd() && this.token.type===TokenType.Plus){
			this.program.addPush( Program.unlinkedReg("eax") );
			
			if (!this.match(TokenType.Plus)) return false;
			if (!this.doStringFactor()) return false;
			this.program.addPop( Program.unlinkedReg("ebx") );
			this.program.addConcat( Program.unlinkedReg("ebx"), Program.unlinkedReg("eax") );
			this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedReg("ebx") );
		}
		return true;
	}

	doEitherExpression(){
		if (this.isStringExpressionToken()){
			if (!this.doStringExpression()) return false;
			return IdentityType.String;
		}
		if (!this.doExpression()) return false;
		return IdentityType.Double;
	}

	doIf(breakToBranch, returnToBranch, returnType){
		const elseLabel = this.newBranch();
		
		if (!this.match(TokenType.If)) return false;

		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;
		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJE( elseLabel );
		if (!this.match(TokenType.RightParen)) return false;

		if (!this.doBlock(breakToBranch, returnToBranch, false, true, false, returnType)) return false;

		if (this.isNotEnd() && this.token.type === TokenType.Else) {
			const endLabel = this.newBranch();
			this.program.addJmp( endLabel );
			this.program.addLabel( elseLabel );

			if (!this.match(TokenType.Else)) return false;
			
			if (!this.doBlock(breakToBranch, returnToBranch, false, true, false, returnType)) return false;
			
			this.program.addLabel( endLabel );
		}else{
			this.program.addLabel( elseLabel );
		}

		this.program.addCodeLine(null);
		return true;
	}

	doWhile(returnToBranch, returnType){
		const loopLabel = this.newBranch();
		const endLabel = this.newBranch();
		

		if (!this.match(TokenType.While)) return false;

		this.program.addLabel( loopLabel );

		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;
		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJE( endLabel );
		if (!this.match(TokenType.RightParen)) return false;
		
		if (!this.doBlock(endLabel, returnToBranch, false, true, false, returnType)) return false;
		
		this.program.addJmp( loopLabel );
		this.program.addLabel( endLabel );
		this.program.addCodeLine(null);
		return true;
	}

	doFor(returnToBranch, returnType){
		const compareLabel = this.newBranch();
		const incLabel = this.newBranch();
		const blockLabel = this.newBranch();
		const endLabel = this.newBranch();


		this.pushScope();

		if (!this.match(TokenType.For)) return false;//                         for
		if (!this.match(TokenType.LeftParen)) return false;//                   (

		if (this.token?.type!==TokenType.LineDelim){//                           [allocate || init]
			switch (this.token.type){
				case TokenType.Bool:
					if (!this.doBool()) return false;
					break;
				case TokenType.Double:
					if (!this.doDouble()) return false;
					break;
				 case TokenType.String:
					 if (!this.doString()) return false;
					 break;
				default:
					if (!this.doAssignment()) return false; 
					break;
			}
		}else{
			if (!this.match(TokenType.LineDelim)) return false;//               ;
		}

		this.program.addLabel( compareLabel );

		if (this.token?.type!==TokenType.LineDelim){//                           [expression]
			if (!this.doExpression()) return false;
			this.program.addTest( Program.unlinkedReg("eax") );
			this.program.addJE( endLabel );
		}
		
		this.program.addJmp( blockLabel );
		this.program.addLabel( incLabel );

		if (!this.match(TokenType.LineDelim)) return false;//                   ;

		if (this.token?.type!==TokenType.RightParen){//                          [assignment] 
			if (!this.doAssignment(false)) return false;
		}

		this.program.addJmp( compareLabel );

		if (!this.match(TokenType.RightParen)) return false;//                  )

		this.program.addLabel( blockLabel );

		if (!this.doBlock(endLabel, returnToBranch, false, true, false, returnType)) return false;//{ block }


		this.program.addJmp( incLabel );
		this.program.addLabel( endLabel );

		this.popScope();
		this.program.addCodeLine(null);

		return true;
	}

	doLoop(returnToBranch, returnType){
		const loopLabel = this.newBranch();
		const endLabel = this.newBranch();

		this.program.addLabel( loopLabel );

		if (!this.match(TokenType.Loop)) return false;

		if (!this.doBlock(endLabel, returnToBranch, false, true, false, returnType)) return false;//{ block }
		
		if (!this.match(TokenType.While)) return false;
		if (!this.match(TokenType.LeftParen)) return false;
		if (!this.doExpression()) return false;
		
		this.program.addTest( Program.unlinkedReg("eax") );
		this.program.addJNE( loopLabel );
		this.program.addLabel( endLabel );

		if (!this.match(TokenType.RightParen)) return false;

		return true;
	}

	doBreak(breakToBranch){
		if (!this.match(TokenType.Break)) return false;
		if (breakToBranch===null || breakToBranch===undefined) return this.setError("No loop to break from.");
		this.program.addJmp( breakToBranch );

		return this.match(TokenType.LineDelim);
	}

	doExit(){
		if (!this.match(TokenType.Exit)) return false;
		if (this.token?.type !== TokenType.LineDelim){
			if (!this.doEitherExpression()) return false;
			this.program.addExit( Program.unlinkedReg("eax") );
		}else{
			this.program.addExit( Program.unlinkedNilString() );
		}
		return this.match(TokenType.LineDelim);
	}
	
	doDouble(){
		if (!this.match(TokenType.Double)) return false;

		do {
			let doubleName = this.token.value;
			if (!this.match(TokenType.Ident)) return false;

			if (this.token?.type===TokenType.LeftParen){//its a function definition
				return this.doFunction(doubleName, IdentityType.DoubleFunction);
			}
			
			let identObj = this.addDouble(doubleName);
			if (!identObj) return false;

			this.program.addDouble( Program.unlinkedDouble(identObj.scope, identObj.index, doubleName) );

			if (this.token?.type===TokenType.Assignment){
				if (!this.match(TokenType.Assignment)) return false;
				if (!this.doExpression()) return false;
				this.program.addMov( Program.unlinkedDouble(identObj.scope, identObj.index, doubleName), Program.unlinkedReg("eax") );
			}

			if (this.token?.type===TokenType.Comma){
				if (!this.match(TokenType.Comma)) return false;
			}
		} while (this.isNotEnd() && this.token.type!==TokenType.LineDelim)
		return this.match(TokenType.LineDelim);
	}    

	doBool(){
		if (!this.match(TokenType.Bool)) return false;

		do {
			let boolName = this.token.value;
			if (!this.match(TokenType.Ident)) return false;

			if (this.token?.type===TokenType.LeftParen){//its a function definition
				return this.doFunction(boolName, IdentityType.BoolFunction);
			}
			
			let identObj = this.addBool(boolName);
			if (!identObj) return false;
			
			this.program.addBool( Program.unlinkedBool(identObj.scope, identObj.index, boolName) );

			if (this.token?.type===TokenType.Assignment){
				if (!this.match(TokenType.Assignment)) return false;
				if (!this.doExpression()) return false;
				this.program.addMov( Program.unlinkedBool(identObj.scope, identObj.index, boolName), Program.unlinkedReg("eax") );
			}

			if (this.token?.type===TokenType.Comma){
				if (!this.match(TokenType.Comma)) return false;
			}
		} while (this.isNotEnd() && this.token.type!==TokenType.LineDelim)
		return this.match(TokenType.LineDelim);
	}

	doString(){
		if (!this.match(TokenType.String)) return false;

		do {
			let stringName = this.token.value;
			if (!this.match(TokenType.Ident)) return false;

			if (this.token?.type===TokenType.LeftParen){//its a function definition
				return this.doFunction(stringName, IdentityType.StringFunction);
			}
			
			let identObj = this.addString(stringName);
			if (!identObj) return false;

			this.program.addString( Program.unlinkedString(identObj.scope, identObj.index, stringName) );

			if (this.token?.type===TokenType.Assignment){
				if (!this.match(TokenType.Assignment)) return false;
				if (!this.doStringExpression()) return false;
				this.program.addMov( Program.unlinkedString(identObj.scope, identObj.index, stringName), Program.unlinkedReg("eax") );
			}

			if (this.token?.type===TokenType.Comma){
				if (!this.match(TokenType.Comma)) return false;
			}
		} while (this.isNotEnd() && this.token.type!==TokenType.LineDelim)
		return this.match(TokenType.LineDelim);
	}

	doFunction(name, type){
		
		const returnToBranch=this.newBranch();
		const skipFuncBranch = this.newBranch();
		const setupStackFrameBranch = this.newBranch();
		const funcBlockBranch = this.newBranch();

		this.program.addJmp( skipFuncBranch );

		this.pushAllocScope();
		this.program.addLabel( funcBlockBranch );

		let paramTypes=[];
		let paramIdents=[];
		let paramObjs=[];

		if (!this.match(TokenType.LeftParen)) return false;
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
					return this.setError("Unexpected token in parameter list "+this.token.type.toString());
			}
			if (!this.match(this.token.type)) return false;

			paramIdents.push(this.token?.value);
			if (!this.match(TokenType.Ident)) return false;
			
			if (this.token?.type === TokenType.Comma){
				if (!this.match(TokenType.Comma)) return false;
				if (this.token?.type===TokenType.RightParen) return this.setError("Expected another parameter, but got a )");
			}
		}
		if (!this.match(TokenType.RightParen)) return false;
		
		let identObj = this.addFunction(name, type, setupStackFrameBranch, paramTypes);
		if (!identObj) return false;

		this.pushScope();
		for (let i=0;i<paramIdents.length;i++){
			let obj=null;
			switch (paramTypes[i]){
				case IdentityType.Double:
					obj=this.addDouble(paramIdents[i]);
					paramObjs.push(obj);
					if (!obj) return false;
					break;
				case IdentityType.Bool:
					obj=this.addBool(paramIdents[i]);
					paramObjs.push(obj);
					if (!obj) return false;
					break;
				case IdentityType.String:
					obj=this.addString(paramIdents[i]);
					paramObjs.push(obj);
					if (!obj) return false;
					break;
				default:
					return this.setError("Unexpected type in parameter list allocation "+paramTypes[i].toString());
			}
		}

		if (!this.doBlock(null, returnToBranch, true, true, true, type)) return false;

		this.popScope();
		switch (type){
			case IdentityType.BoolFunction:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilBool() );
				break;
			case IdentityType.StringFunction:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilString() );
				break;
			case IdentityType.DoubleFunction:
				this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilDouble() );
				break;
			default:
				return this.setError("invalid return type from function "+name);
		}
		this.program.addLabel( returnToBranch );
		this.program.addPopScope( this.allocScopeIndex );
		this.program.addRet();
		this.program.addLabel( setupStackFrameBranch );
		this.program.addPushScope( this.allocScopeIndex, this.allocScope[this.allocScopeIndex] );

		for (let i=paramObjs.length-1;i>=0;i--){
			switch (paramObjs[i].type){
			case IdentityType.Bool:
				this.program.addBool( Program.unlinkedBool(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				this.program.addPop( Program.unlinkedBool(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				break;
			case IdentityType.Double:
				this.program.addDouble( Program.unlinkedDouble(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				this.program.addPop( Program.unlinkedDouble(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				break;
			case IdentityType.String:
				this.program.addString( Program.unlinkedString(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				this.program.addPop( Program.unlinkedString(paramObjs[i].scope, paramObjs[i].index, paramObjs[i].name) );
				break;
			}
		}

		this.program.addJmp( funcBlockBranch );

		this.popAllocScope();
		this.program.addLabel( skipFuncBranch );
		this.program.addCodeLine(null);
		return true;
	}

	doReturn(returnToBranch, returnType){
		if (!this.match(TokenType.Return)) return false;

		switch (returnType){
			case IdentityType.DoubleFunction:
				if (this.token?.type!==TokenType.LineDelim){
					if (!this.doExpression()) return false;
				}else{
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilDouble() );
				}
				break;
			case IdentityType.BoolFunction:
				if (this.token?.type!==TokenType.LineDelim){
					if (!this.doExpression()) return false;
				}else{
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilBool() );
				}
				break;
			case IdentityType.StringFunction:
				if (this.token?.type!==TokenType.LineDelim){
					if (!this.doStringExpression()) return false;
				}else{
					this.program.addMov( Program.unlinkedReg("eax"), Program.unlinkedNilString() );
				}
				break;
			default:
				return this.setError("Expected return type of "+returnType.toString());
		}
		this.program.addJmp( returnToBranch );
		return this.match(TokenType.LineDelim);
	}
	
	doAssignment(wantsDelim=true){
		let varName=this.token.value;

		if (!this.match(TokenType.Ident)) return false;
		let identObj = this.getIdentity(varName);
		if (!identObj) return this.setError("Tried to assign to undefined '"+varName+"'");

		if (!this.match(TokenType.Assignment)) return false;

		switch (identObj.type){
			case IdentityType.String:
				if (!this.doStringExpression()) return false;
				this.program.addMov( Program.unlinkedString(identObj.scope, identObj.index, varName), Program.unlinkedReg("eax") );
				break;
			case IdentityType.Double:
				if (!this.doExpression()) return false;
				this.program.addMov( Program.unlinkedDouble(identObj.scope, identObj.index, varName), Program.unlinkedReg("eax") );
				break;
			case IdentityType.Bool:
				if (!this.doExpression()) return false;
				this.program.addMov( Program.unlinkedBool(identObj.scope, identObj.index, varName), Program.unlinkedReg("eax") );
				break;
			default:
				return this.setError("Tried to do assignment to invalid type");
		}

		if (wantsDelim===true) return this.match(TokenType.LineDelim);
		return true;
	}

	doIdentStatement(){
		let identName = this.token.value;

		let identObj = this.getIdentity(identName);
		if (!identObj) return this.setError("Trying to operate on undefined '"+identName+"'");

		switch (identObj.type){
			case IdentityType.Double:
			case IdentityType.Bool:
			case IdentityType.String:
				return this.doAssignment();
			case IdentityType.BoolFunction:
			case IdentityType.DoubleFunction:
			case IdentityType.StringFunction:
				if (!this.doFuncCall(true, true, true)) return false;
				return this.match(TokenType.LineDelim);
		}
		return this.setError("Invalid identity type "+identName+":"+identObj.type.toString())
	}

	doStatement(breakToBranch, returnToBranch, returnType){
		switch (this.token.type){
			case TokenType.If:
				if (!this.doIf(breakToBranch, returnToBranch, returnType)) return false;
				break;
			case TokenType.While:
				if (!this.doWhile(returnToBranch, returnType)) return false;
				break;
			case TokenType.For:
				if (!this.doFor(returnToBranch, returnType)) return false;
				break;
			case TokenType.Loop:
				if (!this.doLoop(returnToBranch, returnType)) return false;
				break;
			case TokenType.Break:
				if (!this.doBreak(breakToBranch)) return false;
				break;

			case TokenType.Exit:
				if (!this.doExit()) return false;
				break;

			case TokenType.Return:
				if (!this.doReturn(returnToBranch, returnType)) return false;
				break;

			case TokenType.Double:
				if (!this.doDouble()) return false;
				break;
			case TokenType.String:
				if (!this.doString()) return false;
				break;
			case TokenType.Bool:
				if (!this.doBool()) return false;
				break;

			case TokenType.Ident:
				if (!this.doIdentStatement()) return false;
				break;
				
			case TokenType.LeftCurly:
				if (!this.doBlock(breakToBranch, returnToBranch, true, false, false, returnType)) return false;
				break;

			case TokenType.LineDelim:
				if (!this.match(TokenType.LineDelim)) return false;
				break;

			default:
				return this.setError("Unexpected token in block, "+this.token.type.toString());
		}
		return true;
	}

	doBlock(breakToBranch, returnToBranch, ifNeedsCurlys, couldBeStatment, dontPushScope=false, returnType=null){
		if (!dontPushScope) this.pushScope();


		let hasCurlys = false;

		if (!ifNeedsCurlys && !this.isNotEnd()) return true;//End of the program, and we're not expecting a closing '}'

		if (ifNeedsCurlys || this.token?.type===TokenType.LeftCurly){
			if (!this.match(TokenType.LeftCurly)) return false;
			hasCurlys=true;
		}  

		while (this.isNotEnd()){
			if (this.token.type===TokenType.RightCurly){
				if (hasCurlys){
					this.match(TokenType.RightCurly);
					hasCurlys=false;
					break;
				} 
				return this.setError("Unexpected token in block, "+this.token.type.toString());
			}
			if (!this.doStatement(breakToBranch, returnToBranch, returnType)) return false;

			if (couldBeStatment && hasCurlys===false) break;
		}

		if (hasCurlys) return this.setError("Got to the end of the file without getting an expected "+TokenType.RightCurly.toString());

		if (!dontPushScope) this.popScope();
		return true;
	}
}

module.exports={Parser, IdentityType};