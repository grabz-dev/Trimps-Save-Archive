/** @typedef {{r: string, d: [string, number, number, number, number, number, number, string, number, number, number, number, number]}[]} JSONSaves */

import fs from 'fs';
import LZString from './lib/lz-string.js';
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
        
        const decompressed = LZString.decompressFromBase64(save);
        if(decompressed == null) {
            console.warn(`Failed to decompress save ${saveName} from ${saveDir}`);
            continue;
        }

        try {
            const game = JSON.parse(decompressed);
            output.push({r: save, d: [
                saveName,
                /** @type {number} */(game.global.highestLevelCleared),
                /** @type {number} */(game.global.highestRadonLevelCleared),
                /** @type {number} */(game.global.totalHeliumEarned),
                /** @type {number} */(game.global.totalPortals),
                /** @type {number} */(game.global.totalRadonEarned),
                /** @type {number} */(game.global.totalRadPortals),
                /** @type {string} */(game.global.stringVersion ?? (game.global.version+'')),
                /** @type {number} */(game.global.lastOnline),
                /** @type {number} */(game.global.spiresCompleted),
                /** @type {number} */(game.global.fluffyExp),
                /** @type {number} */(game.global.fluffyExp2),
                /** @type {number} */(game.global.fluffyPrestige)
            ]});
        }
        catch(e) {
            console.error(`Failed to parse save ${saveName} from ${saveDir}`);
            continue;
        }
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