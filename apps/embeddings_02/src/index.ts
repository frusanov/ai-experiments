import { setRootAsCwd, loadEnv } from '@ai/utils';
import { App } from './app.class.js';
import { readdir, readFile} from 'node:fs/promises';
import { resolve } from 'node:path';
import { IncludeEnum } from 'chromadb';


setRootAsCwd();
loadEnv();

const app = await App.create();

// app.recreateCollection();

const documentsFolder = resolve(process.cwd(), './apps/generation_01/data');
const documentsList = await readdir(documentsFolder);

for (const document of documentsList) {
  const documentPath = resolve(documentsFolder, document);

  const candidates = await app.collection?.get({
    include: [IncludeEnum.Metadatas],
    where: { path: documentPath },
  });

  if (!candidates?.ids.length) {
    const documentData = await readFile(documentPath, { encoding: 'utf-8' });

    const embedding = await app.getEmbedding(documentData);

    await app.collection?.add({
      ids: [documentPath],
      documents: [documentPath],
      embeddings: [embedding],
      metadatas: [{ 
        title: document,
        path: documentPath
      }],
    });

    console.log(`Document ${document} added to the collection`);
  } else {
    console.log(`Document ${document} already in the collection`);
  }
}

console.log(`

--- Results ---

`);

const embedding = await app.getEmbedding('dog and engineer cartoon');

const results = await app.collection?.query({
  queryEmbeddings: [embedding],
  nResults: 3,
});

results?.metadatas[0].forEach((metadata: any, index) => {
  console.log(metadata?.title, results?.distances?.[0][index]);
})
