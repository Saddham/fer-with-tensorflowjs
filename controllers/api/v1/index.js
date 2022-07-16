const express = require('express')
const v1 = new express.Router()
const fer = require('./fer')

v1.use('/fer', fer)

module.exports = v1
