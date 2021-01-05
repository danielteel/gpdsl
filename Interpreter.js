const {Utils} = require('./Utils');
const {OpObjType, OpObj, RegisterObj, StringObj, NumberObj, BoolObj, Machine}=require('./OpObjs');

const Tokenizer = require('./Tokenizer');
const {Parser, IdentityType} = require('./Parser');
const {Program} = require('./Program');


class Interpreter {

	static funcDef(name, func, returnType, ...params){
		let builtDef={};

		builtDef.name=name;
		builtDef.func=func;
		builtDef.params=[];
		builtDef.type=IdentityType.Function;

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

module.exports={Interpreter, StringObj, NumberObj, BoolObj};