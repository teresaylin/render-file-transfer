const net = require("net");

/**
 * Home server needs to be able to receive the following messages:
 *
 * From client:
 * - its own port
 * - request to get clients
 *
 */

class Server {
  server;
  clients = [];

  constructor() {
    this.server = net.createServer((socket) => {
      socket.pipe(process.stdout);

      socket.on("data", (msg) => {
        console.log("got data: ", msg.toString());
        const port = Number(msg.toString());
        if (Number.isInteger(port)) {
          this.clients.push(port);
        }
      });
    });

    this.server.listen(8000);
    console.log("listening");
  }
}

const homeServer = new Server();
