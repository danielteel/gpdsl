import {Tokenizer, TokenType} from '../Tokenizer';

describe("Tokenizer",()=>{
    let tokenizer;

    beforeEach(()=>{
        tokenizer=new Tokenizer();
    })

    it("intentionally fail with invalid character",()=>{
        expect(() => {
            tokenizer.tokenize('\\');
          }).toThrow();
    })

    it("intentionally fail with open ended string",()=>{
        expect(() => {
            tokenizer.tokenize('"');
          }).toThrow();

        expect(() => {
            tokenizer.tokenize("'");
        }).toThrow();
    })

    it("intentionally fail with incomplete OR",()=>{
        expect(() => {
            tokenizer.tokenize('|');
        }).toThrow();
    })

    it("intentionally fail with incomplete AND",()=>{
        expect(() => {
            tokenizer.tokenize('&');
        }).toThrow();
    })
    
    it("whitespace program",()=>{
        expect(tokenizer.tokenize(' ')).toEqual([{line: 1, type: TokenType.NewLine, value: ""}]);
    })

    it("blank program",()=>{
        expect(tokenizer.tokenize('')).toEqual([{line: 1, type: TokenType.NewLine, value: null}]);
    })

    it("comment only program has just a newline token with the comment",()=>{
        const commentCode = '//adsasdas';
        let tokenList=tokenizer.tokenize(commentCode);
        expect(tokenList).toEqual([{line: 1, type: TokenType.NewLine, value: commentCode}]);
    })

    it("LineDelim",()=>{
        expect(tokenizer.tokenize(';')[0]).toEqual({line: 1, type: TokenType.LineDelim, value: null});
    })

    it("NewLine",()=>{
        expect(tokenizer.tokenize('\n')[0]).toEqual({line: 2, type: TokenType.NewLine, value: ""});
    })

    it("Double",()=>{
        expect(tokenizer.tokenize('double')[0]).toEqual({line: 1, type: TokenType.Double, value: null});
    })

    it("String",()=>{
        expect(tokenizer.tokenize('string')[0]).toEqual({line: 1, type: TokenType.String, value: null});
    })

    it("Bool",()=>{
        expect(tokenizer.tokenize('bool')[0]).toEqual({line: 1, type: TokenType.Bool, value: null});
    })

    it("DoubleLiteral",()=>{
        expect(tokenizer.tokenize('123.45')[0]).toEqual({line: 1, type: TokenType.DoubleLiteral, value: 123.45});
        expect(tokenizer.tokenize('45')[0]).toEqual({line: 1, type: TokenType.DoubleLiteral, value: 45});
        expect(tokenizer.tokenize('.45')[0]).toEqual({line: 1, type: TokenType.DoubleLiteral, value: .45});
        expect(tokenizer.tokenize('45.')[0]).toEqual({line: 1, type: TokenType.DoubleLiteral, value: 45.});
    })

    it("StringLiteral",()=>{
        expect(tokenizer.tokenize('""')[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: ""});
        expect(tokenizer.tokenize('"1"')[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: "1"});
        const allCharDQ='`1234567890-=qwertyuiop[]\\asdfghjkl;\'zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:ZXCVBNM<>?';
        expect(tokenizer.tokenize('"'+allCharDQ+'"')[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: allCharDQ});

        expect(tokenizer.tokenize("''")[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: ""});
        expect(tokenizer.tokenize("'1'")[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: "1"});
        const allCharSQ="`1234567890-=qwertyuiop[]\\asdfghjkl;\"zxcvbnm,./~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:ZXCVBNM<>?";
        expect(tokenizer.tokenize("'"+allCharSQ+"'")[0]).toEqual({line: 1, type: TokenType.StringLiteral, value: allCharSQ});
    })

    it("Ident",()=>{
        const expectGoodIdent = (name) => {
            expect(tokenizer.tokenize(name)[0]).toEqual({line: 1, type: TokenType.Ident, value: name});
        }
        const expectBadIdent = (name) => {
            expect(tokenizer.tokenize(name)[0]).not.toEqual({line: 1, type: TokenType.Ident, value: name});
        }

        expectGoodIdent("a");
        expectGoodIdent("_");
        expectGoodIdent("True");
        expectGoodIdent("False");
        expectGoodIdent("Null");
        expectGoodIdent("_qwertyuiopasdfghjklzxcvbnm_QWERTYUIOPASDFGHJKLZXCVBNM1234567890_");
        expectBadIdent("0NAME");
        expectBadIdent("A.B");
    })

    it("True",()=>{
        expect(tokenizer.tokenize('true')[0]).toEqual({line: 1, type: TokenType.True, value: null});
    })

    it("False",()=>{
        expect(tokenizer.tokenize('false')[0]).toEqual({line: 1, type: TokenType.False, value: null});
    })

    it("Null",()=>{
        expect(tokenizer.tokenize('null')[0]).toEqual({line: 1, type: TokenType.Null, value: null});
    })

    it("LeftParen",()=>{
        expect(tokenizer.tokenize('(')[0]).toEqual({line: 1, type: TokenType.LeftParen, value: null});
    })

    it("RightParen",()=>{
        expect(tokenizer.tokenize(')')[0]).toEqual({line: 1, type: TokenType.RightParen, value: null});
    })

    it("LeftSqaure",()=>{
        expect(tokenizer.tokenize('[')[0]).toEqual({line: 1, type: TokenType.LeftSqaure, value: null});
    })

    it("RightSqaure",()=>{
        expect(tokenizer.tokenize(']')[0]).toEqual({line: 1, type: TokenType.RightSqaure, value: null});
    })

    it("Comma",()=>{
        expect(tokenizer.tokenize(',')[0]).toEqual({line: 1, type: TokenType.Comma, value: null});
    })

    it("Dot",()=>{
        expect(tokenizer.tokenize('.')[0]).toEqual({line: 1, type: TokenType.Dot, value: null});
    })

    it("Not",()=>{
        expect(tokenizer.tokenize('!')[0]).toEqual({line: 1, type: TokenType.Not, value: null});
    })

    it("And",()=>{
        expect(tokenizer.tokenize('&&')[0]).toEqual({line: 1, type: TokenType.And, value: null});
    })

    it("Or",()=>{
        expect(tokenizer.tokenize('||')[0]).toEqual({line: 1, type: TokenType.Or, value: null});
    })

    it("Plus",()=>{
        expect(tokenizer.tokenize('+')[0]).toEqual({line: 1, type: TokenType.Plus, value: null});
    })

    it("Minus",()=>{
        expect(tokenizer.tokenize('-')[0]).toEqual({line: 1, type: TokenType.Minus, value: null});
    })

    it("Divide",()=>{
        expect(tokenizer.tokenize('/')[0]).toEqual({line: 1, type: TokenType.Divide, value: null});
    })

    it("Multiply",()=>{
        expect(tokenizer.tokenize('*')[0]).toEqual({line: 1, type: TokenType.Multiply, value: null});
    })

    it("Mod",()=>{
        expect(tokenizer.tokenize('%')[0]).toEqual({line: 1, type: TokenType.Mod, value: null});
    })

    it("Exponent",()=>{
        expect(tokenizer.tokenize('^')[0]).toEqual({line: 1, type: TokenType.Exponent, value: null});
    })

    it("Question",()=>{
        expect(tokenizer.tokenize('?')[0]).toEqual({line: 1, type: TokenType.Question, value: null});
    })

    it("Colon",()=>{
        expect(tokenizer.tokenize(':')[0]).toEqual({line: 1, type: TokenType.Colon, value: null});
    })

    it("Assignment",()=>{
        expect(tokenizer.tokenize('=')[0]).toEqual({line: 1, type: TokenType.Assignment, value: null});
    })

    it("Equals",()=>{
        expect(tokenizer.tokenize('==')[0]).toEqual({line: 1, type: TokenType.Equals, value: null});
    })

    it("NotEquals",()=>{
        expect(tokenizer.tokenize('!=')[0]).toEqual({line: 1, type: TokenType.NotEquals, value: null});
    })

    it("Lesser",()=>{
        expect(tokenizer.tokenize('<')[0]).toEqual({line: 1, type: TokenType.Lesser, value: null});
    })

    it("LesserEquals",()=>{
        expect(tokenizer.tokenize('<=')[0]).toEqual({line: 1, type: TokenType.LesserEquals, value: null});
    })

    it("Greater",()=>{
        expect(tokenizer.tokenize('>')[0]).toEqual({line: 1, type: TokenType.Greater, value: null});
    })

    it("GreaterEquals",()=>{
        expect(tokenizer.tokenize('>=')[0]).toEqual({line: 1, type: TokenType.GreaterEquals, value: null});
    })

    it("Min",()=>{
        expect(tokenizer.tokenize('min')[0]).toEqual({line: 1, type: TokenType.Min, value: null});
    })

    it("Max",()=>{
        expect(tokenizer.tokenize('max')[0]).toEqual({line: 1, type: TokenType.Max, value: null});
    })

    it("Abs",()=>{
        expect(tokenizer.tokenize('abs')[0]).toEqual({line: 1, type: TokenType.Abs, value: null});
    })

    it("Clamp",()=>{
        expect(tokenizer.tokenize('clamp')[0]).toEqual({line: 1, type: TokenType.Clamp, value: null});
    })

    it("Floor",()=>{
        expect(tokenizer.tokenize('floor')[0]).toEqual({line: 1, type: TokenType.Floor, value: null});
    })

    it("Ceil",()=>{
        expect(tokenizer.tokenize('ceil')[0]).toEqual({line: 1, type: TokenType.Ceil, value: null});
    })

    it("LCase",()=>{
        expect(tokenizer.tokenize('lcase')[0]).toEqual({line: 1, type: TokenType.LCase, value: null});
    })

    it("UCase",()=>{
        expect(tokenizer.tokenize('ucase')[0]).toEqual({line: 1, type: TokenType.UCase, value: null});
    })

    it("Trim",()=>{
        expect(tokenizer.tokenize('trim')[0]).toEqual({line: 1, type: TokenType.Trim, value: null});
    })

    it("Len",()=>{
        expect(tokenizer.tokenize('len')[0]).toEqual({line: 1, type: TokenType.Len, value: null});
    })

    it("SubStr",()=>{
        expect(tokenizer.tokenize('substr')[0]).toEqual({line: 1, type: TokenType.SubStr, value: null});
    })

    it("While",()=>{
        expect(tokenizer.tokenize('while')[0]).toEqual({line: 1, type: TokenType.While, value: null});
    })

    it("For",()=>{
        expect(tokenizer.tokenize('for')[0]).toEqual({line: 1, type: TokenType.For, value: null});
    })

    it("Loop",()=>{
        expect(tokenizer.tokenize('loop')[0]).toEqual({line: 1, type: TokenType.Loop, value: null});
    })

    it("If",()=>{
        expect(tokenizer.tokenize('if')[0]).toEqual({line: 1, type: TokenType.If, value: null});
    })

    it("Else",()=>{
        expect(tokenizer.tokenize('else')[0]).toEqual({line: 1, type: TokenType.Else, value: null});
    })

    it("Break",()=>{
        expect(tokenizer.tokenize('break')[0]).toEqual({line: 1, type: TokenType.Break, value: null});
    })

    it("LeftCurly",()=>{
        expect(tokenizer.tokenize('{')[0]).toEqual({line: 1, type: TokenType.LeftCurly, value: null});
    })

    it("RightCurly",()=>{
        expect(tokenizer.tokenize('}')[0]).toEqual({line: 1, type: TokenType.RightCurly, value: null});
    })

    it("Return",()=>{
        expect(tokenizer.tokenize('return')[0]).toEqual({line: 1, type: TokenType.Return, value: null});
    })

    it("Exit",()=>{
        expect(tokenizer.tokenize('exit')[0]).toEqual({line: 1, type: TokenType.Exit, value: null});
    })
})