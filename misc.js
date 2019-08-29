
//Some stuff to draw screen
document.addEventListener("DOMContentLoaded", function(){
    // Handler when the DOM is fully loaded
        var gameCanvas = document.getElementById("game")
        var gameCanvasCtx = gameCanvas.getContext("2d")
    
        window.displayPixels  = function (rows) {
            
            let id = gameCanvasCtx.getImageData(0, 0, 160, 144)
            let pixlos = id.data
            w = 0
            for (let j = 0; j < 144; j++) {
                for (let i = 0; i < 160; i++) {
                    let px = rows[j][i]
                    pixlos[w] = px
                    pixlos[w + 1] = px
                    pixlos[w + 2] = px
                    pixlos[w + 3] = 0xFF
                    w += 4
                }
            }
            gameCanvasCtx.putImageData(id, 0, 0)
        }
    });

function stop () {
    if (window.gb) {
        window.gb.stop()
    }
}

function cont () {
    if (window.gb) {
        window.gb.start()
    }
}

function step () {
    if (window.gb) {
        window.gb.step()
    }
}

function memAddr (e) {
    if (e.key != `Enter`) {return;}
    let memBox = document.querySelector(`#mem`)
    let inputVal = document.querySelector(`#memSearchBoxAddr`).value
    let radix = 10
    if (inputVal.toString().includes(`0x`)) {radix = 16; inputVal = inputVal.substring(2)}
    if (inputVal.toString().includes(`0b`)) {radix = 2; inputVal = inputVal.substring(2)}
    let addressToGet = parseInt(inputVal.toString(), radix)
    memBox.options.selectedIndex = addressToGet
}

function memVal (e) {
    if (e.key != `Enter`) {return;}
    let memBox = document.querySelector(`#mem`)
    let inputVal = document.querySelector(`#memSearchBoxVal`).value
    let radix = 10
    if (inputVal.toString().includes(`0x`)) {radix = 16; inputVal = inputVal.substring(2)}
    if (inputVal.toString().includes(`0b`)) {radix = 2; inputVal = inputVal.substring(2)}
    let valueToFind = parseInt(inputVal.toString(), radix)
    let index = -1;
    if (window.gb) {
        let mem = window.gb.getMemory()
        //Search from the currently selected index
        let searchStart = memBox.options.selectedIndex >= 0 ? memBox.options.selectedIndex + 1: 0
        let found = false
        for (let i = searchStart; i < mem.length; i++) {
            if (mem[i] === valueToFind) {
                index = i
                found = true
                break
            }
        }
        //If this didn't yield anything - try searching from the top again
        if (!found) {
            for (let i = 0; i < mem.length; i++) {
                if (mem[i] === valueToFind) {
                    index = i
                    break
                }
            }
        }
    }
    memBox.options.selectedIndex = index
}

function outputDebugInfo ({cpu}) {
    //TODO: This
    document.querySelector(`#rb`).innerHTML = `B: 0x${cpu.b.toString(16)}`
    document.querySelector(`#rc`).innerHTML = `C: 0x${cpu.c.toString(16)}`
    document.querySelector(`#rd`).innerHTML = `D: 0x${cpu.d.toString(16)}`
    document.querySelector(`#re`).innerHTML = `E: 0x${cpu.e.toString(16)}`
    document.querySelector(`#rh`).innerHTML = `H: 0x${cpu.h.toString(16)}`
    document.querySelector(`#rl`).innerHTML = `L: 0x${cpu.l.toString(16)}`
    document.querySelector(`#rhl`).innerHTML = `HL: 0x${cpu.hl.toString(16)}`
    document.querySelector(`#ra`).innerHTML = `A: 0x${cpu.a.toString(16)}`
    document.querySelector(`#rf`).innerHTML = `F: 0b${cpu.f.toString(2).padStart(8, "0")}`
    document.querySelector(`#pc`).innerHTML = `PC: 0x${cpu.pc.toString(16)}`
    document.querySelector(`#sp`).innerHTML = `SP: 0x${cpu.sp.toString(16)}`
}

function printMemory () {
    if (window.gb) {
        let mem = window.gb.getMemory()
        let memDom = document.querySelector(`#mem`)
        let t = (v, i) => {return `${i.toString(16).padEnd(10, ".")} 0x${v.toString(16)}`}
        if (memDom.childElementCount == 0) {
            mem.forEach((v, i) => memDom.appendChild(new Option(t(v, i))))
        } else {
            mem.forEach((v, i) => {
                memDom.childNodes[i].innerHTML = t(v, i)
            })
        }
    }
}

function run () {
    //Stop anything that's running already
    stop()
    window.game = null
    window.gb = null

    //Get the ROM and start it
    //
    // fetch("res/Tetris (JUE) (V1.1) [!].gb")
    fetch("roms/adjustris.gb")
    // fetch("res/Donkey Kong Land III (U) [S][!].gb")
    // fetch("res/Legend of Zelda, The - Link's Awakening (U) (V1.2) [!].gb")
    // fetch("res/Pokemon - Blue Version (UE) [S][!].gb")
    // fetch("res/Super Mario Land 2 - 6 Golden Coins (UE) (V1.2) [!].gb")
    // fetch("res/Super Mario Land (JUE) (V1.1) [!].gb")
    // fetch("res/opus5.gb")
    // fetch("res/individual/01-special.gb")
    // fetch("res/individual/02-interrupts.gb")
    // fetch("res/individual/03-op sp,hl.gb")
    // fetch("res/individual/04-op r,imm.gb")
    // fetch("res/individual/05-op rp.gb")
    // fetch("res/individual/06-ld r,r.gb")
    // fetch("res/individual/07-jr,jp,call,ret,rst.gb")
    // fetch("res/individual/08-misc instrs.gb")
    // fetch("res/individual/09-op r,r.gb")
    // fetch("res/individual/10-bit ops.gb")
    // fetch("res/individual/11-op a,(hl).gb")
    // fetch("res/cpu_instrs.gb")
        .then((res) => {
            return res.arrayBuffer()
        })
        .then((ab) => {
            game = new Uint8Array(ab);
            window.gb = emu(outputDebugInfo) 
            // window.gb.setBreakPoint(0xA0)
            // window.gb.setBreakPoint(0x95)
            window.gb.start()          
        })
}

run()