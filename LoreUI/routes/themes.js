const express = require("express");
const router = express.Router();
const Theme = require("../models/theme");

router.get("/", async function (req, res, next) {
  let themes = await Theme.find();
  res.render("themes/index", {
    title: "Themes",
    dataset: themes,
    user: req.user,
  });
});

router.get("/add", async function (req, res, next) {
  res.render("themes/add", { title: "Add a new Theme", user: req.user });
});
router.post("/add", async function (req, res, next) {
  let theme = new Theme({
    Name: req.body.Name,
    Description: req.body.Description,
    Tags: req.body.Tags,
    Keywords: req.body.Keywords,
  });
  theme.save();
  res.redirect("/themes");
});

router.get("/edit/:_id", async function (req, res, next) {
  let theme = await Theme.findById(req.params._id);
  res.render("themes/edit", {
    title: "Edit a Theme",
    data: theme,
    user: req.user,
  });
});
router.post("/edit/:_id", async function (req, res, next) {
  await Theme.findByIdAndUpdate(req.params._id, {
    Name: req.body.Name,
    Description: req.body.Description,
    Tags: req.body.Tags,
    Keywords: req.body.Keywords,
  });
  res.redirect("/themes");
});

router.get("/delete/:_id", async function (req, res, next) {
  await Theme.findByIdAndRemove(req.params._id);
  res.redirect("/themes");
});

module.exports = router;
