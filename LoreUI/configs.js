require("dotenv").config();
const configs = {
    Session: {
        Secret: process.env.SESSION_SECRET
    },
    ConnectionStrings: {
        MongoDB: process.env.CONNECTION_STRING_MONGODB
    },
    OpenAI: {
        OrganizationId: process.env.OPENAI_ORG_ID,
        APIKey: process.env.OPENAI_API_KEY,
        Model: "gpt-4" // 8k model, WAITING FOR -32k
    }
}
module.exports = configs;