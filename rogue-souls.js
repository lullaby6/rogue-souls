const GRID_SIZE = 32
const STRUCTURES = 12
const MIN_STRUCTURE_SIZE = 6
const MAX_STRUCTURE_SIZE = 20

const Slab = {
    color: 'transparent',
    tags: ['slab'],
    image: {
        src: './images/slab.png'
    }
}

const Brick = {
    color: 'transparent',
    tags: ['brick'],
    image: {
        src: './images/brick.png'
    },
}

const Skeleton = {
    color: 'transparent',
    tags: ['enemy', 'skeleton'],
    x: 4 * GRID_SIZE,
    y: 4 * GRID_SIZE,
    z: 1,
    width: GRID_SIZE,
    height: GRID_SIZE,
    image: {
        src: './images/skeleton.png'
    },

    movementDelay: 1000,
    movementTimeout: null,

    getNearestPlayer: current => {
        const players = current.scene.getGameObjectsByTag('player')

        let nearestPlayer = null
        let distanceToNearestPlayer = Infinity

        players.forEach(player => {
            const distance = getDistance(current, player)

            if (distance < distanceToNearestPlayer) {
                nearestPlayer = player
                distanceToNearestPlayer = distance
            }
        })

        return {
            nearestPlayer,
            distanceToNearestPlayer
        }
    },

    getMovements: current => {
        const movements = {
            left: {x: current.x - GRID_SIZE, y: current.y},
            right: {x: current.x + GRID_SIZE, y: current.y},
            up: {x: current.x, y: current.y - GRID_SIZE},
            down: {x: current.x, y: current.y + GRID_SIZE},
        }

        Object.entries(movements).forEach(([movement, position]) => {
            if (!current.canMove(current, position)) {
                delete movements[movement]
            }
        })

        return movements
    },

    canMove: (current, position) => {
        const checkGameObjects = current.scene.getGameObjectsByPosition(position.x, position.y)

        let canMove = true

        checkGameObjects.forEach(checkGameObject => {
            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                canMove = false
            }
        })

        return canMove
    },

    getBestMovement: (current, movements, nearestPlayer, distanceToNearestPlayer) => {
        let bestMovement = null
        let bestMovementDistance = distanceToNearestPlayer

        Object.entries(movements).forEach(([movement, position]) => {
            const distance = getDistance(nearestPlayer, position)

            if (distance < bestMovementDistance) {
                bestMovement = movement
                bestMovementDistance = distance
            }
        })

        return {
            movement: bestMovement,
            newPosition: movements[bestMovement]
        }
    },

    move: (current, movement, newPosition) => {
        current.movementTimeout = setTimeout(() => {
            current.movementTimeout = null

            if (movement === 'left') {
                current.image.flipX = true
            } else if (movement === 'right') {
                current.image.flipX = false
            }

            current.x = newPosition.x
            current.y = newPosition.y
        }, current.movementDelay)
    },

    onUpdate: current => {
        if (current.movementTimeout) return

        const {nearestPlayer, distanceToNearestPlayer} = current.getNearestPlayer(current)

        if (!nearestPlayer || !distanceToNearestPlayer || distanceToNearestPlayer <= 0) return

        const movements = current.getMovements(current)

        const {movement, newPosition} = current.getBestMovement(current, movements, nearestPlayer, distanceToNearestPlayer)

        if (!movement || !newPosition) return
        current.move(current, movement, newPosition)
    },
}

const Player = {
    color: 'transparent',
    tags: ['player'],
    x: 2 * GRID_SIZE,
    y: 2 * GRID_SIZE,
    z: 2,
    width: GRID_SIZE,
    height: GRID_SIZE,
    image: {
        src: './images/knight.png'
    },

    onUpdate: current => {
        current.scene.game.camera.setTarget(current, 10)
    },

    onKeyup: ({event, current}) => {
        if (current.scene.game.pause) return

        if (event.key == 'w') {
            const checkGameObjects = current.scene.getGameObjectsByPosition(current.x, current.y - GRID_SIZE)

            let wall = false

            checkGameObjects.forEach(checkGameObject => {
                if (checkGameObject && checkGameObject.tags.includes('brick')) {
                    wall = true
                }
            })

            if (wall) return

            current.y -= GRID_SIZE
        } else if (event.key == 'a') {
            const checkGameObjects = current.scene.getGameObjectsByPosition(current.x - GRID_SIZE, current.y)

            let wall = false

            checkGameObjects.forEach(checkGameObject => {
                if (checkGameObject && checkGameObject.tags.includes('brick')) {
                    wall = true
                }
            })

            if (wall) return

            current.image.flipX = true
            current.x -= GRID_SIZE
        } else if (event.key == 's') {
            const checkGameObjects = current.scene.getGameObjectsByPosition(current.x, current.y + GRID_SIZE)

            let wall = false

            checkGameObjects.forEach(checkGameObject => {
                if (checkGameObject && checkGameObject.tags.includes('brick')) {
                    wall = true
                }
            })

            if (wall) return

            current.y += GRID_SIZE
        } else if (event.key == 'd') {
            const checkGameObjects = current.scene.getGameObjectsByPosition(current.x + GRID_SIZE, current.y)

            let wall = false

            checkGameObjects.forEach(checkGameObject => {
                if (checkGameObject && checkGameObject.tags.includes('brick')) {
                    wall = true
                }
            })

            if (wall) return

            current.image.flipX = false
            current.x += GRID_SIZE
        }
    }
}

const Structure = {
    color: 'transparent',
    tags: ['structure'],
    directions: ['left', 'right', 'up', 'down'],

    image: {
        src: './images/32x_slab.png',
        pattern: true,
    },

    loadTileMaps: current => {
        const map = current.scene.generateMapRoom(current.height/GRID_SIZE, current.width/GRID_SIZE)

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
                0: null,
                1: Brick
            },
            map,
        })

        // current.scene.removeGameObjectByName(current.name)
    },
}

const MainScene = {
    maxStructures: STRUCTURES,
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

    onUpdate: current => {
        if (!current.tileMapsLoaded) current.generateStructures(current)

        // console.log(Object.keys(current.gameObjects).length, current.game.currentFPS);
    },

    generateStructures: (current) => {
        const structures = current.getGameObjectsByTag('structure')

        if (structures.length < current.maxStructures) {
            const randomStructure = randomItemFromArray(structures)

            current.createStructure(current, randomStructure)
        } else {
            current.tileMapsLoaded = true

            structures.forEach(structure => {
                structure.loadTileMaps(structure)
            })

            current.instantGameObject(Skeleton)
        }
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

        newStructure.width = GRID_SIZE * randomIntFromInterval(MIN_STRUCTURE_SIZE, MAX_STRUCTURE_SIZE)
        newStructure.height = GRID_SIZE * randomIntFromInterval(MIN_STRUCTURE_SIZE, MAX_STRUCTURE_SIZE)

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
    title: 'Rogue Souls',
    imageSmoothingEnabled: false,
    cursor: false,
    width: 640,
    height: 480,

    scenes: {
        main: MainScene
    },

    onKeydown: ({event, current}) => {
        if (event.key == 'f') current.toggleFullscreen()
        else if (event.key == 'p') current.togglePause()
        else if (event.key == 'r') current.resetScene()
    },

    onPause: current => {
        current.setCursorVisibility(true)
    },

    onResume: current => {
        current.setCursorVisibility(false)
    }
})

game.run()