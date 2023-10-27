const express = require("express");
const router = express.Router();
const Style = require("../models/Style");

router.get("/", async function (req, res, next) {
  let styles = await Style.find();
  res.render("styles/index", {
    title: "Visual Styles",
    dataset: styles,
    user: req.user,
  });
});

router.get("/add", async function (req, res, next) {
  res.render("styles/add", { user: req.user });
});
router.post("/add", async function (req, res, next) {
  let style = new Style({
    Name: req.body.Name,
    AdditionalPrompt: req.body.AdditionalPrompt,
    NegativePrompt: req.body.NegativePrompt,
    ClipGuidancePreset: req.body.ClipGuidancePreset,
    Sampler: req.body.Sampler,
    StylePreset: req.body.StylePreset,
  });
  await style.save();
  res.redirect("/styles");
});

router.get("/edit/:_id", async function (req, res, next) {
  let style = await Style.findById(req.params._id);
  res.render("styles/edit", {
    title: "Edit an Style",
    data: style,
    user: req.user,
  });
});
router.post("/edit/:_id", async function (req, res, next) {
  await Style.findByIdAndUpdate(req.params._id, {
    Name: req.body.Name,
    AdditionalPrompt: req.body.AdditionalPrompt,
    NegativePrompt: req.body.NegativePrompt,
    ClipGuidancePreset: req.body.ClipGuidancePreset,
    Sampler: req.body.Sampler,
    StylePreset: req.body.StylePreset,
  });
  res.redirect("/styles");
});

router.get("/delete/:_id", async function (req, res, next) {
  await Style.findByIdAndRemove(req.params._id);
  res.redirect("/styles");
});

module.exports = router;
