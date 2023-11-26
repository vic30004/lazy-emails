import 'dotenv/config'
import { SetupKeys } from '../types'
import inquirer, { Question, ListQuestionOptions, Answers } from 'inquirer';
import fs from 'fs';
import path from 'path';
import { generateEmail } from '../openai/index.js';
import { ChatCompletionMessage, ChatCompletionMessageParam, ChatCompletionUserMessageParam, ChatCompletionAssistantMessageParam } from "openai/resources/index.js";
import { sendEmail } from '../emails/index.js';

const checkIfAnythingRequiresSetup = (): SetupKeys => {
    const requiredEnvVars: (keyof SetupKeys)[] = ["OPENAIKEY", "SMTPUSER", "SMTPSERVER", "SMTPPASS", "SMTPPORT", "FULLNAME"];
    const setupStatus: SetupKeys = {
        OPENAIKEY: false,
        SMTPUSER: false,
        SMTPSERVER: false,
        SMTPPASS: false,
        SMTPPORT: false,
        FULLNAME: false
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

export const handleSetup = async () => {
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
        const answers = await inquirer.prompt(questions);
        for (let key in answers) {
            console.log(`${key} set to: ${answers[key]}`);
            addToEnv(key, answers[key])
        }
    }
}

const checkIfUserIsHappyWithEmail = async (): Promise<boolean> => {
    const questions: Array<ListQuestionOptions> = [{
        type: 'list',
        name: 'choices',
        message: 'Are you happy with that email? Should we send it?',
        choices: [
            'Yes',
            'No'
        ],
        validate: function (answer) {
            if (!answer) {
                return "Please select an option"
            }
            return true
        }
    }]

    const answer = await inquirer.prompt(questions);
    if (answer.choices === "Yes") {
        return true;
    }
    return false;
}

const getUpdatedInstruction = async (): Promise<ChatCompletionUserMessageParam> => {
    const questions: Array<Question> = [
        {
            name: "emailUpdate",
            message: "What would you like to change? ",
            type: 'input',
            validate: function (answer) {
                if (!answer) {
                    return 'Please provide instructions.';
                }
                return true;
            }
        },
    ]

    const answer = await inquirer.prompt(questions);
    const userMessage: ChatCompletionMessageParam = { role: 'user', content: answer.emailUpdate };
    return userMessage;
}

interface EmailParts {
    subject: string;
    emailBody: string;
}

const extractSubjectAndEmail = (emailText: ChatCompletionMessage): EmailParts | void => {
    const text = emailText.content;
    if (!text) {
        return;
    }

    // Regular expression to find 'Subject:' (case insensitive)
    const subjectRegex = /subject:\s*(.*?)\s*(\n|$)/i;
    const subjectMatch = text.match(subjectRegex);
    if (!subjectMatch) {
        return;
    }
    const subject = subjectMatch[1].trim();

    // Regular expression to find 'Email:' (case insensitive)
    const emailRegex = /email:\s*(\n|$)/i;
    const emailIndex = text.search(emailRegex);
    if (emailIndex === -1) {
        return;
    }
    const emailBody = text.substring(emailIndex).replace(emailRegex, "").trim();

    return { subject, emailBody };
}


const getEmailInformation = async (): Promise<Answers> => {

    const questions: Array<Question> = [
        {
            name: "emailTo",
            message: "Who would you like to send an email to? ",
            type: 'email',
            validate: function (answer) {
                if (!answer) {
                    return 'Please provide an email.';
                }
                return /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()\.,;\s@\"]+\.{0,1})+([^<>()\.,;:\s@\"]{2,}|[\d\.]+))$/.test(answer);
            }
        },
        {
            name: "moreInfo",
            message: `Please provide specific details about the email's content. \nThis may include the recipient's name, the purpose of the email, any key points \nor messages you want to include.`,
            type: 'input',
            validate: function (answer) {
                if (!answer) {
                    return 'Please provide some information, this will help us draft the email.';
                }
                return true;
            }
        },
        {
            name: "tone",
            message: "How would you like the tone or style of the email to be? ",
            type: 'input'
        }
    ]
    const answers = await inquirer.prompt(questions);
    return answers
}

const preparePrompt = (userChoices: Answers): Array<ChatCompletionAssistantMessageParam | ChatCompletionMessageParam> => {
    let userMessage: string = ''

    userMessage += `Context: ${userChoices.moreInfo}\n Email Signature: ${process.env.FULLNAME}`
    if (userChoices.tone) {
        userMessage += `\nTone: ${userChoices.tone}`
    }
    const userMessages: ChatCompletionMessageParam = { role: 'user', content: userMessage }
    const correspondence: Array<ChatCompletionAssistantMessageParam | ChatCompletionMessageParam> = [userMessages]
    return correspondence;
}

const generateAndSendEmail = async() => {
    const choices = await getEmailInformation()
    const correspondence = preparePrompt(choices);
    try {
        console.log("-----GENERATING EMAIL-----")
        let email = await generateEmail(correspondence);
        if (!email){
            console.log('We encountered an issue generating the email. Please try again');
            return
        }
        console.log(email.content)
        console.log("----EMAIL GENERATED-----")

        let isHappy = await checkIfUserIsHappyWithEmail()
        while (!isHappy) {
            const updates = await getUpdatedInstruction()
            if (typeof email !== 'undefined') {
                const botMessage: ChatCompletionAssistantMessageParam = { role: email.role, content: email.content };
                correspondence.push(botMessage);
            }

            correspondence.push(updates);

            console.log("-----UPDATING EMAIL-----")
            email = await generateEmail(correspondence);
            if (!email){
                console.log('We encountered an issue generating the email. Please try again');
                return
            }
            console.log(email.content)
            console.log("----EMAIL UPDATED-----")
            isHappy = await checkIfUserIsHappyWithEmail()
        }
        if (typeof email !== 'undefined') {
            const emailData = extractSubjectAndEmail(email);
            if (!emailData) {
                console.log("Something went wrong while preparing the email.")
                return;
            }
            const { subject, emailBody } = emailData;
            console.log(subject, emailBody)
            console.log('----- SENDING EMAIL ----')
            await sendEmail(choices.emailTo, subject, emailBody)
        }

    } catch (error) {
        console.error(error);
    }
}

const handleUsersChoice = async (choice: string) => {
    switch (choice) {
        case 'Generate and Send Email':
            generateAndSendEmail()
        default:
            return
    }
}


export const showChoices = async () => {
    const questions: Array<ListQuestionOptions> = [{
        type: 'list',
        name: 'choices',
        message: 'What would you like to do today?',
        choices: [
            'Generate and Send Email',
            'Draft Email',
            'Quit'
        ],
        validate: function (answer) {
            if (answer.length < 1) {
                return 'You must choose at lease one option.';
            }
            return true;
        }
    }]

    const answer = await inquirer.prompt(questions);
    handleUsersChoice(answer.choices)
}