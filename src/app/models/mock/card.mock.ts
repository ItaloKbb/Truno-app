import Card from "../card";

const naipes = [
    { nome: "ESPADAS", codigo: "espadas" },
    { nome: "BASTOS", codigo: "bastos" },
    { nome: "OUROS", codigo: "oros" },
    { nome: "COPAS", codigo: "copas" },
] as const;

const valores = [
    { nome: "1", codigo: "01" },
    { nome: "2", codigo: "02" },
    { nome: "3", codigo: "03" },
    { nome: "4", codigo: "04" },
    { nome: "5", codigo: "05" },
    { nome: "6", codigo: "06" },
    { nome: "7", codigo: "07" },
    { nome: "10 (Sota)", codigo: "10" },
    { nome: "11 (Cavalo)", codigo: "11" },
    { nome: "12 (Rei)", codigo: "12" },
] as const;

export const mockCards: Card[] = naipes.flatMap((naipe) =>
    valores.map((valor) => ({
        id: `card-${naipe.codigo.toLowerCase()}-${valor.codigo.toLowerCase()}`,
        naipe: naipe.nome,
        valor: valor.nome,
        url: `/assets/cards/${valor.codigo}-${naipe.codigo}.png`,
    })),
);

export const mockCard: Card[] = mockCards;
