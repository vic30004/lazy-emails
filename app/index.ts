import 'dotenv/config'
import { handleSetup, showChoices } from './cmd/index.js';

const run = async() => {
    await handleSetup()
    await showChoices()
}

run()



