const express = require("express");
const router = express.Router();
const Channel = require("../models/channel");

router.get("/", async function (req, res, next) {
  let channels = await Channel.find();
  res.render("channels/index", {
    title: "channels",
    dataset: channels,
    user: req.user,
  });
});

router.get("/add", async function (req, res, next) {
  res.render("channels/add", { title: "Express", user: req.user });
});
router.post("/add", async function (req, res, next) {
  let channel = new Channel({
    Name: req.body.Name,
    Url: req.body.Url,
    Keywords: req.body.Keywords,
    SeriesName: req.body.SeriesName
  });
  channel.save();
  res.redirect("/channels");
});

router.get("/edit/:_id", async function (req, res, next) {
  let channel = await Channel.findById(req.params._id);
  res.render("channels/edit", {
    title: "Edit a Channel",
    data: channel,
    user: req.user,
  });
});
router.post("/edit/:_id", async function (req, res, next) {
  await Channel.findByIdAndUpdate(req.params._id, {
    Name: req.body.Name,
    Url: req.body.Url,
    Keywords: req.body.Keywords,
    SeriesName: req.body.SeriesName
  });
  res.redirect("/channels");
});

router.get("/delete/:_id", async function (req, res, next) {
  await Channel.findByIdAndRemove(req.params._id);
  res.redirect("/channels");
});

module.exports = router;
