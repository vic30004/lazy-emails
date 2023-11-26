import 'dotenv/config'
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

const prepareTransporter = (): nodemailer.Transporter<SMTPTransport.SentMessageInfo> => {
    const port = typeof process.env.SMTPPORT === 'string' ? parseInt(process.env.SMTPPORT) : 587;

    const transportOptions = nodemailer.createTransport({
        host: process.env.SMTPSERVER,
        port: port,
        secure: false,
        auth: {
            user: process.env.SMTPUSER,
            pass: process.env.SMTPPASS
        }
    })
    return transportOptions;
}


export const sendEmail = async (to: string, subject: string, text: string) => {
    const transporter = prepareTransporter();

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTPUSER,
            to,
            subject,
            text
        })

        console.log("Message sent %s", info.messageId)
        console.log('----- EMAIL SENT -----')
    } catch (error) {
        console.error(error)
    }

}