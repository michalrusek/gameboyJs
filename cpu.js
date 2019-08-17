function z80 (mem, runInterruptsFunction) {
    "use strict";
    let debug = false
    let uniqueInstr = {}
    let pc = 0x100
    let sp = 0xFFFE
    let r = {a: 0, f: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0}
    let f = {z: 0, n: 0, h: 0, c: 0}
    let syncFlagsToRegister = function () {r.f = ((f.z << 7) | (f.n << 6) | (f.h << 5) | (f.c << 4)) & 0xF0}
    let syncRegisterToFlags = function () {
        f.z = (r.f >> 7) & 0b1
        f.n = (r.f >> 6) & 0b1
        f.h = (r.f >> 5) & 0b1
        f.c = (r.f >> 4) & 0b1
    }
    let af = function (val) {if (val !== undefined && val !== null && val > 0xFFFF) {throw new Error(`Can't set ${val} to af`)} if (val !== undefined && val !== null) {r.a = (val >> 8) & 0xFF; r.f = val & 0xF0;} syncRegisterToFlags(); return (r.a << 8) + r.f}
    let bc = function (val) {if (val !== undefined && val !== null && val > 0xFFFF) {throw new Error(`Can't set ${val} to bc`)} if (val !== undefined && val !== null) {r.b = (val >> 8) & 0xFF; r.c = val & 0xFF;} return (r.b << 8) + r.c}
    let de = function (val) {if (val !== undefined && val !== null && val > 0xFFFF) {throw new Error(`Can't set ${val} to de`)} if (val !== undefined && val !== null) {r.d = (val >> 8) & 0xFF; r.e = val & 0xFF;} return (r.d << 8) + r.e}
    let hl = function (val) {if (val !== undefined && val !== null && val > 0xFFFF) {throw new Error(`Can't set ${val} to hl`)} if (val !== undefined && val !== null) {r.h = (val >> 8) & 0xFF; r.l = val & 0xFF;} return (r.h << 8) + r.l}
    let stopped = false
    let IME = false

    //Power up stuff (see http://bgb.bircd.org/pandocs.htm#powerupsequence)
    af(0x0100)
    bc(0x0013)
    de(0x00D8)
    hl(0x014D)
    sp = 0xFFFE

    let logRegisters = () => {
        let newR = {}
        for (let k in r) {
            newR[k] = r[k].toString(16)
        }
        console.log("PC: " + pc.toString(16) + " (opcode: " + mem.readByte(pc).toString(16) + ")  :  " + JSON.stringify(r) + "   :   " + JSON.stringify(newR) + "   :   next two bytes: " + mem.readByte(pc + 1).toString(16) + 
        ", " + mem.readByte(pc + 2).toString(16))
    }

    let runCycles = function (n) {
        let cyclesRan = 0;
        while (n >= 0 && !stopped) {
            let num = opcode(mem.readByte(pc))
            n = n - num
            cyclesRan = cyclesRan + num
            syncFlagsToRegister()

            //Just a sanity check - run through all registers and if any is above 0xFF then something went really wrong
            for (let key in r) {if (r[key] > 0xFF) {logRegisters(); throw new Error(`Register ${key} has invalid value: ${r[key]}`)}}
        }
        return cyclesRan

        //DEBUG
        // if (pc >= 0xE8) {
        //     throw new Error("Comparison starts. Needs logo data (load the game bruh).")
        // }
    }

    let runCyclesUntil = function (n, when) {
        while (n > 0 && !stopped) {
            n = n - opcode(mem.readByte(pc))
            syncFlagsToRegister()

            //Just a sanity check - run through all registers and if any is above 0xFF then something went really wrong
            for (let key in r) {if (r[key] > 0xFF) {logRegisters(); throw new Error(`Register ${key} has invalid value: ${r[key]}`)}}

            if (pc == when) {
                // logRegisters()
                return true
            }
        }
        return false
    }

    let cb = (instr) => {
        let valOrig = 0
        let valNew = 0
        let cycles = 8

        switch (instr % 8) {
            case 0: valOrig = r.b; break;
            case 1: valOrig = r.c; break;
            case 2: valOrig = r.d; break;
            case 3: valOrig = r.e; break;
            case 4: valOrig = r.h; break;
            case 5: valOrig = r.l; break;
            case 6: valOrig = mem.readByte(hl()); cycles = 16; break;
            case 7: valOrig = r.a; break;
        }

        valNew = valOrig;

        //Divide the instruction by 8 because there are 8 values we can operate on (b,c,d,e,h,l,(hl),a)
        //So there's basically X instructions times 8 values
        let op = instr / 8
        if ((op | 0) >= 0 && (op | 0) <= 7) {
            let c = op | 0
            f.n = 0; f.h = 0;
            switch (c) {
                case 0: f.c = valOrig >> 7; valNew = (valOrig << 1) + f.c; valNew = valNew & 0xFF; break; //RLC - rotate left
                case 1: f.c = valOrig & 1; valNew = (valOrig >> 1) + (f.c << 7); break; //RRC - rotate right
                case 2: valNew = (valOrig << 1) + f.c; f.c = (valOrig >> 7) & 0b1; valNew = valNew & 0xFF; break; //RL - rotate left through carry
                case 3: valNew = (valOrig >> 1) + (f.c << 7); f.c = valOrig & 1; break; //RR - rotate right through carry
                case 4: f.c = valOrig >> 7; valNew = (valOrig << 1) % 256; break; //SLA
                case 5: f.c = valOrig & 1; valNew = (valOrig >> 1) | (valOrig & 0x80); break; //SRA
                case 6: valNew = ((valOrig >> 4) | (valOrig << 4)) & 0xFF; f.c = 0; break; //SWAP
                case 7: f.c = valOrig & 1; valNew = (valOrig >> 1); break; //SRL
            }
            f.z = valNew == 0 ? 1 : 0
        } else if ((op | 0) >= 8 && (op | 0) <= 15) {
            //BIT
            f.h = 1; f.n = 0; f.z = ((valOrig & (1 << ((op | 0) - 8))) == 0) ? 1 : 0;
        } else if ((op | 0) >= 16 && (op | 0) <= 23) {
            //RES
            valNew = valOrig &~ (1 << ((op | 0) - 16))
        } else if ((op | 0) >= 24 && (op | 0) <= 31) {
            //SET
            valNew = valOrig | (1 << ((op | 0) - 24))
        }

        valNew = valNew % 256

        switch (instr % 8) {
            case 0: r.b = valNew; break;
            case 1: r.c = valNew; break;
            case 2: r.d = valNew; break;
            case 3: r.e = valNew; break;
            case 4: r.h = valNew; break;
            case 5: r.l = valNew; break;
            case 6: mem.setByte(hl(), valNew); break;
            case 7: r.a = valNew; break;
        }

        return cycles;
    }
    let xor = (a, b) => {if ((a ^ b) == 0) {f.z = 1} else {f.z = 0} f.n = 0; f.c = 0; f.h = 0; return a ^ b}
    let or = (a, b) => {if ((a | b) == 0) {f.z = 1} else {f.z = 0} f.n = 0; f.c = 0; f.h = 0; return a | b}
    let and = (a, b) => {f.n = 0; f.h = 1; f.c = 0; if ((a & b) == 0) {f.z = 1} else {f.z = 0} return a & b}
    let incByte = (a) => {
        f.n = 0; 
        f.h = 0; 
        if (a >= 0xFF) {
            f.h = 1; 
            f.z = 1; 
            return 0
        }
        f.z = 0;
        if ((a % 16) == 15) {
            f.h = 1
        } 
        return a + 1
    }
    let decByte = (a) => {
        f.n = 1; 
        f.h = 0; 
        if (a == 0) {
            f.h = 1; 
            f.z = 0; 
            return 0xFF
        } 
        if (a == 1) {
            f.z = 1; 
            return 0
        } 
        f.z = 0; 
        if (a % 16 == 0) {
            f.h = 1
        } 
        return a - 1
    }
    let sbc = (a, b) => {return sub(a, b + f.c)}
    let sub = (a, b) => {f.n = 1; let res = a - b; f.c = res < 0 ? 1 : 0; f.z = res == 0 ? 1 : 0; f.h = (a % 0x10) - (b % 0x10) < 0 ? 1 : 0; return (res + 256) % 256}
    let add = (a, b) => {
        f.n = 0; 
        let res = a + b; 
        f.c = res > 255 ? 1 : 0; 
        f.z = (res % 256) == 0 ? 1 : 0; 
        f.h = ((a % 0x10) + (b % 0x10)) > 0xF ? 1 : 0; 
        return res % 256}
    let adc = (a, b) => {return add(a, b + f.c)}
    let addWord = (a, b) => {
        f.n = 0;
        if (b < 0) {b = b + 0x10000}
        let res = a + b; 
        f.c = (res > 0xFFFF) ? 1 : 0; 
        f.h = (a % 0x1000) + (b % 0x1000) > 0xFFF ? 1 : 0; 
        return res % 0x10000
    }
    let call = (addr) => {if (sp == 0) {throw new Error(`SP going lower than 0.`)} sp = sp - 2; mem.setWord(sp, pc); pc = addr}

    let opcodes = {
        '0': ()=>{pc = pc + 1; return 4;},
        '1': ()=>{bc(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '2': ()=>{mem.setByte(bc(), r.a); pc = pc + 1; return 8},
        '3': ()=>{let val = bc(); if (val == 0xFFFF) {bc(0)} else {bc(val + 1)} pc = pc + 1; return 8},
        '4': ()=>{r.b = incByte(r.b); pc = pc + 1; return 4},
        '5': ()=>{r.b = decByte(r.b); pc = pc + 1; return 4},
        '6': ()=>{pc = pc + 1; r.b = mem.readByte(pc); pc = pc + 1; return 8},
        '7': ()=>{cb(7); pc = pc + 1; return 4},
        '8': ()=>{mem.setWord(mem.readWord(pc + 1), sp); pc = pc + 3; return 20},
        '9': ()=>{hl(addWord(hl(), bc())); pc = pc + 1; return 8},
        'a': ()=>{r.a = mem.readByte(bc()); pc = pc + 1; return 8},
        'b': ()=>{if (bc() == 0) {bc(0xFFFF)} else {bc(bc() - 1)} pc = pc + 1; return 8},
        'c': ()=>{r.c = incByte(r.c); pc = pc + 1; return 4},
        'd': ()=>{r.c = decByte(r.c); pc = pc + 1; return 4},
        'e': ()=>{r.c = mem.readByte(pc + 1); pc = pc + 2; return 8},
        'f': ()=>{cb(15); pc = pc + 1; return 4},
        '10': ()=>{stopped = true; pc = pc + 1; return 4},
        '11': ()=>{de(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '12': ()=>{mem.setByte(de(), r.a); pc = pc + 1; return 8},
        '13': ()=>{if (de() == 0xFFFF) {de(0)} else {de(de() + 1)} pc = pc + 1; return 8},
        '14': ()=>{r.d = incByte(r.d); pc = pc + 1; return 4},
        '15': ()=>{r.d = decByte(r.d); pc = pc + 1; return 4},
        '16': ()=>{r.d = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '17': ()=>{pc = pc + 1; cb(23); return 4;},
        '18': ()=>{pc = pc + 1; pc = pc + mem.readSigned(pc) + 1; return 12},
        '19': ()=>{hl(addWord(hl(), de())); pc = pc + 1; return 8},
        '1a': ()=>{r.a = mem.readByte(de()); pc = pc + 1; return 8},
        '1b': ()=>{if (de() == 0) {de(0xFFFF)} else {de(de() - 1)} pc = pc + 1; return 8},
        '1c': ()=>{r.e = incByte(r.e); pc = pc + 1; return 4},
        '1d': ()=>{r.e = decByte(r.e); pc = pc + 1; return 4},
        '1e': ()=>{r.e = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '1f': ()=>{cb(31); pc = pc + 1; return 4},
        '20': ()=>{
            if (f.z == 0) {
                pc = pc + 1; 
                let val = mem.readSigned(pc); 
                pc = (pc|0) + (val) + (1|0); 
                return 12;
            } else {
                pc = pc + 2; 
                return 8;
            }
        },
        '21': ()=>{hl(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '22': ()=>{mem.setByte(hl(), r.a); if (hl() == 0xFFFF) { hl(0) } else { hl(hl() + 1) } pc = pc + 1; return 8},
        '23': ()=>{if (hl() == 0xFFFF) {hl(0)} else {hl(hl() + 1)} pc = pc + 1; return 8},
        '24': ()=>{r.h = incByte(r.h); pc = pc + 1; return 4},
        '25': ()=>{r.h = decByte(r.h); pc = pc + 1; return 4},
        '26': ()=>{r.h = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '27': ()=>{
            //DAA -> adjusts A to be a correct BCD representation (each nibble is in range 0-9, max number is 0x99)
            //This is intended to be used after addition/substraction
            //The reason we have to adjust it is to handle overflows/underflows 
            //See: https://forums.nesdev.com/viewtopic.php?f=20&t=15944#p196282
            // if (!f.n) {
            //     //addition
            //     if (f.c || (r.a > 0x99)) {r.a = r.a + 0x60; f.c = 1}
            //     if (f.h || (r.a & 0xF) > 0x9) {r.a = r.a + 0x6}
            // } else {
            //     //substraction
            //     if (f.c) {r.a = r.a - 0x60}
            //     if (f.h) {r.a = r.a - 0x6}
            // }
            // r.a = r.a % 256
            // // f.z = r.a == 0 ? 1 : 0
            // // f.h = 0
            let upper = r.a >> 4; 
            let lower = (r.a|0) % 16 |0;
            if(!f.n){
                if(!f.c & !f.h & (upper|0) <= 9 & (lower|0) <= 9){f.c = 0;}
                else if(!f.c & !f.h & (upper|0) <= 8 & (lower|0) >= 10){f.c = 0; r.a = r.a + 0x06 |0}
                else if(!f.c & f.h & (upper|0) <= 9 & (lower|0) <= 3){f.c = 0; r.a = r.a + 0x06 |0}
                else if(!f.c & !f.h & (upper|0) >= 10 & (lower|0) <= 9){f.c = 1; r.a = r.a + 0x60 |0}
                else if(!f.c & !f.h & (upper|0) >= 9 & (lower|0) >= 10){f.c = 1; r.a = r.a + 0x66 |0}
                else if(!f.c & f.h & (upper|0) >= 10 & (lower|0) <= 3){f.c = 1; r.a = r.a + 0x66 |0}
                else if(f.c & !f.h & (upper|0) <= 2 & (lower|0) <= 9){f.c = 1; r.a = r.a + 0x60 |0}
                else if(f.c & !f.h & (upper|0) <= 2 & (lower|0) >= 10){f.c = 1; r.a = r.a + 0x66 |0}
                else if(f.c & f.h & (upper|0) <= 3 & (lower|0) <= 3){f.c = 1; r.a = r.a + 0x66 |0}
            } else {
                if(!f.c & !f.h & (upper|0) <= 9 & (lower|0) <= 9){f.c = 0;}
                else if(!f.c & f.h & (upper|0) <= 8 & (lower|0) >= 6){f.c = 0; r.a = r.a + 0xFA |0}
                else if(f.c & !f.h & (upper|0) >= 7 & (lower|0) <= 9){f.c = 1; r.a = r.a + 0xA0 |0}
                else if(f.c & f.h & (upper|0) >= 6 & (lower|0) >= 6){f.c = 1; r.a = r.a + 0x9A |0}
            }
            r.a = (r.a|0) % 256 |0;
            pc = pc + 1
            return 4
        },
        '28': ()=>{if (f.z == 1) {pc = pc + 1; pc = pc + mem.readSigned(pc) + 1; return 12} else {pc = pc + 2; return 8}},
        '29': ()=>{hl(addWord(hl(), hl())); pc = pc + 1; return 8},
        '2a': ()=>{r.a = mem.readByte(hl()); if (hl() == 0xFFFF) {hl(0)} else {hl(hl() + 1)} pc = pc + 1; return 8},
        '2b': ()=>{if (hl() == 0) {hl(0xFFFF)} else {hl(hl() - 1)} pc = pc + 1; return 8},
        '2c': ()=>{r.l = incByte(r.l); pc = pc + 1; return 4},
        '2d': ()=>{r.l = decByte(r.l); pc = pc + 1; return 4},
        '2e': ()=>{r.l = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '2f': ()=>{r.a = r.a ^ 0xFF; f.n = 1; f.h = 1; pc = pc + 1; return 4},
        '30': ()=>{if (f.c == 0) {pc = pc + 1; let val = mem.readSigned(pc); pc = pc + val + 1; return 12} else {pc = pc + 2; return 8}},
        '31': ()=>{sp = mem.readWord(pc + 1); pc = pc + 3; return 12},
        '32': ()=>{mem.setByte(hl(), r.a); if (hl() == 0) { hl(0xFFFF) } else { hl(hl() - 1) } pc = pc + 1; return 8},
        '33': ()=>{if (sp == 0xFFFF) {sp = 0} else {sp = sp + 1} pc = pc + 1; return 8},
        '34': ()=>{mem.setByte(hl(), incByte(mem.readByte(hl()))); pc = pc + 1; return 12},
        '35': ()=>{mem.setByte(hl(), decByte(mem.readByte(hl()))); pc = pc + 1; return 12},
        '36': ()=>{mem.setByte(hl(), mem.readByte(pc + 1)); pc = pc + 2; return 12},
        '37': ()=>{f.n = 0; f.h = 0; f.c = 1; pc = pc + 1; return 4},
        '38': ()=>{if (f.c != 0) {pc = pc + 1; let val = mem.readSigned(pc); pc = pc + val + 1; return 12} else {pc = pc + 2; return 8}},
        '39': ()=>{hl(addWord(hl(), sp)); pc = pc + 1; return 8},
        '3a': ()=>{r.a = mem.readByte(hl()); if (hl() == 0) {hl(0xFFFF)} else {hl(hl() - 1)} pc = pc + 1; return 8},
        '3b': ()=>{if (sp == 0) {sp = 0xFFFF} else {sp = sp - 1} pc = pc + 1; return 8},
        '3c': ()=>{r.a = incByte(r.a); pc = pc + 1; return 4},
        '3d': ()=>{r.a = decByte(r.a); pc = pc + 1; return 4},
        '3e': ()=>{r.a = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '3f': ()=>{f.n = 0; f.h = 0; if (f.c == 0) {f.c = 1} else {f.c = 0}; pc = pc + 1; return 4},
        '40': ()=>{r.b = r.b; pc = pc + 1; return 4},
        '41': ()=>{r.b = r.c; pc = pc + 1; return 4},
        '42': ()=>{r.b = r.d; pc = pc + 1; return 4},
        '43': ()=>{r.b = r.e; pc = pc + 1; return 4},
        '44': ()=>{r.b = r.h; pc = pc + 1; return 4},
        '45': ()=>{r.b = r.l; pc = pc + 1; return 4},
        '46': ()=>{r.b = mem.readByte(hl()); pc = pc + 1; return 8},
        '47': ()=>{r.b = r.a; pc = pc + 1; return 4},
        '48': ()=>{r.c = r.b; pc = pc + 1; return 4},
        '49': ()=>{r.c = r.c; pc = pc + 1; return 4},
        '4a': ()=>{r.c = r.d; pc = pc + 1; return 4},
        '4b': ()=>{r.c = r.e; pc = pc + 1; return 4},
        '4c': ()=>{r.c = r.h; pc = pc + 1; return 4},
        '4d': ()=>{r.c = r.l; pc = pc + 1; return 4},
        '4e': ()=>{r.c = mem.readByte(hl()); pc = pc + 1; return 8},
        '4f': ()=>{r.c = r.a; pc = pc + 1; return 4},
        '50': ()=>{r.d = r.b; pc = pc + 1; return 4},
        '51': ()=>{r.d = r.c; pc = pc + 1; return 4},
        '52': ()=>{r.d = r.d; pc = pc + 1; return 4},
        '53': ()=>{r.d = r.e; pc = pc + 1; return 4},
        '54': ()=>{r.d = r.h; pc = pc + 1; return 4},
        '55': ()=>{r.d = r.l; pc = pc + 1; return 4},
        '56': ()=>{r.d = mem.readByte(hl()); pc = pc + 1; return 8},
        '57': ()=>{r.d = r.a; pc = pc + 1; return 4},
        '58': ()=>{r.e = r.b; pc = pc + 1; return 4},
        '59': ()=>{r.e = r.c; pc = pc + 1; return 4},
        '5a': ()=>{r.e = r.d; pc = pc + 1; return 4},
        '5b': ()=>{r.e = r.e; pc = pc + 1; return 4},
        '5c': ()=>{r.e = r.h; pc = pc + 1; return 4},
        '5d': ()=>{r.e = r.l; pc = pc + 1; return 4},
        '5e': ()=>{r.e = mem.readByte(hl()); pc = pc + 1; return 8},
        '5f': ()=>{r.e = r.a; pc = pc + 1; return 4},
        '60': ()=>{r.h = r.b; pc = pc + 1; return 4},
        '61': ()=>{r.h = r.c; pc = pc + 1; return 4},
        '62': ()=>{r.h = r.d; pc = pc + 1; return 4},
        '63': ()=>{r.h = r.e; pc = pc + 1; return 4},
        '64': ()=>{r.h = r.h; pc = pc + 1; return 4},
        '65': ()=>{r.h = r.l; pc = pc + 1; return 4},
        '66': ()=>{r.h = mem.readByte(hl()); pc = pc + 1; return 8},
        '67': ()=>{r.h = r.a; pc = pc + 1; return 4},
        '68': ()=>{r.l = r.b; pc = pc + 1; return 4},
        '69': ()=>{r.l = r.c; pc = pc + 1; return 4},
        '6a': ()=>{r.l = r.d; pc = pc + 1; return 4},
        '6b': ()=>{r.l = r.e; pc = pc + 1; return 4},
        '6c': ()=>{r.l = r.h; pc = pc + 1; return 4},
        '6d': ()=>{r.l = r.l; pc = pc + 1; return 4},
        '6e': ()=>{r.l = mem.readByte(hl()); pc = pc + 1; return 8},
        '6f': ()=>{r.l = r.a; pc = pc + 1; return 4},
        '70': ()=>{mem.setByte(hl(), r.b); pc = pc + 1; return 8},
        '71': ()=>{mem.setByte(hl(), r.c); pc = pc + 1; return 8},
        '72': ()=>{mem.setByte(hl(), r.d); pc = pc + 1; return 8},
        '73': ()=>{mem.setByte(hl(), r.e); pc = pc + 1; return 8},
        '74': ()=>{mem.setByte(hl(), r.h); pc = pc + 1; return 8},
        '75': ()=>{mem.setByte(hl(), r.l); pc = pc + 1; return 8},
        '76': ()=>{if (IME) {stopped = true} pc = pc + 1; return 4},
        '77': ()=>{mem.setByte(hl(), r.a); pc = pc + 1; return 8},
        '78': ()=>{r.a = r.b; pc = pc + 1; return 4},
        '79': ()=>{r.a = r.c; pc = pc + 1; return 4},
        '7a': ()=>{r.a = r.d; pc = pc + 1; return 4},
        '7b': ()=>{r.a = r.e; pc = pc + 1; return 4},
        '7c': ()=>{r.a = r.h; pc = pc + 1; return 4},
        '7d': ()=>{r.a = r.l; pc = pc + 1; return 4},
        '7e': ()=>{r.a = mem.readByte(hl()); pc = pc + 1; return 4},
        '7f': ()=>{r.a = r.a; pc = pc + 1; return 4},
        '80': ()=>{r.a = add(r.a, r.b); pc = pc + 1; return 4},
        '81': ()=>{r.a = add(r.a, r.c); pc = pc + 1; return 4},
        '82': ()=>{r.a = add(r.a, r.d); pc = pc + 1; return 4},
        '83': ()=>{r.a = add(r.a, r.e); pc = pc + 1; return 4},
        '84': ()=>{r.a = add(r.a, r.h); pc = pc + 1; return 4},
        '85': ()=>{r.a = add(r.a, r.l); pc = pc + 1; return 4},
        '86': ()=>{r.a = add(r.a, mem.readByte(hl())); pc = pc + 1; return 8},
        '87': ()=>{r.a = add(r.a, r.a); pc = pc + 1; return 4},
        '88': ()=>{r.a = adc(r.a, r.b); pc = pc + 1; return 4},
        '89': ()=>{r.a = adc(r.a, r.c); pc = pc + 1; return 4},
        '8a': ()=>{r.a = adc(r.a, r.d); pc = pc + 1; return 4},
        '8b': ()=>{r.a = adc(r.a, r.e); pc = pc + 1; return 4},
        '8c': ()=>{r.a = adc(r.a, r.h); pc = pc + 1; return 4},
        '8d': ()=>{r.a = adc(r.a, r.l); pc = pc + 1; return 4},
        '8e': ()=>{r.a = adc(r.a, mem.readByte(hl())); pc = pc + 1; return 8},
        '8f': ()=>{r.a = adc(r.a, r.a); pc = pc + 1; return 4},
        '90': ()=>{r.a = sub(r.a, r.b); pc = pc + 1; return 4},
        '91': ()=>{r.a = sub(r.a, r.c); pc = pc + 1; return 4},
        '92': ()=>{r.a = sub(r.a, r.d); pc = pc + 1; return 4},
        '93': ()=>{r.a = sub(r.a, r.e); pc = pc + 1; return 4},
        '94': ()=>{r.a = sub(r.a, r.h); pc = pc + 1; return 4},
        '95': ()=>{r.a = sub(r.a, r.l); pc = pc + 1; return 4},
        '96': ()=>{r.a = sub(r.a, mem.readByte(hl())); pc = pc + 1; return 8},
        '97': ()=>{r.a = sub(r.a, r.a); pc = pc + 1; return 4},
        '98': ()=>{r.a = sbc(r.a, r.b); pc = pc + 1; return 4},
        '99': ()=>{r.a = sbc(r.a, r.c); pc = pc + 1; return 4},
        '9a': ()=>{r.a = sbc(r.a, r.d); pc = pc + 1; return 4},
        '9b': ()=>{r.a = sbc(r.a, r.e); pc = pc + 1; return 4},
        '9c': ()=>{r.a = sbc(r.a, r.h); pc = pc + 1; return 4},
        '9d': ()=>{r.a = sbc(r.a, r.l); pc = pc + 1; return 4},
        '9e': ()=>{r.a = sbc(r.a, mem.readByte(hl())); pc = pc + 1; return 8},
        '9f': ()=>{r.a = sbc(r.a, r.a); pc = pc + 1; return 4},
        'a0': ()=>{r.a = and(r.a, r.b); pc = pc + 1; return 4},
        'a1': ()=>{r.a = and(r.a, r.c); pc = pc + 1; return 4},
        'a2': ()=>{r.a = and(r.a, r.d); pc = pc + 1; return 4},
        'a3': ()=>{r.a = and(r.a, r.e); pc = pc + 1; return 4},
        'a4': ()=>{r.a = and(r.a, r.h); pc = pc + 1; return 4},
        'a5': ()=>{r.a = and(r.a, r.l); pc = pc + 1; return 4},
        'a6': ()=>{r.a = and(r.a, mem.readByte(hl())); pc = pc + 1; return 4},
        'a7': ()=>{r.a = and(r.a, r.a); pc = pc + 1; return 4},
        'a8': ()=>{r.a = xor(r.a, r.b); pc = pc + 1; return 4},
        'a9': ()=>{r.a = xor(r.a, r.c); pc = pc + 1; return 4},
        'aa': ()=>{r.a = xor(r.a, r.d); pc = pc + 1; return 4},
        'ab': ()=>{r.a = xor(r.a, r.e); pc = pc + 1; return 4},
        'ac': ()=>{r.a = xor(r.a, r.h); pc = pc + 1; return 4},
        'ad': ()=>{r.a = xor(r.a, r.l); pc = pc + 1; return 4},
        'ae': ()=>{r.a = xor(r.a, mem.readByte(hl())); pc = pc + 1; return 4},
        'af': ()=>{r.a = xor(r.a, r.a); pc = pc + 1; return 4},
        'b0': ()=>{r.a = or(r.a, r.b); pc = pc + 1; return 4},
        'b1': ()=>{r.a = or(r.a, r.c); pc = pc + 1; return 4},
        'b2': ()=>{r.a = or(r.a, r.d); pc = pc + 1; return 4},
        'b3': ()=>{r.a = or(r.a, r.e); pc = pc + 1; return 4},
        'b4': ()=>{r.a = or(r.a, r.h); pc = pc + 1; return 4},
        'b5': ()=>{r.a = or(r.a, r.l); pc = pc + 1; return 4},
        'b6': ()=>{r.a = or(r.a, mem.readByte(hl())); pc = pc + 1; return 4},
        'b7': ()=>{r.a = or(r.a, r.a); pc = pc + 1; return 4},
        'b8': ()=>{sub(r.a, r.b); pc = pc + 1; return 4},
        'b9': ()=>{sub(r.a, r.c); pc = pc + 1; return 4},
        'ba': ()=>{sub(r.a, r.d); pc = pc + 1; return 4},
        'bb': ()=>{sub(r.a, r.e); pc = pc + 1; return 4},
        'bc': ()=>{sub(r.a, r.h); pc = pc + 1; return 4},
        'bd': ()=>{sub(r.a, r.l); pc = pc + 1; return 4},
        'be': ()=>{sub(r.a, mem.readByte(hl())); pc = pc + 1; return 8},
        'bf': ()=>{sub(r.a, r.a); pc = pc + 1; return 4},
        'c0': ()=>{if (f.z == 0) {pc = mem.readWord(sp); sp = sp + 2; return 20} else {pc = pc + 1; return 8}},
        'c1': ()=>{bc(mem.readWord(sp)); sp = sp + 2; pc = pc + 1; return 12},
        'c2': ()=>{if (f.z == 0) {pc = mem.readWord(pc + 1); return 16} else {pc = pc + 3; return 12}},
        'c3': ()=>{pc = mem.readWord(pc + 1); return 16},
        'c4': ()=>{if (f.z == 0) {pc = pc + 3; call(mem.readWord(pc - 2)); return 24} else {pc = pc + 3; return 12}},
        'c5': ()=>{sp = sp - 2; mem.setWord(sp, bc()); pc = pc + 1; return 16},
        'c6': ()=>{r.a = add(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'c7': ()=>{pc = pc + 1; call(0x0); return 16},
        'c8': ()=>{if (f.z == 1) {pc = mem.readWord(sp); sp = sp + 2; return 20} else {pc = pc + 1; return 8}},
        'c9': ()=>{pc = mem.readWord(sp); sp = sp + 2; return 16},
        'ca': ()=>{if (f.z == 1) {pc = mem.readWord(pc + 1); return 16} else {pc = pc + 3; return 12}},
        'cb': ()=>{let cyclos = cb(mem.readByte(pc + 1)); pc = pc + 2; return cyclos},
        'cc': ()=>{if (f.z == 1) {pc = pc + 3; call(mem.readWord(pc - 2)); return 24} else {pc = pc + 3; return 12}},
        'cd': ()=>{pc = pc + 3; call(mem.readWord(pc - 2)); return 24},
        'ce': ()=>{r.a = adc(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'cf': ()=>{pc = pc + 1; call(0x8); return 16},
        'd0': ()=>{if (f.c == 0) {pc = mem.readWord(sp); sp = sp + 2; return 20} else {pc = pc + 1; return 8}},
        'd1': ()=>{de(mem.readWord(sp)); sp = sp + 2; pc = pc + 1; return 12},
        'd2': ()=>{if (f.c == 0) {pc = mem.readWord(pc + 1); return 16} else {pc = pc + 3; return 12}},
        'd3': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'd4': ()=>{if (f.c == 0) {pc = pc + 3; call(mem.readWord(pc - 2)); return 24} else {pc = pc + 3; return 12}},
        'd5': ()=>{sp = sp - 2; mem.setWord(sp, de()); pc = pc + 1; return 16},
        'd6': ()=>{r.a = sub(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'd7': ()=>{pc = pc + 1; call(0x10); return 16},
        'd8': ()=>{if (f.c == 1) {pc = mem.readWord(sp); sp = sp + 2; return 20} else {pc = pc + 1; return 8}},
        'd9': ()=>{pc = mem.readWord(sp); sp = sp + 2; IME = true; return 16},
        'da': ()=>{if (f.c == 1) {pc = mem.readWord(pc + 1); return 16} else {pc = pc + 3; return 12}},
        'db': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'dc': ()=>{if (f.c == 1) {pc = pc + 3; call(mem.readWord(pc - 2)); return 24} else {pc = pc + 3; return 12}},
        'dd': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'de': ()=>{r.a = sbc(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'df': ()=>{pc = pc + 1; call(0x18); return 16},
        'e0': ()=>{mem.setByte(0xFF00 + mem.readByte(pc + 1), r.a); pc = pc + 2; return 12},
        'e1': ()=>{hl(mem.readWord(sp)); sp = sp + 2; pc = pc + 1; return 12},
        'e2': ()=>{mem.setByte(0xFF00 + r.c, r.a); pc = pc + 1; return 8},
        'e3': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'e4': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'e5': ()=>{sp = sp - 2; mem.setWord(sp, hl()); pc = pc + 1; return 16},
        'e6': ()=>{r.a = and(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'e7': ()=>{pc = pc + 1; call(0x20); return 16},
        'e8': ()=>{
            sp = addWord(sp, mem.readSigned(pc + 1)); 
            sp = (sp + 0x10000) % 0x10000; 
            f.z = 0;
            pc = pc + 2; 
            return 16},
        'e9': ()=>{pc = hl(); return 4},
        'ea': ()=>{mem.setByte(mem.readWord(pc + 1), r.a); pc = pc + 3; return 16},
        'eb': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'ec': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'ed': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'ee': ()=>{r.a = xor(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'ef': ()=>{pc = pc + 1; call(0x28); return 16},
        'f0': ()=>{r.a = mem.readByte(0xFF00 + mem.readByte(pc + 1)); pc = pc + 2; return 12},
        'f1': ()=>{af(mem.readWord(sp)); sp = sp + 2; pc = pc + 1; return 12},
        'f2': ()=>{r.a = mem.readByte(0xFF00 + r.c); pc = pc + 1; return 8},
        'f3': ()=>{IME = false; pc = pc + 1; return 4},
        'f4': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'f5': ()=>{sp = sp - 2; mem.setWord(sp, af()); pc = pc + 1; return 16},
        'f6': ()=>{r.a = or(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'f7': ()=>{pc = pc + 1; call(0x30); return 16},
        'f8': ()=>{hl(addWord(sp, mem.readSigned(pc + 1))); f.z = 0; pc = pc + 2; return 12},
        'f9': ()=>{sp = hl(); pc = pc + 1; return 8},
        'fa': ()=>{r.a = mem.readByte(mem.readWord(pc + 1)); pc = pc + 3; return 16},
        'fb': ()=>{IME = 1; pc = pc + 1; runInterruptsFunction(); return 4;},
        'fc': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'fd': ()=>{throw new Error(`NOT AN INSTRUCTION`)},
        'fe': ()=>{sub(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'ff': ()=>{pc = pc + 1; call(0x38); return 16}    
    }
    let lastInstr = 0;
    let history = []
    let opcode = function (instr) {
        // console.log(`${instr.toString(16)} at address: ${pc.toString(16)}; next two bytes: ${mem.readByte(pc + 1).toString(16)}, ${mem.readByte(pc + 2).toString(16)}`)
        // history.push(`${instr.toString(16)} at address: ${pc.toString(16)}; next two bytes: ${mem.readByte(pc + 1).toString(16)}, ${mem.readByte(pc + 2).toString(16)}, a: ${r.a}`)
        // if (history.length > 100) {
        //     history.shift()
        // }
        // logRegisters()
        // if (pc === 0x6a) {
        //     console.log(`C: ${r.c.toString(16)}`)
        // }
        // if (pc === 0x6d) {
        //     console.log(`E: ${r.e.toString(16)}`)
        // }
        lastInstr = instr.toString(16)
        uniqueInstr[instr.toString(16)] = 1
        try {
            if (opcodes[instr.toString(16).toLowerCase()]) return opcodes[instr.toString(16).toLowerCase()]()
        } catch (e) {throw new Error(`Instr ${instr.toString(16).toLowerCase()} error: ${e.toString()}; PC: ${pc.toString(16)}; FULL: ${e.stack}`)}
    }

    let interrupt = (addr) => {
        if (IME) {
            IME = false
            call(addr)
            stopped = false
            return true
        } else {
            return false
        }
    } 

    return {
        runCycles: runCycles,
        interrupt: interrupt,
        step: step,
        runCyclesUntil: runCyclesUntil,
        getRegisters: () => {
            return {pc, sp, hl: mem.readByte(hl()), ...r}
        }
    }
}