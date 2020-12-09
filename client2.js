const Client = require("./client");

let client2;

const [arg1, arg2] = process.argv.slice(2, 4);

/**
 * To start the client, type in terminal:
 * node client2.js [port] [name]
 *
 * example: node client2.js 8002 alice
 */
if (Number.isInteger(Number(arg1))) {
  client2 = new Client(Number(arg1), arg2);
}

/**
 * To initiate a file transfer, type in terminal:
 * transfer [receiver-name] [filename]
 *
 * example: transfer bob missfits-logo.png
 */
process.stdin.on("data", (input) => {
  if (!client2) return;

  const [operation, receiver, file] = input.toString().split(" ");
  if (operation === "transfer") {
    client2.initiateTransfer(receiver, file.trim());
  }
});
