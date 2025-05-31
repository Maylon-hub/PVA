import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App component
const App = () => {
    // Game states
    const [money, setMoney] = useState(0); // Player's current money
    const [currentRoom, setCurrentRoom] = useState('livingRoom'); // Current room the player is in
    const [message, setMessage] = useState('Você perdeu tudo nas apostas. Precisa de mais dinheiro!'); // Game messages
    const [gameOver, setGameOver] = useState(false); // Game over state
    const [gameStarted, setGameStarted] = useState(false); // Game started state
    const [qteActive, setQteActive] = useState(false); // Quick Time Event active state
    const [qteKey, setQteKey] = useState(''); // Key to press for QTE
    const [qteSuccess, setQteSuccess] = useState(false); // QTE success state
    const [qteTimer, setQteTimer] = useState(0); // QTE timer
    const [familyDetected, setFamilyDetected] = useState(false); // Family detection state
    const [familyLocation, setFamilyLocation] = useState('bedroom'); // Family member's current location
    const [caughtCount, setCaughtCount] = useState(0); // How many times the player has been caught
    const maxCaught = 3; // Max times allowed to be caught before game over

    // Game configuration
    const targetMoney = 100; // Money needed to "win" (place another bet)
    const qteDuration = 1500; // QTE duration in ms
    const familyMoveInterval = 5000; // How often family moves in ms

    // Room and item data
    const rooms = {
        livingRoom: {
            name: 'Sala de Estar',
            items: {
                sofa: { name: 'Sofá', value: 5, found: false, description: 'Um sofá velho e empoeirado. Talvez haja algo entre as almofadas.' },
                tv: { name: 'TV', value: 0, found: false, description: 'A TV está ligada. Ninguém está assistindo.' },
            },
            exits: ['kitchen', 'bedroom'],
        },
        kitchen: {
            name: 'Cozinha',
            items: {
                cookieJar: { name: 'Pote de Biscoitos', value: 2, found: false, description: 'Um pote de biscoitos vazio. Que decepção.' },
                fridge: { name: 'Geladeira', value: 0, found: false, description: 'Cheia de sobras. Nenhuma nota de dinheiro aqui.' },
            },
            exits: ['livingRoom'],
        },
        bedroom: {
            name: 'Quarto do Casal',
            items: {
                nightstand: { name: 'Mesa de Cabeceira', value: 10, found: false, description: 'Pode haver algum trocado aqui.' },
                wardrobe: { name: 'Guarda-roupa', value: 0, found: false, description: 'Cheio de roupas velhas.' },
                wifePurse: { name: 'Bolsa da Esposa', value: 30, found: false, description: 'A bolsa da sua esposa. Um risco alto, mas uma recompensa maior.' },
            },
            exits: ['livingRoom', 'kidsRoom', 'bathroom'],
        },
        kidsRoom: {
            name: 'Quarto das Crianças',
            items: {
                piggyBank: { name: 'Cofre do Porquinho', value: 20, found: false, description: 'O cofre do porquinho das crianças. Que dilema moral...' },
                toyBox: { name: 'Caixa de Brinquedos', value: 0, found: false, description: 'Brinquedos espalhados por todo lado.' },
            },
            exits: ['bedroom'],
        },
        bathroom: {
            name: 'Banheiro',
            items: {
                medicineCabinet: { name: 'Armário de Remédios', value: 0, found: false, description: 'Apenas remédios e produtos de higiene.' },
            },
            exits: ['bedroom'],
        },
    };

    // Ref for QTE timer
    const qteTimerRef = useRef(null);

    // Function to start the game
    const startGame = () => {
        setMoney(0);
        setCurrentRoom('livingRoom');
        setMessage('Você perdeu tudo nas apostas. Precisa de mais dinheiro!');
        setGameOver(false);
        setGameStarted(true);
        setQteActive(false);
        setQteSuccess(false);
        setFamilyDetected(false);
        setCaughtCount(0);
        // Randomize initial family location
        const roomKeys = Object.keys(rooms);
        setFamilyLocation(roomKeys[Math.floor(Math.random() * roomKeys.length)]);
    };

    // Function to move to a new room
    const moveToRoom = (roomName) => {
        if (!gameStarted || gameOver || qteActive) return;
        if (rooms[currentRoom].exits.includes(roomName)) {
            setCurrentRoom(roomName);
            setMessage(`Você está na ${rooms[roomName].name}.`);
            // Check if family is in the new room
            if (familyLocation === roomName) {
                setMessage('Cuidado! Alguém da família está aqui!');
                setFamilyDetected(true);
            } else {
                setFamilyDetected(false);
            }
        } else {
            setMessage('Você não pode ir para lá daqui.');
        }
    };

    // Function to handle item interaction
    const interactWithItem = (itemName) => {
        if (!gameStarted || gameOver || qteActive) return;

        const item = rooms[currentRoom].items[itemName];
        if (!item || item.found) {
            setMessage(`Você já pegou o que tinha no ${item ? item.name : 'este item'}.`);
            return;
        }

        setMessage(`Você está investigando o ${item.name}...`);

        // If family is detected in the room, trigger QTE
        if (familyDetected) {
            setMessage(`Alguém está por perto! Pressione "${qteKey}" para não ser pego!`);
            startQTE();
        } else {
            // If no family, directly get money
            setMoney(prevMoney => prevMoney + item.value);
            // Mark item as found
            rooms[currentRoom].items[itemName].found = true;
            setMessage(`Você encontrou $${item.value} no ${item.name}! Total: $${money + item.value}`);
            // Check for win condition
            if (money + item.value >= targetMoney) {
                setGameOver(true);
                setMessage(`Parabéns! Você conseguiu $${targetMoney} para fazer outra aposta... Que vergonha!`);
            }
        }
    };

    // Function to start a Quick Time Event
    const startQTE = useCallback(() => {
        const possibleKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', 'ç']; // Brazilian keyboard layout
        const randomKey = possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
        setQteKey(randomKey);
        setQteActive(true);
        setQteSuccess(false);
        setQteTimer(qteDuration);

        // Clear any existing timer
        if (qteTimerRef.current) {
            clearInterval(qteTimerRef.current);
        }

        // Set up the countdown timer
        qteTimerRef.current = setInterval(() => {
            setQteTimer(prev => {
                if (prev <= 0) {
                    clearInterval(qteTimerRef.current);
                    setQteActive(false);
                    setMessage('Tempo esgotado! Você foi pego!');
                    handleCaught();
                    return 0;
                }
                return prev - 100;
            });
        }, 100);
    }, [qteDuration]);

    // Function to handle QTE key press
    const handleQTEKeyPress = useCallback((event) => {
        if (qteActive && event.key.toLowerCase() === qteKey) {
            clearInterval(qteTimerRef.current);
            setQteActive(false);
            setQteSuccess(true);
            setMessage('Ufa! Você escapou por pouco!');
        } else if (qteActive && event.key.toLowerCase() !== qteKey) {
            clearInterval(qteTimerRef.current);
            setQteActive(false);
            setQteSuccess(false);
            setMessage('Tecla errada! Você foi pego!');
            handleCaught();
        }
    }, [qteActive, qteKey]);

    // Function to handle being caught by family
    const handleCaught = useCallback(() => {
        setCaughtCount(prev => prev + 1);
        if (caughtCount + 1 >= maxCaught) {
            setGameOver(true);
            setMessage(`Você foi pego ${maxCaught} vezes! Sua família descobriu tudo. Fim de jogo.`);
        } else {
            setMessage(`Você foi pego! Cuidado! Você foi pego ${caughtCount + 1} de ${maxCaught} vezes.`);
        }
    }, [caughtCount, maxCaught]);

    // Effect for handling QTE key listener
    useEffect(() => {
        if (qteActive) {
            window.addEventListener('keydown', handleQTEKeyPress);
        } else {
            window.removeEventListener('keydown', handleQTEKeyPress);
        }
        return () => {
            window.removeEventListener('keydown', handleQTEKeyPress);
            if (qteTimerRef.current) {
                clearInterval(qteTimerRef.current);
            }
        };
    }, [qteActive, handleQTEKeyPress]);

    // Effect for family movement
    useEffect(() => {
        if (!gameStarted || gameOver) return;

        const moveFamily = setInterval(() => {
            const roomKeys = Object.keys(rooms);
            let newFamilyLocation;
            do {
                newFamilyLocation = roomKeys[Math.floor(Math.random() * roomKeys.length)];
            } while (newFamilyLocation === currentRoom); // Don't move family to player's current room randomly

            setFamilyLocation(newFamilyLocation);
            // console.log(`Family moved to: ${rooms[newFamilyLocation].name}`); // For debugging
        }, familyMoveInterval);

        return () => clearInterval(moveFamily);
    }, [gameStarted, gameOver, currentRoom, familyMoveInterval, rooms]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700 text-white font-inter flex flex-col items-center justify-center p-4">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />

            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-2xl w-full text-center border-4 border-gray-600">
                <h1 className="text-4xl font-bold mb-6 text-yellow-400">O Vício do Papai</h1>
                <p className="text-lg mb-6 text-gray-300">Um simulador satírico de vício em apostas.</p>

                {!gameStarted ? (
                    <button
                        onClick={startGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Começar Jogo
                    </button>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="text-xl font-semibold text-blue-400">Dinheiro: ${money}</p>
                            <p className="text-xl font-semibold text-red-400">Pego {caughtCount} de {maxCaught} vezes</p>
                            <p className="text-lg text-gray-300 mt-2">{message}</p>
                        </div>

                        {gameOver ? (
                            <div className="bg-red-700 p-4 rounded-md mb-6">
                                <p className="text-2xl font-bold text-white">{message}</p>
                                <button
                                    onClick={startGame}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out"
                                >
                                    Jogar Novamente
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 bg-gray-700 p-4 rounded-md border border-gray-600">
                                    <h2 className="text-2xl font-bold mb-4 text-purple-300">Você está na {rooms[currentRoom].name}</h2>
                                    {familyDetected && (
                                        <p className="text-red-500 font-bold animate-pulse">
                                            🚨 ALERTA: Membro da família detectado nesta sala! 🚨
                                        </p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(rooms[currentRoom].items).map(([key, item]) => (
                                            <button
                                                key={key}
                                                onClick={() => interactWithItem(key)}
                                                disabled={item.found || qteActive}
                                                className={`p-3 rounded-lg transition duration-200 ease-in-out ${item.found ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                                            >
                                                <span className="font-semibold">{item.name}</span>
                                                <span className="block text-sm text-gray-200">{item.description}</span>
                                                {item.value > 0 && !item.found && <span className="block text-xs text-yellow-200">Valor: ${item.value}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-6 bg-gray-700 p-4 rounded-md border border-gray-600">
                                    <h2 className="text-2xl font-bold mb-4 text-green-300">Sair para:</h2>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {rooms[currentRoom].exits.map((exitRoom) => (
                                            <button
                                                key={exitRoom}
                                                onClick={() => moveToRoom(exitRoom)}
                                                disabled={qteActive}
                                                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-full shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                            >
                                                {rooms[exitRoom].name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {qteActive && (
                                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                                        <div className="bg-yellow-500 p-8 rounded-lg shadow-2xl text-center border-4 border-yellow-300 animate-pulse">
                                            <h3 className="text-3xl font-bold text-gray-900 mb-4">EVENTO DE TEMPO RÁPIDO!</h3>
                                            <p className="text-5xl font-extrabold text-red-700 mb-6">Pressione "{qteKey.toUpperCase()}"!</p>
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div
                                                    className="bg-green-600 h-4 rounded-full transition-all duration-100 ease-linear"
                                                    style={{ width: `${(qteTimer / qteDuration) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-lg text-gray-800 mt-2">Tempo restante: {(qteTimer / 1000).toFixed(1)}s</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default App;
