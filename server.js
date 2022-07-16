const bodyParser = require('body-parser')
const express = require('express')
const compression = require('compression')
const app = express()
const apiRouter = require('./controllers/api')

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(bodyParser.urlencoded({
  extended: true
}))

// compress all responses
app.use(compression())

app.use('/api', apiRouter)

app.listen(3000, function () {
  console.log('Live at port 3000!')
})
