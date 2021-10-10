import {Utils, IdentityType} from "./Utils.js";
import {OpObjType, NullObj, RegisterObj, StringObj, NumberObj, BoolObj} from './OpObjs.js';


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
	null:		Symbol("null"),
}


class Program {
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
			default:
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

				switch (cur.type){
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
					default:
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
				default:
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
					default:
						this.executionError("unknown register");
				}
				break;

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
				break;

			case UnlinkedType.null:
				return this.null;

			default:
				this.executionError("unknown unlinked object type");
		}		
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

			const scopes=[[externals]];

			const callStack=[];
			const stack=[];

			let flag_e=false;
			let flag_a=false;
			let flag_b=false;
		
			while (notDone && eip<this.code.length){
				let opcode=this.code[eip];
				let obj0=null;
				let obj1=null;
				let obj2=null;
				switch (opcode.type){
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
						flag_e=obj0.equalTo(obj1);
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
						if (obj0.value!==null){
							obj0.setTo(new NumberObj(null, Math.ceil(obj0.value), true));
						}
						break;
					case OpCode.floor:
						obj0 = link(opcode.obj0);
						if (obj0.value!==null){
							obj0.setTo(new NumberObj(null, Math.floor(obj0.value), true));
						}
						break;
					case OpCode.abs:
						obj0 = link(opcode.obj0);
						if (obj0.value!==null){
							obj0.setTo(new NumberObj(null, Math.abs(obj0.value), true));
						}
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
						if (obj0.value===null){
							obj0.setTo(new NumberObj(null, null, true));
						}else{
							if (obj0.value===true || obj0.value===false){
								obj0.setTo(new NumberObj(null, obj0.value), true);
							}else{
								obj0.setTo(new NumberObj(null, Number.parseFloat(String(obj0.value)), true));
							}
						}
						break;
					case OpCode.tobool:
						obj0 = link(opcode.obj0);
						if (obj0.value===null){
							obj0.setTo(new BoolObj(null, null, true));
						}else{
							obj0.setTo(new BoolObj(null, Boolean(obj0.value), true));
						}
						break;
					case OpCode.len:
						obj0 = link(opcode.obj0);
						if (obj0.value===null){
							obj0.setTo(new NumberObj(null, null, true));
						}else{
							obj0.setTo(new NumberObj(null, obj0.value.length, true));
						}
						break;

					case OpCode.lcase:
						obj0 = link(opcode.obj0);
						if (obj0.value!==null){
							obj0.setTo( new StringObj(null, obj0.value.toLowerCase(), true) );
						}
						break;
					case OpCode.ucase:
						obj0 = link(opcode.obj0);
						if (obj0.value!==null){
							obj0.setTo( new StringObj(null, obj0.value.toUpperCase(), true) );
						}
						break;
					case OpCode.trim:
						obj0 = link(opcode.obj0);
						if (obj0.value!==null){
							obj0.setTo( new StringObj(null, obj0.value.trim(), true) );
						}
						break;
					case OpCode.substr:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null || obj1.value===null){
							obj0.setTo( new StringObj(null, null, true) );
						}else{
							if (obj2.value===null){
								obj0.setTo( new StringObj(null, obj0.value.substr(obj1.value), true) );
							}else{
								obj0.setTo( new StringObj(null, obj0.value.substr(obj1.value, obj2.value), true) );
							}
						}
						break;
					case OpCode.tostring:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null){
							obj0.setTo( new StringObj(null, null, true) );
						}else{
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
						}
						break;
					case OpCode.concat:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						const a = obj0.value===null ? "null" : obj0.value;
						const b = obj1.value===null ? "null" : obj1.value;
						obj0.setTo( new StringObj(null, a+b, true) );
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
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to do && with a null value");
						obj0.setTo( new BoolObj(null, obj0.value && obj1.value, true) );
						break;
					case OpCode.or:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) this.executionError("tried to do || with a null value");
						obj0.setTo( new BoolObj(null, obj0.value || obj1.value, true) );
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
						if (obj0.value===null || obj1.value===null) this.executionError("tried to mul null");
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
					default:
				}
				eip++;
			}

			return new BoolObj(null, true, true);
		} catch (error) {
			let callTraceMsg="\n";
			for (const callData of trace.reverse()){
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
				return " _"+obj.debugName+"  ;"+obj.scope+":"+obj.index;
			case UnlinkedType.literal:
				return obj.value.toString();
			case UnlinkedType.null:
				return "null";
			default:
				return "unknown";
		}
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

Program.regSymbols = {eax: Symbol("eax"), ebx: Symbol("ebx"), ecx: Symbol("ecx")};
Program.unlinkedReg = (registerName) => {
	switch (registerName.trim().toLowerCase()){
			case "eax":	return {type: UnlinkedType.register, register: Program.regSymbols.eax, debugName:"eax"}
			case "ebx":	return {type: UnlinkedType.register, register: Program.regSymbols.ebx, debugName:"ebx"}
			case "ecx":	return {type: UnlinkedType.register, register: Program.regSymbols.ecx, debugName:"ecx"}
			default:
	}
	this.otherError("no register with the name "+registerName+" exists");
}
Program.unlinkedVariable = (type, scope, index, debugName=null) => { return {type: UnlinkedType.variable, identType: type, scope, index, debugName}; }
Program.unlinkedLiteral = (type, value) => { return {type: UnlinkedType.literal, literalType: type,	value}; }
Program.unlinkedNull = () => ({type: UnlinkedType.null});

Program.CodeState = {
	BUILDING: Symbol("Building"),
	OPTIMIZED: Symbol("Optimized"),
	READY: Symbol("Ready"),
}


export {Program, OpCode, UnlinkedType};