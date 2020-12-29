const Utils = require("./Utils");
const {OpObjType, OpObj, RegisterObj, StringObj, NumberObj, BoolObj} = require('./OpObjs');

const OpCode = {
	label:	Symbol("label"),
	jmp:		Symbol("jmp"),

	cmp:		Symbol("cmp"),
	test:	Symbol("test"),
	
	je:		Symbol("je"),
	jne:		Symbol("jne"),
	ja:		Symbol("ja"),
	jae:		Symbol("jae"),
	jb:		Symbol("jb"),
	jbe:		Symbol("jbe"),

	se:		Symbol("se"),
	sne:		Symbol("sne"),
	sa:		Symbol("sa"),
	sae:		Symbol("sae"),
	sb:		Symbol("sb"),
	sbe:		Symbol("sbe"),

	exit:	Symbol("exit"),
	ceil:	Symbol("ceil"),
	floor:	Symbol("floor"),
	abs:		Symbol("abs"),
	min:		Symbol("min"),
	max:		Symbol("max"),
	clamp:	Symbol("clamp"),
	excall:	Symbol("excall"),
	call:	Symbol("call"),
	ret:		Symbol("ret"),
	todouble:	Symbol("todouble"),
	len:		Symbol("len"),
	strcmp:	Symbol("strcmp"),
	stricmp:	Symbol("stricmp"),
	lcase:	Symbol("lcase"),
	ucase:	Symbol("ucase"),
	trim:	Symbol("trim"),
	substr:	Symbol("substr"),
	tostring:	Symbol("tostring"),
	concat:	Symbol("concat"),
	double:	Symbol("double"),
	bool:	Symbol("bool"),
	string:	Symbol("string"),
	pushscope:Symbol("pushscope"),
	popscope:	Symbol("popscope"),
	push:	Symbol("push"),
	pop:		Symbol("pop"),
	codeline:	Symbol("codeLine"),
	mov:		Symbol("mov"),
	and:		Symbol("and"),
	or:		Symbol("or"),
	add:		Symbol("add"),
	sub:		Symbol("sub"),
	mul:		Symbol("mul"),
	div:		Symbol("div"),
	mod:		Symbol("mod"),
	exponent:	Symbol("exponent"),
	not:		Symbol("not"),
	neg:		Symbol("neg"),
	scopedepth:Symbol("scopedepth")
}

const UnlinkedType={
	register:		Symbol("register"),
	double:		Symbol("double"),
	bool:		Symbol("bool"),
	string:		Symbol("string"),
	doubleLiteral:	Symbol("double literal"),
	boolLiteral:	Symbol("bool literal"),
	stringLiteral:	Symbol("string literal"),
	nilDouble:	Symbol("nil double"),
	nilBool:		Symbol("nil bool"),
	nilString:	Symbol("nil string"),
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
	static unlinkedDouble(scope, index, debugName=null){	return {type: UnlinkedType.double,	scope: Number(scope), index: Number(index), debugName: debugName}; }
	static unlinkedBool(scope, index, debugName=null){		return {type: UnlinkedType.bool,	scope: Number(scope), index: Number(index), debugName: debugName}; }
	static unlinkedString(scope, index, debugName=null){	return {type: UnlinkedType.string,	scope: Number(scope), index: Number(index), debugName: debugName}; }
	static unlinkedDoubleLiteral(value){	return {type: UnlinkedType.doubleLiteral,	value: Number(value)}; }
	static unlinkedBoolLiteral(value){		return {type: UnlinkedType.boolLiteral,		value: Boolean(value)}; }
	static unlinkedStringLiteral(value){	return {type: UnlinkedType.stringLiteral,	value: String(value)};}
	static unlinkedNilDouble(){				return {type: UnlinkedType.nilDouble}; }
	static unlinkedNilBool(){				return {type: UnlinkedType.nilBool}; }
	static unlinkedNilString(){				return {type: UnlinkedType.nilString}; }

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
	}


	unlinkedsEqual(obj, obj1){
		if (obj.type!==obj1.type) return false;
		if (obj.type===UnlinkedType.register){
			if (obj.register!==obj1.register) return false;
			return true;
		}
		switch (obj.type){
			case UnlinkedType.double:
			case UnlinkedType.bool:
			case UnlinkedType.string:
				if (obj.scope!==obj1.scope || obj.index!==obj1.index) return false;
				return true;

			case UnlinkedType.doubleLiteral:
			case UnlinkedType.boolLiteral:
			case UnlinkedType.stringLiteral:
				if (obj.value!==obj1.value) return false;
				return true;
		}
		return true;//must be a nil literal			
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
						} else if (nxt.type===OpCode.cmp && cur.obj0.type==UnlinkedType.register && (this.unlinkedsEqual(cur.obj0, nxt.obj0) || this.unlinkedsEqual(cur.obj0, nxt.obj1))){// mov(eax, X) + cmp(eax, Y) => cmp(X, Y)
							if (this.unlinkedsEqual(cur.obj0, nxt.obj0)){ 
								nxt.obj0=cur.obj1;
								this.code.splice(i,1);
								i--;
								stillOptimizing=true;
							}else if (this.unlinkedsEqual(cur.obj0, nxt.obj1)){	// mov(eax, X) + cmp(Y, eax) => cmp(Y, X)
								nxt.obj1=cur.obj1;
								this.code.splice(i,1);
								i--;
								stillOptimizing=true;
							}
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
			if (this.codeState!==Program.CodeState.OPTIMIZED) return Utils.newErrorObj("error optimizing.");
		}

		const labelMap = new Map();
		for (let i=0;i<this.code.length;i++){//Make a map of all the labels and there indexes
			if (this.code[i].type===OpCode.label){
				if (labelMap.has(this.code[i].id)){
					return Utils.newErrorObj("error linking, "+this.code[i].id+" was already defined.");
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
		return null;
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
				return null;

			case UnlinkedType.double:
			case UnlinkedType.bool:
			case UnlinkedType.string:
				return scopes[obj.scope][scopes[obj.scope].length-1][obj.index];

			case UnlinkedType.doubleLiteral:
				return new NumberObj(null, obj.value, true);
			case UnlinkedType.boolLiteral:
				if (obj.value) return this.true;
				return this.false;
			case UnlinkedType.stringLiteral:
				return new StringObj(null, obj.value, true);

			case UnlinkedType.nilDouble:
				return NumberObj.null();
			case UnlinkedType.nilBool:
				return BoolObj.null();
			case UnlinkedType.nilString:
				return StringObj.null();
		}		
		return null;
	}


	executionError(eip, message){
		return Utils.newErrorObj(eip, message);
	}

	execute(externals){
		const link = (obj) => this.linkedObject(obj, scopes);

		if (this.codeState!==Program.CodeState.READY){
			return this.executionError(null, "tried executing on unlinked code")
		}
		this.debugCodeLine=1;

		let notDone=true;
		let eip = 0;

		let scopes=[[externals]];

		let callStack=[];
		let stack=[];

		let flag_e=false;
		let flag_a=false;
		let flag_b=false;

		let errMsg=null;
		
			while (notDone && eip<this.code.length){
				let opcode=this.code[eip];
				let obj0=null;
				let obj1=null;
				let obj2=null;
				switch (opcode.type){
					case OpCode.label:
						break;

					case OpCode.excall:
						if ( (errMsg=this.eax.setTo(externals[opcode.id]( () => stack.pop() ))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.call:
						callStack.push(eip+1);
						eip=opcode.id;
						continue;
					case OpCode.ret:
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
						flag_a=obj0.greaterThan(obj1);
						flag_b=obj0.smallerThan(obj1);
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
						if ( (errMsg=link(opcode.obj0).setTo(flag_e?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sne:
						if ( (errMsg=link(opcode.obj0).setTo(!flag_e?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sa:
						if ( (errMsg=link(opcode.obj0).setTo(flag_a?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sae:
						if ( (errMsg=link(opcode.obj0).setTo(flag_a||flag_e?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sb:
						if ( (errMsg=link(opcode.obj0).setTo(flag_b?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sbe:
						if ( (errMsg=link(opcode.obj0).setTo(flag_b||flag_e?this.true:this.false)) !==null ) return this.executionError(eip, errMsg);
						break;
						
					case OpCode.ceil:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to do ceil on null value");	
						if ( (errMsg=obj0.setTo(new NumberObj(null, Math.ceil(obj0.value), true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.floor:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to do floor on null value");
						if ( (errMsg=obj0.setTo(new NumberObj(null, Math.floor(obj0.value), true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.abs:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to do abs on null value");	
						if ( (errMsg=obj0.setTo(new NumberObj(null, Math.abs(obj0.value), true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.min:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) return this.executionError(eip, "tried to do min on null value");	
						if (obj1.value===null) return this.executionError(eip, "tried to do min on null value");	
						if ( (errMsg=obj0.setTo( new NumberObj(null, Math.min(obj0.value, obj1.value), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.max:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) return this.executionError(eip, "tried to do max on null value");	
						if (obj1.value===null) return this.executionError(eip, "tried to do max on null value");	
						if ( (errMsg=obj0.setTo( new NumberObj(null, Math.max(obj0.value, obj1.value), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.clamp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) return this.executionError(eip, "tried to do clamp on null value");	
						if (obj1.value===null) return this.executionError(eip, "tried to do clamp on null value");	
						if (obj2.value===null) return this.executionError(eip, "tried to do clamp on null value");	
						if ( (errMsg=obj0.setTo( new NumberObj(null, Math.min(Math.max(obj0.value, obj1.value), obj2.value), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.todouble:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to convert null to double");	
						if ( (errMsg=obj0.setTo(new NumberObj(null, Number(obj0.value), true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.len:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to get length of null string");
						if ( (errMsg=obj0.setTo(new NumberObj(null, obj0.value.length, true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.strcmp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if ( (errMsg=obj0.setTo(new BoolObj(null, obj0.value===obj1.value, true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.stricmp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if ( (errMsg=obj0.setTo(new BoolObj(null, obj0.value.toLowerCase()===obj1.value.toLowerCase(), true))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.lcase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to set null string to lower case");
						if ( (errMsg=obj0.setTo( new StringObj(null, obj0.value.toLowerCase(), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.ucase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to set null string to upper case");
						if ( (errMsg=obj0.setTo( new StringObj(null, obj0.value.toUpperCase(), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.trim:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to trim null string");
						if ( (errMsg=obj0.setTo( new StringObj(null, obj0.value.trim(), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.substr:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) return this.executionError(eip, "tried to get substring of null string");
						if (obj1.value===null) return this.executionError(eip, "tried to get substring with null index");
						if (obj2.value===null) return this.executionError(eip, "tried to get substring with null length");
						if ( (errMsg=obj0.setTo( new StringObj(null, obj0.value.substr(obj1.value, obj2.value), true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.tostring:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) return this.executionError(eip, "tried to convert null to string");
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
						if ( (errMsg=obj0.setTo( new StringObj(null, val, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.concat:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) return this.executionError(eip, "tried to concat null to string");
						if (obj1.value===null) return this.executionError(eip, "tried to concat string to null");
						if ( (errMsg=obj0.setTo( new StringObj(null, obj0.value+obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
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
						if ( (errMsg=link(opcode.obj0).setTo(stack.pop())) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.codeline:
						//essentially a nop
						//used for debugging, shows when there was a line break in the original code
						if (opcode.code!==null){
							this.debugCodeLine++;
						}
						break;
					case OpCode.mov:
						if ( (errMsg=link(opcode.obj0).setTo(link(opcode.obj1))) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.and:
						obj0=link(opcode.obj0);
						if ( (errMsg=obj0.setTo( new BoolObj(null, obj0.value && link(opcode.obj1).value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.or:
						obj0=link(opcode.obj0);
						if ( (errMsg=obj0.setTo( new BoolObj(null, obj0.value || link(opcode.obj1).value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.add:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) return this.executionError(eip, "tried to add null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value + obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.sub:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) return this.executionError(eip, "tried to sub null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value - obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.mul:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value * obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.div:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) return this.executionError(eip, "tried to div null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value / obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.mod:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) return this.executionError(eip, "tried to mod null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value % obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.exponent:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) return this.executionError(eip, "tried to ^ null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, obj0.value ** obj1.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.not:
						obj0=link(opcode.obj0);
						if ( (errMsg=obj0.setTo( new BoolObj(null, !obj0.value, true) )) !==null ) return this.executionError(eip, errMsg);
						break;
					case OpCode.neg:
						obj0=link(opcode.obj0);
						if (obj0.value===null) return this.executionError(eip, "tried to neg null");
						if ( (errMsg=obj0.setTo( new NumberObj(null, 0-obj0.value, true) )) !==null ) return this.executionError(eip, errMsg);
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
	}

	addRet			()					{ this.code.push( {type: OpCode.ret} ); }
	addLabel			(id)					{ this.code.push( {type: OpCode.label,		id: id} ); }
	addJmp			(id)					{ this.code.push( {type: OpCode.jmp,		id: id} ); }
	addJE			(id)					{ this.code.push( {type: OpCode.je,		id: id} ); }
	addJNE			(id)					{ this.code.push( {type: OpCode.jne,		id: id} ); }
	addScopeDepth		(size)				{ this.code.push( {type: OpCode.scopedepth,	size: size} ); }
	addTest			(obj0)				{ this.code.push( {type: OpCode.test,		obj0: obj0} ); }
	addSE			(obj0)				{ this.code.push( {type: OpCode.se,		obj0: obj0} ); }
	addSNE			(obj0)				{ this.code.push( {type: OpCode.sne,		obj0: obj0} ); }
	addSA			(obj0)				{ this.code.push( {type: OpCode.sa,		obj0: obj0} ); }
	addSAE			(obj0)				{ this.code.push( {type: OpCode.sae,		obj0: obj0} ); }
	addSB			(obj0)				{ this.code.push( {type: OpCode.sb,		obj0: obj0} ); }
	addSBE			(obj0)				{ this.code.push( {type: OpCode.sbe,		obj0: obj0} ); }
	addExit			(obj0)				{ this.code.push( {type: OpCode.exit,		obj0: obj0} ); }
	addCeil			(obj0)				{ this.code.push( {type: OpCode.ceil,		obj0: obj0} ); }
	addFloor			(obj0)				{ this.code.push( {type: OpCode.floor,		obj0: obj0} ); }
	addAbs			(obj0)				{ this.code.push( {type: OpCode.abs,		obj0: obj0} ); }
	addToDouble		(obj0)				{ this.code.push( {type: OpCode.todouble,	obj0: obj0} ); }
	addLen			(obj0)				{ this.code.push( {type: OpCode.len,		obj0: obj0} ); }
	addLCase			(obj0)				{ this.code.push( {type: OpCode.lcase,		obj0: obj0} ); }
	addUCase			(obj0)				{ this.code.push( {type: OpCode.ucase,		obj0: obj0} ); }
	addTrim			(obj0)				{ this.code.push( {type: OpCode.trim,		obj0: obj0} ); }
	addDouble			(obj0)				{ this.code.push( {type: OpCode.double,		obj0: obj0} ); }
	addBool			(obj0)				{ this.code.push( {type: OpCode.bool,		obj0: obj0} ); }
	addString			(obj0)				{ this.code.push( {type: OpCode.string,		obj0: obj0} ); }
	addPush			(obj0)				{ this.code.push( {type: OpCode.push,		obj0: obj0} ); }
	addPop			(obj0)				{ this.code.push( {type: OpCode.pop,		obj0: obj0} ); }
	addNot			(obj0)				{ this.code.push( {type: OpCode.not,		obj0: obj0} ); }
	addNeg			(obj0)				{ this.code.push( {type: OpCode.neg,		obj0: obj0} ); }
	addCodeLine		(code)				{ this.code.push( {type: OpCode.codeline,	code: code} ); }
	addPopScope		(scope)				{ this.code.push( {type: OpCode.popscope,	scope: scope} ); }
	addToString		(obj0, obj1)			{ this.code.push( {type: OpCode.tostring,	obj0: obj0, obj1: obj1} ); }
	addCmp			(obj0, obj1)			{ this.code.push( {type: OpCode.cmp,		obj0: obj0, obj1: obj1} ); }
	addConcat			(obj0, obj1)			{ this.code.push( {type: OpCode.concat,		obj0: obj0, obj1: obj1} ); }
	addStrCmp			(obj0, obj1)			{ this.code.push( {type: OpCode.strcmp,		obj0: obj0, obj1: obj1} ); }
	addStrICmp		(obj0, obj1)			{ this.code.push( {type: OpCode.stricmp,	obj0: obj0, obj1: obj1} ); }
	addMin			(obj0, obj1)			{ this.code.push( {type: OpCode.min,		obj0: obj0, obj1: obj1} ); }
	addMax			(obj0, obj1)			{ this.code.push( {type: OpCode.max,		obj0: obj0, obj1: obj1} ); }
	addMov			(obj0, obj1)			{ this.code.push( {type: OpCode.mov,		obj0: obj0, obj1: obj1} ); }
	addAnd			(obj0, obj1)			{ this.code.push( {type: OpCode.and,		obj0: obj0, obj1: obj1} ); }
	addOr			(obj0, obj1)			{ this.code.push( {type: OpCode.or,		obj0: obj0, obj1: obj1} ); }
	addAdd			(obj0, obj1)			{ this.code.push( {type: OpCode.add,		obj0: obj0, obj1: obj1} ); }
	addSub			(obj0, obj1)			{ this.code.push( {type: OpCode.sub,		obj0: obj0, obj1: obj1} ); }
	addMul			(obj0, obj1)			{ this.code.push( {type: OpCode.mul,		obj0: obj0, obj1: obj1} ); }
	addDiv			(obj0, obj1)			{ this.code.push( {type: OpCode.div,		obj0: obj0, obj1: obj1} ); }
	addMod			(obj0, obj1)			{ this.code.push( {type: OpCode.mod,		obj0: obj0, obj1: obj1} ); }
	addExponent		(obj0, obj1)			{ this.code.push( {type: OpCode.exponent,	obj0: obj0, obj1: obj1} ); }
	addPushScope		(scope, size)			{ this.code.push( {type: OpCode.pushscope,	scope: scope, size: size} ); }
	addCall			(id, debugName)		{ this.code.push( {type: OpCode.call,		id: id, debugName: debugName} ); }
	addExCall			(id, debugName)		{ this.code.push( {type: OpCode.excall,		id: id, debugName: debugName} ); }
	addSubStr			(obj0, obj1, obj2)		{ this.code.push( {type: OpCode.substr,		obj0: obj0, obj1: obj1, obj2: obj2} ); }
	addClamp			(obj0, obj1, obj2)		{ this.code.push( {type: OpCode.clamp,		obj0: obj0, obj1: obj1, obj2: obj2} ); }



	//debugger stuff
	//unlinkedObj to english
	linkToEnglish(obj){
		switch (obj.type){
			case UnlinkedType.register:
				return " "+obj.debugName;
			case UnlinkedType.double:
			case UnlinkedType.bool:
			case UnlinkedType.string:
				return " _"+obj.debugName;

			case UnlinkedType.doubleLiteral:
				case UnlinkedType.boolLiteral:
				return obj.value.toString();
			case UnlinkedType.stringLiteral:
				return '"'+obj.value+'"';

			case UnlinkedType.nilDouble:
			case UnlinkedType.nilBool:
			case UnlinkedType.nilString:
				return "null";
		}		
		return null;										
	}

	getDebugOutput(onlyPrintOpCodes=false){
		let codeLine=0;
		let output=String("DISASSEMBLED VIEW - Length: "+this.code.reduce((prev, cur)=>(prev+(cur.type!==OpCode.codeline && cur.type!==OpCode.label)),0))+"\n";
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
				case OpCode.len:
					asm+="len "+this.linkToEnglish(opcode.obj0);
					break;
				case OpCode.strcmp:
					asm+="strcmp "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
					break;
				case OpCode.stricmp:
					asm+="stricmp "+this.linkToEnglish(opcode.obj0)+", "+this.linkToEnglish(opcode.obj1);
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
		output+="END DISASSEMBLED VIEW";
		return output;
	}

}


module.exports={Program};