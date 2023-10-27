const express = require('express');
const router = express.Router();
router.use((req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
});
module.exports = router;
