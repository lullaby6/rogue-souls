const GRID_SIZE = 32
const ROOMS = 6
const MAX_PATH_WIDTH = 4
const MAX_PATH_LENGTH = 10
const MIN_ROOM_SIZE = 10
const MAX_ROOM_SIZE = 20

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
    z: 10,
    image: {
        src: './images/brick.png'
    },
}

const Trap = {
    color: 'transparent',
    tags: ['trap'],
    image: {
        src: './images/trap_off.png'
    },

    onLoad: () => {
        loadImageCache('./images/trap_on.png')
    }
}

const Skeleton = {
    color: 'transparent',
    tags: ['enemy', 'skeleton', 'brick'],
    x: 4 * GRID_SIZE,
    y: 4 * GRID_SIZE,
    z: 1,
    width: GRID_SIZE,
    height: GRID_SIZE,
    image: {
        src: './images/skeleton.png'
    },

    movementDelay: 750,
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

            if (current.canMove(current, newPosition)) {
                current.x = newPosition.x
                current.y = newPosition.y
            }
        }, current.movementDelay)

    },

    onPlayermove: current => {
        if (current.nearesPlayer.x > current.x) {
            current.image.flipX = false
        } else {
            current.image.flipX = true
        }
    },

    onUpdate: current => {
        if (current.movementTimeout) return

        const {nearestPlayer, distanceToNearestPlayer} = current.getNearestPlayer(current)

        if (!nearestPlayer || !distanceToNearestPlayer || distanceToNearestPlayer <= 0) return
        current.nearesPlayer = nearestPlayer

        const movements = current.getMovements(current)

        const {movement, newPosition} = current.getBestMovement(current, movements, nearestPlayer, distanceToNearestPlayer)

        if (!movement || !newPosition) return
        current.move(current, movement, newPosition)
    },
}

const Sword = {
    color: 'transparent',
    tags: ['item', 'sword'],
    width: GRID_SIZE/1.5,
    height: GRID_SIZE/1.5,
    image: {
        src: './images/sword.png'
    },

    onUpdate: current => {
        const player = current.player

        current.x = player.x + (current.width * 1.25)
        if (player.image.flipX) {
            current.x = player.x - (current.width - (current.width/4))
            current.image.flipX = true
        } else {
            current.x = player.x + (current.width + (current.width/4))
            current.image.flipX = false
        }

        current.y = player.y + (current.height / 4)
    }
}

const Player = {
    color: 'transparent',
    tags: ['player', 'brick'],
    x: 2 * GRID_SIZE,
    y: 2 * GRID_SIZE,
    z: 2,
    width: GRID_SIZE,
    height: GRID_SIZE,
    image: {
        src: './images/knight.png'
    },

    moved: {
        left: false,
        right: false,
        up: false,
        down: false,
    },

    items: [],

    onLoad: current => {
        const sword = current.scene.instantGameObject({
            ...Sword,
            x: current.x,
            y: current.y,
            z: current.z + 1,
            player: current
        })

        current.items.push(sword)
    },

    onUpdate: current => {
        current.scene.game.camera.setTarget(current, 10)
    },

    canMove: (current, x, y) => {
        const checkGameObjects = current.scene.getGameObjectsByPosition(x, y)

        let move = true

        checkGameObjects.forEach(checkGameObject => {
            if (checkGameObject && checkGameObject.tags.includes('brick')) {
                move = false
            }
        })

        return move
    },

    onKeydown: ({event, current}) => {
        if (current.scene.game.pause) return

        if (event.key == 'w' && !current.moved.up) {
            current.moved.up = true

            if (!current.canMove(current, current.x, current.y - GRID_SIZE)) return

            current.y -= GRID_SIZE
        } else if (event.key == 'a' && !current.moved.left) {
            current.moved.left = true
            current.image.flipX = true

            if (!current.canMove(current, current.x - GRID_SIZE, current.y)) return

            current.x -= GRID_SIZE
        } else if (event.key == 's' && !current.moved.down) {
            current.moved.down = true

            if (!current.canMove(current, current.x, current.y + GRID_SIZE)) return

            current.y += GRID_SIZE
        } else if (event.key == 'd' && !current.moved.right) {
            current.moved.right = true
            current.image.flipX = false

            if (!current.canMove(current, current.x + GRID_SIZE, current.y)) return

            current.x += GRID_SIZE
        }

        current.scene.game.customEvent('playermove')

        const rooms = current.scene.getGameObjectsByTag('room')

        rooms.forEach(room => {
            if (isInside(current, room)) {
                if (room.name == 'mainRoom') return
                if (room.closed) return

                const atPosition = current.scene.getGameObjectsByPosition(current.x, current.y)
                let inTrap = false
                if (atPosition.length > 1) {
                    atPosition.forEach(gameObject => {
                        if (gameObject.tags.includes('trap')) {
                            inTrap = true
                        }
                    })
                }

                if (!inTrap) {
                    room.close(room)
                }
            }
        })
    },

    onKeyup: ({current, event}) => {
        if (event.key == 'w') {
            current.moved.up = false
        } else if (event.key == 'a') {
            current.moved.left = false
        } else if (event.key == 's') {
            current.moved.down = false
        } else if (event.key == 'd') {
            current.moved.right = false
        }
    }
}

const Structure = {
    color: 'transparent',
    tags: ['structure'],

    image: {
        src: './images/32x_slab.png',
        pattern: true,
    },
}

const Path = {
    ...Structure,
    tags: ['structure', 'path'],

    generateMap: (rows, cols) => {
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
    },

    loadTileMap: current => {
        const map = current.generateMap(current.height/GRID_SIZE, current.width/GRID_SIZE)

        if (current.direction && current.direction == 'y') {
            map[0][1] = 0
            map[0][2] = 0
            map[map.length - 1][1] = 0
            map[map.length - 1][2] = 0
        }

        if (current.direction && current.direction == 'x') {
            map[1][0] = 0
            map[2][0] = 0
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
    },
}

const Room = {
    ...Structure,
    tags: ['structure', 'room'],

    left: null,
    right: null,
    up: null,
    down: null,
    closed: false,

    onLoad: current => {
        if (!current.exits) current.exits = []
        if (!current.traps) current.traps = []
    },

    generateMap: (rows, cols) => {
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
    },

    loadTileMap: current => {
        const map = current.generateMap(current.height/GRID_SIZE, current.width/GRID_SIZE)

        try {
            current.exits.forEach(([x, y]) => {
                map[y][x] = 2
            })
        } catch (error) {
            console.error(error);

            current.scene.game.resetScene()

            return
        }

        const tileMapGameObjects = current.scene.instantTileMap({
            x: current.x,
            y: current.y,
            size: GRID_SIZE ,
            tiles: {
                0: null,
                1: {
                    ...Brick,
                    parentGameObjectName: current.name,
                },
                2: {
                    ...Trap,
                    parentGameObjectName: current.name,
                }
            },
            map,
        })

        tileMapGameObjects.forEach(tileMapGameObject => {
            if (tileMapGameObject.tags.includes('trap')) {
                current.traps = [...current.traps, tileMapGameObject]
            }
        })
    },

    close: current => {
        current.closed = true

        current.traps.forEach(trap => {
            trap.tags = [...trap.tags, 'brick']
            trap.setImageSource('./images/trap_on.png')
        })

        current.scene.instantGameObject({
            ...Skeleton,
            x: current.x + (randomIntFromInterval(1, (current.width / GRID_SIZE) - 2) * GRID_SIZE),
            y: current.y + (randomIntFromInterval(1, (current.height / GRID_SIZE) - 2) * GRID_SIZE),
            parentGameObjectName: current.name,
        })
    },
}

const MainScene = {
    maxRooms: ROOMS,
    tileMapsLoaded: false,

    gameObjects: {
        mainRoom: {
            ...Room,
            width: GRID_SIZE * 15,
            height: GRID_SIZE * 15,
        },
        Player: {
            ...Player,
            x: 7 * GRID_SIZE,
            y: 7 * GRID_SIZE,
        }
    },

    onUpdate: current => {
        if (!current.tileMapsLoaded) current.generateRooms(current)

        // console.log(Object.keys(current.gameObjects).length, current.game.currentFPS);
    },

    generateRooms: (current) => {
        const rooms = current.getGameObjectsByTag('room')

        if (rooms.length < current.maxRooms) {
            const randomRoom = randomItemFromArray(rooms)

            current.createRoom(current, randomRoom)
        } else {
            current.tileMapsLoaded = true

            rooms.forEach(room => {
                room.loadTileMap(room)
            })
        }
    },

    createRoom: (current, parentStructure) => {
        let direction = randomItemFromArray(['left', 'right', 'up', 'down'])

        let newRoom = {
            ...Room,
            parentStructure: parentStructure.name,
            x: parentStructure.x,
            y: parentStructure.y,
            exits: []
        }

        newRoom.width = GRID_SIZE * randomIntFromInterval(MIN_ROOM_SIZE, MAX_ROOM_SIZE)
        newRoom.height = GRID_SIZE * randomIntFromInterval(MIN_ROOM_SIZE, MAX_ROOM_SIZE)

        const parentStructureExitY = randomIntFromInterval(1, (parentStructure.height / GRID_SIZE) - 3)
        const parentStructureExitX = randomIntFromInterval(1, (parentStructure.width / GRID_SIZE) - 3)
        const newRoomExitY = randomIntFromInterval(1, (newRoom.height / GRID_SIZE) - 3)
        const newRoomExitX = randomIntFromInterval(1, (newRoom.width / GRID_SIZE) - 3)

        const parentStructureExits = []

        switch (direction) {
            case 'left':
                parentStructureExits.push([0, parentStructureExitY])
                parentStructureExits.push([0, parentStructureExitY + 1])

                newRoom.exits.push([(newRoom.width / GRID_SIZE) - 1, newRoomExitY])
                newRoom.exits.push([(newRoom.width / GRID_SIZE) - 1, newRoomExitY + 1])

                newRoom.x -= newRoom.width
                newRoom.y += (parentStructureExitY - newRoomExitY) * GRID_SIZE
                break;

            case 'right':
                parentStructureExits.push([(parentStructure.width / GRID_SIZE) - 1, parentStructureExitY])
                parentStructureExits.push([(parentStructure.width / GRID_SIZE) - 1, parentStructureExitY + 1])

                newRoom.exits.push([0, newRoomExitY])
                newRoom.exits.push([0, newRoomExitY + 1])

                newRoom.x += parentStructure.width
                newRoom.y += (parentStructureExitY - newRoomExitY) * GRID_SIZE
                break;

            case 'up':
                parentStructureExits.push([parentStructureExitX, 0])
                parentStructureExits.push([parentStructureExitX + 1, 0])

                newRoom.exits.push([newRoomExitX, (newRoom.height / GRID_SIZE) - 1])
                newRoom.exits.push([newRoomExitX + 1, (newRoom.height / GRID_SIZE) - 1])

                newRoom.x += (parentStructureExitX - newRoomExitX) * GRID_SIZE
                newRoom.y -= newRoom.height
                break;

            case 'down':
                parentStructureExits.push([parentStructureExitX, (parentStructure.height / GRID_SIZE) - 1])
                parentStructureExits.push([parentStructureExitX + 1, (parentStructure.height / GRID_SIZE) - 1])

                newRoom.exits.push([newRoomExitX, 0])
                newRoom.exits.push([newRoomExitX + 1, 0])

                newRoom.x += (parentStructureExitX - newRoomExitX) * GRID_SIZE
                newRoom.y += parentStructure.height
                break;

            default:
                return;
        }

        const structures = current.getGameObjectsByTag('structure')

        let collide = false

        Object.values(structures).forEach((structure) => {
            if (structure.name != newRoom.parentStructure) {
                if (isCollide(newRoom, structure)) collide = true
            }
        })

        if (collide) return

        parentStructure.exits = [...parentStructure.exits, ...parentStructureExits]

        current.instantGameObject(newRoom)
    },
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
        else if (event.key == 'z') {
            current.camera.zoom == 1
                ? current.camera.setZoom(0.125)
                : current.camera.setZoom(1)
        }
    },

    onPause: current => {
        current.setCursorVisibility(true)
    },

    onResume: current => {
        current.setCursorVisibility(false)
    }
})

game.run()