class Utils{
    static isAboutEquals(a,b){
        if (Math.abs(a-b)<0.0000001){
            return true;
        }
        return false;
    }

    static isDigit(character){
        const charCode=character.charCodeAt(0);
        if (charCode>=48 && charCode<=57){
            return true;
        }
        return false;
    }

    static isAlpha(character){
        const charCode=character.charCodeAt(0);
        if ((charCode>=65 && charCode<=90) || (charCode>=97 && charCode<=122)){
            return true;
        }
        return false;
    }
    
    static isAlNum(character){
	    return Utils.isAlpha(character) || Utils.isDigit(character);
    }
	 
	static isSpace(character){
		if (character.charCodeAt(0)<=32) return true;
		return false
    }
    
    static newErrorObj(errorOnLine, message){
        return {line: errorOnLine, message: message};
    }
}

module.exports=Utils;