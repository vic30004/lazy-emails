# lazy-emails
A cli that drafts and sends emails for you. 

## Setup

When you start the app for the firs time, you will be asked to provide some values required for setup.

1. OPENAIKEY - This is your API key for OpenAI, which allows you to access GPT-based services for generating email content. Obtain your key from (openAi)[https://openai.com/].

2. SMTPSERVER - Specifies the SMTP server used for sending emails. For instance, use smtp.gmail.com for Gmail services.

3. SMTPPASS -  Your email account's password. This is necessary for authenticating your account with the SMTP server. If you use two-factor authentication (2FA) for your Gmail account, you might need to generate an "App Password" specifically for sending emails through SMTP. To generate an App Password for Gmail, follow the instructions provided in Google's documentation.

4. SMTPUSER - The email address that will be used as the sender for outgoing emails. This should be the same email account associated with your SMTPPASS.

5. SMTPPORT - The port used by your email service for SMTP communication. Common ports include 587 for TLS/STARTTLS and 465 for SSL.

6. FULLNAME - Your full name as you want it to appear in the signature of your emails. This adds a personal touch to the emails sent using this setup.

If you want to skip the setup, you can create a .env file in the root folder and you can manually setup up these values.


## Getting Started.

1. Install the dependencies - ```npm install```
2. Build the app - ```npm run build```
3. Start the app - ```npm start```

## Tips

You can quit the app at any point by running ```cntrl + c``` or ```cmd + c``` on mac. 