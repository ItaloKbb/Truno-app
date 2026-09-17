import Skill from "./skill";
import user from "./user";

export default interface round{
    id: string;
    number: number;
    turns: turn[];
    winner: user | null;
    status: "EM_ANDAMENTO" | "FINALIZADO";
}

interface turn{
    id: string;
    player: user;
    card: string;
    skill: Skill | null;
    playertarget: user | null;
}