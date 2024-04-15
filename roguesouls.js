const Structure = {
    color: 'black',
    tags: ['structure'],

    width: 50,
    height: 50,

    onLoad: current => {
        current.width = randomIntInInterval(50, 250)
        current.height = randomIntInInterval(50, 250)
    }
}

const MainScene = {
    rooms: 10,

    gameObjects: {
        mainRoom: Structure
    },

    onLoad: current => {
        const mainRoom = current.getGameObjectByName('mainRoom')

        current.createStructure(current)
    },

    onUpdate: current => {
        current.game.camera.setTarget(0, 0)
    },

    onKeydown: ({event, current}) => {
        
    },

    createStructure: current => {
        const directions = ['left', 'right', 'up', 'down']
        const direction = randomItemFromArray(directions)

        const mainRoom = current.getGameObjectByName('mainRoom')

        switch (direction) {
            case 'right':
                current.instantGameObject({
                    ...Structure,
                    width: randomIntInInterval(50, 250),
                    height: randomIntInInterval(50, 250),
                    x: mainRoom.x + mainRoom.width,
                })
                break;
            case 'left':
                current.instantGameObject({
                    ...Structure,
                    width: randomIntInInterval(50, 250),
                    height: randomIntInInterval(50, 250),
                    x: mainRoom.x - Structure.width,
                })
                break;
            case 'up':
                current.instantGameObject({
                    ...Structure,
                    width: randomIntInInterval(50, 250),
                    height: randomIntInInterval(50, 250),
                    y: mainRoom.y - Structure.height,
                })
                break;
            case 'down':
                current.instantGameObject({
                    ...Structure,
                    width: randomIntInInterval(50, 250),
                    height: randomIntInInterval(50, 250),
                    y: mainRoom.y + mainRoom.height,
                })
                break;
            default:
                break;
        }
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