import * as path from 'path';
import { readFile } from '../zutil/ls/asyncUtil';

export let SRC;

export async function intConfig(config_path: string) {
    const config_raw = await readFile(config_path);
    const config = JSON.parse(config_raw);
    SRC = path.resolve(config.dist_path);
}
