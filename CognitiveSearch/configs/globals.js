require("dotenv").config();

const globals = {
    Azure: {
        CognitiveSearch: {
            ServiceName: process.env.AZURE_COGNITIVE_SEARCH_SERVICE,
            IndexName: process.env.AZURE_COGNITIVE_SEARCH_INDEX,
            ApiKey: process.env.AZURE_COGNITIVE_SEARCH_API_KEY
        }
    }
}

module.exports = globals;