class Vectrex {
    constructor(containerId, cellSizePx=10) {
        // Check arguments
        if (!Vectrex.checkConstructorArguments(containerId, cellSizePx)) return;

        // Set properties
        this.setDefaultProperties();
        this.cellSizePx = cellSizePx;
        this.container = document.getElementById(containerId);
        this.createCanvas();
        
        // Set events
        this.setEvents();
        
        // Start
        this.loadLevel(0);
    }
    
    static checkConstructorArguments(containerId, cellSizePx) {
        // Check arguments
        let isCorrectFlag = true;
        if (!document.getElementById(containerId)) isCorrectFlag = false;
        if (isNaN(cellSizePx) || cellSizePx < 1) isCorrectFlag = false;
        
        // Throw error
        if (!isCorrectFlag) throw new Error("Incorrect arguments");
        
        return true;
    }
    
    calcBaseCoords() {
        let maxCellPositionX = 0;
        let maxCellPositionY = 0;
        for (const cell of this.cells) {
            maxCellPositionX = Math.max(maxCellPositionX, cell[0]);
            maxCellPositionY = Math.max(maxCellPositionY, cell[1]);
        }
        
        const fieldWidth = this.calcCellCoords([0, 0], [maxCellPositionX + 1, maxCellPositionY + 1])[0];
        const fieldHeight = this.calcCellCoords([0, 0], [0, maxCellPositionY + 1])[1] - this.calcCellCoords([0, 0], [maxCellPositionX + 1, 0])[1];
        
        const canvas = this.container.firstChild;
        const baseCoordX = Math.floor((canvas.width - fieldWidth) / 2);
        const baseCoordY = Math.floor((canvas.height - fieldHeight) / 2) - this.calcCellCoords([0, 0], [maxCellPositionX, 0])[1];

        return [baseCoordX, baseCoordY];
    }
    
    calcCellCoords(baseCoords, cellPosition) {
        const cellCoordX = baseCoords[0] + (cellPosition[0] * this.settings.cellSprite.width + cellPosition[1] * this.settings.cellSprite.shiftX) * this.cellSizePx;
        const cellCoordY = baseCoords[1] + (cellPosition[1] * this.settings.cellSprite.height + cellPosition[0] * this.settings.cellSprite.shiftY) * this.cellSizePx;
        
        return [cellCoordX, cellCoordY];
    }
    
    checkState() {
        if (
            this.shapePlacement === this.dicts.shapePlacements.up && 
            this.shapePosition[0] === this.cellFinishPosition[0] && 
            this.shapePosition[1] === this.cellFinishPosition[1]
        ) {
            this.state = this.dicts.states.win;
        } else {
            let shapeCells = [];
            shapeCells.push(this.shapePosition);
            if (this.shapePlacement !== this.dicts.shapePlacements.up) {
                if (this.shapePlacement === this.dicts.shapePlacements.horizontal) {
                    shapeCells.push([this.shapePosition[0] + 1, this.shapePosition[1]]);
                } else if (this.shapePlacement === this.dicts.shapePlacements.vertical) {
                    shapeCells.push([this.shapePosition[0], this.shapePosition[1] + 1]);
                }
            }
            
            let counter = 0;
            for (const shapeCell of shapeCells) {
                for (const cell of this.cells) {
                    if (shapeCell[0] === cell[0] && shapeCell[1] === cell[1]) {
                        counter++;
                        break;
                    }
                }
            }
            if (counter !== shapeCells.length) this.state = this.dicts.states.loss;
        }
    }
    
    createCanvas() {
        // Clear container
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }
        
        // Create new canvas
        const canvas = document.createElement("canvas");
        canvas.id = this.container.id + "-canvas";
        canvas.width = this.container.offsetWidth;
        canvas.height = this.container.offsetHeight;
        
        // Append new canvas to the container
        this.container.append(canvas);
    }
    
    drawVertexes(normalVertexes, cellCoords, lineColor, lineWidthPx) {
        const context = this.container.firstChild.getContext("2d");
        
        // Style of the line
        context.lineWidth = lineWidthPx;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = lineColor;
        
        // Draw lines between vertexes
        for (const groupVertexes of normalVertexes) {
            context.beginPath();
            
            let isFirstVertex = true;
            for (const vertex of groupVertexes) {
                const vertexCoordX = cellCoords[0] + vertex[0] * this.cellSizePx;
                const vertexCoordY = cellCoords[1] + vertex[1] * this.cellSizePx;
                
                if (isFirstVertex) {
                    context.moveTo(vertexCoordX, vertexCoordY);
                    isFirstVertex = false;
                } else {
                    context.lineTo(vertexCoordX, vertexCoordY);
                }
            }
            
            context.stroke();
        }
    }
    
    nextLevel() {
        // Set cycle level numeration
        this.loadLevel((this.currentLevelIndex + 1) % this.settings.levels.length);
    }
    
    loadLevel(levelIndex) {
        this.currentLevelIndex = levelIndex;
        
        // Set cells properties
        const level = this.settings.levels[levelIndex];
        this.cells = level.cells;
        this.cellStartPosition = level.cellStartPosition;
        this.cellFinishPosition = level.cellFinishPosition;
        
        // Set shape properties
        this.shapePosition = [level.cellStartPosition[0], level.cellStartPosition[1]];
        this.shapePlacement = this.dicts.shapePlacements.up;
        
        // Set state
        this.state = this.dicts.states.inProgress;
        
        this.render();
    }
    
    moveShape(direction) {
        if (this.state !== this.dicts.states.inProgress) return;
            
        if (direction === this.dicts.stepDirections.top || direction === this.dicts.stepDirections.bottom) {
            if (this.shapePlacement === this.dicts.shapePlacements.up) {
                this.shapePlacement = this.dicts.shapePlacements.vertical;
                this.shapePosition[1] += (direction === this.dicts.stepDirections.top ? -2 : 1);
            } else if (this.shapePlacement === this.dicts.shapePlacements.vertical) {
                this.shapePlacement = this.dicts.shapePlacements.up;
                this.shapePosition[1] += (direction === this.dicts.stepDirections.top ? -1 : 2);
            } else {
                this.shapePosition[1] += (direction === this.dicts.stepDirections.top ? -1 : 1);
            }
        } else if (direction === this.dicts.stepDirections.right || direction === this.dicts.stepDirections.left) {
            if (this.shapePlacement === this.dicts.shapePlacements.up) {
                this.shapePlacement = this.dicts.shapePlacements.horizontal;
                this.shapePosition[0] += (direction === this.dicts.stepDirections.left ? -2 : 1);
            } else if (this.shapePlacement === this.dicts.shapePlacements.horizontal) {
                this.shapePlacement = this.dicts.shapePlacements.up;
                this.shapePosition[0] += (direction === this.dicts.stepDirections.left ? -1 : 2);
            } else {
                this.shapePosition[0] += (direction === this.dicts.stepDirections.left ? -1 : 1);
            }
        }
        
        this.checkState();
        this.render();
    }
    
    render() {
        // Clear canvas
        const canvas = this.container.firstChild;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render cells and shape
        this.renderCells();
        this.renderShape();
    }
    
    renderCells() {
        const baseCoords = this.calcBaseCoords();
        const lineWidthPx = 1;
        
        // Render cells
        for (const cellPosition of this.cells) {
            if (
                (cellPosition[0] === this.cellStartPosition[0] && cellPosition[1] === this.cellStartPosition[1]) || 
                (cellPosition[0] === this.cellFinishPosition[0] && cellPosition[1] === this.cellFinishPosition[1])
            ) continue;
            
            const cellCoords = this.calcCellCoords(baseCoords, cellPosition);
            this.drawVertexes(this.settings.cellSprite.vertexes, cellCoords, this.settings.colors.cell, lineWidthPx);
        }
        
        // Render start cell
        const cellStartCoords = this.calcCellCoords(baseCoords, this.cellStartPosition);
        this.drawVertexes(this.settings.cellStartSprite.vertexes, cellStartCoords, this.settings.colors.cellStart, lineWidthPx);
        
        // Render finish cell
        const cellFinishCoords = this.calcCellCoords(baseCoords, this.cellFinishPosition);
        this.drawVertexes(this.settings.cellFinishSprite.vertexes, cellFinishCoords, this.settings.colors.cellFinish, lineWidthPx);
    }
    
    renderShape() {
        const shapeVertexes = (this.shapePlacement === this.dicts.shapePlacements.horizontal ? this.settings.shapeSprite.horizontalVertexes : (this.shapePlacement === this.dicts.shapePlacements.vertical ? this.settings.shapeSprite.verticalVertexes : this.settings.shapeSprite.upVertexes));
        const shapeCoords = this.calcCellCoords(this.calcBaseCoords(), this.shapePosition);
        const shapeColor = (this.state === this.dicts.states.win ? this.settings.colors.shapeWin : (this.state === this.dicts.states.loss ? this.settings.colors.shapeLoss : this.settings.colors.shapeInProgress));
        const lineWidthPx = 1.8;
        
        this.drawVertexes(shapeVertexes, shapeCoords, shapeColor, lineWidthPx);
    }
    
    repeatLevel() {
        this.loadLevel(this.currentLevelIndex);
    }
    
    setDefaultProperties() {
        // Set dictionaries
        this.dicts = {
            states: {notReady: 0, inProgress: 1, win: 2, loss: 3},
            shapePlacements: {horizontal: 0, vertical: 1, up: 2},
            stepDirections: {top: 0, right: 1, bottom: 2, left: 3}
        };
        
        // Set settings
        this.settings = {
            colors: {cell: "#888", cellStart: "#888", cellFinish: "#888", shapeInProgress: "#fff", shapeWin: "#f90", shapeLoss: "#f00"},
            cellSprite: {
                width: .6, 
                height: .5, 
                shiftX: .3, 
                shiftY: -.2, 
                vertexes: [
                    [[.0, .2], [.6, .0], [.9, .5], [.3, .7], [.0, .2]]
                ]
            },
            cellStartSprite: {
                vertexes: [
                    [[.0, .2], [.6, .0], [.9, .5], [.3, .7], [.0, .2]]
                ]
            },
            cellFinishSprite: {
                vertexes: [
                    [[.0, .2], [.6, .0], [.9, .5], [.3, .7], [.0, .2]],
                    [[.0, .2], [.9, .5]],
                    [[.3, .7], [.6, .0]]
                ]
            },
            shapeSprite: {
                horizontalVertexes: [
                    [[.0, .2], [.0, -.5], [1.2, -.9], [1.2, -.2], [.0, .2]],
                    [[.3, .7], [.3, .0], [1.5, -.4], [1.5, .3], [.3, .7]],
                    [[.0, .2], [.0, -.5], [.3, .0], [.3, .7], [.0, .2]],
                    [[1.2, -.2], [1.2, -.9], [1.5, -.4], [1.5, .3], [1.2, -.2]]
                ],
                verticalVertexes: [
                    [[.0, .2], [.0, -.5], [.6, -.7], [.6, .0], [.0, .2]],
                    [[.6, 1.2], [.6, .5], [1.2, .3], [1.2, 1.0], [.6, 1.2]],
                    [[.0, .2], [.0, -.5], [.6, .5], [.6, 1.2], [.0, .2]],
                    [[.6, .0], [.6, -.7], [1.2, .3], [1.2, 1.0], [.6, .0]]
                ],
                upVertexes: [
                    [[.0, .2], [.0, -1.1], [.6, -1.3], [.6, .0], [.0, .2]],
                    [[.3, .7], [.3, -.6], [.9, -.8], [.9, .5], [.3, .7]],
                    [[.0, .2], [.0, -1.1], [.3, -.6], [.3, .7], [.0, .2]],
                    [[.6, .0], [.6, -1.3], [.9, -.8], [.9, .5], [.6, .0]]
                ]
            },
            levels: [
                {
                    cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3], [3, 3]],
                    cellStartPosition: [0, 0],
                    cellFinishPosition: [3, 3]
                },
                {
                    cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [0, 3], [1, 3], [2, 3]],
                    cellStartPosition: [0, 0],
                    cellFinishPosition: [2, 3]
                },
                {
                    cells: [[3, 0], [4, 0], [5, 0], [3, 1], [4, 1], [5, 1], [2, 2], [3, 2], [4, 2], [5, 2], [2, 3], [3, 3], [4, 3], [0, 4], [1, 4], [2, 4], [6, 4], [7, 4], [8, 4], [0, 5], [1, 5], [2, 5], [6, 5], [7, 5], [8, 5], [9, 5], [0, 6], [1, 6], [2, 6], [7, 6], [8, 6], [9, 6], [0, 7], [7, 7], [8, 7], [9, 7], [0, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [3, 10], [4, 10], [5, 10], [3, 11], [3, 12], [3, 13], [3, 14]],
                    cellStartPosition: [3, 14],
                    cellFinishPosition: [4, 1]
                },
                {
                    cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [3, 6], [4, 6], [5, 6], [3, 7], [4, 7], [5, 7], [3, 8], [4, 8], [5, 8], [3, 9], [1, 10], [2, 10], [3, 10], [4, 10], [1, 11], [2, 11], [3, 11], [4, 11], [1, 12], [2, 12], [3, 12], [4, 12], [1, 13], [2, 13], [3, 13], [4, 13]],
                    cellStartPosition: [2, 12],
                    cellFinishPosition: [2, 1]
                }
            ]
        };
        
        // Set default properties
        this.cells = [];
        this.cellStartPosition = [];
        this.cellFinishPosition = [];
        this.cellSizePx = 0;
        this.container = null;
        this.currentLevelIndex = 0;
        this.shapePosition = [];
        this.shapePlacement = null;
        this.state = this.dicts.states.notReady;
    }
    
    setEvents() {
        this.container.addEventListener("click", (event) => {
            if (this.state === this.dicts.states.loss) {
                // Click to repeat level
                this.repeatLevel();
            } else if (this.state === this.dicts.states.win) {
                // Click to load next level
                this.nextLevel();
            } else if (this.state === this.dicts.states.inProgress) {
                // Click to move the shape
                const coordX = event.clientX - this.container.offsetLeft;
                const coordY = event.clientY - this.container.offsetTop;
                const ratio = this.container.offsetHeight / this.container.offsetWidth;
                
                let direction;
                if (coordY > ratio * coordX) {
                    if (coordY > -ratio * coordX + this.container.offsetHeight) {
                        direction = this.dicts.stepDirections.bottom;
                    } else {
                        direction = this.dicts.stepDirections.left;
                    }
                } else {
                    if (coordY > -ratio * coordX + this.container.offsetHeight) {
                        direction = this.dicts.stepDirections.right;
                    } else {
                        direction = this.dicts.stepDirections.top;
                    }
                }
                
                this.moveShape(direction);
            }
        });
        
        document.addEventListener("keydown", (event) => {
            if (this.state === this.dicts.states.loss) {
                // Any key to repeat level
                this.repeatLevel();
            } else if (this.state === this.dicts.states.win) {
                // Any key to load next level
                this.nextLevel();
            } else if (this.state === this.dicts.states.inProgress) {
                // Arrow keys to move the shape
                let direction;
                if (event.code === "ArrowUp") {
                    direction = this.dicts.stepDirections.top;
                } else if (event.code === "ArrowRight") {
                    direction = this.dicts.stepDirections.right;
                } else if (event.code === "ArrowDown") {
                    direction = this.dicts.stepDirections.bottom;
                } else if (event.code === "ArrowLeft") {
                    direction = this.dicts.stepDirections.left;
                }
                
                this.moveShape(direction);
            }
        });
    }
}
