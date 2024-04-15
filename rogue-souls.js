const GRID_SIZE = 25

const Slab = {
    color: 'transparent',
    tags: ['slab'],
    image: {
        src: '/assets/images/slab.png'
    }
}

const Brick = {
    color: 'transparent',
    tags: ['brick'],
    image: {
        src: '/assets/images/brick.png'
    },
}

const Player = {
    color: 'transparent',
    tags: ['player'],
    x: 2 * GRID_SIZE,
    y: 2 * GRID_SIZE,
    z: 1,
    width: GRID_SIZE,
    height: GRID_SIZE,
    image: {
        src: '/assets/images/knight.png'
    },

    onUpdate: current => {
        current.scene.game.camera.setTarget(current, 10)
    },

    onKeydown: ({event, current}) => {
        if (current.scene.game.pause) return

        if (event.key == 'w') {
            const checkGameObject = current.scene.getGameObjectByPosition(current.x, current.y - GRID_SIZE)

            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                return
            }

            current.y -= GRID_SIZE
        } else if (event.key == 'a') {
            const checkGameObject = current.scene.getGameObjectByPosition(current.x - GRID_SIZE, current.y)

            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                return
            }

            current.image.flipX = true
            current.x -= GRID_SIZE
        } else if (event.key == 's') {
            const checkGameObject = current.scene.getGameObjectByPosition(current.x, current.y + GRID_SIZE)

            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                return
            }

            current.y += GRID_SIZE
        } else if (event.key == 'd') {
            const checkGameObject = current.scene.getGameObjectByPosition(current.x + GRID_SIZE, current.y)

            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                return
            }

            current.image.flipX = false
            current.x += GRID_SIZE
        }
    }
}

const Structure = {
    color: 'transparent',
    tags: ['structure'],
    directions: ['left', 'right', 'up', 'down'],

    // image: {
    //     src: '/assets/images/slab.png'
    // },

    loadTileMaps: current => {
        const map = current.scene.generateMapRoom(current.height/GRID_SIZE, current.width/GRID_SIZE)

        console.log(map);
        if (!current.directions.includes('up')) {
            map[0][1] = 0
            map[0][2] = 0
        }

        if (!current.directions.includes('down')) {
            map[map.length - 1][1] = 0
            map[map.length - 1][2] = 0
        }

        if (!current.directions.includes('left')) {
            map[1][0] = 0
            map[2][0] = 0
        }

        if (!current.directions.includes('right')) {
            map[1][map[0].length - 1] = 0
            map[2][map[0].length - 1] = 0
        }


        current.scene.instantTileMap({
            x: current.x,
            y: current.y,
            size: GRID_SIZE ,
            tiles: {
                // 0: {
                //     ...GameObject,
                //     color: 'transparent',
                // },
                0: Slab,
                1: Brick
            },
            map,
        })
    },
}

const MainScene = {
    maxStructures: 10,
    structureIndex: 0,
    tileMapsLoaded: false,

    gameObjects: {
        mainRoom: {
            ...Structure,
            width: GRID_SIZE * 10,
            height: GRID_SIZE * 10,
            structureIndex: 0,
        },
        Player: Player
    },

    onLoad: current => {
        // current.game.camera.setZoom(0.375)
    },

    onUpdate: current => {
        const structures = current.getGameObjectsByTag('structure')

        if (structures.length < current.maxStructures) {
            const randomStructure = randomItemFromArray(structures)

            current.createStructure(current, randomStructure)
        } else if (!current.tileMapsLoaded) {
            current.tileMapsLoaded = true

            structures.forEach(structure => {
                structure.loadTileMaps(structure)
            })
        }

        // console.log(current.game.currentFPS);
    },

    createStructure: (current, structure) => {
        const direction = randomItemFromArray(structure.directions)

        current.structureIndex += 1

        let newStructure = {
            ...Structure,
            parentStructure: structure.name,
            x: structure.x,
            y: structure.y,
            structureIndex: current.structureIndex
        }

        newStructure.width = GRID_SIZE * randomIntFromInterval(5, 10)
        newStructure.height = GRID_SIZE * randomIntFromInterval(5, 10)

        switch (direction) {
            case 'right':
                newStructure.x = structure.x + structure.width
                newStructure.directions = newStructure.directions.filter(d => d != 'left')
                break;
            case 'left':
                newStructure.x = structure.x - newStructure.width
                newStructure.directions = newStructure.directions.filter(d => d != 'right')
                break;
            case 'up':
                newStructure.y = structure.y - newStructure.height
                newStructure.directions = newStructure.directions.filter(d => d != 'down')
                break;
            case 'down':
                newStructure.y = structure.y + structure.height
                newStructure.directions = newStructure.directions.filter(d => d != 'up')
                break;
            default:
                break;
        }

        const structures = current.getGameObjectsByTag('structure')

        let collide = false

        Object.entries(structures).forEach(([name, checkStructure]) => {
            if (checkStructure.name != newStructure.parentStructure) {
                if (isCollide(newStructure, checkStructure)) {
                    collide = true
                }
            }
        })

        if (collide) {
            current.structureIndex -= 1
            return
        }

        structure.directions = structure.directions.filter(d => d != direction)

        current.instantGameObject(newStructure)
    },

    generateMapRoom: (rows, cols) => {
        const map = []

        for (let row_i = 0; row_i < rows; row_i++) {
            const row = []

            for (let col_i = 0; col_i < cols; col_i++) {
                if (row_i == 0 || row_i == rows - 1 || col_i == 0 || col_i == cols - 1) {
                    row.push(1)
                } else {
                    row.push(0)
                }
            }

            map.push(row)
        }

        return map
    }
}

const game = new Game({
    backgroundColor: '#0f0f0f',
    fps: 60,
    title: 'Rogue Souls',
    imageSmoothingEnabled: false,

    scenes: {
        main: MainScene
    },

    onKeydown: ({event, current}) => {
        if (event.key == 'f') current.toggleFullscreen()
        else if (event.key == 'p') current.togglePause()
        else if (event.key == 'r') current.resetScene()
    },
})

game.run()