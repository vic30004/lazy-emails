import 'dotenv/config'
import { SetupKeys } from '../types'
import inquirer, { Question, ListQuestionOptions } from 'inquirer';
import fs from 'fs';
import path from 'path';

const checkIfAnythingRequiresSetup = (): SetupKeys => {
    const requiredEnvVars: (keyof SetupKeys)[] = ["OPENAIKEY", "SMTPUSER", "SMTPSERVER", "SMTPPASS", "SMTPPORT"];
    const setupStatus: SetupKeys = {
        OPENAIKEY: false,
        SMTPUSER: false,
        SMTPSERVER: false,
        SMTPPASS: false,
        SMTPPORT: false
    };

    requiredEnvVars.forEach((key) => {
        if (!process.env[key]) {
            setupStatus[key] = true;
        }
    })
    return setupStatus;
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

export const handleSetup = () => {
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

const getEmailInformation = async () => {

    const questions: Array<Question> = [
        {
            name: "emailTo",
            message: "Who would you like to send an email to? ",
            type: 'input'
        },
        {
            name: "moreInfo",
            message: "Please provide some information about the email receiver.",
            type: 'input',
        },
        {
            name: "tone",
            message: "Would you like to use a specific tone for this email? ",
            type: 'input'
        }
    ]

    const answers = await inquirer.prompt(questions);
    console.log(answers)
}

const handleUsersChoice = async (choice: string) => {
    switch (choice) {
        case 'Generate and Send Email':
            getEmailInformation()
        default:
            return
    }
}


export const showChoices = async ()=> {
    const questions: Array<ListQuestionOptions> = [{
        type: 'list',
        name: 'choices',
        message: 'What would you like to do today?',
        choices: [
            'Generate and Send Email',
            'Draft Email'
        ],
        validate: function (answer) {
            if (answer.length < 1) {
                return 'You must choose at lease one option.';
            }
            return true;
        }
    }]

    const answer = await inquirer.prompt(questions);
    console.log(answer)
    handleUsersChoice(answer.choices)
}