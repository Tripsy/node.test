import 'reflect-metadata'
import app from './app'
import 'dotenv/config'

const port: number = process.env.APP_PORT

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})
