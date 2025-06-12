const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('Connection')
}

socket.onclose = event => {
    console.log('Connection closed', event);
};