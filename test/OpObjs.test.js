const {OpObjType, OpObj, NullObj, RegisterObj, StringObj, NumberObj, BoolObj}=require('../OpObjs');

describe("OpObj",()=>{
    it("default constructor values",()=>{
        let obj=new OpObj();
        expect(obj.name).toEqual("");
        expect(obj.objType).toEqual(null);
        expect(obj.isConstant).toEqual(false);
        expect(obj.value).toEqual(null);
    })

    it("supplied constructor values",()=>{
        let obj=new OpObj("dan", "Yolo", 123, true);
        expect(obj.name).toEqual("dan");
        expect(obj.objType).toEqual("Yolo");
        expect(obj.isConstant).toEqual(true);
        expect(obj.value).toEqual(123);
    })
})

describe("NullObj",()=>{
    it("getCopy",()=>{
        const nullObj = new NullObj();
        expect(nullObj.getCopy()).toEqual(nullObj);
    })

    it("setTo",()=>{
        expect(() => {
            (new NullObj()).setTo(true);
          }).toThrow();
    })

    it("eqaulTo",()=>{
        expect((new NullObj()).eqaulTo(new NullObj())).toEqual(true);
        expect((new NullObj()).eqaulTo(new NumberObj("asd", 100, false))).toEqual(false);
    })

    it("notEqualTo",()=>{
        expect((new NullObj()).notEqualTo(new NullObj())).toEqual(false);
        expect((new NullObj()).notEqualTo(new NumberObj("asd", 100, false))).toEqual(true);
    })
    it("smallerThan",()=>{
        expect((new NullObj()).smallerThan(new NullObj())).toEqual(false);
    })

    it("greaterThan",()=>{
        expect((new NullObj()).greaterThan(new NullObj())).toEqual(false);
    })

    it("smallerOrEqualThan",()=>{
        expect((new NullObj()).smallerOrEqualThan(new NullObj())).toEqual(true);
        expect((new NullObj()).smallerOrEqualThan(new NumberObj("asd", 100, false))).toEqual(false);
    })

    it("greaterOrEqualThan",()=>{
        expect((new NullObj()).greaterOrEqualThan(new NullObj())).toEqual(true);
        expect((new NullObj()).greaterOrEqualThan(new NumberObj("asd", 100, false))).toEqual(false);
    })
})


describe("RegisterObj",()=>{
    it("getCopy",()=>{
        const regObj = new RegisterObj("heyyy");
        expect(regObj.getCopy()).toEqual(new RegisterObj("heyyyCopy"));
    })

    it("seTo/getNativeObj",()=>{
        const expectSetToMatch = (obj) => {  
            const regObj = new RegisterObj();
            regObj.setTo(obj)
            expect(regObj.getNativeObj()).toEqual(obj);
        }

        expectSetToMatch(new NumberObj(null, 100));
        expectSetToMatch(new StringObj(null, "Dan Teeel"));
        expectSetToMatch(new BoolObj(null, true));
        expectSetToMatch(new NullObj());

        const eax = new RegisterObj("eax");
        const ebx = new RegisterObj("ebx");
        ebx.setTo(new NumberObj(null, 500));
        eax.setTo(ebx);
        expect(eax.getNativeObj()).toEqual(ebx.getNativeObj());
    })

    it("getNativeObj",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new NullObj());
        expect(regObj._curValType).toEqual(OpObjType.null);

        regObj.setTo(new NumberObj());
        expect(regObj._curValType).toEqual(OpObjType.num);

        regObj.setTo(new StringObj());
        expect(regObj._curValType).toEqual(OpObjType.string);

        regObj.setTo(new BoolObj());
        expect(regObj._curValType).toEqual(OpObjType.bool);
    })

    it("equalTo",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new StringObj(null,"Jim"));
        expect(regObj.eqaulTo(new StringObj(null, "Jim"))).toEqual(true);
        expect(regObj.eqaulTo(new StringObj(null, "miJ"))).toEqual(false);
    })

    it("notEqualTo",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new StringObj(null,"Jim"));
        expect(regObj.notEqualTo(new StringObj(null, "Jim"))).toEqual(false);
        expect(regObj.notEqualTo(new StringObj(null, "miJ"))).toEqual(true);
    })
    
    it("smallerThan",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new NumberObj(null,100));
        expect(regObj.smallerThan(new NumberObj(null, 100))).toEqual(false);
        expect(regObj.smallerThan(new NumberObj(null, 90))).toEqual(false);
        expect(regObj.smallerThan(new NumberObj(null, 110))).toEqual(true);
    })

    it("greaterThan",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new NumberObj(null,100));
        expect(regObj.greaterThan(new NumberObj(null, 100))).toEqual(false);
        expect(regObj.greaterThan(new NumberObj(null, 90))).toEqual(true);
        expect(regObj.greaterThan(new NumberObj(null, 110))).toEqual(false);
    })

    it("smallerOrEqualThan",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new NumberObj(null,100));
        expect(regObj.smallerOrEqualThan(new NumberObj(null, 100))).toEqual(true);
        expect(regObj.smallerOrEqualThan(new NumberObj(null, 90))).toEqual(false);
        expect(regObj.smallerOrEqualThan(new NumberObj(null, 110))).toEqual(true);
    })

    it("greaterOrEqualThan",()=>{
        const regObj = new RegisterObj("heyyy");
    
        regObj.setTo(new NumberObj(null,100));
        expect(regObj.greaterOrEqualThan(new NumberObj(null, 100))).toEqual(true);
        expect(regObj.greaterOrEqualThan(new NumberObj(null, 90))).toEqual(true);
        expect(regObj.greaterOrEqualThan(new NumberObj(null, 110))).toEqual(false);
    })
})

