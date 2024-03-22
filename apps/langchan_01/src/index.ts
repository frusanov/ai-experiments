import { ChatMistralAI } from "@langchain/mistralai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { setRootAsCwd, loadEnv } from '@ai/utils';

setRootAsCwd();
loadEnv();

const prompt = ChatPromptTemplate.fromMessages([
  ["human", "Tell me a short joke about {topic}"],
]);


const model = new ChatMistralAI({
  apiKey: process.env.MISTRAL_API_KEY,
  modelName: "mistral-small",
});
// const outputParser = new StringOutputParser();

const chain = prompt.pipe(model);

const response = await chain.invoke({
  topic: "ice cream",
});

console.log(response);