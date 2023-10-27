const express = require("express");
const router = express.Router();
const Aesthetic = require("../models/Aesthetic");

router.get("/", async function (req, res, next) {
  let aesthetics = await Aesthetic.find();
  res.render("aesthetics/index", {
    title: "Aesthetics",
    dataset: aesthetics,
    user: req.user,
  });
});

router.get("/add", async function (req, res, next) {
  res.render("aesthetics/add", { title: "Express", user: req.user });
});
router.post("/add", async function (req, res, next) {
  let aesthetic = new Aesthetic({
    Name: req.body.Name,
    AdditionalPrompt: req.body.AdditionalPrompt,
    NegativePrompt: req.body.NegativePrompt,
    ClipGuidancePreset: req.body.ClipGuidancePreset,
    Sampler: req.body.Sampler,
    StylePreset: req.body.StylePreset,
  });
  aesthetic.save();
  res.redirect("/aesthetics");
});

router.get("/edit/:_id", async function (req, res, next) {
  let aesthetic = await Aesthetic.findById(req.params._id);
  res.render("aesthetics/edit", {
    title: "Edit an Aesthetic",
    data: aesthetic,
    user: req.user,
  });
});
router.post("/edit/:_id", async function (req, res, next) {
  await Aesthetic.findByIdAndUpdate(req.params._id, {
    Name: req.body.Name,
    AdditionalPrompt: req.body.AdditionalPrompt,
    NegativePrompt: req.body.NegativePrompt,
    ClipGuidancePreset: req.body.ClipGuidancePreset,
    Sampler: req.body.Sampler,
    StylePreset: req.body.StylePreset,
  });
  res.redirect("/aesthetics");
});

router.get("/delete/:_id", async function (req, res, next) {
  await Aesthetic.findByIdAndRemove(req.params._id);
  res.redirect("/aesthetics");
});

module.exports = router;
