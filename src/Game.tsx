import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Position = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const TechSnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [trailEffect, setTrailEffect] = useState<Position[]>([]);
  const animationFrameId = useRef<number>();
  const lastUpdateTime = useRef<number>(0);

  const generateFood = useCallback((): Position => {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    return { x, y };
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setTrailEffect([]);
    lastUpdateTime.current = 0;
  };

  const moveSnake = useCallback((timestamp: number) => {
    if (gameOver) return;

    if (!lastUpdateTime.current) {
      lastUpdateTime.current = timestamp;
    }

    const elapsed = timestamp - lastUpdateTime.current;
    if (elapsed < speed) {
      animationFrameId.current = requestAnimationFrame(moveSnake);
      return;
    }

    lastUpdateTime.current = timestamp;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDirection = nextDirection;

      switch (currentDirection) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];
      
      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setFood(generateFood());
        setScore(prev => prev + 10);
        setSpeed(prev => Math.max(prev - 5, 50));
        
        // Add trail effect
        setTrailEffect(prev => [...prev, ...newSnake.slice(0, 3)]);
      } else {
        newSnake.pop();
      }

      setDirection(currentDirection);
      return newSnake;
    });

    animationFrameId.current = requestAnimationFrame(moveSnake);
  }, [food, gameOver, generateFood, nextDirection, speed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': 
          if (direction !== 'DOWN') setNextDirection('UP'); 
          break;
        case 'ArrowDown': 
          if (direction !== 'UP') setNextDirection('DOWN'); 
          break;
        case 'ArrowLeft': 
          if (direction !== 'RIGHT') setNextDirection('LEFT'); 
          break;
        case 'ArrowRight': 
          if (direction !== 'LEFT') setNextDirection('RIGHT'); 
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [direction]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(moveSnake);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [moveSnake]);

  useEffect(() => {
    if (trailEffect.length > 0) {
      const trailTimer = setTimeout(() => {
        setTrailEffect(prev => prev.slice(1));
      }, 300);
      return () => clearTimeout(trailTimer);
    }
  }, [trailEffect]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
        TECH SNAKE
      </h1>
      
      <div className="mb-4 flex items-center gap-8">
        <div className="text-xl font-mono">
          Score: <span className="text-cyan-400">{score}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={resetGame}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-all"
          >
            {gameOver ? 'Play Again' : 'Reset'}
          </button>
        </div>
      </div>

      <div 
        className="relative border-2 border-cyan-400 rounded-md overflow-hidden shadow-lg shadow-cyan-500/20"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          background: 'radial-gradient(circle, rgba(8,47,73,0.5) 0%, rgba(4,12,24,1) 100%)'
        }}
      >
        {/* Food */}
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            left: food.x * CELL_SIZE,
            top: food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
            background: 'radial-gradient(circle, #ff00aa 0%, #ff0066 100%)',
            boxShadow: '0 0 10px #ff00aa, 0 0 20px #ff00aa'
          }}
        />

        {/* Snake segments */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${index === 0 ? 'z-10' : ''}`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              background: index === 0 
                ? 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)' 
                : 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
              boxShadow: index === 0 
                ? '0 0 10px #00d2ff, 0 0 20px #00d2ff' 
                : '0 0 5px #00c6ff',
              transform: index === 0 ? 'scale(1.1)' : 'scale(1)'
            }}
          />
        ))}

        {/* Trail effect */}
        {trailEffect.map((pos, index) => (
          <div
            key={`trail-${index}`}
            className="absolute rounded-sm opacity-70"
            style={{
              left: pos.x * CELL_SIZE,
              top: pos.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
              background: 'radial-gradient(circle, rgba(0,210,255,0.7) 0%, rgba(58,123,213,0.7) 100%)',
              transition: 'all 0.3s ease-out',
              transform: `scale(${1 - index * 0.1})`
            }}
          />
        ))}

        {/* Grid lines */}
        {Array.from({ length: GRID_SIZE }).map((_, i) => (
          <React.Fragment key={`grid-${i}`}>
            <div
              className="absolute opacity-10 bg-cyan-500"
              style={{
                left: 0,
                top: i * CELL_SIZE,
                width: '100%',
                height: 1
              }}
            />
            <div
              className="absolute opacity-10 bg-cyan-500"
              style={{
                left: i * CELL_SIZE,
                top: 0,
                width: 1,
                height: '100%'
              }}
            />
          </React.Fragment>
        ))}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-20">
            <div className="text-center p-6 rounded-lg bg-gray-800 border border-cyan-400">
              <h2 className="text-2xl font-bold mb-4 text-cyan-400">Game Over!</h2>
              <p className="mb-4">Your score: <span className="text-blue-400">{score}</span></p>
              <button
                onClick={resetGame}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-md transition-all"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center">
        <p className="mb-2 text-gray-400">Controls</p>
        <div className="grid grid-cols-3 gap-2 place-items-center">
          <div></div>
          <button 
            className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-all"
            onClick={() => direction !== 'DOWN' && setNextDirection('UP')}
          >
            <ArrowUp className="text-cyan-400" size={24} />
          </button>
          <div></div>
          <button 
            className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-all"
            onClick={() => direction !== 'RIGHT' && setNextDirection('LEFT')}
          >
            <ArrowLeft className="text-cyan-400" size={24} />
          </button>
          <button 
            className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-all"
            onClick={() => direction !== 'UP' && setNextDirection('DOWN')}
          >
            <ArrowDown className="text-cyan-400" size={24} />
          </button>
          <button 
            className="p-3 bg-gray-800 rounded-md hover:bg-gray-700 transition-all"
            onClick={() => direction !== 'LEFT' && setNextDirection('RIGHT')}
          >
            <ArrowRight className="text-cyan-400" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechSnakeGame;
