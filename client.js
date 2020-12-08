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

  constructor(port) {
    this.port = port;

    this.server = net.createServer((socket) => {
      socket.pipe(process.stdout);

      const newFile = fs.createWriteStream("newFile.png");

      socket.on("data", (chunk) => {
        newFile.write(chunk);
      });
    });

    console.log("client listening");
    this.server.listen(port);

    // connect to home server
    const socket = net.connect(8000);
    socket.write(port.toString());

    // get clients
  }

  connectTo(receiver) {
    const socket = net.connect(receiver);
    const file = fs.createReadStream("./missfits-logo.png");
    file.pipe(socket);
  }
}

module.exports = Client;
