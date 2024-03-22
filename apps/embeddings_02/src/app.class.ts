import { ChromaClient, Collection } from 'chromadb'
import { Ollama } from 'ollama';
import { randomUUID } from 'node:crypto';

export class App {
  static readonly COLLECTION_NAME = "rag_01";

  static readonly ollama = new Ollama();
  static readonly chroma = new ChromaClient();

  static async create() {
    const app = new App();
    await app.init();
    return app;
  }

  collection?: Collection;

  async init() {
    await this._initCollection();
  }
  
  async _initCollection() {
    this.collection = await App.chroma.getOrCreateCollection({
      name: App.COLLECTION_NAME,
    });
  }

  async _deleteCollection() {
    await App.chroma.deleteCollection({
      name: App.COLLECTION_NAME,
    });
  }

  async recreateCollection() {
    await this._deleteCollection();
    await this._initCollection();
  }

  async getEmbedding(text: string) {
    const result = await App.ollama.embeddings({
      model: 'nomic-embed-text',
      prompt: text,
    });
    
    return result.embedding;
  }

  async embedDocument(document: string) {
    const embedding = await this.getEmbedding(document);

    this.collection?.add({
      ids: [randomUUID()],
      documents: [document],
      embeddings: [embedding],
    })
    
    return embedding;
  }
}