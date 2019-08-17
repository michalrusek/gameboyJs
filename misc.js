
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
}

function printMemory () {
    if (window.gb) {
        let mem = window.gb.getMemory()
        let memDom = document.querySelector(`#mem`) 
        if (memDom.childElementCount == 0) {
            mem.forEach(v => memDom.appendChild(new Option(v)))
        } else {
            mem.forEach((v, i) => {
                memDom.childNodes[i].innerHTML = v
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

    // fetch("res/Tetris (JUE) (V1.1) [!].gb")
    // fetch("res/individual/01-special.gb")
    // fetch("res/individual/02-interrupts.gb")
    // fetch("res/individual/03-op sp,hl.gb")
    // fetch("res/individual/04-op r,imm.gb")
    // fetch("res/individual/05-op rp.gb")
    // fetch("res/individual/06-ld r,r.gb")
    // fetch("res/individual/07-jr,jp,call,ret,rst.gb")
    // fetch("res/individual/08-misc instrs.gb")
    fetch("res/individual/09-op r,r.gb")
    // fetch("res/individual/10-bit ops.gb")
    // fetch("res/individual/11-op a,(hl).gb")
    // fetch("res/cpu_instrs.gb")
        .then((res) => {
            return res.arrayBuffer()
        })
        .then((ab) => {
            game = new Uint8Array(ab);
            window.gb = emu(outputDebugInfo)  
            window.gb.start()          
        })
}