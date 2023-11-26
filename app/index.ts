import 'dotenv/config'
import { SetupKeys, EnvVars } from './types';
import inquirer, { Answers, Question } from 'inquirer';
import fs from 'fs';
import path from 'path';

const envVars: EnvVars = {
    OPENAIKEY: process.env.OPENAIKEY,
    SMTPUSER: process.env.SMTPUSER,
    SMTPSERVER: process.env.SMTPSERVER,
    SMTPPASS: process.env.SMTPPASS,
    SMTPPORT: process.env.SMTPPORT
}

const checkIfAnythingRequiresSetup = (): SetupKeys => {
    const res: SetupKeys = {
        OPENAIKEY: false,
        SMTPSERVER: false,
        SMTPPASS: false,
        SMTPUSER: false,
        SMTPPORT: false,
    };
    for (let v in envVars) {
        if (!envVars[v]) {
            res[v] = true
        }
    }
    return res;
};

const addToEnv = (key: string, envData: string) => {
    const envPath = path.resolve(process.cwd(), '.env');
    console.log(envPath);
    const regex = new RegExp(`^${key}=.*`, 'm');
    let envContent = '';

    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8')
    }
    const newLine = `${key}=${envData}\n`;
    if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine);
    } else {
        envContent += newLine;
    }
    fs.writeFileSync(envPath, envContent);
}

const handleSetup = async () => {
    const checkData = checkIfAnythingRequiresSetup();
    const questions: Array<Question> = []

    for (let key in checkData) {
        if (checkData[key]) {
            questions.push({
                name: key,
                message: `${key} is not set up. Please provide ${key}: `,
                type: 'input'
            })
        }
    }

    if (questions.length > 0) {
        inquirer.prompt(questions).then((answers) => {
            for (let key in answers) {
                console.log(`${key} set to: ${answers[key]}`);
                addToEnv(key, answers[key])
            }
        })
    }
}

handleSetup()




