import './App.css';
import {useContext, useEffect, useState} from "react";
import {
    addDoc,
    collection,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy
} from "firebase/firestore";
import {db} from "./firebase";


function refreshPage() {
    window.location.reload()
}

function App() {
    const grid = 16
    const defaultSnake = [{x: 8, y: 8}, {x: 8, y: 7}, {x: 8, y: 6}]
    const rows = Array(16).fill(0).map((_, index) => index)
    const cols = Array(16).fill(0).map((_, index) => index)
    const [snake, setSnake] = useState(defaultSnake)
    const [food, setFood] = useState({
        x: Math.ceil(Math.random() * (grid - 1)),
        y: Math.ceil(Math.random() * (grid - 1))
    })
    const [isCollide, setIsCollide] = useState(false)
    const [score, setScore] = useState(0)
    const [scores, setScores] = useState(null)
    const [flag, setFlag] = useState(false)
    const [recordUser, setRecordUser] = useState(null)
    const [user, setUser] = useState(null)
    const [userInput, setUserInput] = useState('')
    const [inp, setInp] = useState(true)

    const directions = {
        left: {x: -1, y: 0},
        right: {x: 1, y: 0},
        up: {x: 0, y: -1},
        down: {x: 0, y: 1}
    }
    const resultObj = {
        user,
        score,
        timestamp: serverTimestamp()

    }

    const [direction, setDirection] = useState(directions.left)

    const createScore = async () => {
        const docRef = await addDoc(collection(db, 'scores'), resultObj)
    }

    function speedSnake(currentScore) {
        if (currentScore > 10 && currentScore <= 20) return 250
        if (currentScore > 20 && currentScore <= 30) return 200
        if (currentScore > 30 && currentScore <= 40) return 150
        if (currentScore > 40) return 100
        return 300
    }

    function collideSnake(snakeArg) {
        const [head] = snakeArg
        const tail = snakeArg.slice(1)

        for (let i = 0; i < tail.length; i++) {
            if (tail[i].x === head.x && tail[i].y === head.y) {
                setIsCollide(true)
                setSnake(defaultSnake)
                createScore()
            }
        }
    }

    function limitCanvas(j) {
        if (j > grid - 1) {
            return 0
        }
        if (j < 0) {
            return grid - 1
        }

        return j
    }

    function getSnake(x, y, snakeXY) {
        for (let i = 0; i < snakeXY.length; i++) {
            if (snakeXY[i].x === x && snakeXY[i].y === y) {
                if (i === 0) return <div className={`h-5 w-5 bg-red-900`}></div>
                return <div className={`h-5 w-5 bg-black`}></div>
            }
        }
    }

    function getFood(x, y, foodArg) {
        if (foodArg.x === x && foodArg.y === y) {
            return <div className={`h-5 w-5 bg-red-900`}></div>
        }
    }

    function snakePosition(snakeArg, directionArg) {
        const [head] = snakeArg
        const newHead = {
            x: limitCanvas(head.x + directionArg.x),
            y: limitCanvas(head.y + directionArg.y)
        }

        if (head.x === food.x && head.y === food.y) {
            setFood({x: Math.ceil(Math.random() * (grid - 1)), y: Math.ceil(Math.random() * (grid - 1))})
            setScore((score !== 0 ? score + 1 : 1))
            setSnake([newHead, ...snake])
        } else {
            setSnake([newHead, ...snake.slice(0, snake.length - 1)])
        }
    }

    let timer
    useEffect(() => {
        if (!isCollide) {
            collideSnake(snake)
            timer = setTimeout(() => {
                setFlag(false)
                snakePosition(snake, direction)
            }, !flag ? speedSnake(score) : speedSnake(score)/2)
        }

    }, [snake, direction])



    useEffect(async () => {
        const setScoresToState = onSnapshot(query(collection(db, 'scores'), orderBy('timestamp', 'desc')), snapshot => {
            const scores = snapshot.docs.map(score => ({...score.data(), id: score.id}))
            setScores(scores.slice(0, 11))
            const record = Math.max(...scores.map(score => score.score))
            if (scores.length > 0) {
                const recordUser = scores.filter(score => score.score === record)[0]
                setRecordUser(recordUser)
            }
        })
        return () => setScoresToState()
    }, [db])


    if (isCollide) return <div className={'flex items-center justify-center h-screen'}>
        <div className={'text-xl'}>
            <div>Your Score</div>
            <div className={'flex justify-center items-center'}>
                <div style={{fontSize: 36}} className={'text-red-900 font-bold'}>{score}</div>
            </div>
            <div>U are died</div>
            <div className={'flex items-center justify-center'}>
                <button className={'bg-blue-500 p-2 rounded-lg'} onClick={() => refreshPage()}>Play!</button>
            </div>
        </div>
    </div>

    if (!user) return <div className={'flex flex-col items-center justify-center h-screen'}>
        <div style={{fontSize: 36}} className={'mb-10'}>Snake</div>
        <div className={'flex flex-col h-24 justify-between text-xl'}>
            <div>
                <input className={'p-2'} placeholder={'Enter Your Name'} onChange={(e) => setUserInput(e.target.value)}
                       type="text"/>
            </div>
            <div className={'flex items-center justify-center'}>
                <button className={'bg-blue-500 p-2 rounded-lg'} onClick={() => setUser(userInput)}>Play!</button>
            </div>
        </div>
    </div>

    return (
        <div className={'h-screen flex items-center justify-center text-gray-500'}>
            <div>
                <div className={'flex justify-center items-center'}>
                    <div style={{fontSize: 36}}
                         className={'text-red-900 font-bold'}>{recordUser ? `${recordUser.score} - ${recordUser.user}` : 0}</div>
                </div>
                <div className={'flex justify-center items-center'}>
                    <div className={'mb-10 text-lg font-bold'}>Record</div>
                </div>
                <div className={'text-black'}>
                    Last 10 Scores:
                </div>
                {scores && scores.length && scores.map(score => (
                    <div>
                        -- {score.score} -- {score.user}
                    </div>
                ))}
            </div>
            <div className={'h-56 w-56 mr-16 '}>
                <div className={'flex justify-center items-center'}>
                    <div style={{fontSize: 36}} className={'text-red-900 font-bold'}>{score}</div>
                </div>
                <div className={'flex justify-center items-center'}>
                    <div className={'mb-10 text-lg font-bold'}>Score</div>
                </div>
                <div className={'flex justify-center items-center'}>
                    <div
                        className={'flex flex-col justify-center items-center text-center font-bold text-lg cursor-pointer text-red-900 h-16 w-16 bg-gray-300'}
                        ><div className={'text-sm text-gray-500'}>Arrow</div> Up
                    </div>
                </div>
                <div className={'flex justify-between'}>
                    <div className={'flex justify-center items-center'}>
                        <div
                            className={'flex flex-col justify-center items-center text-center font-bold text-lg cursor-pointer text-red-900 h-16 w-16 bg-gray-300'}
                            ><div className={'text-sm text-gray-500'}>Arrow</div> Left
                        </div>
                    </div>
                    <div className={'flex justify-center items-center'}>
                        <div
                            className={'flex flex-col justify-center items-center text-center font-bold text-lg cursor-pointer text-red-900 h-16 w-16 bg-gray-300'}
                            ><div className={'text-sm text-gray-500'}>Arrow</div> Right
                        </div>
                    </div>
                </div>
                <div className={'flex justify-center items-center'}>
                    <div className={'flex justify-center items-center'}>
                        <div
                            className={'flex flex-col justify-center text-center items-center font-bold text-lg cursor-pointer text-red-900 h-16 w-16 bg-gray-300'}
                           ><div className={'text-sm text-gray-500'}>Arrow</div> Down
                        </div>
                    </div>
                </div>
                {inp && <div className={'absolute opacity-0'}>
                    <input onBlur={()=>{
                        setInp(false)
                        setTimeout(()=>{
                            setInp(true)
                        },100)
                    }} autoFocus={true} onKeyDown={(e)=>{
                        clearTimeout(timer)
                        setFlag(true)
                        if(e.keyCode === 37) {
                            setDirection(directions.left)
                        }
                        if(e.keyCode === 39) {
                            setDirection(directions.right)
                        }
                        if(e.keyCode === 38) {
                            setDirection(directions.up)
                        }
                        if(e.keyCode === 40) {
                            setDirection(directions.down)
                        }
                    }} className={'p-2'} placeholder={'Enter...'} onChange={(e) => setUserInput(e.target.value)}
                           type="text"/>
                </div>}
            </div>
            {
                rows.map(x => (
                    <div>
                        {
                            cols.map(y => (
                                <div
                                    className={'text-black flex justify-center items-center w-9 h-9 bg-blue-500 border border-gray-700'}>
                                    {getSnake(x, y, snake) || null}
                                    {getFood(x, y, food) || null}
                                </div>

                            ))
                        }
                    </div>
                ))
            }
        </div>
    );
}

export default App;