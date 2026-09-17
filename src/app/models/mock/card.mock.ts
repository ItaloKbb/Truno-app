import Card from "../card";

const naipes = [
    { nome: "COPAS", codigo: "H" },
    { nome: "OUROS", codigo: "D" },
    { nome: "PAUS", codigo: "C" },
    { nome: "ESPADAS", codigo: "S" },
] as const;

const valores = [
    { nome: "A", codigo: "A" },
    { nome: "2", codigo: "2" },
    { nome: "3", codigo: "3" },
    { nome: "4", codigo: "4" },
    { nome: "5", codigo: "5" },
    { nome: "6", codigo: "6" },
    { nome: "7", codigo: "7" },
    { nome: "8", codigo: "8" },
    { nome: "9", codigo: "9" },
    { nome: "10", codigo: "10" },
    { nome: "J", codigo: "J" },
    { nome: "Q", codigo: "Q" },
    { nome: "K", codigo: "K" },
] as const;

export const mockCards: Card[] = naipes.flatMap((naipe) =>
    valores.map((valor) => ({
        id: `card-${naipe.codigo.toLowerCase()}-${valor.codigo.toLowerCase()}`,
        naipe: naipe.nome,
        valor: valor.nome,
        url: `/assets/cards/${valor.codigo}${naipe.codigo}.png`,
    })),
);

export const mockCard: Card = mockCards[0];
