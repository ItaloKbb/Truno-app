export default interface Shop {
    id: string;
    name: string;
    status: boolean
    itens: Item[];
    url: string;
    
}

interface Item {
    id: string;
    name: string;
    price: number;
    url: string;
    strouphy: boolean;
    power: "bomb" | "block";
}