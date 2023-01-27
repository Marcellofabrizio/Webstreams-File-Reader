const API_URL = "http://localhost:3000";

async function consumeApi(signal) {
  const response = await fetch(API_URL, {
    signal,
  });

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(parserJSON());

  return reader;
}

function addToHtml(element) {
  return new WritableStream({
    write({ title, description, urlAnime }) {
      element.innerHTML += `<article>
      <div class="text">
        <h3>[${++itemCounter}] ${title}</h3>
        <p>${description.slice(0, 100)}</p>
        <a href="${urlAnime}">Here's why</a>
      </div>
    </article>`;
    },
    abort(reason) {
      console.log(reason);
    },
  });
}

function parserJSON() {
  let buffer = "";
  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      const items = buffer.split("\n");

      items.slice(0, -1).forEach((item) => {
        controller.enqueue(JSON.parse(item));
      });

      buffer = items[items.length - 1];
    },
    flush(controller) {
      if (!buffer) {
        return;
      }

      controller.enqueue(JSON.parse(buffer));
    },
  });
}

var itemCounter = 0;
const [start, stop, cards] = ["start", "stop", "cards"].map((item) =>
  document.getElementById(item)
);

let abortController = new AbortController();

start.addEventListener("click", async () => {
  const reader = await consumeApi(abortController.signal);
  reader.pipeTo(addToHtml(cards));
});

stop.addEventListener("click", async () => {
  abortController.abort();
  abortController = new AbortController();
  console.log("Stopped fetching new elements");
});
