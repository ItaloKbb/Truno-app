import Skill from "../skill";

export const mockSkills: Skill[] = [
    {
        id: "skill-1",
        name: "Block",
        description: "Impede a proxima jogada do adversario.",
        type: "DEFESA",
        naipe: "OUROS",
        valor: "K",
    },
    {
        id: "skill-2",
        name: "Bomb",
        description: "Remove uma carta aleatoria da mao do adversario.",
        type: "ATAQUE",
        naipe: "ESPADAS",
        valor: "A",
    },
    {
        id: "skill-3",
        name: "Shield",
        description: "Protege o jogador do proximo efeito negativo.",
        type: "DEFESA",
        naipe: "COPAS",
        valor: "Q",
    },
    {
        id: "skill-4",
        name: "Steal",
        description: "Rouba uma carta aleatoria da mao do adversario.",
        type: "ATAQUE",
        naipe: "PAUS",
        valor: "J",
    },
    {
        id: "skill-5",
        name: "Draw",
        description: "Permite comprar duas cartas adicionais.",
        type: "SUPORTE",
        naipe: "COPAS",
        valor: "10",
    },
    {
        id: "skill-6",
        name: "Swap",
        description: "Troca uma carta da sua mao por uma do adversario.",
        type: "CONTROLE",
        naipe: "OUROS",
        valor: "9",
    },
    {
        id: "skill-7",
        name: "Reverse",
        description: "Inverte a ordem dos turnos da rodada.",
        type: "CONTROLE",
        naipe: "PAUS",
        valor: "8",
    },
    {
        id: "skill-8",
        name: "Double",
        description: "Duplica os pontos recebidos ao vencer a rodada.",
        type: "SUPORTE",
        naipe: "ESPADAS",
        valor: "7",
    },
];

export const mockSkill: Skill = mockSkills[0];
