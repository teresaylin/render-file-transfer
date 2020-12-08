const net = require("net");

const fs = require("fs");

/**
 * Client needs to be able to receive the following messages:
 *
 * From server:
 * - list of receivers
 *
 * From sender:
 * - initiating file transfer
 *
 * From receiver:
 * - accept/reject file transfer?
 *
 */

class Client {
  server;
  port;
  clients = [];
  transferSocket;

  constructor(port) {
    this.port = port;

    this.server = net.createServer((socket) => {
      socket.pipe(process.stdout);

      let newFile;

      socket.on("data", (chunk) => {
        const msg = chunk.toString();

        if (msg.includes("List of clients: ")) {
          const allClients = msg
            .split("List of clients: ")[1]
            .split(",")
            .map((clientPortStr) => Number(clientPortStr));
          this.clients = allClients;
        } else if (msg.includes("Transferring file: ")) {
          const [fileName, senderPort] = msg
            .split("Transferring file: ")[1]
            .split(" from ");

          // accept or reject file transfer
          const replySocket = net.connect(senderPort);
          replySocket.on("ready", () => {
            replySocket.write("OK");
          });

          newFile = fs.createWriteStream(`copy-${fileName}`);
        } else if (msg.includes("OK")) {
          this.sendFile();
        } else {
          newFile.write(chunk);
        }
      });

      socket.on("error", (error) => {
        socket.end("Goodbye!");
      });
    });

    this.server.listen(port, () => {
      console.log("Client server listening...");
    });

    // connect to home server and send port
    const socket = net.connect(8000);
    socket.on("ready", () => {
      console.log("Socket to home server ready");
      socket.write(port.toString());
    });
  }

  /**
   *
   * @param {*} receiver
   * @param {*} fileName Must exist in same directory as sender
   */
  initiateTransfer(receiver, fileName) {
    if (!this.clients.includes(receiver)) return;

    const socket = net.connect(receiver);
    socket.on("ready", () => {
      socket.write(`Transferring file: ${fileName} from ${this.port}`);
    });

    this.transferSocket = socket;
    this.transferFile = fileName;
  }

  sendFile() {
    const file = fs.createReadStream(`./${this.transferFile}`);
    file.pipe(this.transferSocket);
  }
}

module.exports = Client;
