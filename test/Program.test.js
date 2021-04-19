const {Parser} = require('../Parser');
const {OpCode, UnlinkedType} = require('../Program');
const Tokenizer = require('../Tokenizer');
const TokenType = Tokenizer.TokenType;

describe("Program",()=>{
    it("1=1",()=>{
        expect(1).toEqual(1);
    })
})