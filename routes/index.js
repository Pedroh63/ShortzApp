const express = require("express");
const router = express.Router();

router.get("/", function(req, res, next){
    res.render("landing", {title: "Vídeo curtos bla bla bla"});
});
module.exports = router;