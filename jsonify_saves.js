/** @typedef {{raw: string, name: string}[]} JSONSaves */

import fs from 'fs';
const { promises: { readdir, readFile, writeFile } } = fs;

const SAVES_PATH = './saves'

const saveDirs = await getDirectoryNames(SAVES_PATH);
for(const saveDir of saveDirs) {
    /** @type {JSONSaves} */
    const output = []

    console.info(`Processing saves from ${saveDir}`)
    const saveNames = await getFileNames(`${SAVES_PATH}/${saveDir}`);
    for(const saveName of saveNames) {
        const save = await readFile(`${SAVES_PATH}/${saveDir}/${saveName}`, 'utf8');
        if(!save.startsWith('N4Ig')) continue;
        output.push({raw: save, name: saveName});
    }

    await writeFile(`./output/${saveDir}.json`, JSON.stringify(output));
}
console.info("All done")

/**
 * @param {string} path 
 * @returns {Promise<string[]>}
 */
async function getDirectoryNames(path) {
    return (await readdir(path, { withFileTypes: true })).filter(v => v.isDirectory()).map(v => v.name);
}

/**
 * @param {string} path 
 * @returns {Promise<string[]>}
 */
async function getFileNames(path) {
    return (await readdir(path, { withFileTypes: true })).filter(v => v.isFile()).map(v => v.name);
}