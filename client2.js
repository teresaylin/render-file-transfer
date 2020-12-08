const Client = require("./client");

const client2 = new Client(8002);

setTimeout(() => {
  // wait for client2 to receive list of clients from home server
  client2.initiateTransfer(8001, "missfits-logo.png");
}, [1000]);
