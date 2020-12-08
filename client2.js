const Client = require("./client");

const client2 = new Client(8002);

client2.connectTo(8001);
