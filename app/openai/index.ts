import OpenAI from "openai";

const openai = new OpenAI();

export const generateEmail = async (): Promise<OpenAI.Chat.ChatCompletionMessage> => {
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [{ role: 'user', content: 'Say this is a test' }],
        model: 'gpt-4',
    };
    const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
    return chatCompletion.choices[0].message;
}