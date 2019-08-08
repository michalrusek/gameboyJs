var STEP_THROUGH = false

var emu = function () {
    //1. Read boot rom and game
    // var bootRom = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "DMG_ROM.bin")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "Tetris (JUE) (V1.1) [!].gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "Super Mario Land (JUE) (V1.1) [!].gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "01-special.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "02-interrupts.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "03-op sp,hl.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "04-op r,imm.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "05-op rp.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "06-ld r,r.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "07-jr,jp,call,ret,rst.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "08-misc instrs.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "09-op r,r.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "10-bit ops.gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "individual", "11-op a,(hl).gb")))
    // var game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "daa.gb")))
    var game = tetrisRom

    
    var vramChanged = false
    var tetrisHack = true

    //2. Initialize memory (also see http://bgb.bircd.org/pandocs.htm#powerupsequence)
    var mem = (function () {
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
       var memory = new Uint8Array(0xFFFF + 1)
       for (var i = 0; i < 0x10000; i++) {
           memory[i] = 0
       }
       var adjust = (addr) => {
           if (addr >= 0xE000 && addr <= 0xFDFF) {addr = addr - 0x2000} return addr
        }
       return {
           readByte: (addr) => {addr = adjust(addr); return memory[addr]},
           setByte: (addr, val) => {
               if(addr == 0xFF80 && tetrisHack) {
                   return
               }
                if (addr >= 0x8000 && addr < 0x9800 && ((mem.readByte(0xFF41) & 3) > 2)) {
                    return
                }
                if (addr == 0xFF41) {
                        memory[addr] &= ~ 120;
                        memory[addr] |= (val & ~135);
                        return
                }
                addr = adjust(addr); memory[addr] = val & 0xFF
                if (addr >= 0x8000 && addr < 0x9800) {
                    vramChanged = true
                    // gpu.tileChanged(addr)
                };
            },
           readSigned: (addr) => {addr = adjust(addr); return memory[addr] >= 128 ? memory[addr] - 256 : memory[addr]},
           readWord: (addr) => {addr = adjust(addr); return (memory[addr] + (memory[addr + 1] << 8))},
           setWord: (addr, val) => {
                mem.setByte(addr + 1, (val >> 8) & 0xFF)
                mem.setByte(addr, val & 0xFF)
            }
       }
    })()
    mem.setByte(0xFF05, 0x00)
    mem.setByte(0xFF06, 0x00)
    mem.setByte(0xFF07, 0x00)
    mem.setByte(0xFF10, 0x80)
    mem.setByte(0xFF11, 0xBF)
    mem.setByte(0xFF12, 0xF3)
    mem.setByte(0xFF14, 0xBF)
    mem.setByte(0xFF16, 0x3F)
    mem.setByte(0xFF17, 0x00)
    mem.setByte(0xFF19, 0xBF)
    mem.setByte(0xFF1A, 0x7F)
    mem.setByte(0xFF1B, 0xFF)
    mem.setByte(0xFF1C, 0x9F)
    mem.setByte(0xFF1E, 0xBF)
    mem.setByte(0xFF20, 0xFF)
    mem.setByte(0xFF21, 0x00)
    mem.setByte(0xFF22, 0x00)
    mem.setByte(0xFF23, 0xBF)
    mem.setByte(0xFF24, 0x77)
    mem.setByte(0xFF25, 0xF3)
    mem.setByte(0xFF26, 0xF1)
    mem.setByte(0xFF40, 0x91)
    mem.setByte(0xFF42, 0x00)
    mem.setByte(0xFF43, 0x00)
    mem.setByte(0xFF45, 0x00)
    mem.setByte(0xFF47, 0xFC)
    mem.setByte(0xFF48, 0xFF)
    mem.setByte(0xFF49, 0xFF)
    mem.setByte(0xFF4A, 0x00)
    mem.setByte(0xFF4B, 0x00)
    mem.setByte(0xFFFF, 0x00)
    mem.setByte(0xFF50, 0x01) //BOOT ROM DOES THAT AFTER CONFIRMING NINTENDO LOGO IS INTACT ON THE CARTRIDGE

    //4a. Read game into memory
    //TODO: Read only the first memory bank and implement banks overall
    game.forEach((val, index) => {
        mem.setByte(index, val)
    })

    //4b. Read GB bios into memory
    // bootRom.forEach((val, index) => {
    //     mem.setByte(index, val)
    // })

    var interrupts = (()=>{

        var run = () => {
            //TODO: Implement the rest of the interrupts
            var iflag = mem.readByte(0xFF0F); var ienabled = mem.readByte(0xFFFF)
            if ((iflag & 0b1) && (ienabled & 0b1) && cpu.interrupt(0x40)) {iflag = iflag ^ 0b1}
            if ((iflag & 0b10) && (ienabled & 0b10) && cpu.interrupt(0x48)) {iflag = iflag ^ 0b10}
            if ((iflag & 0b100) && (ienabled & 0b100) && cpu.interrupt(0x50)) {iflag = iflag ^ 0b100}
            mem.setByte(0xFF0F, iflag)
        }

        var vblank = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b1); run()}
        var lcd = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b10); run()}
        var timer = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 0b100); run()}
        return {
            vblank: vblank,
            lcd: lcd,
            run: run,
            timer: timer
        }
    })()

    //Initialize CPU
    var cpu = z80(mem, ()=>{interrupts.run()})

    //GPU
    var gpu = (() => {
        var tiles = [] // 384 tiles - each tile is [0..7] of [0..7] (8 rows of 8 pixels each)
        var frame = new Array(144); for (var i = 0; i < 144; i++) {frame[i] = new Array(160)}
        var bgMapPixels = new Array(256); for (var i = 0; i < 256; i++) {bgMapPixels[i] = new Uint8Array(256)}
        var vstat = 0; var hstat = 0;
        var getLine = (a, b) => {
            a = a.toString(2).substring(a.length - 8).padStart(8, "0").split("")
            b = b.toString(2).substring(b.length - 8).padStart(8, "0").split("")
            return a.map((v, i) => {var num = parseInt(v + b[i], 2); return num ? 255/num : 0})
        }

        //TODO: Throw this into a process; this can happen whenever and could be resource intensive
        var recalcTiles = () => {
            tiles = []
            for (var i = 0x8000; i < 0x9800; i = i + 16) {
                var lines = []
                for (j = 0; j < 16; j = j + 2) {
                    var topByte = mem.readByte(i + j); var botByte = mem.readByte(i + j + 1); var line = getLine(botByte, topByte); lines.push(line);
                }
                tiles.push(lines)
            }

            //TODO: Check how often this should really happen (probably with each write to VRAM or something)
            
        }

        var updateBgMap = () => {
            //1. Read BGMap from memory (32x32 tiles)
            var bgTiles = []
            if (tiles.length == 0) {return}
            for (var i = 0x9800; i < 0x9C00; i++) {bgTiles.push(mem.readByte(i))}

            //2. Throw it into bgMapPixels array (256 x 256 (32 * 8 = 256))
            for (var i = 0; i < 32; i++) {
                for (var j = 0; j < 32; j++) {
                    //TODO: Implement addressing tiles as -127 to 127 as well
                    var tileToWrite = tiles[bgTiles[i * 32 + j]]
                    tileToWrite.forEach((row, y) => {
                        row.forEach((pixel, x) => {
                            var bgX = j * 8 + x;
                            var bgY = i * 8 + y;
                            bgMapPixels[bgY][bgX] = pixel;
                            
                        })
                    })
                }
            }
        }

        var drawLine = (lineNo) => {
            // if (mem.readByte(0xFF40) & 1) {
                updateBgMap()
                var line = new Array(256)
                //BGMap
                //TODO: Check if BG should be drawn (LCDC bit 0?)
                //1. Read scroll positions
                var scy = mem.readByte(0xFF42); var scx = mem.readByte(0xFF43)
                var bgY = lineNo + scy; if (bgY > 0xFF) {bgY = bgY % 0xFF}
                //2. Draw scrollX + lineNo
                for (var i = 0; i < 160; i++) {
                    var bgX = scx + i; if (bgX > 0xFF) {bgX = bgX % 0xFF}
                    frame[lineNo][i] = bgMapPixels[bgY][bgX]
                }
            // }

            //TODO: WINDOW

            //TODO: SPRITES
        }

        //TODO: Throw this into a process if it's too expensive; this can be offloaded and then only the data can be sent to renderer
        // var update = () => {
        //     //TODO: FINISH THIS UP
            

        //     if (vstat == mem.readByte(0xFF45)) {
        //         interrupts.lcd()
        //     }

        //     if (vstat < 144) {
        //         if (hstat == 1) {
        //             // if (mem.readByte(0xFF40) & 128) {
        //                 drawLine(vstat)
        //             // }
        //         } else if(hstat == 4){hstat = -1; vstat++;}
        //     } else {
        //         if (vstat === 144 && hstat == 0) {
        //             interrupts.vblank()
        //         }
        //         if(hstat == 4){hstat = -1; vstat++;}
        //         if (vstat === 154) {
        //             vstat = 0;
        //         }
        //     }

        //     mem.setByte(0xFF44, vstat)

        //     hstat++
        // }

        var lcdstat = mem.readByte(0xFF41);
        //TODO: MAke your own!
        var update = () => {
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

             mem.setByte(0xFF41, lcdstat);
             mem.setByte(0xFF44, vstat);

             hstat++;
        }

        // var tileChanged = (addr) => {
        //     //Tile number
        //     var tileNo = Math.floor((addr - 0x8000) / 16)
        //     var lineNo = Math.floor(((addr - 0x8000)) % 16 / 2)
            
        //     tiles[tileNo][lineNo] = getLine(
        //         mem.readByte(addr % 2 ? addr : addr - 1), 
        //         mem.readByte(addr % 2 ? addr : addr + 1)
        //     )
        // }

        return {
            update: update,
            recalcTiles: recalcTiles,
            getTiles: () => tiles,
            getFrame: () => frame//,
            // tileChanged: tileChanged
        }
    })()

    var timers = (()=>{
        var dividerClock = 0; var timerClock = 0;
        const divAddr = 0xFF04; 
        const timaAddr = 0xFF05;
        const tmaAddr = 0xFF06;
        const tacAddr = 0xFF07;

        var update = (n) => {
            //Divider always updates
            dividerClock = dividerClock + n
            if (dividerClock >= 257) {dividerClock = dividerClock % 257; var divider = mem.readByte(divAddr); if (divider == 0xFF) {mem.setByte(divAddr, 0)} else {mem.setByte(divAddr, divider + 1)}}
            
            //Timer only updates if it's enabled
            //TAC:
            //      Bit  2   - Timer Enable
            //      Bits 1-0 - Input Clock Select
            //      00: CPU Clock / 1024 (DMG, CGB:   4096 Hz, SGB:   ~4194 Hz)
            //      01: CPU Clock / 16   (DMG, CGB: 262144 Hz, SGB: ~268400 Hz)
            //      10: CPU Clock / 64   (DMG, CGB:  65536 Hz, SGB:  ~67110 Hz)
            //      11: CPU Clock / 256  (DMG, CGB:  16384 Hz, SGB:  ~16780 Hz)
            //(also see: https://gbdev.gg8.se/wiki/articles/Timer_and_Divider_Registers)

            var tac = mem.readByte(tacAddr)
            if (tac & 0b100) {
                timerClock = timerClock + n
                //There are 4 modes for the times sitting in TAC - they control how many CPU clocks should amount to + 1 on the timer
                //(see Input Clock Select in TAC)
                var d = 0
                switch (tac & 0b11) {
                    case 0: d = 1024; break;
                    case 1: d = 16; break;
                    case 2: d = 64; break;
                    case 3: d = 256; break;
                }
                while (timerClock >= d) {
                    //Add one
                    var tima = mem.readByte(timaAddr)
                    if (tima == 0xFF) {
                        //If we're overflowing - run interrupts and load TMA into TIMA
                        interrupts.timer()
                        tima = mem.readByte(tmaAddr)
                    } else {
                        tima = tima + 1
                    }
                    mem.setByte(timaAddr, tima)
                    timerClock = timerClock - d
                }
            }
        }
        return {
            update: update
        }
    })()

    //5. Start emulation
    var time = (new Date()).getTime()
    var we = 0;

    var loop = function () {
        requestAnimationFrame(loop.bind(this))
        
        if (vramChanged) {
            if (we == 4) {
                gpu.recalcTiles()
                we = 0
            }
            we++
            // window.webContents.send('gpuTiles', gpu.getTiles()) 
            vramChanged = false
        }
        // window.webContents.send('framePixels', gpu.getFrame())
        if (window.displayPixels) {
            window.displayPixels(gpu.getFrame())
        }
        try{
            if (!this.paused) {
                //4,213,440 CPU ticks each second, 154 scanlines per frame - draw 2 frames
                for (var i = 0; i < 154 * 4; i++) {
                    cpu.runCycles(114)
                    gpu.update()
                    timers.update(114)
                }
            }
        } catch (e) {
            throw(e);
        }

        console.log(`Frame time: ${((new Date()).getTime() - time)}ms.`); time = (new Date()).getTime()
    }

    // var loopUntil = (when) => {
    //     var stop = false
        
    //     gpu.recalcTiles()
    //     window.webContents.send('gpuTiles', gpu.getTiles()) 
    //     window.webContents.send('framePixels', gpu.getFrame()) 

    //     while (!stop) {
    //         stop = cpu.runCyclesUntil(114, when)
    //         timers.update(114)
    //         gpu.update()
    //     }
    // }

    // var step = () => {
    //     cpu.step()
    //     gpu.recalcTiles()
    //     window.webContents.send('gpuTiles', gpu.getTiles()) 
    // }

    if (STEP_THROUGH) {
        return {
            step: step,
            loopUntil: loopUntil
        }
    } else {
        loop()
    }
}