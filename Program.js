const Utils = require("./Utils");
const {OpObjType, OpObj, RegisterObj, StringObj, NumberObj, BoolObj} = require('./OpObjs');

const OpCode = {
	label:      Symbol("label"),
	jmp:        Symbol("jmp"),
	je:         Symbol("je"),
	jne:        Symbol("jne"),
	test:       Symbol("test"),
	cmp:        Symbol("cmp"),
	se:         Symbol("se"),
	sne:        Symbol("sne"),
	sa:         Symbol("sa"),
	sae:        Symbol("sae"),
	sb:         Symbol("sb"),
	sbe:        Symbol("sbe"),
	exit:       Symbol("exit"),
	ceil:       Symbol("ceil"),
	floor:      Symbol("floor"),
	abs:        Symbol("abs"),
	min:        Symbol("min"),
	max:        Symbol("max"),
	clamp:      Symbol("clamp"),
	excall:     Symbol("excall"),
	call:       Symbol("call"),
	ret:        Symbol("ret"),
	todouble:   Symbol("todouble"),
	len:        Symbol("len"),
	strcmp:     Symbol("strcmp"),
	stricmp:    Symbol("stricmp"),
	lcase:      Symbol("lcase"),
	ucase:      Symbol("ucase"),
	trim:       Symbol("trim"),
	substr:     Symbol("substr"),
	tostring:   Symbol("tostring"),
	concat:     Symbol("concat"),
	double:     Symbol("double"),
	bool:       Symbol("bool"),
	string:     Symbol("string"),
	pushscope:  Symbol("pushscope"),
	popscope:   Symbol("popscope"),
	push:       Symbol("push"),
	pop:        Symbol("pop"),
	___unused:	Symbol("___unused"),
	mov:        Symbol("mov"),
	and:        Symbol("and"),
	or:         Symbol("or"),
	add:        Symbol("add"),
	sub:        Symbol("sub"),
	mul:        Symbol("mul"),
	div:        Symbol("div"),
	mod:        Symbol("mod"),
	exponent:   Symbol("exponent"),
	not:        Symbol("not"),
	neg:        Symbol("neg"),
	scopedepth:	Symbol("scopedepth")
}

const UnlinkedType={
	register:		1,
	double:			2,
	bool:			3,
	string:			4,
	doubleLiteral: 	5,
	boolLiteral: 	6,
	stringLiteral: 	7,
	nilDouble:		8,
	nilBool:		9,
	nilString:		10,
}



class Program {
	static regSymbols = {eax: Symbol("eax"), ebx: Symbol("ebx"), ecx: Symbol("ecx")};
	static unlinkedReg(registerName){
		switch (registerName.trim().toLowerCase()){
			 case "eax":	return {type: UnlinkedType.register, register: Program.regSymbols.eax}
			 case "ebx":	return {type: UnlinkedType.register, register: Program.regSymbols.ebx}
			 case "ecx":	return {type: UnlinkedType.register, register: Program.regSymbols.ecx}
		}
		return null;
	}
	static unlinkedDouble(scope, index){ 	return {type: UnlinkedType.double,	scope: Number(scope), index: Number(index)}; }
	static unlinkedBool(scope, index){ 		return {type: UnlinkedType.bool,	scope: Number(scope), index: Number(index)}; }
	static unlinkedString(scope, index){ 	return {type: UnlinkedType.string,	scope: Number(scope), index: Number(index)}; }
	static unlinkedDoubleLiteral(value){ 	return {type: UnlinkedType.doubleLiteral,	value: Number(value)}; }
	static unlinkedBoolLiteral(value){ 		return {type: UnlinkedType.boolLiteral,		value: Boolean(value)}; }
	static unlinkedStringLiteral(value){ 	return {type: UnlinkedType.stringLiteral,	value: String(value)};}
	static unlinkedNilDouble(){				return {type: UnlinkedType.nilDouble}; }
	static unlinkedNilBool(){				return {type: UnlinkedType.nilBool}; }
	static unlinkedNilString(){				return {type: UnlinkedType.nilString}; }

	constructor(){
		this.errorObj=null;
		this.code=[];

		this.linkedCode=[];

		this.eax=new RegisterObj("eax");
		this.ebx=new RegisterObj("ebx");
		this.ecx=new RegisterObj("ecx");
		this.true=new BoolObj("true", true, true);
		this.false=new BoolObj("false", false, true);
		this.zero=new NumberObj("zero",0,true);
	}

	link(){//TODO remove label objects instead of leaving them in for optimization
		const labelMap = new Map();
		for (let i=0;i<this.code.length;i++){//Make a map of all the labels and there indexes
			if (this.code[i].type===OpCode.label){
				if (labelMap.has(this.code[i].id)){
					return Utils.newErrorObj("error linking, "+this.code[i].id+" was already defined.");
				}
				labelMap.set(this.code[i].id, i);
			}
		}

		for (let i=0;i<this.code.length;i++){//Now go through and update the id's of all the codes that can/will jump
			switch (this.code[i].type){
				case OpCode.jmp:
				case OpCode.je:
				case OpCode.jne:
				case OpCode.call:
					this.code[i].id=labelMap.get(this.code[i].id);
					break;
			}
		}
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
				return new BoolObj(null, obj.value, true);
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

	execute(externals){
		let notDone=true;
		let eip = 0;

		let scopes=[[externals]];
		const link = (obj) => this.linkedObject(obj, scopes);

		let callStack=[];
		let stack=[];

		let flag_e=false;
		let flag_a=false;
		let flag_b=false;
		try {
			while (notDone && eip<this.code.length){
				let opcode=this.code[eip];
				//console.log(opcode);
				let obj0=null;
				let obj1=null;
				let obj2=null;
				switch (opcode.type){
					case OpCode.label:
						//dont do nothing, essentially a NOP
						break;
					case OpCode.jmp:
						eip=opcode.id;
						break;
					case OpCode.je:
						if (flag_e) eip=opcode.id;
						break;
					case OpCode.jne:
						if (!flag_e) eip=opcode.id;
						break;
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
					case OpCode.se:
						link(opcode.obj0).setTo(flag_e?this.true:this.false);
						break;
					case OpCode.sne:
						link(opcode.obj0).setTo(!flag_e?this.true:this.false);
						break;
					case OpCode.sa:
						link(opcode.obj0).setTo(flag_a?this.true:this.false);
						break;
					case OpCode.sae:
						link(opcode.obj0).setTo(flag_a||flag_e?this.true:this.false);
						break;
					case OpCode.sb:
						link(opcode.obj0).setTo(flag_b?this.true:this.false);
						break;
					case OpCode.sbe:
						link(opcode.obj0).setTo(flag_b||flag_e?this.true:this.false);
						break;
					case OpCode.exit:
						return (link(opcode.obj0).getCopy(true));
					case OpCode.ceil:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to do ceil on null value");						
						obj0.setTo( new NumberObj(null, Math.ceil(obj0.value), true) );
						break;
					case OpCode.floor:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to do floor on null value");	
						obj0.setTo( new NumberObj(null, Math.floor(obj0.value), true) );
						break;
					case OpCode.abs:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to do abs on null value");	
						obj0.setTo( new NumberObj(null, Math.abs(obj0.value), true) );
						break;
					case OpCode.min:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) throw Error("tried to do min on null value");	
						if (obj1.value===null) throw Error("tried to do min on null value");	
						obj0.setTo( new NumberObj(null, Math.min(obj0.value, obj1.value), true) );
						break;
					case OpCode.max:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) throw Error("tried to do max on null value");	
						if (obj1.value===null) throw Error("tried to do max on null value");	
						obj0.setTo( new NumberObj(null, Math.max(obj0.value, obj1.value), true) );
						break;
					case OpCode.clamp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) throw Error("tried to do clamp on null value");	
						if (obj1.value===null) throw Error("tried to do clamp on null value");	
						if (obj2.value===null) throw Error("tried to do clamp on null value");	
						obj0.setTo( new NumberObj(null, Math.min(Math.max(obj0.value, obj1.value), obj2.value), true) );
						break;
					case OpCode.excall:
						this.eax.setTo(externals[opcode.id]( () => stack.pop() ));
						break;
					case OpCode.call:
						callStack.push(eip+1);
						eip=opcode.id;
						break;
					case OpCode.ret:
						eip=callStack.pop();
						continue;
					case OpCode.todouble:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to convert null to double");	
						obj0.setTo(new NumberObj(null, Number(obj0.value), true));
						break;
					case OpCode.len:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to get length of null string");	
						obj0.setTo(new NumberObj(null, obj0.value.length, true));
						break;
					case OpCode.strcmp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj0.setTo(new BoolObj(null, obj0.value===obj1.value, true));
						break;
					case OpCode.stricmp:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj0.setTo(new BoolObj(null, obj0.value.toLowerCase()===obj1.value.toLowerCase(), true));
						break;
					case OpCode.lcase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to set null string to lower case");
						obj0.setTo( new StringObj(null, obj0.value.toLowerCase(), true) );
						break;
					case OpCode.ucase:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to set null string to upper case");
						obj0.setTo( new StringObj(null, obj0.value.toUpperCase(), true) );
						break;
					case OpCode.trim:
						obj0 = link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to trim null string");
						obj0.setTo( new StringObj(null, obj0.value.trim(), true) );
						break;
					case OpCode.substr:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						obj2 = link(opcode.obj2);
						if (obj0.value===null) throw Error("tried to get substring of null string");
						if (obj1.value===null) throw Error("tried to get substring with null index");
						if (obj2.value===null) throw Error("tried to get substring with null length");
						obj0.setTo( new StringObj(null, obj0.value.substr(obj1.value, obj2.value), true) );
						break;
					case OpCode.tostring:
						obj0 = link(opcode.obj0);
						obj1 = link(opcode.obj1);
						if (obj0.value===null) throw Error("tried to convert null to string");
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
						if (obj0.value===null) throw Error("tried to concat null to string");
						if (obj1.value===null) throw Error("tried to concat string to null");
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
					case OpCode.___unused:
						//place holder for something in the future
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
						if (obj0.value===null || obj1.value===null) throw Error("tried to add null");
						obj0.setTo( new NumberObj(null, obj0.value + obj1.value, true) );
						break;
					case OpCode.sub:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) throw Error("tried to sub null");
						obj0.setTo( new NumberObj(null, obj0.value - obj1.value, true) );
						break;
					case OpCode.mul:
						obj0=link(opcode.obj0);
						obj0.setTo( new NumberObj(null, obj0.value * obj1.value, true) );
						break;
					case OpCode.div:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) throw Error("tried to div null");
						obj0.setTo( new NumberObj(null, obj0.value / obj1.value, true) );
						break;
					case OpCode.mod:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) throw Error("tried to mod null");
						obj0.setTo( new NumberObj(null, obj0.value % obj1.value, true) );
						break;
					case OpCode.exponent:
						obj0=link(opcode.obj0);
						obj1=link(opcode.obj1);
						if (obj0.value===null || obj1.value===null) throw Error("tried to ^ null");
						obj0.setTo( new NumberObj(null, obj0.value ** obj1.value, true) );
						break;
					case OpCode.not:
						obj0=link(opcode.obj0);
						obj0.setTo( new BoolObj(null, !obj0.value, true) );
						break;
					case OpCode.neg:
						obj0=link(opcode.obj0);
						if (obj0.value===null) throw Error("tried to neg null");
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
		} catch (err){
			return Utils.newErrorObj(eip,"runtime error: "+err.message);
		}
		return null;
	}

	addRet          ()					{ this.code.push( {type: OpCode.ret} ); }
	addLabel		(id)				{ this.code.push( {type: OpCode.label,		id: id} ); }
	addJmp			(id)				{ this.code.push( {type: OpCode.jmp,		id: id} ); }
	addJE           (id)				{ this.code.push( {type: OpCode.je,			id: id} ); }
	addJNE          (id)				{ this.code.push( {type: OpCode.jne,		id: id} ); }
	addCall         (id)				{ this.code.push( {type: OpCode.call,		id: id} ); }
	addExCall       (id)				{ this.code.push( {type: OpCode.excall,		id: id} ); }
	addScopeDepth	(size)				{ this.code.push( {type: OpCode.scopedepth, size: size} ); }
	addTest         (obj0)				{ this.code.push( {type: OpCode.test,		obj0: obj0} ); }
	addSE           (obj0)				{ this.code.push( {type: OpCode.se,			obj0: obj0} ); }
	addSNE          (obj0)				{ this.code.push( {type: OpCode.sne,		obj0: obj0} ); }
	addSA           (obj0)				{ this.code.push( {type: OpCode.sa,			obj0: obj0} ); }
	addSAE          (obj0)				{ this.code.push( {type: OpCode.sae,		obj0: obj0} ); }
	addSB           (obj0)				{ this.code.push( {type: OpCode.sb,			obj0: obj0} ); }
	addSBE          (obj0)				{ this.code.push( {type: OpCode.sbe,		obj0: obj0} ); }
	addExit         (obj0)				{ this.code.push( {type: OpCode.exit,		obj0: obj0} ); }
	addCeil         (obj0)				{ this.code.push( {type: OpCode.ceil,		obj0: obj0} ); }
	addFloor        (obj0)				{ this.code.push( {type: OpCode.floor,		obj0: obj0} ); }
	addAbs          (obj0)				{ this.code.push( {type: OpCode.abs,		obj0: obj0} ); }
	addToDouble     (obj0)				{ this.code.push( {type: OpCode.todouble,	obj0: obj0} ); }
	addLen          (obj0)				{ this.code.push( {type: OpCode.len,		obj0: obj0} ); }
	addLCase        (obj0)				{ this.code.push( {type: OpCode.lcase,		obj0: obj0} ); }
	addUCase        (obj0)				{ this.code.push( {type: OpCode.ucase,		obj0: obj0} ); }
	addTrim         (obj0)				{ this.code.push( {type: OpCode.trim,		obj0: obj0} ); }
	addDouble       (obj0)				{ this.code.push( {type: OpCode.double,		obj0: obj0} ); }
	addBool         (obj0)				{ this.code.push( {type: OpCode.bool,		obj0: obj0} ); }
	addString       (obj0)				{ this.code.push( {type: OpCode.string,		obj0: obj0} ); }
	addPush         (obj0)				{ this.code.push( {type: OpCode.push,		obj0: obj0} ); }
	addPop          (obj0)				{ this.code.push( {type: OpCode.pop,		obj0: obj0} ); }
	addNot          (obj0)				{ this.code.push( {type: OpCode.not,		obj0: obj0} ); }
	addNeg          (obj0)				{ this.code.push( {type: OpCode.neg,		obj0: obj0} ); }
	addPopScope     (scope)				{ this.code.push( {type: OpCode.popscope,	scope: scope} ); }
	addToString     (obj0, obj1)		{ this.code.push( {type: OpCode.tostring,	obj0: obj0, obj1: obj1} ); }
	addCmp          (obj0, obj1)		{ this.code.push( {type: OpCode.cmp,		obj0: obj0, obj1: obj1} ); }
	addConcat       (obj0, obj1)		{ this.code.push( {type: OpCode.concat,		obj0: obj0, obj1: obj1} ); }
	addStrCmp       (obj0, obj1)		{ this.code.push( {type: OpCode.strcmp,		obj0: obj0, obj1: obj1} ); }
	addStrICmp      (obj0, obj1)		{ this.code.push( {type: OpCode.stricmp,	obj0: obj0, obj1: obj1} ); }
	addMin          (obj0, obj1)		{ this.code.push( {type: OpCode.min,		obj0: obj0, obj1: obj1} ); }
	addMax          (obj0, obj1)		{ this.code.push( {type: OpCode.max,		obj0: obj0, obj1: obj1} ); }
	addMov          (obj0, obj1)		{ this.code.push( {type: OpCode.mov,		obj0: obj0, obj1: obj1} ); }
	addAnd          (obj0, obj1)		{ this.code.push( {type: OpCode.and,		obj0: obj0, obj1: obj1} ); }
	addOr           (obj0, obj1)		{ this.code.push( {type: OpCode.or,			obj0: obj0, obj1: obj1} ); }
	addAdd          (obj0, obj1)		{ this.code.push( {type: OpCode.add,		obj0: obj0, obj1: obj1} ); }
	addSub          (obj0, obj1)		{ this.code.push( {type: OpCode.sub,		obj0: obj0, obj1: obj1} ); }
	addMul          (obj0, obj1)		{ this.code.push( {type: OpCode.mul,		obj0: obj0, obj1: obj1} ); }
	addDiv          (obj0, obj1)		{ this.code.push( {type: OpCode.div,		obj0: obj0, obj1: obj1} ); }
	addMod          (obj0, obj1)		{ this.code.push( {type: OpCode.mod,		obj0: obj0, obj1: obj1} ); }
	addExponent     (obj0, obj1)		{ this.code.push( {type: OpCode.exponent,	obj0: obj0, obj1: obj1} ); }
	addPushScope    (scope, size)		{ this.code.push( {type: OpCode.pushscope,	scope: scope, size: size} ); }
	addSubStr       (obj0, obj1, obj2)	{ this.code.push( {type: OpCode.substr,		obj0: obj0, obj1: obj1, obj2: obj2} ); }
	addClamp        (obj0, obj1, obj2)	{ this.code.push( {type: OpCode.clamp,		obj0: obj0, obj1: obj1, obj2: obj2} ); }
}


module.exports={Program};