const {Parser} = require('../Parser');

const Tokenizer = require('../Tokenizer');
const TokenType = Tokenizer.TokenType;

describe("Parser",()=>{
    it("",()=>{
			let tokenizer=new Tokenizer();
			let tokenList=tokenizer.tokenize(`{`);

			//Parse and generate byte code
			let parser=new Parser(tokenList);
			expect(()=>parser.parse()).toThrow();
    });
})