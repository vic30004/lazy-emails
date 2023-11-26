import 'dotenv/config'
import { handleSetup, showChoices } from './cmd/index.js';

const run = async() => {
    handleSetup()
    await showChoices()
}

run()



