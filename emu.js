let emu = function (outputDebugInfo) {
    //Note it reads a window.game variable, needs to be initialized
    if (!window.game) {
        throw new Error(`Game was not initialized!`)
    }

    let stopped = false

    //2. Initialize memory (also see http://bgb.bircd.org/pandocs.htm#powerupsequence)
    let mem = (function () {
        /*
        0000	3FFF	16KB ROM bank 00	    From cartridge, usually a fixed bank
        4000	7FFF	16KB ROM Bank 01~NN	    From cartridge, switchable bank via MBC (if any)
        8000	9FFF	8KB Video RAM (VRAM)	Only bank 0 in Non-CGB mode
                                                Switchable bank 0/1 in CGB mode
        
        A000	BFFF	8KB External RAM	    In cartridge, switchable bank if any
        C000	CFFF	4KB Work RAM (WRAM)     bank 0	
        D000	DFFF	4KB Work RAM (WRAM)     bank 1~N	Only bank 1 in Non-CGB mode
                                                Switchable bank 1~7 in CGB mode
        
        E000	FDFF	                        Mirror of C000~DDFF (ECHO RAM)	Typically not used
        FE00	FE9F	                        Sprite attribute table (OAM)	
        FEA0	FEFF                            Not Usable	
        FF00	FF7F	                        I/O Registers	
        FF80	FFFE	                        High RAM (HRAM)	
        FFFF	FFFF	                        Interrupts Enable Register (IE)	
        */
        let memory = new Array(0xFFFF + 1)
        for (let i = 0; i < 0x10000; i++) {
            memory[i] = 0
        }
        let adjust = (addr) => {
           if (addr >= 0xE000 && addr <= 0xFDFF) {addr = addr - 0x2000} return addr
        }
        let dmaTransfer = (val) => {
            //DMA transfer is a weird thing where you get the value the CPU was trying to save to 0xFF46
            //Multiply it by 0x100 - the transfer can only start at addresses divisible by 0x100, 
            //and the data written will always be <= 0xFF, so we need to multiply it by 0x100 to get an address.
            //That's the the start of data you should transfer to Sprite Table
            val = val * 0x100

            //Iterate through 160 bytes (40 sprites, 4 bytes each) and copy them into 0xFE00 - 0xFE9F
            for (let i = 0; i < 160; i++) {
                // if (i == 1) {
                //     if (readByte(val + i) == 16 || readByte(val + i) == 96) {
                //         debugger
                //     }
                //     console.log(`Sprite x: ${readByte(val + i)}`)
                // }
                setByte(0xFE00 + i, readByte(val + i), true)
            }
        }
        let readByte = (addr) => {addr = adjust(addr); return memory[addr]}
        //TODO: Rename `force` to something else
        let setByte = (addr, val, force) => {
            val = Math.abs(val)
            addr = adjust(addr); 
            if (addr >= 0x0 && addr <= 0x8000 && !force) {
                //TODO: Implement MBC; just return for now
                return
            }
            //VRAM is only accessible during some of the PPU states, not all of them
            // if (addr >= 0x8000 && addr < 0x9800 && ((mem.readByte(0xFF41) & 3) > 2)) {
            //     return
            // }
            // //IO stuff - 0xFF00 - 0xFF80?
            if (addr == 0xFF00 && !force) {
                //Joypad IO
                let oldVal = mem.readByte(addr)
                memory[addr] = ((oldVal & 0xF) | (val & 0xF0))
                moveKeysToMemory()
                return
            }
            if (addr == 0xFF04 && !force) {memory[addr] = 0; return}
            if (addr == 0xFF05 && !force) {memory[addr] = 0; return}
            if (addr == 0xFF0F && !force) {
                addr = adjust(addr); memory[addr] = val & 0xFF
                interrupts.run();
                return
            }
            if (addr == 0xFF41 && !force) {
                    //The first 3 bits are read only for CPU
                    val = val & 0b11111000
                    oldVal = mem.readByte(addr)
                    oldVal = oldVal & 0b111
                    memory[addr] = (val + oldVal)
                    return
            }
            if (addr == 0xFF46) {
                //Attempts at write to this address trigger a DMA transfer
                //as far as I understand this transfer normally doesn't happen right away, but rather at an appropriate time
                //but for the purpose of emulation we can run it immediately
                dmaTransfer(val)
                return
            }
            // OAM memory gets filled during dmaTransfer
            if (addr >= 0xFE00 && addr <= 0xFE9F && !force) {
                return
            }
            if (addr >= 0xFEA0 && addr <= 0xFEFF) {
                //Unused
                return
            }
            memory[addr] = val & 0xFF
        }
        let readSigned = (addr) => {addr = adjust(addr); return memory[addr] >= 128 ? memory[addr] - 256 : memory[addr]}
        let readWord = (addr) => {addr = adjust(addr); return (memory[addr] + (memory[addr + 1] << 8))}
        let setWord = (addr, val) => {
            setByte(addr + 1, (val >> 8) & 0xFF)
            setByte(addr, val & 0xFF)
        }
        let initMem = () => {
            memory[0xFF00] = 0x0F
            memory[0xFF50] = 0x01 //BOOT ROM DOES THAT AFTER CONFIRMING NINTENDO LOGO IS INTACT ON THE CARTRIDGE
        }
        return {initMem, readByte, setByte, readSigned, readWord, setWord, memory}
    })()
    mem.initMem()

    //4a. Read game into memory
    //TODO: Implement banks overall
    for (let i = 0; i < 0x8000 && i < game.length; i++) {
        mem.setByte(i, game[i], true)
    }

    let interrupts = (()=>{

        let run = () => {
            //TODO: Implement the rest of the interrupts
            let iflag = mem.readByte(0xFF0F); let ienabled = mem.readByte(0xFFFF)
            if ((iflag & 0b1) && (ienabled & 0b1) && cpu.interrupt(0x40)) {iflag = iflag ^ 0b1}
            // if ((iflag & 0b10) && (ienabled & 0b10) && cpu.interrupt(0x48)) {debugger; iflag = iflag ^ 0b10}
            // if ((iflag & 0b100) && (ienabled & 0b100) && cpu.interrupt(0x50)) {iflag = iflag ^ 0b100}
            // if ((iflag & 0b10000) && (ienabled & 0b10000) && cpu.interrupt(0x60)) {iflag = iflag ^ 0b10000}
            mem.setByte(0xFF0F, iflag, true)
        }

        let vblank = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b1), true; run()}
        let lcd = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b10, true); run()}
        let timer = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b100, true); run()}
        let joypad = () => {cpu.resume(), mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b10000, true); run()}
        return {
            vblank, lcd, run, timer, joypad
        }
    })()

    //Initialize CPU
    let cpu = z80(mem, ()=>{interrupts.run()})

    //GPU
    let gpu = (() => {
        let tiles = new Array(384); for (let i = 0; i < 384; i++) {let t = new Array(8); for (let j = 0; j < 8; j++) {t[j] = new Array(8)}; tiles[i] = t} // 384 tiles - each tile is [0..7] of [0..7] (8 rows of 8 pixels each)
        let frame = new Array(144); for (let i = 0; i < 144; i++) {frame[i] = new Array(160)}
        let sprites = new Array(40); for (let i = 0; i < 40; i++) {sprites[i] = {}}
        let bgMapPixels = new Array(256); for (let i = 0; i < 256; i++) {bgMapPixels[i] = new Uint8Array(256)}
        let vstat = 0; let hstat = 0;
        let palette = [
            0xFF, //0
            0xCC, //1
            0x66, //2
            0x00, //4
        ]
        let getLine = (a, b) => {
            a = a.toString(2).padStart(8, "0").split("")
            b = b.toString(2).padStart(8, "0").split("")
            return a.map((v, i) => {let num = parseInt(v + b[i], 2); return palette[num]})
        }
        
        let refreshPalette = () => {
            let p = mem.readByte(0xFF47).toString(2).padStart(8, "0").split("").reverse().join("");
            for (let i = 0; i < 8; i = i + 2) {
                let n = parseInt(p[i] + p[i + 1], 2)
                switch (n) {
                    case 0: palette[Math.floor(i/2)] = 0xFF; break;
                    case 1: palette[Math.floor(i/2)] = 0xCC; break;
                    case 2: palette[Math.floor(i/2)] = 0x66; break;
                    case 3: palette[Math.floor(i/2)] = 0x00; break;
                }
            }
        }

        //TODO: Throw this into a process; this can happen whenever and could be resource intensive
        let recalcTiles = () => {
            refreshPalette()

            let z = 0;
            for (let i = 0x8000; i < 0x9800; i = i + 16) {
                for (j = 0; j < 16; j = j + 2) {
                    let topByte = mem.readByte(i + j); 
                    let botByte = mem.readByte(i + j + 1); 
                    tiles[z][Math.floor(j/2)] = getLine(botByte, topByte); 
                }
                z++
            }

            updateBgMap()     
            updateSprites()
        }

        let updateSprites = () => {
            //The hardware has a complex behavior here with first moving data from RAM to OAM memory,
            //but we don't really care for that in the emulator, we'll just use values straight from memory
            let getSpriteData = (sprite) => {
                //TODO: Implement 8x16 sprites as well
                //TODO: Implement palettes for sprites
                //TODO: Implement priority
                //TODO: Implement flips
                return tiles[sprite.tile]
            }
            
            for (let i = 0xFE00; i < 0xFEA0; i = i + 4) {
                let f = mem.readByte(i + 3)
                let sprite = {
                    x: mem.readByte(i + 1) - 8,
                    y: mem.readByte(i) - 16,
                    tile: mem.readByte(i + 2),
                    prio: (f >> 7) & 1,
                    yFlip: (f >> 6) & 1,
                    xFlip: (f >> 5) & 1,
                    paletteNo: (f >> 4) & 1 //non-CGB mode only
                    //Bit 3 = tile VRAM bank - CGB mode only
                    //Bits 0-2 = palette number - CGB mode only
                }
                
                sprite.data = getSpriteData(sprite)
                sprites[Math.floor((i - 0xFE00)/4)] = sprite 
            }
        }

        let updateBgMap = () => {
            let lcdc = mem.readByte(0xFF40)

            //1. Read BGMap from memory (32x32 tiles)
            let bgTiles = []
            let signed = ((lcdc > 4) & 0b1) ? false : true
            if (tiles.length == 0) {return}
            if ((lcdc >> 3) & 0b1) {
                for (let i = 0x9C00; i < 0xA000; i++) {bgTiles.push(mem.readByte(i))}
            } else {
                for (let i = 0x9800; i < 0x9C00; i++) {bgTiles.push(mem.readByte(i))}
            }

            //2. Throw it into bgMapPixels array (256 x 256 (32 * 8 = 256))
            for (let i = 0; i < 32; i++) {
                for (let j = 0; j < 32; j++) {
                    let tileNo = bgTiles[i * 32 + j]
                    if (signed) {
                        tileNo = tileNo >= 128 ? tileNo - 128 : tileNo + 128
                        tileNo = tileNo + 128
                    }
                    let tileToWrite = tiles[tileNo]
                    tileToWrite.forEach((row, y) => {
                        row.forEach((pixel, x) => {
                            let bgX = j * 8 + x;
                            let bgY = i * 8 + y;
                            bgMapPixels[bgY][bgX] = pixel;
                            
                        })
                    })
                }
            }
        }

        let drawLine = (lineNo) => {
            if (mem.readByte(0xFF40) & 1) {
                //BGMap
                //TODO: Check if BG should be drawn (LCDC bit 0?)
                //1. Read scroll positions
                let scy = mem.readByte(0xFF42); let scx = mem.readByte(0xFF43)
                let bgY = lineNo + scy; if (bgY > 0xFF) {bgY = bgY % 0xFF}
                //2. Draw scrollX + lineNo
                for (let i = 0; i < 160; i++) {
                    let bgX = scx + i; if (bgX > 0xFF) {bgX = bgX % 0xFF}
                    frame[lineNo][i] = bgMapPixels[bgY][bgX]
                }
            }

            //TODO: WINDOW

            //TODO: SPRITES
            if (mem.readByte(0xFF40) & 2) {
                let spritesDrawnOnLine = 0
                for (let i = 0; i < sprites.length; i++) {
                    let sprite = sprites[i]
                    if (lineNo >= sprite.y && lineNo < sprite.y + 8 && !sprite.prio) {
                        //Draw
                        if (spritesDrawnOnLine <= 10) {
                            for (let j = 0; j < 8 ; j++) {
                                if (j + sprite.x >=0 && j + sprite.x < 160) {
                                    frame[lineNo][j + sprite.x] = sprite.data[lineNo - sprite.y][j]
                                }
                            }
                            spritesDrawnOnLine++
                        }
                    }
                }
            }
        }

        let lcdstat = mem.readByte(0xFF41);
        //TODO: MAke your own!
        let update = () => {
            if(vstat == mem.readByte(0xFF45)){ // LYC == LY ?
                lcdstat |= 4;
                if(hstat == 0 && lcdstat & 64){interrupts.lcd()};
             }else{
                lcdstat &= ~4;
             }
             
             lcdstat &= ~3;
             if(vstat < 144){
                if(hstat == 0){
                   lcdstat |= 2;
                }else if(hstat == 1){
                   if(mem.readByte(0xFF40) & 128) {
                       drawLine(vstat);
                   }
                   lcdstat |= 3;
                }else if(hstat == 4){
                   vstat++;
                   hstat = -1;
                }
             }else{
                
                if(vstat == 144 && hstat == 0){
                  
                    interrupts.vblank();
                    if(lcdstat & 16){
                        interrupts.lcd()
                        
                    };
                }
                
                lcdstat |= 1;
                if(hstat == 4){hstat = -1; vstat++;}
                if(vstat == 154) vstat = 0;
             }

             mem.setByte(0xFF41, lcdstat, true);
             mem.setByte(0xFF44, vstat);

             hstat++;
        }

        return {
            update: update,
            recalcTiles: recalcTiles,
            getTiles: () => tiles,
            getFrame: () => frame
        }
    })()

    let timers = (()=>{
        let dividerClock = 0; let timerClock = 0;
        const divAddr = 0xFF04; 
        const timaAddr = 0xFF05;
        const tmaAddr = 0xFF06;
        const tacAddr = 0xFF07;

        let update = (n) => {
            //Divider always updates
            dividerClock = dividerClock + n
            if (dividerClock >= 257) {dividerClock = dividerClock % 257; let divider = mem.readByte(divAddr); if (divider == 0xFF) {mem.setByte(divAddr, 0, true)} else {mem.setByte(divAddr, divider + 1, true)}}
            
            //Timer only updates if it's enabled
            //TAC:
            //      Bit  2   - Timer Enable
            //      Bits 1-0 - Input Clock Select
            //      00: CPU Clock / 1024 (DMG, CGB:   4096 Hz, SGB:   ~4194 Hz)
            //      01: CPU Clock / 16   (DMG, CGB: 262144 Hz, SGB: ~268400 Hz)
            //      10: CPU Clock / 64   (DMG, CGB:  65536 Hz, SGB:  ~67110 Hz)
            //      11: CPU Clock / 256  (DMG, CGB:  16384 Hz, SGB:  ~16780 Hz)
            //(also see: https://gbdev.gg8.se/wiki/articles/Timer_and_Divider_Registers)

            let tac = mem.readByte(tacAddr)
            if (tac & 0b100) {
                timerClock = timerClock + n
                //There are 4 modes for the times sitting in TAC - they control how many CPU clocks should amount to + 1 on the timer
                //(see Input Clock Select in TAC)
                let d = 0
                switch (tac & 0b11) {
                    case 0: d = 1024; break;
                    case 1: d = 16; break;
                    case 2: d = 64; break;
                    case 3: d = 256; break;
                }
                while (timerClock >= d) {
                    //Add one
                    let tima = mem.readByte(timaAddr)
                    if (tima == 0xFF) {
                        //If we're overflowing - run interrupts and load TMA into TIMA
                        interrupts.timer()
                        tima = mem.readByte(tmaAddr)
                    } else {
                        tima = tima + 1
                    }
                    mem.setByte(timaAddr, tima, true)
                    timerClock = timerClock - d
                }
            }
        }
        return {
            update: update
        }
    })()

    //5. Start emulation
    let getDebugInfo = () => {
        return {cpu: cpu.getRegisters()}
    }
    let time = (new Date()).getTime()

    gpu.recalcTiles()


    let loop = function () {
        if (!stopped) {
            requestAnimationFrame(loop.bind(this))
            
            gpu.recalcTiles()
            if (window.displayPixels) {
                window.displayPixels(gpu.getFrame())
            }
            try{
                //4,213,440 CPU ticks each second, 154 scanlines per frame - draw 2 frames
                for (let i = 0; i < 154 * 4; i++) {
                    stopped = cpu.runCycles(114) < 0
                    gpu.update()
                    timers.update(114)
                    if (stopped) {
                        break
                    }
                }
            } catch (e) {
                throw(e);
            }
            console.log(`Frame time: ${((new Date()).getTime() - time)}ms.`); time = (new Date()).getTime()
            outputDebugInfo(getDebugInfo())

        }
    }

    let cyclesRan = 0
    let step = () => {
        gpu.recalcTiles()
        if (window.displayPixels) {
            window.displayPixels(gpu.getFrame())
        }
        cyclesRan += cpu.runCycles(1)
        if (cyclesRan >= 114) {
            cyclesRan -= 114
            gpu.update()
            timers.update(114)
        }
        outputDebugInfo(getDebugInfo())
    }

    let keysPressed = {
        left: false,
        right: false,
        up: false,
        down: false,
        a: false,
        b: false,
        select: false,
        start: false
    }

    let moveKeysToMemory = () => {
        let lowerNibble = 0xf
        if ((mem.readByte(0xFF00) & 0x10) == 0x10) {
            //Button keys
            if (keysPressed.a) {
                lowerNibble = lowerNibble ^ 0x1
            }
            if (keysPressed.b) {
                lowerNibble = lowerNibble ^ 0b10
            }
            if (keysPressed.select) {
                lowerNibble = lowerNibble ^ 0b100
            }
            if (keysPressed.start) {
                lowerNibble = lowerNibble ^ 0b1000
            }
        } else if ((mem.readByte(0xFF00) & 0x20) == 0x20) {
            //Direction keys
            if (keysPressed.right) {
                lowerNibble = lowerNibble ^ 0x1
            }
            if (keysPressed.left) {
                lowerNibble = lowerNibble ^ 0b10
            }
            if (keysPressed.up) {
                lowerNibble = lowerNibble ^ 0b100
            }
            if (keysPressed.down) {
                lowerNibble = lowerNibble ^ 0b1000
            }
        } else if ((mem.readByte(0xFF00) & 0x30) == 0x30) {
            return 0x30
        }
        if (lowerNibble != 0xf) {
            console.log(`Lower nibble: ${lowerNibble.toString(2)}`)
        }
        mem.setByte(0xFF00, (mem.readByte(0xFF00) & 0xF0) + lowerNibble, true)        
    }

    window.onkeydown = (ev) => {
        switch (ev.code) {
            case 'ArrowRight':
                keysPressed.right = true; break
            case 'ArrowLeft':
                keysPressed.left = true; break
            case 'ArrowDown':
                keysPressed.down = true; break
            case 'ArrowUp':
                keysPressed.up = true; break
            case 'Enter':
                keysPressed.start = true; break
            case 'Space':
                keysPressed.select = true; break
            case 'KeyZ':
                keysPressed.a = true; break
            case 'KeyX':
                keysPressed.b = true; break
        }
        moveKeysToMemory()
        interrupts.joypad()
    }

    window.onkeyup = (ev) => {
        switch (ev.code) {
            case 'ArrowRight':
                keysPressed.right = false; break
            case 'ArrowLeft':
                keysPressed.left = false; break
            case 'ArrowDown':
                keysPressed.down = false; break
            case 'ArrowUp':
                keysPressed.up = false; break
            case 'Enter':
                keysPressed.start = false; break
            case 'Space':
                keysPressed.select = false; break
            case 'KeyZ':
                keysPressed.a = false; break
            case 'KeyX':
                keysPressed.b = false; break
        }
        moveKeysToMemory()
    }

    return {
        start: () => {stopped = false; cyclesRan = 0; loop()},
        stop: () => {stopped = true},
        step,
        getMemory: () => {return mem.memory},
        setBreakPoint: (v) => {cpu.addBreakPoint(v)},
        removeBreakPoint: (v) => {cpu.removeBreakPoint(v)}
    }
}