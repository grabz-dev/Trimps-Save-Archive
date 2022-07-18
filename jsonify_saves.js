/** @typedef {{[name: string]: {raw: string, name: string, lastModified: number}[]}} JSONSaves */

import fs from 'fs';
const { promises: { readdir, readFile, writeFile, stat } } = fs;

const SAVES_PATH = './saves'
/** @type {JSONSaves} */
const output = {}

const saveDirs = await getDirectoryNames(SAVES_PATH);
for(const saveDir of saveDirs) {
    console.info(`Processing saves from ${saveDir}`)
    output[saveDir] = []
    const saveNames = await getFileNames(`${SAVES_PATH}/${saveDir}`);
    for(const saveName of saveNames) {
        const save = await readFile(`${SAVES_PATH}/${saveDir}/${saveName}`, 'utf8');
        const stats = await stat(`${SAVES_PATH}/${saveDir}/${saveName}`);
        output[saveDir].push({raw: save, name: saveName, lastModified: stats.mtime.getTime()});
    }
}
await writeFile('./output/saves.json', JSON.stringify(output));
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