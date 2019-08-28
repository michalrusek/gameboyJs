# THIS IS A WORK IN PROGRESS  
  
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
  
## What practical things works:  
- Boot rom works fully
- Most of the CPU Blargg's tests are passing as well  
- Tetris is now fully playable
- Adjustris (https://github.com/tbsp/Adjustris) is fully playable:  
![Alt text](/img/adjustris.gif?raw=true "Adjustris gameplay")  
  
## What was tested but doesn't work:  
- Dr Mario game
- Super Mario game  
  
## What's yet to be implemented:  
- Palettes for sprites
- Sound
- Last interrupt (serial)
- MBC
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
