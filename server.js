const net = require("net");

/**
 * Server that keeps track of Clients (names and ports)
 */

class Server {
  server;
  clients = {};

  constructor() {
    this.server = net.createServer((socket) => {
      socket.on("data", (d) => {
        const msg = d.toString();

        if (msg.includes("New client: ")) {
          const [port, name] = msg.split("New client: ")[1].split(", ");

          this.clients[name] = Number(port);
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
      `List of clients: ${Object.entries(this.clients).map(
        ([name, port]) => `${name}: ${port}`
      )}`
    );
  }
}

const homeServer = new Server();
