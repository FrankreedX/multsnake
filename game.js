function spawnFood(gameState){
    let validCoords = false
    let row = 0
    let col = 0
    mainLoopRow:
        while(!validCoords){
            row = Math.floor(Math.random() * gameState.boardRow)
            col = Math.floor(Math.random() * gameState.boardCol)
            for(let i = 0; i < gameState.snake1.length; i++){
                if(row === gameState.snake1[i][0] && col === gameState.snake1[i][1])
                    continue mainLoopRow
            }
            for(let i = 0; i < gameState.snake2.length; i++){
                if(row === gameState.snake2[i][0] && col === gameState.snake2[i][1])
                    continue mainLoopRow
            }
            validCoords = true
        }
    gameState.food = [row, col]
}

function coordEqual(coord1, coord2){
    return coord1[0] === coord2[0] && coord1[1] === coord2[1]
}

function dirToCoord(gameState, direction, coord){
    let coordinate = JSON.parse(JSON.stringify(coord));
    switch(direction){
        case 0: //up
            coordinate[0]--
            if(coordinate[0] < 0)
                coordinate[0] += gameState.boardRow
            break
        case 1: //left
            coordinate[1]--
            if(coordinate[1] < 0)
                coordinate[1] += gameState.boardCol
            break
        case 2: //down
            coordinate[0]++
            if(coordinate[0] >= gameState.boardRow)
                coordinate[0] -= gameState.boardRow
            break
        case 3: //right
            coordinate[1]++
            if(coordinate[1] >= gameState.boardCol)
                coordinate[1] -= gameState.boardCol
            break
    }
    return coordinate
}

async function mainGameLoop(broacaster, gameState){
    console.log("playing state: ", gameState)
    broacaster.emit('snake update', gameState)
    let alive = true
    while(alive){
        let time = new Date();
        broacaster.emit('input', gameState)
        let nextHead1 = dirToCoord(gameState, gameState.snake1Direction, gameState.snake1[0])
        let nextHead2 = dirToCoord(gameState, gameState.snake2Direction, gameState.snake2[0])
        let gameEndObj = []
        if(coordEqual(nextHead1, nextHead2)){
            gameEndObj.push({'winner': 'tie'})
            console.log('tie. player 1 and player 2 collided')
            broacaster.emit('game ended', gameEndObj)
            return
        } else {
            for (let i = 0; i < gameState.snake1.length; i++) {
                if (coordEqual(nextHead1, gameState.snake1[i])) {
                    gameEndObj.push({'winner': 'player 2', 'reason': 'player 1 collided with itself'})
                    console.log('player 2 wins. player 1 self collided')
                }
                if (coordEqual(nextHead2, gameState.snake1[i])) {
                    gameEndObj.push({'winner': 'player 1', 'reason': 'player 2 collided with player 1'})
                    console.log('player 1 wins. player 2 collided with player 1')
                }
            }
            for (let i = 0; i < gameState.snake2.length; i++) {
                if (coordEqual(nextHead1, gameState.snake2[i])) {
                    gameEndObj.push({'winner': 'player 2', 'reason': 'player 1 collided with player 2'})
                    console.log('player 2 wins. player 1 collided with player 2')
                }
                if (coordEqual(nextHead2, gameState.snake2[i])) {
                    gameEndObj.push({'winner': 'player 1', 'reason': 'player 2 collided with itself'})
                    console.log('player 1 wins. player 2 self collided')
                }
            }
            if(gameEndObj.length === 1) {
                broacaster.emit('game ended', gameEndObj)
                return
            }
            if(gameEndObj.length > 1){
                gameEndObj = [{'winner': 'tie'}]
                console.log('tie. player 1 and player 2 collided at the same time')
                broacaster.emit('game ended', gameEndObj)
                return
            }
        }
        gameState.snake1.unshift(nextHead1)
        gameState.snake2.unshift(nextHead2)
        if(coordEqual(nextHead1, gameState.food)){
            spawnFood(gameState)
            gameState.foodCounter++
        } else {
            gameState.snake1.pop()
        }
        if(coordEqual(nextHead2, gameState.food)){
            spawnFood(gameState)
            gameState.foodCounter++
        } else {
            gameState.snake2.pop()
        }
        time = new Date() - time
        await sleep(1000/(15 + Math.floor(gameState.foodCounter/10)) - time)
        broacaster.emit('snake update', gameState)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    spawnFood: spawnFood,
    play: mainGameLoop,
}
