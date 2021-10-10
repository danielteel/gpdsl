import {OpObjType, OpObj, NullObj, RegisterObj, StringObj, NumberObj, BoolObj} from '../OpObjs.js';

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

    it("equalTo",()=>{
        expect((new NullObj()).equalTo(new NullObj())).toEqual(true);
        expect((new NullObj()).equalTo(new NumberObj("asd", 100, false))).toEqual(false);
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

        regObj.setTo(new StringObj(null,"Yolo"));
        expect(regObj.getCopy(true)).toEqual(new StringObj(null, "Yolo"));
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

        expect( () => {
            const regObj = new RegisterObj();
            regObj.setTo("IM NOT A VALID VALUE!!");
        }).toThrow();
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
        expect(regObj.equalTo(new StringObj(null, "Jim"))).toEqual(true);
        expect(regObj.equalTo(new StringObj(null, "miJ"))).toEqual(false);
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

describe("BoolObj",()=>{
    it("getCopy",()=>{
        const boolObj = new BoolObj();
        expect(boolObj.getCopy()).toEqual(boolObj);
    })

    it("setTo",()=>{
        expect(() => {
            (new BoolObj(null, null, true)).setTo(new BoolObj(null, false));//writing to constant
        }).toThrow();
        expect(() => {
            (new BoolObj(null, null, false)).setTo("not valid");//setting to invalid type (needs to be an OpObj)
        }).toThrow();
        expect(() => {
            (new BoolObj(null, null, false)).setTo(new StringObj());//setting to invalid type (needs to be an OpObj)
        }).toThrow();

        const boolObj = new BoolObj();

        const regObj = new RegisterObj();
        regObj.setTo(new BoolObj(null, true, false));

        boolObj.setTo(regObj);
        expect(boolObj.value).toEqual(true);

        boolObj.setTo(new NullObj());
        expect(boolObj.value).toEqual(null);

        boolObj.setTo(new NumberObj(null, 1));
        expect(boolObj.value).toEqual(true);

        boolObj.setTo(new BoolObj(null, false));
        expect(boolObj.value).toEqual(false);
    })

    it("equalTo",()=>{
        const boolObj = new BoolObj(null, true);
        
        expect(boolObj.equalTo(new BoolObj(null, true))).toEqual(true);
        expect(boolObj.equalTo(new BoolObj(null, false))).toEqual(false);

        expect(boolObj.equalTo(new NumberObj(null, 0))).toEqual(false);
        expect(boolObj.equalTo(new NumberObj(null, 1))).toEqual(true);

        expect(boolObj.equalTo(new NullObj())).toEqual(false);
        boolObj.setTo(new BoolObj(null, null));
        expect(boolObj.equalTo(new NullObj())).toEqual(true);

        const regObj = new RegisterObj(null);
        boolObj.setTo(regObj);
        expect(boolObj.equalTo(new RegisterObj(null))).toEqual(true);

        expect(()=>boolObj.equalTo("bad type")).toThrow();
    })

    it("notEqualTo",()=>{
        const boolObj = new BoolObj(null, true);
    
        expect(boolObj.notEqualTo(new BoolObj(null, true))).not.toEqual(true);
        expect(boolObj.notEqualTo(new BoolObj(null, false))).not.toEqual(false);

        expect(boolObj.notEqualTo(new NumberObj(null, 0))).not.toEqual(false);
        expect(boolObj.notEqualTo(new NumberObj(null, 1))).not.toEqual(true);

        expect(boolObj.notEqualTo(new NullObj())).not.toEqual(false);
        boolObj.setTo(new BoolObj(null, null));
        expect(boolObj.notEqualTo(new NullObj())).not.toEqual(true);


        expect(()=>boolObj.notEqualTo("bad type")).toThrow();
    })

    it("smallerThan",()=>{
        const boolObj = new BoolObj(null, false);
    
        expect(boolObj.smallerThan(new BoolObj(null, true))).toEqual(true);
        expect(boolObj.smallerThan(new BoolObj(null, false))).toEqual(false);

        expect(boolObj.smallerThan(new NumberObj(null, 1))).toEqual(true);
        expect(boolObj.smallerThan(new NumberObj(null, 0))).toEqual(false);
    })

    it("greaterThan",()=>{
        const boolObj = new BoolObj(null, true);
    
        expect(boolObj.greaterThan(new BoolObj(null, true))).toEqual(false);
        expect(boolObj.greaterThan(new BoolObj(null, false))).toEqual(true);

        expect(boolObj.greaterThan(new NumberObj(null, 1))).toEqual(false);
        expect(boolObj.greaterThan(new NumberObj(null, 0))).toEqual(true);
    })

    it("smallerOrEqualThan",()=>{
        const boolObj = new BoolObj(null, true);
    
        expect(boolObj.smallerOrEqualThan(new BoolObj(null, true))).toEqual(true);
        expect(boolObj.smallerOrEqualThan(new BoolObj(null, false))).toEqual(false);

        expect(boolObj.smallerOrEqualThan(new NumberObj(null, 1))).toEqual(true);
        expect(boolObj.smallerOrEqualThan(new NumberObj(null, 0))).toEqual(false);
    })

    it("greaterOrEqualThan",()=>{
        const boolObj = new BoolObj(null, false);
    
        expect(boolObj.greaterOrEqualThan(new BoolObj(null, true))).toEqual(false);
        expect(boolObj.greaterOrEqualThan(new BoolObj(null, false))).toEqual(true);

        expect(boolObj.greaterOrEqualThan(new NumberObj(null, 1))).toEqual(false);
        expect(boolObj.greaterOrEqualThan(new NumberObj(null, 0))).toEqual(true);
    })
})



describe("NumberObj",()=>{
    it("getCopy",()=>{
        const numberObj = new NumberObj();
        expect(numberObj.getCopy()).toEqual(numberObj);
    })

    it("setTo",()=>{
        expect(() => {
            (new NumberObj(null, null, true)).setTo(new NumberObj(null, false));//writing to constant
        }).toThrow();
        expect(() => {
            (new NumberObj(null, null, false)).setTo("not valid");//setting to invalid type (needs to be an OpObj)
        }).toThrow();
        expect(() => {
            (new NumberObj(null, null, false)).setTo(new StringObj());//setting to invalid type (needs to be an OpObj)
        }).toThrow();

        const numberObj = new NumberObj();

        const regObj = new RegisterObj();
        regObj.setTo(new NumberObj(null, 100, false));

        numberObj.setTo(regObj);
        expect(numberObj.value).toEqual(100);

        numberObj.setTo(new NullObj());
        expect(numberObj.value).toEqual(null);

        numberObj.setTo(new NumberObj(null, 123));
        expect(numberObj.value).toEqual(123);

        numberObj.setTo(new BoolObj(null, true));
        expect(numberObj.value).toEqual(1);

        numberObj.setTo(new BoolObj(null, null));
        expect(numberObj.value).toEqual(null);

        numberObj.setTo(new NumberObj(null, Infinity));
        expect(numberObj.value).toEqual(null);
    })

    it("equalTo",()=>{
        const numberObj = new NumberObj(null, null);
        const n1 = new NumberObj(null, 1);

        expect(numberObj.equalTo(new NullObj())).toEqual(true);
        expect(numberObj.equalTo(n1)).toEqual(false);

        numberObj.setTo(n1);
        expect(numberObj.equalTo(new NullObj())).toEqual(false);

        expect(numberObj.equalTo(new NullObj())).toEqual(false);
        expect(numberObj.equalTo(new BoolObj(null, true))).toEqual(true);
        expect( () => numberObj.equalTo(new StringObj(null, "asd")) ).toThrow();
    })

    it("notEqualTo",()=>{
        const numberObj = new NumberObj(null, 1);
        expect(numberObj.notEqualTo(new BoolObj(null, true))).toEqual(false);
        expect( () => numberObj.notEqualTo(new StringObj(null, "asd")) ).toThrow();
    })

    it("smallerThan",()=>{
        const numberObj = new NumberObj(null, 0);
        const regObj=new RegisterObj();
        regObj.setTo(new NumberObj(null, -10));
        expect(numberObj.smallerThan(new NumberObj(null, 10))).toEqual(true);
        expect(numberObj.smallerThan(regObj)).toEqual(false);
        expect(numberObj.smallerThan(new BoolObj(null, true))).toEqual(true);
        expect(numberObj.smallerThan(new BoolObj(null, false))).toEqual(false);
        expect( () => numberObj.smallerThan(new StringObj(null, "asd")) ).toThrow();
    })

    it("greaterThan",()=>{
        const numberObj = new NumberObj(null, 0);
        const regObj=new RegisterObj();
        regObj.setTo(new NumberObj(null, -10));
        expect(numberObj.greaterThan(new NumberObj(null, 10))).toEqual(false);
        expect(numberObj.greaterThan(regObj)).toEqual(true);
        expect(numberObj.greaterThan(new BoolObj(null, true))).toEqual(false);
        expect(numberObj.greaterThan(new BoolObj(null, false))).toEqual(false);
        expect( () => numberObj.greaterThan(new StringObj(null, "asd")) ).toThrow();
    })

    it("smallerOrEqualThan",()=>{
        const numberObj = new NumberObj(null, 0);
        const regObj=new RegisterObj();
        regObj.setTo(new NumberObj(null, -10));
        expect(numberObj.smallerOrEqualThan(new NumberObj(null, 10))).toEqual(true);
        expect(numberObj.smallerOrEqualThan(regObj)).toEqual(false);
        expect(numberObj.smallerOrEqualThan(new BoolObj(null, true))).toEqual(true);
        expect(numberObj.smallerOrEqualThan(new BoolObj(null, false))).toEqual(true);
        expect( () => numberObj.smallerOrEqualThan(new StringObj(null, "asd")) ).toThrow();
    })

    it("greaterOrEqualThan",()=>{
        const numberObj = new NumberObj(null, 0);
        const regObj=new RegisterObj();
        regObj.setTo(new NumberObj(null, -10));
        expect(numberObj.greaterOrEqualThan(new NumberObj(null, 10))).toEqual(false);
        expect(numberObj.greaterOrEqualThan(regObj)).toEqual(true);
        expect(numberObj.greaterOrEqualThan(new BoolObj(null, true))).toEqual(false);
        expect(numberObj.greaterOrEqualThan(new BoolObj(null, false))).toEqual(true);
        expect( () => numberObj.greaterOrEqualThan(new StringObj(null, "asd")) ).toThrow();
    })
})


describe("StringObj",()=>{
    it("getCopy",()=>{
        const stringObj = new StringObj();
        expect(stringObj.getCopy()).toEqual(stringObj);
    })

    it("setTo",()=>{
        expect(() => {
            (new StringObj(null, null, true)).setTo(new StringObj(null, "asd"));//writing to constant
        }).toThrow();
        expect(() => {
            (new StringObj(null, null, false)).setTo("not valid");//setting to invalid type (needs to be an OpObj)
        }).toThrow();
        expect(() => {
            (new StringObj(null, null, false)).setTo(new NumberObj());//setting to invalid type (needs to be an OpObj)
        }).toThrow();

        const stringObj = new StringObj();

        stringObj.setTo(new StringObj(null, "yolo swaggins"));
        expect(stringObj.value).toEqual("yolo swaggins");

        stringObj.setTo(new NullObj());
        expect(stringObj.value).toEqual(null);

        const regObj = new RegisterObj();
        regObj.setTo(new StringObj(null,"asd"));
        stringObj.setTo(regObj);
        expect(stringObj.value).toEqual("asd");
    })

    it("equalTo",()=>{
        const stringObj = new StringObj();
        const regObj = new RegisterObj();

        regObj.setTo(new StringObj(null,"Im a register"));
        expect(stringObj.equalTo(regObj)).toEqual(false);

        stringObj.setTo(regObj);
        expect(stringObj.equalTo(regObj)).toEqual(true);

        expect(stringObj.equalTo(new NullObj())).toEqual(false);
        stringObj.setTo(new NullObj());
        expect(stringObj.equalTo(new NullObj())).toEqual(true);

        expect(()=>stringObj.equalTo(new NumberObj(null, 1))).toThrow();
    })

    it("notEqualTo",()=>{
        const stringObj = new StringObj(null,"oloy");
        
        expect(stringObj.notEqualTo(new StringObj(null,"yolo"))).toEqual(true);
        expect(stringObj.notEqualTo(new StringObj(null,"oloy"))).toEqual(false);
    })

    it("smallerThan",()=>{
        expect(() => (new StringObj()).smallerThan(new StringObj())).toThrow();
    })

    it("greaterThan",()=>{
        expect(() => (new StringObj()).greaterThan(new StringObj())).toThrow();
    })

    it("smallerOrEqualThan",()=>{
        expect(() => (new StringObj()).smallerOrEqualThan(new StringObj())).toThrow();
    })

    it("greaterOrEqualThan",()=>{
        expect(() => (new StringObj()).greaterOrEqualThan(new StringObj())).toThrow();
    })
})