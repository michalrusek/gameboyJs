# THIS IS A WORK IN PROGRESS  
  
## How to run:  
Place a `Tetris (JUE) (V1.1) [!].gb` rom in `res/` folder and run `npm start` (a drag-and-drop rom loader will come soon).
  
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
- Tetris is now playable:  
![Alt text](/img/tetrisrun.gif?raw=true "Tetris menu")  
  
## What was tested but doesn't work:  
- Dr Mario game
- Super Mario game  
  
## What's yet to be implemented:  
- Palettes should be improved for sure, the colors are kinda wrong
- Sound
- Last interrupt (serial)
- MBC
- 8x16 sprites
- sprite flip
- WINDOW
- A drag-and-drop game loader
  
## Sources:  
- http://bgb.bircd.org/pandocs.html  
- http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html  
- https://www.youtube.com/watch?v=HyzD8pNlpwI ("The Ultimate Game Boy Talk (33c3)")  
- https://gbdev.gg8.se/wiki/articles/Main_Page  
- https://forums.nesdev.com/viewtopic.php?f=20&t=15944#p196282
- https://github.com/alexaladren/jsgameboy (used for debugging side by side)
- http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-The-CPU
