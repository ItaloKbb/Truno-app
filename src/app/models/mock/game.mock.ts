import Game from "../game";

const playerOne = {
    id: "user-1",
    name: "Ana",
    email: "ana@example.com",
    url: "https://i.pravatar.cc/150?img=47",
    coin: {
        id: "coin-1",
        balance: 250,
    },
};

const playerTwo = {
    id: "user-2",
    name: "Bruno",
    email: "bruno@example.com",
    url: "https://i.pravatar.cc/150?img=12",
    coin: {
        id: "coin-2",
        balance: 180,
    },
};

export const mockGame: Game = {
    id: "game-1",
    name: "Partida entre amigos",
    players: [
        {
            user: playerOne,
            cards: [
                {
                    id: "card-1",
                    naipe: "COPAS",
                    valor: "1",
                    url: "/assets/cards/01-copas.png",
                },
                {
                    id: "card-2",
                    naipe: "ESPADAS",
                    valor: "7",
                    url: "/assets/cards/07-espadas.png",
                },
            ],
            effect: null,
            trouphies: 2,
        },
        {
            user: playerTwo,
            cards: [
                {
                    id: "card-3",
                    naipe: "OUROS",
                    valor: "12",
                    url: "/assets/cards/12-oros.png",
                },
                {
                    id: "card-4",
                    naipe: "BASTOS",
                    valor: "5",
                    url: "/assets/cards/05-bastos.png",
                },
            ],
            effect: "block",
            trouphies: 1,
        },
    ],
    rounds: [
        {
            id: "round-1",
            number: 1,
            turns: [
                {
                    id: "turn-1",
                    player: playerOne,
                    card: "card-1",
                    skill: null,
                    playertarget: null,
                },
                {
                    id: "turn-2",
                    player: playerTwo,
                    card: "card-3",
                    skill: {
                        id: "skill-1",
                        name: "Block",
                        description: "Impede a proxima jogada do adversario.",
                        type: "DEFESA",
                        naipe: "OUROS",
                        valor: "12",
                    },
                    playertarget: playerOne,
                },
            ],
            winner: null,
            status: "EM_ANDAMENTO",
        },
    ],
    status: "EM_ANDAMENTO",
    winner: null,
};
