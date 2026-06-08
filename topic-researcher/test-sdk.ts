import { Exabase } from "@exabase/sdk";

const api = new Exabase({ apiKey: "test" });
console.log(Object.keys(api));
console.log(Object.keys(api.resources || {}));
console.log(Object.keys(api.workers || {}));
console.log(Object.keys(api.bases || {}));
