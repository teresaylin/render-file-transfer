const net = require("net");

/**
 * Home server needs to be able to receive the following messages:
 *
 * From client:
 * - its own port
 */

class Server {
  server;
  clients = new Set();

  constructor() {
    this.server = net.createServer((socket) => {
      socket.pipe(process.stdout);

      socket.on("data", (msg) => {
        // Get client port and send back list of available clients
        const port = Number(msg.toString());
        if (Number.isInteger(port)) {
          this.clients.add(port);
          this.sendClients(port);
        }
      });
    });

    this.server.listen(8000, () => {
      console.log("Home server listening...");
    });
  }

  sendClients(toPort) {
    const clientSocket = net.connect(toPort);
    clientSocket.write(
      `List of clients: ${Array.from(this.clients).toString()}`
    );
  }
}

const homeServer = new Server();
