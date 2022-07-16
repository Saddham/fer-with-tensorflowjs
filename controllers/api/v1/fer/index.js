const express = require('express')
const fer = new express.Router()

fer.get('/', function (req, res) {
  res.render('pages/fer/index', {})
})

module.exports = fer
