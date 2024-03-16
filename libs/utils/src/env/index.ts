import dotenv from 'dotenv';
import { resolve } from 'node:path'

export function loadEnv() {
  dotenv.config({
    path: resolve(process.cwd(), '.env'),
  });
}