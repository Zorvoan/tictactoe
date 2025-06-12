const WebSocket = require('ws');
const webSocketServer = new WebSocket.Server({ port: 8080 });

let players = [];

console.info("Server started\n--------------\n");

webSocketServer.on('connection', webSocket => {
    if (players.length >= 2) {
        console.log("More than 2 users not allowed!");
        webSocket.close();
        return;
    }

    console.log(`User ${players.length + 1} connected`);
    players.push(webSocket);

    if (players.length === 2) {
        console.log("\nBoth users connected\nGame starting\n--------------------");
        players[0].send('start:X');
        players[1].send('start:O');
    }


    // Kdyz nekdo posle zpravu pres WebSocket, spusti se tento kod
    webSocket.on('message', message => {

        // Vypise prijatou zpravu do konzole, jen pro kontrolu
        console.log(`WS message: ${message}`);

        // Kdyz zprava je presne "reset", udela se restart hry
        if (message.toString() === 'reset') {

            // Pokud jsou pripojeni presne dva hraci, pokracujeme
            if (players.length === 2) {

                // Prohodime hrace – ten co byl prvni, bude druhy a naopak
                [players[0], players[1]] = [players[1], players[0]];

                // Prvnimu hraci posleme, ze hraje za "X"
                players[0].send('start:X');

                // Druhemu hraci posleme, ze hraje za "O"
                players[1].send('start:O');
            }

            // Kazdemu hraci (oba dva) posleme zpravu "reset"
            players.forEach((client) => {
                // Posleme to jen tem, co jsou pripojeni
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reset');
                }
            });

            // Ukoncime zpracovani, dal uz se nic nedeje
            return;
        }

        // Pokud zprava neni "reset", posleme ji druhemu hraci
        players.forEach((client) => {
            // Posleme to kazdemu, kdo neni ten, co zpravu poslal
            // a kdo je pripojeny
            if (client !== webSocket && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });


    webSocket.on('close', () => {
        console.log("User disconnected");
        players = players.filter(client => client !== webSocket);
    });
});
