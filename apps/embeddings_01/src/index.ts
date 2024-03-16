import { ChromaClient } from 'chromadb'
import prompts from 'prompts';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFile } from "node:fs/promises";
import { setRootAsCwd, loadEnv } from '@ai/utils'
import MistralClient from '@mistralai/mistralai';

setRootAsCwd();
loadEnv();

interface DocumentEntry {
  id: string;
  document: string;
  metadata: Record<string, any>;
}

const chroma = new ChromaClient();
const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

const { resetDatabase } = await prompts({
  type: 'select',
  name: 'resetDatabase',
  message: 'Clear database?',
  active: 'No',
  choices: [
    { title: 'No', value: false },
    { title: 'Yes', value: true },
  ],
});

if (resetDatabase) await chroma.reset();

const collection = await chroma.getOrCreateCollection({
  name: "embeddings_01",
});

const { addNewEntries } = await prompts({
  type: 'select',
  name: 'addNewEntries',
  message: 'Clear database?',
  active: 'Yes',
  choices: [
    { title: 'Yes', value: true },
    { title: 'No', value: false },
  ],
});


if (addNewEntries) {
  const TIME_ALL = 'Add all items to collection';

  console.time(TIME_ALL);
  
  const zshHistoryPath = join(homedir(), '.zsh_history');
  const zshHistoryData = await readFile(zshHistoryPath, 'utf-8');
  const zshHistoryLines = zshHistoryData.split(/^:/gm).map((line) => line.trim()).filter((line) => line.length > 0);
  
  const zshHistory = zshHistoryLines.map((line) => {
    const [timestamp, index, document] = line.split(/(\d+):(\d+);/).slice(1);
  
    return {
      id: `${timestamp}:${index}`,
      document,
      metadata: {
        timestamp,
        index,
      }
    } as DocumentEntry;
  });
  
  for (const item of zshHistory) {
    const TIME_ITEM = `Add item '${item.id}' to collection`;
  
    const searchResult = await collection.get({ ids: [item.id] }).catch(() => ({ ids: [] } as any));
  
    if (searchResult.ids.includes(item.id)) {
      console.log(`Item ${zshHistory.indexOf(item) + 1}/${zshHistory.length} (${item.id}) already in collection`);
      continue;
    }
  
    console.log(`\nAdding item ${zshHistory.indexOf(item) + 1}/${zshHistory.length} (${item.id})`);
    console.time(TIME_ITEM);
  
    const explanation = await askExplanation(item.document);
    const embedding = await getEmbeddingForSingleItem(explanation);
  
    await collection.add({
      ids: [item.id],
      embeddings: [embedding],
      documents: [item.document],
      metadatas: [item.metadata],
    })
  
    console.timeEnd(TIME_ITEM);
  }
  
  console.timeEnd(TIME_ALL);
}




const { userPrompt } = await prompts({
  type: 'text',
  name: 'userPrompt',
  message: 'Find related to:',
});

const relatedTo = await askAskRelated(userPrompt);
const relatedEmbedding = await getEmbeddingForSingleItem(relatedTo);

const finalResult = await collection.query({ 
  queryEmbeddings: [relatedEmbedding],
  nResults: 5,
})

console.log(`- - -
Results:
- - -
`);

finalResult.ids[0].forEach((_id, index) => {
  const timestamp = finalResult.metadatas?.[0][index]?.timestamp as string ?? '0';
  const document = finalResult.documents?.[0][index];
  const distance = finalResult.distances?.[0][index];

  console.log(`
Command: ${document}
Date/time: ${new Date(parseInt(timestamp) * 1000)}
Distance: ${distance}
  `);
})

// ~~ Functions

async function askExplanation(cmd: string) {
  const chatResponse = await mistral.chat({
    model: 'open-mistral-7b',
    messages: [{role: 'user', content: `What technologies can this command be related to "${cmd}"? Give me list of 3 items`}],
  });

  return chatResponse.choices[0].message.content;
}
async function askAskRelated(cmd: string) {
  const chatResponse = await mistral.chat({
    model: 'open-mistral-7b',
    messages: [{role: 'user', content: `What technologies can this be related to "${cmd}"? Give me list of 3 items`}],
  });

  return chatResponse.choices[0].message.content;
}

async function getEmbeddingForSingleItem(input: string) {
  const embeddingsResponse = await mistral.embeddings({
    model: 'mistral-embed',
    input,
  })
  
  return embeddingsResponse.data[0].embedding;
}
