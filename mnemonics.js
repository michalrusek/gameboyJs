let cbOnes = {
    '0': () => {return `RLC B`;},
    '1': () => {return `RLC C`;},
    '2': () => {return `RLC D`;},
    '3': () => {return `RLC E`;},
    '4': () => {return `RLC H`;},
    '5': () => {return `RLC L`;},
    '6': () => {return `RLC (HL)`;},
    '7': () => {return `RLC A`;},
    '8': () => {return `RRC B`;},
    '9': () => {return `RRC C`;},
    'a': () => {return `RRC D`;},
    'b': () => {return `RRC E`;},
    'c': () => {return `RRC H`;},
    'd': () => {return `RRC L`;},
    'e': () => {return `RRC (HL)`;},
    'f': () => {return `RRC A`;},
    '10': () => {return `RL B`;},
    '11': () => {return `RL C`;},
    '12': () => {return `RL D`;},
    '13': () => {return `RL E`;},
    '14': () => {return `RL H`;},
    '15': () => {return `RL L`;},
    '16': () => {return `RL (HL)`;},
    '17': () => {return `RL A`;},
    '18': () => {return `RR B`;},
    '19': () => {return `RR C`;},
    '1a': () => {return `RR D`;},
    '1b': () => {return `RR E`;},
    '1c': () => {return `RR H`;},
    '1d': () => {return `RR L`;},
    '1e': () => {return `RR (HL)`;},
    '1f': () => {return `RR A`;},
    '20': () => {return `SLA B`;},
    '21': () => {return `SLA C`;},
    '22': () => {return `SLA D`;},
    '23': () => {return `SLA E`;},
    '24': () => {return `SLA H`;},
    '25': () => {return `SLA L`;},
    '26': () => {return `SLA (HL)`;},
    '27': () => {return `SLA A`;},
    '28': () => {return `SRA B`;},
    '29': () => {return `SRA C`;},
    '2a': () => {return `SRA D`;},
    '2b': () => {return `SRA E`;},
    '2c': () => {return `SRA H`;},
    '2d': () => {return `SRA L`;},
    '2e': () => {return `SRA (HL)`;},
    '2f': () => {return `SRA A`;},
    '30': () => {return `SWAP B`;},
    '31': () => {return `SWAP C`;},
    '32': () => {return `SWAP D`;},
    '33': () => {return `SWAP E`;},
    '34': () => {return `SWAP H`;},
    '35': () => {return `SWAP L`;},
    '36': () => {return `SWAP (HL)`;},
    '37': () => {return `SWAP A`;},
    '38': () => {return `SRL B`;},
    '39': () => {return `SRL C`;},
    '3a': () => {return `SRL D`;},
    '3b': () => {return `SRL E`;},
    '3c': () => {return `SRL H`;},
    '3d': () => {return `SRL L`;},
    '3e': () => {return `SRL (HL)`;},
    '3f': () => {return `SRL A`;},
    '40': () => {return `BIT 0,B`;},
    '41': () => {return `BIT 0,C`;},
    '42': () => {return `BIT 0,D`;},
    '43': () => {return `BIT 0,E`;},
    '44': () => {return `BIT 0,H`;},
    '45': () => {return `BIT 0,L`;},
    '46': () => {return `BIT 0,(HL)`;},
    '47': () => {return `BIT 0,A`;},
    '48': () => {return `BIT 1,B`;},
    '49': () => {return `BIT 1,C`;},
    '4a': () => {return `BIT 1,D`;},
    '4b': () => {return `BIT 1,E`;},
    '4c': () => {return `BIT 1,H`;},
    '4d': () => {return `BIT 1,L`;},
    '4e': () => {return `BIT 1,(HL)`;},
    '4f': () => {return `BIT 1,A`;},
    '50': () => {return `BIT 2,B`;},
    '51': () => {return `BIT 2,C`;},
    '52': () => {return `BIT 2,D`;},
    '53': () => {return `BIT 2,E`;},
    '54': () => {return `BIT 2,H`;},
    '55': () => {return `BIT 2,L`;},
    '56': () => {return `BIT 2,(HL)`;},
    '57': () => {return `BIT 2,A`;},
    '58': () => {return `BIT 3,B`;},
    '59': () => {return `BIT 3,C`;},
    '5a': () => {return `BIT 3,D`;},
    '5b': () => {return `BIT 3,E`;},
    '5c': () => {return `BIT 3,H`;},
    '5d': () => {return `BIT 3,L`;},
    '5e': () => {return `BIT 3,(HL)`;},
    '5f': () => {return `BIT 3,A`;},
    '60': () => {return `BIT 4,B`;},
    '61': () => {return `BIT 4,C`;},
    '62': () => {return `BIT 4,D`;},
    '63': () => {return `BIT 4,E`;},
    '64': () => {return `BIT 4,H`;},
    '65': () => {return `BIT 4,L`;},
    '66': () => {return `BIT 4,(HL)`;},
    '67': () => {return `BIT 4,A`;},
    '68': () => {return `BIT 5,B`;},
    '69': () => {return `BIT 5,C`;},
    '6a': () => {return `BIT 5,D`;},
    '6b': () => {return `BIT 5,E`;},
    '6c': () => {return `BIT 5,H`;},
    '6d': () => {return `BIT 5,L`;},
    '6e': () => {return `BIT 5,(HL)`;},
    '6f': () => {return `BIT 5,A`;},
    '70': () => {return `BIT 6,B`;},
    '71': () => {return `BIT 6,C`;},
    '72': () => {return `BIT 6,D`;},
    '73': () => {return `BIT 6,E`;},
    '74': () => {return `BIT 6,H`;},
    '75': () => {return `BIT 6,L`;},
    '76': () => {return `BIT 6,(HL)`;},
    '77': () => {return `BIT 6,A`;},
    '78': () => {return `BIT 7,B`;},
    '79': () => {return `BIT 7,C`;},
    '7a': () => {return `BIT 7,D`;},
    '7b': () => {return `BIT 7,E`;},
    '7c': () => {return `BIT 7,H`;},
    '7d': () => {return `BIT 7,L`;},
    '7e': () => {return `BIT 7,(HL)`;},
    '7f': () => {return `BIT 7,A`;},
    '80': () => {return `RES 0,B`;},
    '81': () => {return `RES 0,C`;},
    '82': () => {return `RES 0,D`;},
    '83': () => {return `RES 0,E`;},
    '84': () => {return `RES 0,H`;},
    '85': () => {return `RES 0,L`;},
    '86': () => {return `RES 0,(HL)`;},
    '87': () => {return `RES 0,A`;},
    '88': () => {return `RES 1,B`;},
    '89': () => {return `RES 1,C`;},
    '8a': () => {return `RES 1,D`;},
    '8b': () => {return `RES 1,E`;},
    '8c': () => {return `RES 1,H`;},
    '8d': () => {return `RES 1,L`;},
    '8e': () => {return `RES 1,(HL)`;},
    '8f': () => {return `RES 1,A`;},
    '90': () => {return `RES 2,B`;},
    '91': () => {return `RES 2,C`;},
    '92': () => {return `RES 2,D`;},
    '93': () => {return `RES 2,E`;},
    '94': () => {return `RES 2,H`;},
    '95': () => {return `RES 2,L`;},
    '96': () => {return `RES 2,(HL)`;},
    '97': () => {return `RES 2,A`;},
    '98': () => {return `RES 3,B`;},
    '99': () => {return `RES 3,C`;},
    '9a': () => {return `RES 3,D`;},
    '9b': () => {return `RES 3,E`;},
    '9c': () => {return `RES 3,H`;},
    '9d': () => {return `RES 3,L`;},
    '9e': () => {return `RES 3,(HL)`;},
    '9f': () => {return `RES 3,A`;},
    'a0': () => {return `RES 4,B`;},
    'a1': () => {return `RES 4,C`;},
    'a2': () => {return `RES 4,D`;},
    'a3': () => {return `RES 4,E`;},
    'a4': () => {return `RES 4,H`;},
    'a5': () => {return `RES 4,L`;},
    'a6': () => {return `RES 4,(HL)`;},
    'a7': () => {return `RES 4,A`;},
    'a8': () => {return `RES 5,B`;},
    'a9': () => {return `RES 5,C`;},
    'aa': () => {return `RES 5,D`;},
    'ab': () => {return `RES 5,E`;},
    'ac': () => {return `RES 5,H`;},
    'ad': () => {return `RES 5,L`;},
    'ae': () => {return `RES 5,(HL)`;},
    'af': () => {return `RES 5,A`;},
    'b0': () => {return `RES 6,B`;},
    'b1': () => {return `RES 6,C`;},
    'b2': () => {return `RES 6,D`;},
    'b3': () => {return `RES 6,E`;},
    'b4': () => {return `RES 6,H`;},
    'b5': () => {return `RES 6,L`;},
    'b6': () => {return `RES 6,(HL)`;},
    'b7': () => {return `RES 6,A`;},
    'b8': () => {return `RES 7,B`;},
    'b9': () => {return `RES 7,C`;},
    'ba': () => {return `RES 7,D`;},
    'bb': () => {return `RES 7,E`;},
    'bc': () => {return `RES 7,H`;},
    'bd': () => {return `RES 7,L`;},
    'be': () => {return `RES 7,(HL)`;},
    'bf': () => {return `RES 7,A`;},
    'c0': () => {return `SET 0,B`;},
    'c1': () => {return `SET 0,C`;},
    'c2': () => {return `SET 0,D`;},
    'c3': () => {return `SET 0,E`;},
    'c4': () => {return `SET 0,H`;},
    'c5': () => {return `SET 0,L`;},
    'c6': () => {return `SET 0,(HL)`;},
    'c7': () => {return `SET 0,A`;},
    'c8': () => {return `SET 1,B`;},
    'c9': () => {return `SET 1,C`;},
    'ca': () => {return `SET 1,D`;},
    'cb': () => {return `SET 1,E`;},
    'cc': () => {return `SET 1,H`;},
    'cd': () => {return `SET 1,L`;},
    'ce': () => {return `SET 1,(HL)`;},
    'cf': () => {return `SET 1,A`;},
    'd0': () => {return `SET 2,B`;},
    'd1': () => {return `SET 2,C`;},
    'd2': () => {return `SET 2,D`;},
    'd3': () => {return `SET 2,E`;},
    'd4': () => {return `SET 2,H`;},
    'd5': () => {return `SET 2,L`;},
    'd6': () => {return `SET 2,(HL)`;},
    'd7': () => {return `SET 2,A`;},
    'd8': () => {return `SET 3,B`;},
    'd9': () => {return `SET 3,C`;},
    'da': () => {return `SET 3,D`;},
    'db': () => {return `SET 3,E`;},
    'dc': () => {return `SET 3,H`;},
    'dd': () => {return `SET 3,L`;},
    'de': () => {return `SET 3,(HL)`;},
    'df': () => {return `SET 3,A`;},
    'e0': () => {return `SET 4,B`;},
    'e1': () => {return `SET 4,C`;},
    'e2': () => {return `SET 4,D`;},
    'e3': () => {return `SET 4,E`;},
    'e4': () => {return `SET 4,H`;},
    'e5': () => {return `SET 4,L`;},
    'e6': () => {return `SET 4,(HL)`;},
    'e7': () => {return `SET 4,A`;},
    'e8': () => {return `SET 5,B`;},
    'e9': () => {return `SET 5,C`;},
    'ea': () => {return `SET 5,D`;},
    'eb': () => {return `SET 5,E`;},
    'ec': () => {return `SET 5,H`;},
    'ed': () => {return `SET 5,L`;},
    'ee': () => {return `SET 5,(HL)`;},
    'ef': () => {return `SET 5,A`;},
    'f0': () => {return `SET 6,B`;},
    'f1': () => {return `SET 6,C`;},
    'f2': () => {return `SET 6,D`;},
    'f3': () => {return `SET 6,E`;},
    'f4': () => {return `SET 6,H`;},
    'f5': () => {return `SET 6,L`;},
    'f6': () => {return `SET 6,(HL)`;},
    'f7': () => {return `SET 6,A`;},
    'f8': () => {return `SET 7,B`;},
    'f9': () => {return `SET 7,C`;},
    'fa': () => {return `SET 7,D`;},
    'fb': () => {return `SET 7,E`;},
    'fc': () => {return `SET 7,H`;},
    'fd': () => {return `SET 7,L`;},
    'fe': () => {return `SET 7,(HL)`;},
    'ff': () => {return `SET 7,A`;}
}

window.mnemonics = {
    '0':  () => {return `NOP`;},
    '1':  () => {return `LD BC,d16`;},
    '2':  () => {return `LD (BC),A`;},
    '3':  () => {return `INC BC`;},
    '4':  () => {return `INC B`;},
    '5':  () => {return `DEC B`;},
    '6':  () => {return `LD B,d8`;},
    '7':  () => {return `RLCA`;},
    '8':  () => {return `LD (a16),SP`;},
    '9':  () => {return `ADD HL,BC`;},
    'a':  () => {return `LD A,(BC)`;},
    'b':  () => {return `DEC BC`;},
    'c':  () => {return `INC C`;},
    'd':  () => {return `DEC C`;},
    'e':  () => {return `LD C,d8`;},
    'f':  () => {return `RRCA`;},
    '10': () => {return `STOP 0`;},
    '11': () => {return `LD DE,d16`;},
    '12': () => {return `LD (DE),A`;},
    '13': () => {return `INC DE`;},
    '14': () => {return `INC D`;},
    '15': () => {return `DEC D`;},
    '16': () => {return `LD D,d8`;},
    '17': () => {return `RLA`;},
    '18': () => {return `JR r8`;},
    '19': () => {return `ADD HL,DE`;},
    '1a': () => {return `LD A,(DE)`;},
    '1b': () => {return `DEC DE`;},
    '1c': () => {return `INC E`;},
    '1d': () => {return `DEC E`;},
    '1e': () => {return `LD E,d8`;},
    '1f': () => {return `RRA`;},
    '20': () => {return `JR NZ,r8`;},
    '21': () => {return `LD HL,d16`;},
    '22': () => {return `LD (HL+),A`;},
    '23': () => {return `INC HL`;},
    '24': () => {return `INC H`;},
    '25': () => {return `DEC H`;},
    '26': () => {return `LD H,d8`;},
    '27': () => {return `DAA`;},
    '28': () => {return `JR Z,r8`;},
    '29': () => {return `ADD HL,HL`;},
    '2a': () => {return `LD A,(HL+)`;},
    '2b': () => {return `DEC HL`;},
    '2c': () => {return `INC L`;},
    '2d': () => {return `DEC L`;},
    '2e': () => {return `LD L,d8`;},
    '2f': () => {return `CPL`;},
    '30': () => {return `JR NC,r8`;},
    '31': () => {return `LD SP,d16`;},
    '32': () => {return `LD (HL-),A`;},
    '33': () => {return `INC SP`;},
    '34': () => {return `INC (HL)`;},
    '35': () => {return `DEC (HL)`;},
    '36': () => {return `LD (HL),d8`;},
    '37': () => {return `SCF`;},
    '38': () => {return `JR C,r8`;},
    '39': () => {return `ADD HL,SP`;},
    '3a': () => {return `LD A,(HL-)`;},
    '3b': () => {return `DEC SP`;},
    '3c': () => {return `INC A`;},
    '3d': () => {return `DEC A`;},
    '3e': () => {return `LD A,d8`;},
    '3f': () => {return `CCF`;},
    '40': () => {return `LD B,B`;},
    '41': () => {return `LD B,C`;},
    '42': () => {return `LD B,D`;},
    '43': () => {return `LD B,E`;},
    '44': () => {return `LD B,H`;},
    '45': () => {return `LD B,L`;},
    '46': () => {return `LD B,(HL)`;},
    '47': () => {return `LD B,A`;},
    '48': () => {return `LD C,B`;},
    '49': () => {return `LD C,C`;},
    '4a': () => {return `LD C,D`;},
    '4b': () => {return `LD C,E`;},
    '4c': () => {return `LD C,H`;},
    '4d': () => {return `LD C,L`;},
    '4e': () => {return `LD C,(HL)`;},
    '4f': () => {return `LD C,A`;},
    '50': () => {return `LD D,B`;},
    '51': () => {return `LD D,C`;},
    '52': () => {return `LD D,D`;},
    '53': () => {return `LD D,E`;},
    '54': () => {return `LD D,H`;},
    '55': () => {return `LD D,L`;},
    '56': () => {return `LD D,(HL)`;},
    '57': () => {return `LD D,A`;},
    '58': () => {return `LD E,B`;},
    '59': () => {return `LD E,C`;},
    '5a': () => {return `LD E,D`;},
    '5b': () => {return `LD E,E`;},
    '5c': () => {return `LD E,H`;},
    '5d': () => {return `LD E,L`;},
    '5e': () => {return `LD E,(HL)`;},
    '5f': () => {return `LD E,A`;},
    '60': () => {return `LD H,B`;},
    '61': () => {return `LD H,C`;},
    '62': () => {return `LD H,D`;},
    '63': () => {return `LD H,E`;},
    '64': () => {return `LD H,H`;},
    '65': () => {return `LD H,L`;},
    '66': () => {return `LD H,(HL)`;},
    '67': () => {return `LD H,A`;},
    '68': () => {return `LD L,B`;},
    '69': () => {return `LD L,C`;},
    '6a': () => {return `LD L,D`;},
    '6b': () => {return `LD L,E`;},
    '6c': () => {return `LD L,H`;},
    '6d': () => {return `LD L,L`;},
    '6e': () => {return `LD L,(HL)`;},
    '6f': () => {return `LD L,A`;},
    '70': () => {return `LD (HL),B`;},
    '71': () => {return `LD (HL),C`;},
    '72': () => {return `LD (HL),D`;},
    '73': () => {return `LD (HL),E`;},
    '74': () => {return `LD (HL),H`;},
    '75': () => {return `LD (HL),L`;},
    '76': () => {return `HALT`;},
    '77': () => {return `LD (HL),A`;},
    '78': () => {return `LD A,B`;},
    '79': () => {return `LD A,C`;},
    '7a': () => {return `LD A,D`;},
    '7b': () => {return `LD A,E`;},
    '7c': () => {return `LD A,H`;},
    '7d': () => {return `LD A,L`;},
    '7e': () => {return `LD A,(HL)`;},
    '7f': () => {return `LD A,A`;},
    '80': () => {return `ADD A,B`;},
    '81': () => {return `ADD A,C`;},
    '82': () => {return `ADD A,D`;},
    '83': () => {return `ADD A,E`;},
    '84': () => {return `ADD A,H`;},
    '85': () => {return `ADD A,L`;},
    '86': () => {return `ADD A,(HL)`;},
    '87': () => {return `ADD A,A`;},
    '88': () => {return `ADC A,B`;},
    '89': () => {return `ADC A,C`;},
    '8a': () => {return `ADC A,D`;},
    '8b': () => {return `ADC A,E`;},
    '8c': () => {return `ADC A,H`;},
    '8d': () => {return `ADC A,L`;},
    '8e': () => {return `ADC A,(HL)`;},
    '8f': () => {return `ADC A,A`;},
    '90': () => {return `SUB B`;},
    '91': () => {return `SUB C`;},
    '92': () => {return `SUB D`;},
    '93': () => {return `SUB E`;},
    '94': () => {return `SUB H`;},
    '95': () => {return `SUB L`;},
    '96': () => {return `SUB (HL)`;},
    '97': () => {return `SUB A`;},
    '98': () => {return `SBC A,B`;},
    '99': () => {return `SBC A,C`;},
    '9a': () => {return `SBC A,D`;},
    '9b': () => {return `SBC A,E`;},
    '9c': () => {return `SBC A,H`;},
    '9d': () => {return `SBC A,L`;},
    '9e': () => {return `SBC A,(HL)`;},
    '9f': () => {return `SBC A,A`;},
    'a0': () => {return `AND B`;},
    'a1': () => {return `AND C`;},
    'a2': () => {return `AND D`;},
    'a3': () => {return `AND E`;},
    'a4': () => {return `AND H`;},
    'a5': () => {return `AND L`;},
    'a6': () => {return `AND (HL)`;},
    'a7': () => {return `AND A`;},
    'a8': () => {return `XOR B`;},
    'a9': () => {return `XOR C`;},
    'aa': () => {return `XOR D`;},
    'ab': () => {return `XOR E`;},
    'ac': () => {return `XOR H`;},
    'ad': () => {return `XOR L`;},
    'ae': () => {return `XOR (HL)`;},
    'af': () => {return `XOR A`;},
    'b0': () => {return `OR B`;},
    'b1': () => {return `OR C`;},
    'b2': () => {return `OR D`;},
    'b3': () => {return `OR E`;},
    'b4': () => {return `OR H`;},
    'b5': () => {return `OR L`;},
    'b6': () => {return `OR (HL)`;},
    'b7': () => {return `OR A`;},
    'b8': () => {return `CP B`;},
    'b9': () => {return `CP C`;},
    'ba': () => {return `CP D`;},
    'bb': () => {return `CP E`;},
    'bc': () => {return `CP H`;},
    'bd': () => {return `CP L`;},
    'be': () => {return `CP (HL)`;},
    'bf': () => {return `CP A`;},
    'c0': () => {return `RET NZ`;},
    'c1': () => {return `POP BC`;},
    'c2': () => {return `JP NZ,a16`;},
    'c3': () => {return `JP a16`;},
    'c4': () => {return `CALL NZ,a16`;},
    'c5': () => {return `PUSH BC`;},
    'c6': () => {return `ADD A,d8`;},
    'c7': () => {return `RST 00H`;},
    'c8': () => {return `RET Z`;},
    'c9': () => {return `RET`;},
    'ca': () => {return `JP Z,a16`;},
    'cb': (op) => {return `PREFIX CB: ${(()=>{
        return cbOnes[op.toString(16).toLowerCase()]();
    })()}`;},
    'cc': () => {return `CALL Z,a16`;},
    'cd': () => {return `CALL a16`;},
    'ce': () => {return `ADC A,d8`;},
    'cf': () => {return `RST 08H`;},
    'd0': () => {return `RET NC`;},
    'd1': () => {return `POP DE`;},
    'd2': () => {return `JP NC,a16`;},
    'd3': () => {return ``;},
    'd4': () => {return `CALL NC,a16`;},
    'd5': () => {return `PUSH DE`;},
    'd6': () => {return `SUB d8`;},
    'd7': () => {return `RST 10H`;},
    'd8': () => {return `RET C`;},
    'd9': () => {return `RETI`;},
    'da': () => {return `JP C,a16`;},
    'db': () => {return ``;},
    'dc': () => {return `CALL C,a16`;},
    'dd': () => {return ``;},
    'de': () => {return `SBC A,d8`;},
    'df': () => {return `RST 18H`;},
    'e0': () => {return `LDH (a8),A`;},
    'e1': () => {return `POP HL`;},
    'e2': () => {return `LD (C),A`;},
    'e3': () => {return ``;},
    'e4': () => {return ``;},
    'e5': () => {return `PUSH HL`;},
    'e6': () => {return `AND d8`;},
    'e7': () => {return `RST 20H`;},
    'e8': () => {return `ADD SP,r8`;},
    'e9': () => {return `JP (HL)`;},
    'ea': () => {return `LD (a16),A`;},
    'eb': () => {return ``;},
    'ec': () => {return ``;},
    'ed': () => {return ``;},
    'ee': () => {return `XOR d8`;},
    'ef': () => {return `RST 28H`;},
    'f0': () => {return `LDH A,(a8)`;},
    'f1': () => {return `POP AF`;},
    'f2': () => {return `LD A,(C)`;},
    'f3': () => {return `DI`;},
    'f4': () => {return ``;},
    'f5': () => {return `PUSH AF`;},
    'f6': () => {return `OR d8`;},
    'f7': () => {return `RST 30H`;},
    'f8': () => {return `LD HL,SP+r8`;},
    'f9': () => {return `LD SP,HL`;},
    'fa': () => {return `LD A,(a16)`;},
    'fb': () => {return `EI`;},
    'fc': () => {return ``;},
    'fd': () => {return ``;},
    'fe': () => {return `CP d8`;},
    'ff': () => {return `RST 38H`;}
}

