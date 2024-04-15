const GRID_SIZE = 50

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
        src: 'brick.png'
    },
}

const Structure = {
    color: 'transparent',
    tags: ['structure'],
    directions: ['left', 'right', 'up', 'down'],

    onLoad: current => {
        current.scene.instantTileMap({
            x: current.x,
            y: current.y,
            size: 50,
            tiles: {
                0: Slab,
                1: Brick
            },
            map: current.scene.generateMapRoom(current.height/GRID_SIZE, current.width/GRID_SIZE),
        })
    },
}

const MainScene = {
    maxStructures: 20,
    structureIndex: 0,

    gameObjects: {
        mainRoom: {
            ...Structure,
            width: GRID_SIZE * 10,
            height: GRID_SIZE * 10,
            structureIndex: 0,
        },
    },

    onLoad: current => {
        current.game.camera.setZoom(0.125)
    },

    onUpdate: current => {
        const structures = current.getGameObjectsByTag('structure')

        if (structures.length < current.maxStructures) {
            const randomStructure = randomItemFromArray(structures)

            current.createStructure(current, randomStructure)
        }

        const mainRoom = current.getGameObjectByName('mainRoom')
        current.game.camera.setTarget(mainRoom)
    },

    createStructure: (current, structure) => {
        const direction = randomItemFromArray(structure.directions)

        structure.directions = structure.directions.filter(d => d != direction)

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

    scenes: {
        main: MainScene
    },

    onKeydown: ({event, current}) => {
        if (event.key == 'f') current.toggleFullscreen()
    },
})

game.run()