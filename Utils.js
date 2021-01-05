class Utils{
	static isAboutEquals(a,b){
		if (Math.abs(a-b)<0.0000001){
			return true;
		}
		return false;
	}
}

const IdentityType = {
	Null: Symbol("Null"),

	Bool: Symbol("Bool"),
	Double: Symbol("Double"),
	String: Symbol("String"),

	Function: Symbol("Function")
}

module.exports={Utils, IdentityType};