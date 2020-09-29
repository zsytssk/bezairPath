import { default as imagemin } from 'imagemin';
import { default as imageminMozJpeg } from 'imagemin-mozjpeg';
import { default as imageminPngquant } from 'imagemin-pngquant';
import * as path from 'path';
import { pMap } from './pMap';
import { walk } from '../zutil/ls/walk';
import { lstatFile } from '../zutil/ls/asyncUtil';
import { write } from '../zutil/ls/write';

export async function compress(src: string) {
    const file_list = await getAllFiles(src);
    await compressFiles(file_list);
}

export async function compressFiles(file_list: string[]) {
    const start = Date.now();
    let i = 0;
    const all_num = file_list.length;
    const mapper = async file => {
        const result = await compressImg(file);
        i++;
        if (!result) {
            console.log(`${i}/${all_num}:>`, file, 'no compress');
            return;
        }

        console.log(`${i}/${all_num}:>`, file, `${result}%`);
    };

    await pMap(file_list, mapper, { concurrency: 6 });
    console.log('completed:>', Date.now() - start);
}

export async function getAllFiles(src: string) {
    const dist = path.resolve(src);
    let file_list = await walk(dist);
    file_list = file_list.filter(file => {
        const ext = path.extname(file);
        return ext === '.png' || ext === '.jpg';
    });
    return file_list.map(file => {
        return file.replace(/\\/g, '/');
    });
}

export function calcPercent(new_val, ori_val) {
    return Math.floor((new_val / ori_val) * 100);
}

/** data 转到文件后自动增加的大小 */
export async function compressImg(file) {
    const { size } = await lstatFile(file);
    const ext = path.extname(file);
    let data;
    if (ext === '.png') {
        data = await compressPng(file);
    } else {
        data = await compressJpg(file);
    }
    if (!data) {
        return false;
    }
    const size_percent = calcPercent(data.toString().length, size * 0.9);

    /** 比原始更大不作处理 */
    if (size_percent >= 100) {
        return false;
    }
    await write(file, data);
    return size_percent;
}

async function compressPng(file: string) {
    try {
        const data = await imagemin([file], {
            plugins: [imageminPngquant()],
        });
        return data[0].data;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function compressJpg(file) {
    try {
        const data = await imagemin([file], undefined, {
            plugins: [imageminMozJpeg()],
        });

        return data[0].data;
    } catch (err) {
        console.error(err);
        return false;
    }
}
