const net = require("net");
const fs = require("fs");
const readline = require("readline");
const { networkInterfaces } = require("os");

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
  ip;

  constructor(port, name) {
    this.port = port;
    this.name = name;
    this.getIP();

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
              const [name, portAndIp] = clientInfo.split(": ");
              const [port, ip] = portAndIp.split(":");
              allClients[name] = [port, ip];
            });
          this.clients = allClients;
        } else if (msg.includes("Transferring file: ")) {
          const [fileName, sender] = msg
            .split("Transferring file: ")[1]
            .split(" from ");

          const [senderName, senderIpAndPort] = sender.split(" at ");
          const [senderIp, senderPort] = senderIpAndPort.split(":");
          const decision = await this.acceptOrRejectTransfer(
            fileName,
            senderName,
            senderIp,
            senderPort
          );

          // accept or reject file transfer
          const replySocket = net.connect(senderPort, senderIp);
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
          // this must be a file transfer
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
      socket.write(`New client: ${this.port}, ${this.name}, ${this.ip}`);
    });
  }

  getIP() {
    const nets = networkInterfaces();
    const { en0 } = nets;
    let ip;
    en0.forEach((net) => {
      if (net.family === "IPv4" && !net.internal) ip = net.address;
    });
    this.ip = ip;
  }

  /**
   * Prompts user to accept or reject the incoming file.
   * @param {*} fileName Name of the file being transferred
   * @param {*} senderName Name of the sender
   * @param {*} senderIp IP address of the sender
   * @param {*} senderPort Port of the sender
   */
  async acceptOrRejectTransfer(fileName, senderName, senderIp, senderPort) {
    const r1 = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) =>
      r1.question(
        `Accept ${fileName} from ${senderName} at ${senderIp}:${senderPort}? Reply with OK or NO: `,
        (ans) => {
          r1.close();
          resolve(ans);
        }
      )
    );
  }

  /**
   * Initiates file transfer but does not actually transfer the file.
   * @param {*} receiver name of receiver
   * @param {*} fileName Must exist in same directory as sender
   */
  initiateTransfer(receiver, fileName) {
    if (!Object.keys(this.clients).includes(receiver)) return;

    const [port, ip] = this.clients[receiver];
    const socket = net.connect(port, ip);
    socket.on("ready", () => {
      socket.write(
        `Transferring file: ${fileName} from ${this.name} at ${this.ip}:${this.port}`
      );
    });

    this.transferSocket = socket;
    this.transferFile = fileName;
  }

  /**
   * Sends the file upon receipt of user confirmation.
   */
  sendFile() {
    if (!this.transferSocket || !this.transferFile) return;

    const file = fs.createReadStream(`./${this.transferFile}`);
    file.pipe(this.transferSocket);
    console.log("Transfer complete");
  }
}

module.exports = Client;
