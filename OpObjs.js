const Utils = require('./Utils');

const OpObjType={
	bool: Symbol("bool"),
	num: Symbol("number"),
	string: Symbol("string"),
	register: Symbol("register")
};


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

class BoolObj extends OpObj {
	constructor(name, initialVal=false, isConstant=false){
		super(name, OpObjType.bool, initialVal===null?null:Boolean(initialVal), isConstant);
	}
	
	static nullObj = null;
	static null(){
		if (BoolObj.nullObj===null){
			BoolObj.nullObj=new BoolObj(null, null, true);
		}
		return BoolObj.nullObj;
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

	static nullObj = null;
	static null(){
		if (NumberObj.nullObj===null){
			NumberObj.nullObj=new NumberObj(null, null, true);
		}
		return NumberObj.nullObj;
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

	static nullObj = null;
	static null(){
		if (StringObj.nullObj===null){
			StringObj.nullObj=new StringObj(null, null, true);
		}
		return StringObj.nullObj;
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

module.exports={OpObjType, OpObj, RegisterObj, StringObj, NumberObj, BoolObj};