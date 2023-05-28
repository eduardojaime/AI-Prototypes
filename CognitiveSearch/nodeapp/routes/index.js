var express = require("express");
const axios = require("axios");
const configs = require("../configs/globals");
var router = express.Router();



/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Azure Cognitive Search" });
});

router.post("/", async (req, res, next) => {
  let searchQuery = req.body.query;
  console.log("Searching for " + searchQuery);

  const config = {
    method: "get",
    url: `https://${configs.Azure.CognitiveSearch.ServiceName}.search.windows.net/indexes/${configs.Azure.CognitiveSearch.IndexName}/docs?api-version=2021-04-30-Preview&search=${searchQuery}`, // your API URL here
    headers: {
      "api-key": configs.Azure.CognitiveSearch.ApiKey,
      "Content-Type": "application/json",
    }
  };

  const searchResults = await axios(config);
  console.log(searchResults);

  res.render("index", { title: "Azure Cognitive Search", results: searchResults.data });
});

module.exports = router;
