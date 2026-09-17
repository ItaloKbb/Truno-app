export default interface user{
    id: string;
    name: string;
    email: string;
    url: string;
    coin: coin;
}

interface coin{
    id: string;
    balance: number;
}