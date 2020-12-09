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
          const [port, name, ip] = msg.split("New client: ")[1].split(", ");

          this.clients[name] = [Number(port), ip];
          this.sendClients();
        }
      });
    });

    this.server.listen(8000, () => {
      console.log("Home server listening...");
    });
  }

  // Broadcasts new clients to all clients
  sendClients() {
    const allClients = Object.entries(this.clients).map(
      ([name, portAndIp]) => `${name}: ${portAndIp[0]}:${portAndIp[1]}`
    );
    Object.values(this.clients).forEach(([port]) => {
      const clientSocket = net.connect(port);
      clientSocket.write(`List of clients: ${allClients}`);
    });
  }
}

const homeServer = new Server();
