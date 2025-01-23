import app from './app'
import 'dotenv/config'

const port = parseInt(process.env.APP_PORT, 10)

console.log(port)

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
