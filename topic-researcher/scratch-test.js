const apiKey = "4bcfa103-0aeb-43ae-86ce-236d7b4b564b";

async function test() {
  const headers = new Headers();
  headers.set("X-Api-Key", apiKey);
  headers.set("Content-Type", "application/json");

  const res = await fetch("https://api.exabase.io/v2/bases", {
    method: "GET",
    headers,
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}

test();
