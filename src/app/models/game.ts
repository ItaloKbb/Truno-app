import Card from "./card";
import round from "./round";
import user from "./user";

export default interface Game {
    id: string;
    name: string;
    players: player[];
    rounds: round[];
    status: "PENDENTE" | "EM_ANDAMENTO" | "FINALIZADO";
    winner: user | null;
}

interface player{
    cards: Card[];
    user: user;
    effect: string | null;
    trouphies: number;
}