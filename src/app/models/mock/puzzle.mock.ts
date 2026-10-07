import Puzzle from "../puzzle";

export const mockPuzzles: Puzzle[] = [
    {
        id: "puzzle-1",
        title: "Quantos naipes existem em um baralho tradicional?",
        alternativas: ["2", "3", "4", "5"],
        alternativaCorreta: 2,
    },
    {
        id: "puzzle-2",
        title: "Qual destes e um naipe do baralho?",
        alternativas: ["Coroas", "Espadas", "Estrelas", "Luas"],
        alternativaCorreta: 1,
    },
    {
        id: "puzzle-3",
        title: "Quantas cartas possui um baralho tradicional sem curingas?",
        alternativas: ["40", "48", "52", "54"],
        alternativaCorreta: 2,
    },
    {
        id: "puzzle-4",
        title: "Qual carta e representada pela letra K?",
        alternativas: ["Valete", "Dama", "Rei", "As"],
        alternativaCorreta: 2,
    },
    {
        id: "puzzle-5",
        title: "Qual carta e representada pela letra Q?",
        alternativas: ["Dama", "Rei", "Valete", "Curinga"],
        alternativaCorreta: 0,
    },
    {
        id: "puzzle-6",
        title: "Quantas cartas existem em cada naipe?",
        alternativas: ["10", "11", "12", "13"],
        alternativaCorreta: 3,
    },
    {
        id: "puzzle-7",
        title: "Qual destes naipes e vermelho?",
        alternativas: ["Paus", "Espadas", "Copas", "Nenhum"],
        alternativaCorreta: 2,
    },
    {
        id: "puzzle-8",
        title: "Qual carta vem depois do 10 na ordem tradicional?",
        alternativas: ["As", "Valete", "Dama", "Rei"],
        alternativaCorreta: 1,
    },
];

export const mockPuzzle: Puzzle = mockPuzzles[0];
