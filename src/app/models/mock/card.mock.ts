import Card from "../card";

const naipes = [
    { nome: "ESPADAS", codigo: "espadas", arquivo: "spanish-swords" },
    { nome: "PAUS", codigo: "paus", arquivo: "spanish-clubs" },
    { nome: "OUROS", codigo: "ouros", arquivo: "spanish-coins" },
    { nome: "COPAS", codigo: "copas", arquivo: "spanish-cups" },
] as const;

const valores = [
    { nome: "1", codigo: "1" },
    { nome: "2", codigo: "2" },
    { nome: "3", codigo: "3" },
    { nome: "4", codigo: "4" },
    { nome: "5", codigo: "5" },
    { nome: "6", codigo: "6" },
    { nome: "7", codigo: "7" },
    { nome: "10 (Sota)", codigo: "10" },
    { nome: "11 (Cavalo)", codigo: "11" },
    { nome: "12 (Rei)", codigo: "12" },
] as const;

export const mockCards: Card[] = naipes.flatMap((naipe) =>
    valores.map((valor, spriteIndex) => ({
        id: `card-${naipe.codigo.toLowerCase()}-${valor.codigo.toLowerCase()}`,
        naipe: naipe.nome,
        valor: valor.nome,
        url: `/assets/cards/sheets/${naipe.arquivo}.png`,
        spriteIndex,
        spriteOffset: `${spriteIndex * -100}%`,
    })),
);

export const mockCard: Card = mockCards[0];
