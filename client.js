const net = require("net");
const fs = require("fs");
const readline = require("readline");

/**
 * Client represents both senders and receivers.
 * Upon creation, the client first registers with the Server in order to send or receive a file from another Client.
 */

class Client {
  server;
  port;
  name;
  clients = {};
  transferSocket;
  transferFile;
  newFile;

  constructor(port, name) {
    this.port = port;
    this.name = name;

    this.server = net.createServer((socket) => {
      socket.on("data", async (chunk) => {
        const msg = chunk.toString();

        if (msg.includes("List of clients: ")) {
          console.log(msg);
          const allClients = {};
          msg
            .split("List of clients: ")[1]
            .split(",")
            .map((clientInfo) => {
              const [name, port] = clientInfo.split(": ");
              allClients[name] = port;
            });
          this.clients = allClients;
        } else if (msg.includes("Transferring file: ")) {
          const [fileName, sender] = msg
            .split("Transferring file: ")[1]
            .split(" from ");

          const [senderName, senderPort] = sender.split(" at ");
          const decision = await this.acceptOrRejectTransfer(
            fileName,
            senderName,
            senderPort
          );

          // accept or reject file transfer
          const replySocket = net.connect(senderPort);
          replySocket.on("ready", () => {
            replySocket.write(decision);
          });

          if (decision === "OK") {
            this.newFile = fs.createWriteStream(`copy-${fileName}`);
          }
        } else if (msg.includes("OK")) {
          this.sendFile();
        } else if (msg.includes("NO")) {
          console.log("Transfer rejected");
          this.transferFile = undefined;
          this.transferSocket = undefined;
        } else {
          this.newFile && this.newFile.write(chunk);
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
      socket.write(`New client: ${port}, ${name}`);
    });
  }

  async acceptOrRejectTransfer(fileName, senderName, senderPort) {
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) =>
      r1.question(
        `Accept ${fileName} from ${senderName} at ${senderPort}?`,
        (ans) => {
          r1.close();
          resolve(ans);
        }
      )
    );
  }

  /**
   *
   * @param {*} receiver name of receiver
   * @param {*} fileName Must exist in same directory as sender
   */
  initiateTransfer(receiver, fileName) {
    if (!Object.keys(this.clients).includes(receiver)) return;

    const socket = net.connect(this.clients[receiver]);
    socket.on("ready", () => {
      socket.write(
        `Transferring file: ${fileName} from ${this.name} at ${this.port}`
      );
    });

    this.transferSocket = socket;
    this.transferFile = fileName;
  }

  sendFile() {
    if (!this.transferSocket || !this.transferFile) return;

    const file = fs.createReadStream(`./${this.transferFile}`);
    file.pipe(this.transferSocket);
    console.log("Transfer complete");
  }
}

module.exports = Client;
