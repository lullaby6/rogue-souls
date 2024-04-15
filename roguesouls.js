const Structure = {
    color: 'rgb(0, 0, 0)',
    width: 50,
    height: 50,
    tags: ['structure'],
    directions: ['left', 'right', 'up', 'down'],

    onCollide({current, target}) {
        if (current.parentStructure && current.parentStructure != target.name && current.name != target.parentStructure) {
            console.log('collide :(', current.parentStructure, target.name);
            current.color = 'red'
        }
    },

    onClick: ({current}) => {
        console.log(current.id);
        // current.color = 'red'
    }
}

const MainScene = {
    maxStructures: 20,

    gameObjects: {
        mainRoom: {
            ...Structure,
            width: randomIntFromInterval(50, 150),
            height: randomIntFromInterval(50, 150)
        }
    },

    onLoad: current => {
        current.game.camera.setZoom(1)
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

    onKeydown: ({event, current}) => {
        
    },

    createStructure: (current, structure) => {
        const direction = randomItemFromArray(structure.directions)

        structure.directions = structure.directions.filter(d => d != direction)

        let newStructure = {
            ...Structure,
            parentStructure: structure.name,    
            x: structure.x,
            y: structure.y,
            color: `rgb(${randomIntFromInterval(0, 255)}, ${randomIntFromInterval(0, 255)}, ${randomIntFromInterval(0, 255)})`,
        }

        newStructure.width = randomIntFromInterval(50, 150)
        newStructure.height = randomIntFromInterval(50, 150)

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

        if (collide) return

        current.instantGameObject(newStructure)
    }
}

const game = new Game({
    backgroundColor: 'gray',
    fps: 60,
    // cursor: true,
    title: 'Rogue Souls',

    scenes: {
        main: MainScene
    },

    onKeydown: ({event, current}) => {
        if (event.key == 'p') current.togglePause()
        else if (event.key == 'r') current.resetScene()
        else if (event.key == 'f') current.toggleFullscreen()
    },

    // onPause: current => {
    //     current.setCursorVisibility(true)
    // },
    // onResume: current => {
    //     current.setCursorVisibility(false)
    // }
})

game.run()