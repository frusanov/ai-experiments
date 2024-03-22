
import { loadEnv, setRootAsCwd } from '@ai/utils';
import MistralClient from '@mistralai/mistralai';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises'

setRootAsCwd();
loadEnv();

const characters = ['Little Lamb', 'Big Badass Wolf', 'Mother Goose', 'Racoon the Dumpster King'];
const activities = ['learning python together', 'arranged a drifting competition', 'went to the moon', 'start a emo-rock band', 'rob the bank'];

const charactersPairs: Array<Array<string>> = [];
const allDoingAll: Array<{
  characters: Array<string>;
  activity: string;
}> = [];

for (let i = 0; i < characters.length; i++) {
  for (let j = i + 1; j < characters.length; j++) {
    charactersPairs.push([characters[i], characters[j]]);
  }
}

for (const characters of charactersPairs) {
  for (const activity of activities) {
    allDoingAll.push({
      characters,
      activity,
    });
  }
}

const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

const resultsFolder = resolve(process.cwd(), './apps/generation_01/data');

for (const { characters, activity } of allDoingAll) {
  console.log(`Create me a little story about ${characters[0]} and ${characters[1]} who ${activity}.`);
  
  const response = await mistral.chat({ 
    model: 'open-mistral-7b',
    messages: [
      {
        role: 'user',
        content: `Create me a little story about ${characters[0]} and ${characters[1]} who ${activity}.`,
      },
    ],
  });

  await writeFile(
    resolve(resultsFolder, `${characters[0]} and ${characters[1]} who ${activity}.txt`), 
    response.choices[0].message.content,
    {
      encoding: 'utf-8',
    }
  );
}