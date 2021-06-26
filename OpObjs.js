//import Utils from './Utils';
const {Utils} = require('./Utils');


const OpObjType={
	bool: Symbol("bool"),
	num: Symbol("number"),
	string: Symbol("string"),
	register: Symbol("register"),
	null: Symbol("null")
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
		if (obj instanceof OpObj === false) throw new Error("Tried to set register to invalid type");

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
		default:
		}
	}

	equalTo(obj){
		return this.getNativeObj().equalTo(obj);
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

	equalTo(obj){
		if (obj._value !== null) return false;
		return true;
	}
	notEqualTo(obj){
		return !this.equalTo(obj);
	}
	smallerThan(obj){
		return false;
	}
	greaterThan(obj){
		return false;
	}
	smallerOrEqualThan(obj){
		return this.equalTo(obj);
	}
	greaterOrEqualThan(obj){
		return this.equalTo(obj);
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
		if (this._isConstant) throw new Error("Tried to write to constant bool");
		if (obj instanceof OpObj === false) throw new Error("Tried to set bool to invalid type");
		
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
			throw new Error("Tried to set bool to invalid type.");
		}
		
		return null;
	}
	equalTo(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;

		switch (type){
		case OpObjType.null:
			return this._value===null;
		case OpObjType.bool:
			return this._value===obj._value;
		case OpObjType.num:
			return Utils.isAboutEquals(Number(this._value), obj._value);
		default:
			throw new Error("Tried to do comparison to invalid type");
		}
	}    
	notEqualTo(obj){
		return !this.equalTo(obj);
	}
	smallerThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		if (this._value===null || obj._value===null) return false;
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
		if (this._value===null || obj._value===null) return false;
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
		return this.smallerThan(obj)||this.equalTo(obj);
	}
	greaterOrEqualThan(obj){
		return this.greaterThan(obj)||this.equalTo(obj);
	}
}

class NumberObj extends OpObj {
	constructor(name, initialVal=null, isConstant=false){
		if (initialVal===null || !isFinite(initialVal)) initialVal=null;
		super(name, OpObjType.num,  initialVal===null?null:Number(initialVal), isConstant);
	}
	
	getCopy(){
		return new NumberObj(this.name, this._value, this._isConstant);
	}

	setTo(obj){
		if (this._isConstant) throw new Error("Tried to write to constant number");
		if (obj instanceof OpObj === false) throw new Error("Tried to set number to invalid type");
		
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
				throw new Error("Tried to set number to invalid type");
		}
		if (!isFinite(this._value)) this._value=null;
		return null;
	}
	equalTo(obj){
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
		return !this.equalTo(obj);
	}
	smallerThan(obj){
		let type=obj._objType;
		if (type===OpObjType.register) type=obj._curValType;
		if (this._value===null || obj._value===null) return false;
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
		if (this._value===null || obj._value===null) return false;
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
		return this.smallerThan(obj)||this.equalTo(obj);
	}
	greaterOrEqualThan(obj){
		return this.greaterThan(obj)||this.equalTo(obj);
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
		if (this._isConstant) throw new Error("Tried to write to constant string");
		if (obj instanceof OpObj === false) throw new Error("Tried to set string to invalid type");
		
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
				throw new Error("Tried to set string to invalid type");
		}
		return null;
	}

	equalTo(obj){
		let type=obj._objType===OpObjType.register?obj._curValType:obj._objType;

		switch (type){
			case OpObjType.null:
			case OpObjType.string:
				return this._value===obj._value;
			default:
				throw new Error("Tried to do comparison to invalid type");
		}
	}
	notEqualTo(obj){
		return !this.equalTo(obj);
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

module.exports = {OpObjType, OpObj, NullObj, RegisterObj, StringObj, BoolObj, NumberObj};
//export {OpObjType, OpObj, NullObj, RegisterObj, StringObj, BoolObj, NumberObj};