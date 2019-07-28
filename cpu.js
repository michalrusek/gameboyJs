let cpu = function (mem) {
    "use strict";
    let debug = false
    let uniqueInstr = {}
    let pc = 0
    let sp = 0xFFFE
    let r = {a: 0, f: 0, b: 0, c: 0, d: 0, e: 0, h: 0, l: 0}
    let f = {z: 0, n: 0, h: 0, c: 0}
    let af = function (val) {if (val && val > 0xFFFF) {throw new Error(`Can't set ${val} to af`)} if (val) {r.a = (val >> 8) & 0xFF; r.f = val & 0xFF;} return r.a << 8 | r.f}
    let bc = function (val) {if (val && val > 0xFFFF) {throw new Error(`Can't set ${val} to bc`)} if (val) {r.b = (val >> 8) & 0xFF; r.c = val & 0xFF;} return r.b << 8 | r.c}
    let de = function (val) {if (val && val > 0xFFFF) {throw new Error(`Can't set ${val} to de`)} if (val) {r.d = (val >> 8) & 0xFF; r.e = val & 0xFF;} return r.d << 8 | r.e}
    let hl = function (val) {if (val && val > 0xFFFF) {throw new Error(`Can't set ${val} to hl`)} if (val) {r.h = (val >> 8) & 0xFF; r.l = val & 0xFF;} return r.h << 8 | r.l}
    let syncFlags = function () {r.f = f.z << 7 | f.n << 6 | f.h << 5 | f.c << 4}
    let stopped = false
    let IME = false

    //Power up stuff (see http://bgb.bircd.org/pandocs.htm#powerupsequence)
    af(0x01B0)
    bc(0x0013)
    de(0x00D8)
    hl(0x014D)
    sp = 0xFFFE

    let logRegisters = () => {
        let newR = {}
        for (let k in r) {
            newR[k] = r[k].toString(16)
        }
        console.log("PC: " + pc.toString(16) + "  :  " + JSON.stringify(r) + "   :   " + JSON.stringify(newR))
    }

    let runCycles = function (n) {
        while (n > 0) {
            n = n - opcode(mem.readByte(pc))
            syncFlags()

            //Just a sanity check - run through all registers and if any is above 0xFF then something went really wrong
            for (let key in r) {if (r[key] > 0xFF) throw new Error(`Register ${key} has invalid value: ${r[key]}`)}
        }

        //DEBUG
        // if (pc >= 0xE8) {
        //     throw new Error("Comparison starts. Needs logo data (load the game bruh).")
        // }
    }

    let runCyclesUntil = function (n, when) {
        while (n > 0) {
            n = n - opcode(mem.readByte(pc))
            syncFlags()

            //Just a sanity check - run through all registers and if any is above 0xFF then something went really wrong
            for (let key in r) {if (r[key] > 0xFF) throw new Error(`Register ${key} has invalid value: ${r[key]}`)}

            if (pc == when) {
                logRegisters()
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
            case 6: valOrig = r.mem.readByte(hl()); cycles = 16; break;
            case 7: valOrig = r.a; break;
        }

        valNew = valOrig;

        //Divide the instruction by 8 because there are 8 values we can operate on (b,c,d,e,h,l,(hl),a)
        //So there's basically X instructions times 8 values
        let op = instr / 8
        if (op >= 0 && op <= 7) {
            let c = op | 0
            f.n = 0; f.h = 0;
            switch (c) {
                case 0: f.c = valOrig >> 7; valNew = valOrig << 1; break; //RLC - rotate left
                case 1: f.c = valOrig & 1; valNew = valOrig >> 1; break; //RRC - rotate right
                case 2: valNew = (valOrig << 1) + f.c; f.c = (valOrig >> 7) & 0b1; break; //RL - rotate left through carry
                case 3: valNew = (valOrig >> 1) + (f.c << 7); f.c = valOrig & 1; break; //RR - rotate left through carry
                case 4: f.c = valOrig >> 7; valNew = valOrig << 1; break; //SLA
                case 5: f.c = valOrig & 1; valNew = (valOrig >> 1) | (valOrig & 0x80); break; //SRA
                case 6: valNew = ((valOrig >> 4) | (valOrig << 4)) & 0xFF; f.c = 0; break; //SWAP
                case 7: f.c = valOrig & 1; valNew = valOrig >> 1; break; //SRL
            }
            valNew = valNew & 0xFF
            f.z = valNew == 0 ? 1 : 0
        } else if ((op | 0) >= 8 && (op | 0) <= 15) {
            //BIT
            f.h = 1; f.n = 0; f.z = ((valOrig & (1 << ((op | 0) - 8))) == 0) ? 1 : 0;
        } else if ((op | 0) >= 16 && (op | 0) <= 23) {
            //RES
            valNew = valOrig ^ (1 << ((op | 0) - 16))
        } else if ((op | 0) >= 24 && (op | 0) <= 31) {
            //SET
            valNew = valOrig | (1 << ((op | 0) - 24))
        }

        valNew = valNew & 0xFF

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
    let xor = (a, b) => {if ((a ^ b) === 0) {f.z = 1} else {f.z = 0} f.n = 0; f.c = 0; f.h = 0; return a ^ b}
    let incByte = (a) => {f.n = 0; f.h = 0; f.z = 0; if (a == 0xFF) {f.h = 1; f.z = 1; return 0} if (a % 16 == 15) {f.h = 1} return a + 1}
    let decByte = (a) => {f.n = 1; f.h = 0; if (a == 0) {f.h = 1; f.z = 0; return 0xFF} if (a == 1) {f.z = 1; return 0} f.z = 0; if (a % 16 == 0) {f.h = 1} return a - 1}
    let sbc = (a, b) => {return sub(a, b + f.c)}
    let sub = (a, b) => {f.n = 1; let res = a - b; f.c = res < 0 ? 1 : 0; f.z = res == 0 ? 1 : 0; f.h = (a & 0xF) - (b & 0xF) < 0 ? 1 : 0; return Math.abs(res)}
    let call = (addr) => {if (sp == 0) {throw new Error(`SP going lower than 0.`)} sp = sp - 2; mem.setWord(sp, pc); pc = addr}

    let opcodes = {
        '0': ()=>{pc = pc + 1; debugger; return 4;},
        '1': ()=>{bc(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '2': ()=>{mem.setByte(bc(), r.a); pc = pc + 1; return 8},
        '3': ()=>{if (bc() == 0xFFFF) {bc(0)} else {bc(bc() + 1)} pc = pc + 1; return 8},
        '4': ()=>{r.b = incByte(r.b); pc = pc + 1; return 4},
        '5': ()=>{r.b = decByte(r.b); pc = pc + 1; return 4},
        '6': ()=>{r.b = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '7': ()=>{cb(7); pc = pc + 1; return 4},
        '8': ()=>{throw new Error(`Not implemented!`)},
        '9': ()=>{throw new Error(`Not implemented!`)},
        'a': ()=>{throw new Error(`Not implemented!`)},
        'b': ()=>{throw new Error(`Not implemented!`)},
        'c': ()=>{r.c = incByte(r.c); pc = pc + 1; return 4},
        'd': ()=>{r.c = decByte(r.c); pc = pc + 1; return 4},
        'e': ()=>{r.c = mem.readByte(pc + 1); pc = pc + 2; return 8},
        'f': ()=>{throw new Error(`Not implemented!`)},
        '10': ()=>{throw new Error(`Not implemented!`)},
        '11': ()=>{de(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '12': ()=>{throw new Error(`Not implemented!`)},
        '13': ()=>{if (de() == 0xFFFF) {de(0)} else {de(de() + 1)} pc = pc + 1; return 8},
        '14': ()=>{throw new Error(`Not implemented!`)},
        '15': ()=>{r.d = decByte(r.d); pc = pc + 1; return 4},
        '16': ()=>{r.d = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '17': ()=>{pc = pc + 1; cb(23); return 4;},
        '18': ()=>{pc = pc + 1; pc = pc + mem.readSigned(pc) + 1; return 12},
        '19': ()=>{throw new Error(`Not implemented!`)},
        '1a': ()=>{r.a = mem.readByte(de()); pc = pc + 1; return 8},
        '1b': ()=>{throw new Error(`Not implemented!`)},
        '1c': ()=>{throw new Error(`Not implemented!`)},
        '1d': ()=>{r.e = decByte(r.e); pc = pc + 1; return 4},
        '1e': ()=>{r.e = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '1f': ()=>{throw new Error(`Not implemented!`)},
        '20': ()=>{if (f.z == 0) {pc = pc + 1; let val = mem.readSigned(pc); pc = pc + val + 1; return 12} else {pc = pc + 2; return 8}},
        '21': ()=>{hl(mem.readWord(pc + 1)); pc = pc + 3; return 12},
        '22': ()=>{mem.setByte(hl(), r.a); if (hl() == 0xFFFF) { hl(0) } else { hl(hl() + 1) } pc = pc + 1; return 8},
        '23': ()=>{if (hl() == 0xFFFF) {hl(0)} else {hl(hl() + 1)} pc = pc + 1; return 8},
        '24': ()=>{r.h = incByte(r.h); pc = pc + 1; return 4},
        '25': ()=>{throw new Error(`Not implemented!`)},
        '26': ()=>{throw new Error(`Not implemented!`)},
        '27': ()=>{throw new Error(`Not implemented!`)},
        '28': ()=>{if (f.z == 1) {pc = pc + 1; pc = pc + mem.readSigned(pc) + 1; return 12} else {pc = pc + 2; return 8}},
        '29': ()=>{throw new Error(`Not implemented!`)},
        '2a': ()=>{throw new Error(`Not implemented!`)},
        '2b': ()=>{throw new Error(`Not implemented!`)},
        '2c': ()=>{throw new Error(`Not implemented!`)},
        '2d': ()=>{throw new Error(`Not implemented!`)},
        '2e': ()=>{r.l = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '2f': ()=>{throw new Error(`Not implemented!`)},
        '30': ()=>{throw new Error(`Not implemented!`)},
        '31': ()=>{sp = mem.readWord(pc + 1); pc = pc + 3; return 12},
        '32': ()=>{mem.setByte(hl(), r.a); if (hl() == 0) { hl(0xFFFF) } else { hl(hl() - 1) } pc = pc + 1; return 8},
        '33': ()=>{throw new Error(`Not implemented!`)},
        '34': ()=>{throw new Error(`Not implemented!`)},
        '35': ()=>{throw new Error(`Not implemented!`)},
        '36': ()=>{throw new Error(`Not implemented!`)},
        '37': ()=>{throw new Error(`Not implemented!`)},
        '38': ()=>{throw new Error(`Not implemented!`)},
        '39': ()=>{throw new Error(`Not implemented!`)},
        '3a': ()=>{throw new Error(`Not implemented!`)},
        '3b': ()=>{throw new Error(`Not implemented!`)},
        '3c': ()=>{throw new Error(`Not implemented!`)},
        '3d': ()=>{r.a = decByte(r.a); pc = pc + 1; return 4},
        '3e': ()=>{r.a = mem.readByte(pc + 1); pc = pc + 2; return 8},
        '3f': ()=>{throw new Error(`Not implemented!`)},
        '40': ()=>{throw new Error(`Not implemented!`)},
        '41': ()=>{throw new Error(`Not implemented!`)},
        '42': ()=>{throw new Error(`Not implemented!`)},
        '43': ()=>{throw new Error(`Not implemented!`)},
        '44': ()=>{throw new Error(`Not implemented!`)},
        '45': ()=>{throw new Error(`Not implemented!`)},
        '46': ()=>{throw new Error(`Not implemented!`)},
        '47': ()=>{throw new Error(`Not implemented!`)},
        '48': ()=>{throw new Error(`Not implemented!`)},
        '49': ()=>{throw new Error(`Not implemented!`)},
        '4a': ()=>{throw new Error(`Not implemented!`)},
        '4b': ()=>{r.c = r.e; pc = pc + 1; return 4},
        '4c': ()=>{throw new Error(`Not implemented!`)},
        '4d': ()=>{throw new Error(`Not implemented!`)},
        '4e': ()=>{throw new Error(`Not implemented!`)},
        '4f': ()=>{r.c = r.a; pc = pc + 1; return 4},
        '50': ()=>{throw new Error(`Not implemented!`)},
        '51': ()=>{throw new Error(`Not implemented!`)},
        '52': ()=>{throw new Error(`Not implemented!`)},
        '53': ()=>{throw new Error(`Not implemented!`)},
        '54': ()=>{throw new Error(`Not implemented!`)},
        '55': ()=>{throw new Error(`Not implemented!`)},
        '56': ()=>{throw new Error(`Not implemented!`)},
        '57': ()=>{r.d = r.a; pc = pc + 1; return 4},
        '58': ()=>{throw new Error(`Not implemented!`)},
        '59': ()=>{throw new Error(`Not implemented!`)},
        '5a': ()=>{throw new Error(`Not implemented!`)},
        '5b': ()=>{throw new Error(`Not implemented!`)},
        '5c': ()=>{throw new Error(`Not implemented!`)},
        '5d': ()=>{throw new Error(`Not implemented!`)},
        '5e': ()=>{throw new Error(`Not implemented!`)},
        '5f': ()=>{throw new Error(`Not implemented!`)},
        '60': ()=>{throw new Error(`Not implemented!`)},
        '61': ()=>{throw new Error(`Not implemented!`)},
        '62': ()=>{throw new Error(`Not implemented!`)},
        '63': ()=>{throw new Error(`Not implemented!`)},
        '64': ()=>{throw new Error(`Not implemented!`)},
        '65': ()=>{throw new Error(`Not implemented!`)},
        '66': ()=>{throw new Error(`Not implemented!`)},
        '67': ()=>{r.h = r.a; pc = pc + 1; return 4},
        '68': ()=>{throw new Error(`Not implemented!`)},
        '69': ()=>{throw new Error(`Not implemented!`)},
        '6a': ()=>{throw new Error(`Not implemented!`)},
        '6b': ()=>{throw new Error(`Not implemented!`)},
        '6c': ()=>{throw new Error(`Not implemented!`)},
        '6d': ()=>{throw new Error(`Not implemented!`)},
        '6e': ()=>{throw new Error(`Not implemented!`)},
        '6f': ()=>{throw new Error(`Not implemented!`)},
        '70': ()=>{throw new Error(`Not implemented!`)},
        '71': ()=>{throw new Error(`Not implemented!`)},
        '72': ()=>{throw new Error(`Not implemented!`)},
        '73': ()=>{throw new Error(`Not implemented!`)},
        '74': ()=>{throw new Error(`Not implemented!`)},
        '75': ()=>{throw new Error(`Not implemented!`)},
        '76': ()=>{throw new Error(`Not implemented!`)},
        '77': ()=>{mem.setByte(hl(), r.a); pc = pc + 1; return 8},
        '78': ()=>{throw new Error(`Not implemented!`)},
        '79': ()=>{throw new Error(`Not implemented!`)},
        '7a': ()=>{throw new Error(`Not implemented!`)},
        '7b': ()=>{r.a = r.e; pc = pc + 1; return 4},
        '7c': ()=>{r.a = r.h; pc = pc + 1; return 4},
        '7d': ()=>{throw new Error(`Not implemented!`)},
        '7e': ()=>{throw new Error(`Not implemented!`)},
        '7f': ()=>{throw new Error(`Not implemented!`)},
        '80': ()=>{throw new Error(`Not implemented!`)},
        '81': ()=>{throw new Error(`Not implemented!`)},
        '82': ()=>{throw new Error(`Not implemented!`)},
        '83': ()=>{throw new Error(`Not implemented!`)},
        '84': ()=>{throw new Error(`Not implemented!`)},
        '85': ()=>{throw new Error(`Not implemented!`)},
        '86': ()=>{throw new Error(`Not implemented!`)},
        '87': ()=>{throw new Error(`Not implemented!`)},
        '88': ()=>{throw new Error(`Not implemented!`)},
        '89': ()=>{throw new Error(`Not implemented!`)},
        '8a': ()=>{throw new Error(`Not implemented!`)},
        '8b': ()=>{throw new Error(`Not implemented!`)},
        '8c': ()=>{throw new Error(`Not implemented!`)},
        '8d': ()=>{throw new Error(`Not implemented!`)},
        '8e': ()=>{throw new Error(`Not implemented!`)},
        '8f': ()=>{throw new Error(`Not implemented!`)},
        '90': ()=>{r.a = sub(r.a, r.b); pc = pc + 1; return 4},
        '91': ()=>{throw new Error(`Not implemented!`)},
        '92': ()=>{throw new Error(`Not implemented!`)},
        '93': ()=>{throw new Error(`Not implemented!`)},
        '94': ()=>{throw new Error(`Not implemented!`)},
        '95': ()=>{throw new Error(`Not implemented!`)},
        '96': ()=>{throw new Error(`Not implemented!`)},
        '97': ()=>{throw new Error(`Not implemented!`)},
        '98': ()=>{throw new Error(`Not implemented!`)},
        '99': ()=>{throw new Error(`Not implemented!`)},
        '9a': ()=>{throw new Error(`Not implemented!`)},
        '9b': ()=>{throw new Error(`Not implemented!`)},
        '9c': ()=>{throw new Error(`Not implemented!`)},
        '9d': ()=>{throw new Error(`Not implemented!`)},
        '9e': ()=>{throw new Error(`Not implemented!`)},
        '9f': ()=>{r.a = sbc(r.a, r.a); pc = pc + 1; return 4},
        'a0': ()=>{throw new Error(`Not implemented!`)},
        'a1': ()=>{throw new Error(`Not implemented!`)},
        'a2': ()=>{throw new Error(`Not implemented!`)},
        'a3': ()=>{throw new Error(`Not implemented!`)},
        'a4': ()=>{throw new Error(`Not implemented!`)},
        'a5': ()=>{throw new Error(`Not implemented!`)},
        'a6': ()=>{throw new Error(`Not implemented!`)},
        'a7': ()=>{throw new Error(`Not implemented!`)},
        'a8': ()=>{r.a = xor(r.a, r.b); pc = pc + 1; return 4},
        'a9': ()=>{r.a = xor(r.a, r.c); pc = pc + 1; return 4},
        'aa': ()=>{r.a = xor(r.a, r.d); pc = pc + 1; return 4},
        'ab': ()=>{r.a = xor(r.a, r.e); pc = pc + 1; return 4},
        'ac': ()=>{r.a = xor(r.a, r.h); pc = pc + 1; return 4},
        'ad': ()=>{r.a = xor(r.a, r.l); pc = pc + 1; return 4},
        'ae': ()=>{r.a = xor(r.a, mem.readByte(hl())); pc = pc + 1; return 4},
        'af': ()=>{r.a = xor(r.a, r.a); pc = pc + 1; return 4},
        'b0': ()=>{throw new Error(`Not implemented!`)},
        'b1': ()=>{throw new Error(`Not implemented!`)},
        'b2': ()=>{throw new Error(`Not implemented!`)},
        'b3': ()=>{throw new Error(`Not implemented!`)},
        'b4': ()=>{throw new Error(`Not implemented!`)},
        'b5': ()=>{throw new Error(`Not implemented!`)},
        'b6': ()=>{throw new Error(`Not implemented!`)},
        'b7': ()=>{throw new Error(`Not implemented!`)},
        'b8': ()=>{throw new Error(`Not implemented!`)},
        'b9': ()=>{throw new Error(`Not implemented!`)},
        'ba': ()=>{throw new Error(`Not implemented!`)},
        'bb': ()=>{throw new Error(`Not implemented!`)},
        'bc': ()=>{throw new Error(`Not implemented!`)},
        'bd': ()=>{throw new Error(`Not implemented!`)},
        'be': ()=>{throw new Error(`Not implemented!`)},
        'bf': ()=>{throw new Error(`Not implemented!`)},
        'c0': ()=>{throw new Error(`Not implemented!`)},
        'c1': ()=>{bc(mem.readWord(sp)); sp = sp + 2; pc = pc + 1; return 12},
        'c2': ()=>{throw new Error(`Not implemented!`)},
        'c3': ()=>{throw new Error(`Not implemented!`)},
        'c4': ()=>{throw new Error(`Not implemented!`)},
        'c5': ()=>{sp = sp - 2; mem.setWord(sp, bc()); pc = pc + 1; return 16},
        'c6': ()=>{throw new Error(`Not implemented!`)},
        'c7': ()=>{throw new Error(`Not implemented!`)},
        'c8': ()=>{throw new Error(`Not implemented!`)},
        'c9': ()=>{pc = mem.readWord(sp); sp = sp + 2; return 16},
        'ca': ()=>{throw new Error(`Not implemented!`)},
        'cb': ()=>{let cyclos = cb(mem.readByte(pc + 1)); pc = pc + 2; return cyclos},
        'cc': ()=>{throw new Error(`Not implemented!`)},
        'cd': ()=>{pc = pc + 3; call(mem.readWord(pc - 2)); return 24},
        'ce': ()=>{throw new Error(`Not implemented!`)},
        'cf': ()=>{throw new Error(`Not implemented!`)},
        'd0': ()=>{throw new Error(`Not implemented!`)},
        'd1': ()=>{throw new Error(`Not implemented!`)},
        'd2': ()=>{throw new Error(`Not implemented!`)},
        'd3': ()=>{throw new Error(`Not implemented!`)},
        'd4': ()=>{throw new Error(`Not implemented!`)},
        'd5': ()=>{throw new Error(`Not implemented!`)},
        'd6': ()=>{throw new Error(`Not implemented!`)},
        'd7': ()=>{throw new Error(`Not implemented!`)},
        'd8': ()=>{throw new Error(`Not implemented!`)},
        'd9': ()=>{throw new Error(`Not implemented!`)},
        'da': ()=>{throw new Error(`Not implemented!`)},
        'db': ()=>{throw new Error(`Not implemented!`)},
        'dc': ()=>{throw new Error(`Not implemented!`)},
        'dd': ()=>{throw new Error(`Not implemented!`)},
        'de': ()=>{throw new Error(`Not implemented!`)},
        'df': ()=>{throw new Error(`Not implemented!`)},
        'e0': ()=>{mem.setByte(0xFF00 + mem.readByte(pc + 1), r.a); pc = pc + 2; return 12},
        'e1': ()=>{throw new Error(`Not implemented!`)},
        'e2': ()=>{mem.setByte(0xFF00 + r.c, r.a); pc = pc + 1; return 8},
        'e3': ()=>{throw new Error(`Not implemented!`)},
        'e4': ()=>{throw new Error(`Not implemented!`)},
        'e5': ()=>{throw new Error(`Not implemented!`)},
        'e6': ()=>{throw new Error(`Not implemented!`)},
        'e7': ()=>{throw new Error(`Not implemented!`)},
        'e8': ()=>{throw new Error(`Not implemented!`)},
        'e9': ()=>{throw new Error(`Not implemented!`)},
        'ea': ()=>{mem.setByte(mem.readWord(pc + 1), r.a); pc = pc + 3; return 16},
        'eb': ()=>{throw new Error(`Not implemented!`)},
        'ec': ()=>{throw new Error(`Not implemented!`)},
        'ed': ()=>{throw new Error(`Not implemented!`)},
        'ee': ()=>{r.a = xor(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'ef': ()=>{throw new Error(`Not implemented!`)},
        'f0': ()=>{r.a = mem.readByte(0xFF00 + mem.readByte(pc + 1)); pc = pc + 2; return 12},
        'f1': ()=>{throw new Error(`Not implemented!`)},
        'f2': ()=>{throw new Error(`Not implemented!`)},
        'f3': ()=>{throw new Error(`Not implemented!`)},
        'f4': ()=>{throw new Error(`Not implemented!`)},
        'f5': ()=>{throw new Error(`Not implemented!`)},
        'f6': ()=>{throw new Error(`Not implemented!`)},
        'f7': ()=>{throw new Error(`Not implemented!`)},
        'f8': ()=>{throw new Error(`Not implemented!`)},
        'f9': ()=>{throw new Error(`Not implemented!`)},
        'fa': ()=>{throw new Error(`Not implemented!`)},
        'fb': ()=>{throw new Error(`Not implemented!`)},
        'fc': ()=>{throw new Error(`Not implemented!`)},
        'fd': ()=>{throw new Error(`Not implemented!`)},
        'fe': ()=>{if (debug && sub(r.a, mem.readByte(pc + 1)) == 0) {console.log(`CP FE = ${sub(r.a, mem.readByte(pc + 1)) == 0}: num: ${mem.readByte(pc + 1)}, a: ${r.a}`); };sub(r.a, mem.readByte(pc + 1)); pc = pc + 2; return 8},
        'ff': ()=>{throw new Error(`Not implemented!`)}    
    }

    let opcode = function (instr) {
        // console.log(`${instr.toString(16)} at address: ${pc.toString(16)}`)
        // if (pc === 0x6a) {
        //     console.log(`C: ${r.c.toString(16)}`)
        // }
        // if (pc === 0x6d) {
        //     console.log(`E: ${r.e.toString(16)}`)
        // }
        uniqueInstr[instr.toString(16)] = 1
        if (pc == 0xa7) {
            // throw new Error(`graphics done: ${JSON.stringify(uniqueInstr)}`)
        }
        try {
            if (opcodes[instr.toString(16).toLowerCase()]) return opcodes[instr.toString(16).toLowerCase()]()
        } catch (e) {throw new Error(`Instr ${instr.toString(16).toLowerCase()} error: ${e.toString()}; PC: ${pc.toString(16)}`)}
    }

    let interrupt = (addr) => {
        if (IME) {
            IME = false
            console.log()
            call(addr)
            stopped = false
            return true
        } else {
            return false
        }
    } 

    let step = () => {
        opcode(mem.readByte(pc))
        syncFlags()
        logRegisters()
    }

    return {
        runCycles: runCycles,
        interrupt: interrupt,
        step: step,
        runCyclesUntil: runCyclesUntil
    }
}

module.exports = cpu