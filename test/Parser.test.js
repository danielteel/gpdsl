const {Parser} =  require('../Parser');
const {OpCode, UnlinkedType} =  require('../Program');
const {Tokenizer} =  require('../Tokenizer');
const {IdentityType}  =  require('../Utils');

describe("Parser",()=>{
    let tokenizer;
    beforeEach(()=>{
        tokenizer=new Tokenizer();
    })

    const exepctFailure = (code) => {
        const tokenList=tokenizer.tokenize(code);
        expect(()=>(new Parser(tokenList)).parse()).toThrow();
    }

    it("throwError",()=>{
        let tokenList=tokenizer.tokenize(`{`);
        let parser=new Parser([tokenList[0]]);
        expect(()=>parser.parse()).toThrow();
            
        tokenList=tokenizer.tokenize(`double a; a=a+`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse()).toThrow();
            
        tokenList=tokenizer.tokenize(`double a; a=double(null);`);
        parser=new Parser(tokenList);
    });

    it("expect exit types",()=>{
        let tokenList=tokenizer.tokenize(`exit false;`);
        let parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.String)).toThrow();

        tokenList=tokenizer.tokenize(`exit 'imastring';`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.String)).not.toThrow();


        tokenList=tokenizer.tokenize(`exit 'yolo';`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.Double)).toThrow();

        tokenList=tokenizer.tokenize(`exit 100;`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.Double)).not.toThrow();

        tokenList=tokenizer.tokenize(`exit 1;`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.Bool)).toThrow();

        tokenList=tokenizer.tokenize(`exit true;`);
        parser=new Parser(tokenList);
        expect(()=>parser.parse(false, IdentityType.Bool)).not.toThrow();
    });

    it("fails for incorrect type in assignment",()=>{

        exepctFailure('double a="0";');
        exepctFailure('bool a="0";');
        exepctFailure('string a=true;');
    })
    it("matching",()=>{
        exepctFailure('if ');
    })
    it("trying to define already defined variable",()=>{
        exepctFailure('double a; double a;');
    })

    it("trying to call undefined func",()=>{
        exepctFailure('a();');
        exepctFailure('double b=a();');
        exepctFailure('double a; b();');
    })

    it("+ operator on non string/number",()=>{
        exepctFailure('bool a=true;bool b=false;a=a+b;');
    })

    it("- operator on invalid types",()=>{
        exepctFailure('bool a=true;bool b=false;a=a-b;');
    })

    it("while/if/loop/for convert non boolean expression to boolean",()=>{
        let program=new Parser(tokenizer.tokenize('if (true) {}')).parse();
        expect(program.code.find((opcode) => opcode.type===OpCode.tobool)).not.toBeDefined();

        program=new Parser(tokenizer.tokenize('if (1) {}')).parse();
        expect(program.code.find((opcode) => opcode.type===OpCode.tobool)).toBeDefined();
        program=new Parser(tokenizer.tokenize('while (1) {}')).parse();
        expect(program.code.find((opcode) => opcode.type===OpCode.tobool)).toBeDefined();
        program=new Parser(tokenizer.tokenize('for(;1;) {}')).parse();
        expect(program.code.find((opcode) => opcode.type===OpCode.tobool)).toBeDefined();
        program=new Parser(tokenizer.tokenize('loop{} while(1)')).parse();
        expect(program.code.find((opcode) => opcode.type===OpCode.tobool)).toBeDefined();
    })

    it("trying to break outside a loop",()=>{
        exepctFailure('break;');
    })

    it("exit",()=>{
        let foundExit=new Parser(tokenizer.tokenize('exit;')).parse().code.find((opcode) => opcode.type===OpCode.exit);
        expect(foundExit.obj0.type).toEqual(UnlinkedType.null);

        foundExit=new Parser(tokenizer.tokenize('exit 1;')).parse().code.find((opcode) => opcode.type===OpCode.exit);
        expect(foundExit.obj0.type).not.toEqual(UnlinkedType.null);
    })
})