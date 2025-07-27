require("dotenv").config({ path: "./src/.env" });

const app = require("./app.js");

const port = process.env.PORT || 8000;

console.log("SUPABASE URL:", process.env.SUPABASE_URL);
console.log("SUPABASE KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);
