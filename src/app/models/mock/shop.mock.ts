import Shop from "../shop";

export const mockShop: Shop = {
	id: "1",
	name: 'Truno Shop',
    status: true,
    url: "https://tse1.mm.bing.net/th/id/OIP.geSCiJWQs5MSVjoZZmsHaAHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3",
    itens: [
        {
            id: "1",
            name: "Bomb",
            price: 100,
            url: "https://static.vecteezy.com/system/resources/thumbnails/047/759/787/small_2x/a-pixelated-bomb-icon-with-a-lit-wick-arcade-game-symbol-web-icon-bomb-icon-burning-bomb-in-pixel-style-vector.jpg",
            strouphy: true,
            power: "bomb"
        },
        {
            id: "2",
            name: "Block",
            price: 50,
            url: "https://media.istockphoto.com/id/1433060182/vector/pixel-forbidden-sign-illustration.jpg?s=170667a&w=0&k=20&c=6pAP7GroQuddDQWenuvQvERHkHfXXnLfNE-mQ_Bo3YU=",
            strouphy: false,
            power: "block"
        }
    ]
};
