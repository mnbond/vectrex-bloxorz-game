# Vectrex game Bloxorz

A JavaScript implementation of Bloxorz game for a vector display-based home video game console [Vectrex](https://en.wikipedia.org/wiki/Vectrex).

![Screenshots](./screenshots/levels.png)

### Instructions

1. Add JavaScript code containing class `Vectrex` in an HTML document:
```html
<script src="js/vectrex.js" type="text/javascript"></script>
```
2. Add HTML element for the game in `body` section:
```html
<div id="vectrex-container"></div>
```
3. Сreate an instance of class `Vectrex` after the `DOMContentLoaded` event:
```js
document.addEventListener("DOMContentLoaded", () => {
    const cellSizePx = 30;
    const containerId = "vectrex-container";
    const vectrex = new Vectrex(containerId, cellSizePx);
});
```

Class `Vectrex` constructor parameters:
- `containerId` — ID of HTLM element for the game;
- `cellSizePx` — size of cell in pixels, default 10 pixels.

### Demo

View demo here.

### Adding new levels

To add new levels modify this method of class `Vectrex`:
```js
class Vectrex {
    ...
    setDefaultProperties() {
        ...
        this.settings = {
            ...
            levels: [
                {
                    cells: [],
                    cellStartPosition: [],
                    cellFinishPosition: []
                }
```