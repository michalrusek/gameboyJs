const fs = require('fs')
const path = require('path')
const z80 = require('./cpu')
const {compress} = require('lz-string')

let emu = function (window, STEP_THROUGH) {
    //1. Read boot rom and game
    let bootRom = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "DMG_ROM.bin")))
    let game = new Uint8Array(fs.readFileSync(path.resolve(__dirname, "res", "Tetris (JUE) (V1.1) [!].gb")))
    let vramChanged = false

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
       let memory = new Uint8Array(0xFFFF + 1)
       let adjust = (addr) => {
           if (addr >= 0xE000 && addr <= 0xFDFF) {addr = addr - 0x2000} return addr
        }
       return {
           readByte: (addr) => {addr = adjust(addr); return memory[addr]},
           setByte: (addr, val) => {if (addr >= 0x8000 && addr <= 0x9FFF) {vramChanged = true}; addr = adjust(addr); memory[addr] = val},
           readSigned: (addr) => {addr = adjust(addr); return memory[addr] >= 128 ? memory[addr] - 256 : memory[addr]},
           readWord: (addr) => {addr = adjust(addr); return memory[addr] | (memory[addr + 1] << 8)},
           setWord: (addr, val) => {if (addr >= 0x8000 && addr <= 0x9FFF) {vramChanged = true}; addr = adjust(addr); memory[addr + 1] = val >> 8; memory[addr] = val & 0xFF}
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
    
    //3. Initialize CPU
    let cpu = z80(mem)

    //4a. Read game into memory
    //TODO: Read only the first memory bank and implement banks overall
    game.forEach((val, index) => {
        mem.setByte(index, val)
    })

    //4b. Read GB bios into memory
    bootRom.forEach((val, index) => {
        mem.setByte(index, val)
    })

    let interrupts = (()=>{

        let run = () => {
            //TODO: Implement the rest of the interrupts
            let iflag = mem.readByte(0xFF0F); let ienabled = mem.readByte(0xFFFF)
            if (iflag & 1 && ienabled & 1 && cpu.interrupt(64)) {console.log(`VBLANKKKK`); mem.setByte(0xFF0F, mem.readByte(0xFF0F) ^ 1)}
            if (iflag & 2 && ienabled & 2 && cpu.interrupt(72)) {console.log(`LCDSTATTTTTTTT!`); mem.setByte(0xFF0F, mem.readByte(0xFF0F) ^ 2)}
        }

        let vblank = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 1); run()}
        let lcd = () => {mem.setByte(0xFF0F, mem.readByte(0xFF0F) | 2); run()}

        return {
            vblank: vblank,
            lcd: lcd
        }
    })()

    //GPU
    let gpu = (() => {
        let tiles = [] // 384 tiles - each tile is [0..7] of [0..7] (8 rows of 8 pixels each)
        let frame = new Array(144); for (let i = 0; i < frame.length; i++) {frame.push(new Uint8Array(160))}
        let bgMapPixels = new Array(256); for (let i = 0; i < bgMapPixels.length; i++) {bgMapPixels.push(new Array(256))}
        let vstat = 0; let hstat = 0;

        //TODO: Throw this into a process; this can happen whenever and could be resource intensive
        let recalcTiles = () => {
            let getLine = (a, b) => {
                a = a.toString(2).substring(a.length - 8).padStart(8, "0").split("").reverse()
                b = b.toString(2).substring(b.length - 8).padStart(8, "0").split("").reverse()
                return a.map((v, i) => {let num = parseInt(v + b[i], 2); return 255/num})
            }

            tiles = []
            for (let i = 0x8000; i < 0x9800; i = i + 16) {
                let lines = []
                for (j = 0; j < 16; j = j + 2) {
                    let topByte = mem.readByte(i + j); let botByte = mem.readByte(i + j + 1); let line = getLine(topByte, botByte); lines.push(line);
                }
                tiles.push(lines)
            }

            //TODO: Check how often this should really happen (probably with each write to VRAM or something)
            updateBgMap()
        }

        let updateBgMap = () => {
            //1. Read BGMap from memory (32x32 tiles)
            //2. Throw it into bgMapPixels array (256 x 256 (32 * 8 = 256))
        }

        let drawLine = (lineNo) => {
            let line = new Array(256)
            //BGMap
            //1. Read scroll positions
            let scy = mem.readByte(0xFF42); let scx = mem.readByte(0xFF43)
            let bgY = lineNo + scy; if (bgLineNo > 0xFF) {bgLineNo = bgLineNo % 0xFF}
            //2. Draw scrollX + lineNo
            for (let i = 0; i < 160; i++) {
                let bgX = scx + i; if (bgX > 0xFF) {bgX = bgX % 0xFF}
                frame[lineNo][i] = bgMapPixels[bgY][bgX]
            }

            //TODO: WINDOW

            //TODO: SPRITES
        }

        //TODO: Throw this into a process if it's too expensive; this can be offloaded and then only the data can be sent to renderer
        let update = () => {
            //TODO: FINISH THIS UP
            mem.setByte(0xFF44, vstat)

            if (vstat == mem.readByte(0xFF45)) {
                interrupts.lcd()
            }

            if (vstat < 144) {
                drawLine(vstat)
                vstat++;
            } else {
                if (vstat === 144) {
                    interrupts.vblank()
                } else if (vstat === 154) {
                    vstat = 0;
                }
                vstat++;
            }

            hstat++
        }

        return {
            update: update,
            recalcTiles: recalcTiles,
            getTiles: () => tiles
        }
    })()

    //5. Start emulation
    let time = (new Date()).getTime()
    let frames = 0

    let loop = function () {
        frames++;
        setTimeout(loop.bind(this), 16) //60FPS
        
        if (!this.paused) {
            //4,213,440 CPU ticks each second, 154 scanlines per frame
            for (let i = 0; i < 154 * 4; i++) {
                cpu.runCycles(114)
                //timers.update(114)
                gpu.update()
            }
        }
        // if (vramChanged) {
            gpu.recalcTiles()
            window.webContents.send('gpuTiles', gpu.getTiles()) 
            vramChanged = false
        // }

        console.log(`Frame time: ${((new Date()).getTime() - time)}ms.`); time = (new Date()).getTime()
    }

    let loopUntil = (when) => {
        let stop = false
        while (!stop) {
            stop = cpu.runCyclesUntil(114, when)
            gpu.update()
        }
        gpu.recalcTiles()
        window.webContents.send('gpuTiles', gpu.getTiles()) 
    }

    let step = () => {
        cpu.step()
        gpu.recalcTiles()
        window.webContents.send('gpuTiles', gpu.getTiles()) 
    }

    if (STEP_THROUGH) {
        return {
            step: step,
            loopUntil: loopUntil
        }
    } else {
        loop()
    }
}
module.exports = emu