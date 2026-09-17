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
                    valor: "A",
                    url: "/assets/cards/ace-of-hearts.png",
                },
                {
                    id: "card-2",
                    naipe: "ESPADAS",
                    valor: "7",
                    url: "/assets/cards/seven-of-spades.png",
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
                    valor: "K",
                    url: "/assets/cards/king-of-diamonds.png",
                },
                {
                    id: "card-4",
                    naipe: "PAUS",
                    valor: "5",
                    url: "/assets/cards/five-of-clubs.png",
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
                        valor: "K",
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
