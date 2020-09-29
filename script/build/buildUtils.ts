import * as path from 'path';
import * as readline from 'readline';
import { genVersion } from '../genVersion/genVersion';
import { readFile } from '../zutil/ls/asyncUtil';
import { excuse } from '../zutil/ls/exec';
import { cp } from '../zutil/ls/main';
import { clear } from '../zutil/ls/rm';
import { write } from '../zutil/ls/write';
import { replaceReg } from '../zutil/utils/replaceReg';
import * as config from './config.json';
import { build_tips } from './build';

async function getConfig(): Promise<typeof config> {
    const file = path.resolve(__dirname, './config.json');
    const str = await readFile(file);
    return JSON.parse(str);
}

export async function preBuild() {
    const { project_path } = await getConfig();
    const bin = path.resolve(project_path, 'bin');
    const index = path.resolve(bin, 'index.html');
    let index_str = await readFile(index);
    index_str = replaceReg(index_str, /var CDN_VERSION = '(\d*)';/g, match => {
        return match[0].replace(match[1], genDate());
    });
    index_str = replaceReg(index_str, /src="index.js\?v=(\w+)"/g, match => {
        return match[0].replace(match[1], genDate());
    });
    index_str = replaceReg(index_str, /paladin.min.js\?v=(\w+)/g, match => {
        return match[0].replace(match[1], genDate());
    });
    await write(index, index_str);
}

export type BuildType = 'test' | 'prod';

export async function build(type: BuildType = 'prod') {
    const { project_path } = await getConfig();

    const mode = type === 'prod' ? 'production' : 'development';
    const env = type === 'prod' ? 'PROD' : 'TEST';

    await excuse(`webpack --ENV=${env} --mode ${mode}`, {
        path: project_path,
        output: true,
    });
}

export async function afterBuild(push = false) {
    const { project_path, dist_path } = await getConfig();
    const dist_bin = path.resolve(dist_path, 'bin');
    await genVersion();
    await copyBinToDist();
    // await compress(dist_bin);
    if (push) {
        await pushRemote();
    }
}

async function copyBinToDist() {
    const { project_path, dist_path } = await getConfig();
    const bin = path.resolve(project_path, 'bin');
    const dist_bin = path.resolve(dist_path);
    await clear(dist_bin);
    await cp(bin, dist_bin);
}

export async function pushRemote() {
    const { dist_path } = await getConfig();
    await excuse('git acpp', { path: dist_path, output: true });
}

function genDate() {
    const now = new Date();
    const year = now.getFullYear();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    const date_arr = [year, day, month, hour, minute, second];
    return date_arr.reduce((prev, cur) => {
        let cur_str = cur + '';
        if (cur_str.length === 1) {
            cur_str = '0' + cur;
        }
        return prev + cur_str;
    }, '');
}

export async function test() {}
