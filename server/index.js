import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { WritableStream, TransformStream } from "node:stream/web";
import { setTimeout } from "node:timers/promises";
import csvtojson from "csvtojson";

const PORT = 3000;
var itemCounter = 0;

const server = createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "*",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  req.once("close", () => console.log("Conection closed", itemCounter));

  Readable.toWeb(createReadStream("./animeflv.csv"))
    .pipeThrough(Transform.toWeb(csvtojson()))
    .pipeThrough(parseJSON())
    .pipeTo(writeToResponse(res));

  res.writeHead(200, headers);
});

server.on("listening", () => {
  console.log(`Listening on port ${PORT}`);
});

server.on("connect", () => {
  console.log("connected to server...");
});

server.listen(PORT);

function parseJSON() {
  return new TransformStream({
    transform(chunk, controller) {
      const chunkJson = JSON.parse(Buffer.from(chunk));
      const data = {
        title: chunkJson.title,
        description: chunkJson.description,
        urlImage: chunkJson.url_image,
      };
      controller.enqueue(JSON.stringify(data).concat("\n"));
    },
  });
}

function writeToResponse(res) {
  return new WritableStream({
    async write(chunk) {
      await setTimeout(500);
      res.write(chunk);
    },
    close() {
      res.end;
    },
  });
}
