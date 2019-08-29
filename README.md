# Note this project is not finished at all and there are some crucial parts missing to this emulator; Not sure if I'll continue as it reached the state I wanted to reach (playing Tetris & Mario) 
  
## What practical things works:  
- Boot rom works fully
- Most of the CPU Blargg's tests are passing as well  
- Adjustris (https://github.com/tbsp/Adjustris) is fully playable:  
![Alt text](/img/adjustris.gif?raw=true "Adjustris gameplay")  
- A few other games are also playable/semi playable, e.g.:  
  ![Alt text](/img/tetris.gif?raw=true "Tetris")![Alt text](/img/mario.gif?raw=true "Super Mario Land")
## How to run:  
- `npm install`
- `npm start`
- open http://127.0.0.1/ in your browser
  
## Controls:
| Keyboard | GameBoy |
|----------|---------|
| Enter    | Start   |
| Space    | Select  |
| Z        | A       |
| X        | B       |
| ↑        | ↑       |
| ↓        | ↓       |
| →        | →       |
| ←        | ←       |  
  
## What was tested but doesn't work:  
- Dr Mario game
- Super Mario game  
  
## What's yet to be implemented:  
- Palettes for sprites
- Sound
- Last interrupt (serial)
- MBC1 full support (only partial support is now enabled)
- Fix DAA
- Sprites transparent pixels
- 8x16 sprites
- WINDOW rendering (https://gbdev.gg8.se/wiki/articles/Video_Display#The_Window)
- A drag-and-drop game loader
  
## Sources:  
- http://bgb.bircd.org/pandocs.html  
- http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html  
- https://www.youtube.com/watch?v=HyzD8pNlpwI ("The Ultimate Game Boy Talk (33c3)")  
- https://gbdev.gg8.se/wiki/articles/Main_Page  
- https://forums.nesdev.com/viewtopic.php?f=20&t=15944#p196282
- https://github.com/alexaladren/jsgameboy (used for debugging side by side)
- http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-The-CPU
