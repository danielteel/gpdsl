const {Interpreter} =  require('../Interpreter');
const {Program} =  require("../Program");
const {IdentityType} =  require('../Utils');

describe("Program",()=>{
    it("a=a produces smaller program when optimized",()=>{
        const interpreter = new Interpreter();

        let retObj=interpreter.runCode('double a=5; a=a;', null, true, true);
        const optimized=retObj.disassembled.length;

        retObj=interpreter.runCode('double a=5; a=a;', null, false, true);
        const notOptimized=retObj.disassembled.length;

        expect(optimized<notOptimized).toEqual(true);
    })

    it("multiple same id labels in program throws",()=>{
        const program = new Program();
        program.addLabel(0);
        program.addLabel(0);

        expect(()=>program.link()).toThrow();
    })

    it("and on true/false works",()=>{
        const program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addMov(Program.unlinkedReg("ebx"), Program.unlinkedLiteral(IdentityType.Bool, false));
        program.addAnd(Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        const retObj=program.execute();

        expect(retObj.value).toEqual(false);
    })

    it("and on true/true works",()=>{
        const program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addMov(Program.unlinkedReg("ebx"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addAnd(Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        const retObj=program.execute();

        expect(retObj.value).toEqual(true);
    })

    it("or on true/true works",()=>{
        const program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addMov(Program.unlinkedReg("ebx"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addOr(Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        const retObj=program.execute();

        expect(retObj.value).toEqual(true);
    })

    it("or on true/false works",()=>{
        const program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, true));
        program.addMov(Program.unlinkedReg("ebx"), Program.unlinkedLiteral(IdentityType.Bool, false));
        program.addOr(Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        const retObj=program.execute();

        expect(retObj.value).toEqual(true);
    })

    it("or on false/false works",()=>{
        const program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Bool, false));
        program.addMov(Program.unlinkedReg("ebx"), Program.unlinkedLiteral(IdentityType.Bool, false));
        program.addOr(Program.unlinkedReg("eax"), Program.unlinkedReg("ebx"));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        const retObj=program.execute();

        expect(retObj.value).toEqual(false);
    })

    it("clamp works",()=>{
        let program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Double, 100));
        program.addClamp(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Double, 0), Program.unlinkedLiteral(IdentityType.Double, 50));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        expect(program.execute().value).toEqual(50);
        
        program = new Program();
        program.addMov(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Double, 100));
        program.addClamp(Program.unlinkedReg("eax"), Program.unlinkedLiteral(IdentityType.Double, 200), Program.unlinkedLiteral(IdentityType.Double, 300));
        program.addExit(Program.unlinkedReg("eax"));

        program.link(false);
        expect(program.execute().value).toEqual(200);
    })

    it("bad register name throws",()=>{
        const program = new Program();
        expect(()=>program.addMov(Program.unlinkedReg("yolo"), Program.unlinkedLiteral(IdentityType.Bool, false))).toThrow();
    })

    it("trying to execute on unlinked code fails",()=>{
        const program = new Program();

        expect(()=>program.execute()).toThrow();
    })
})