const express = require('express')
const api = new express.Router()
const v1Router = require('./v1')

api.use('/v1', v1Router)

module.exports = api
