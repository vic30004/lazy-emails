import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.js";
import { BOTPURPOSE } from "./constants.js";

const openai = new OpenAI({ apiKey: process.env.OPENAIKEY });

export const generateEmail = async (userMessage: Array<ChatCompletionMessageParam>): Promise<void | OpenAI.Chat.ChatCompletionMessage> => {
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [{ role: 'system', content: BOTPURPOSE }],
        model: 'gpt-4',
    };
    params.messages = [...params.messages, ...userMessage];
    try {
        const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
        return chatCompletion.choices[0].message;
    } catch (error) {
        console.error(error)
        Promise.reject(error)
    }

}