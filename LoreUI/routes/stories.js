const express = require("express");
const router = express.Router();
const Story = require("../models/story");
const Channel = require("../models/channel");
const chatCompletion = require("../extensions/chat-completions");

router.get("/", async function (req, res, next) {
  let stories = await Story.find().sort([["DateAdded", "descending"]]);
  res.render("stories/index", {
    title: "Stories",
    dataset: stories,
    user: req.user,
  });
});

router.get("/add", async function (req, res, next) {
  let channels = await Channel.find();
  res.render("stories/add", {
    title: "Add a New Story",
    user: req.user,
    channels: channels,
  });
});
router.post("/add", async function (req, res, next) {
  let story = new Story({
    Title: req.body.Title,
    Notes: req.body.Notes,
    Channel: req.body.Channel,
    IsShort: req.body.IsShort == "true" ? true : false,
    IsFemale: req.body.IsFemale == "true" ? true : false,
    Aesthetic: "TODO",
    ScriptTable: req.body.ScriptTableMultiLang,
    MetadataEN: {
      Title: req.body.ScriptMetadataTitleEN,
      Description: req.body.ScriptMetadataDescriptionEN,
      Tags: req.body.ScriptMetadataTagsEN,
    },
    MetadataES: {
      Title: req.body.ScriptMetadataTitleES,
      Description: req.body.ScriptMetadataDescriptionES,
      Tags: req.body.ScriptMetadataTagsES,
    },
  });
  await story.save();
  res.redirect("/stories");
});

router.get("/edit/:_id", async function (req, res, next) {
  let channels = await Channel.find();
  let story = await Story.findById(req.params._id);
  res.render("stories/edit", {
    title: "Express",
    data: story,
    channels: channels,
    user: req.user,
  });
});
router.post("/edit/:_id", async function (req, res, next) {
  let action = req.body.action;
  console.log(action);
  if (action == "save") {
    await Story.findByIdAndUpdate(req.params._id, {
      Title: req.body.Title,
      Notes: req.body.Notes,
      Status: req.body.Status,
      Channel: req.body.Channel,
      DatePublished: req.body.Status == "PUBLISHED" ? new Date() : null,
      IsShort: req.body.IsShort == "true" ? true : false,
      IsFemale: req.body.IsFemale == "true" ? true : false,
      Aesthetic: "TODO",
      ScriptTable: req.body.ScriptTableMultiLang,
      MetadataEN: {
        Title: req.body.ScriptMetadataTitleEN,
        Description: req.body.ScriptMetadataDescriptionEN,
        Tags: req.body.ScriptMetadataTagsEN,
      },
      MetadataES: {
        Title: req.body.ScriptMetadataTitleES,
        Description: req.body.ScriptMetadataDescriptionES,
        Tags: req.body.ScriptMetadataTagsES,
      },
    });
    res.redirect("/stories");
  } else if (action == "generateTable") {
    let story = await Story.findById(req.params._id);
    let channels = await Channel.find();

    // let script = await chatCompletion.GenerateScript(
    //   req.body.Notes,
    //   req.body.IsShort == "true" ? true : false
    // );
    // story.ScriptTable = script;
    let metadataES = await chatCompletion.GenerateMetadata(
      story.Notes,
      story.ScriptTable,
      "Historias de Horror",
      "Historias de Terror",
      "Spanish"
    );
    story.MetadataES.Description = metadataES;
    let metadataEN = await chatCompletion.GenerateMetadata(
      story.Notes,
      story.ScriptTable,
      "Horror Stories",
      "Horror Stories",
      "English"
    );
    story.MetadataEN.Description = metadataEN;

    res.render("stories/edit", {
      title: "Express",
      data: story,
      channels: channels,
      user: req.user,
    });
  }
});

router.get("/delete/:_id", async function (req, res, next) {
  await Story.findByIdAndRemove(req.params._id);
  res.redirect("/stories");
});

module.exports = router;
