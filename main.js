export {}

/** @type {any} */
// @ts-ignore
const LZ = LZString;

/** @typedef {{base64: string, name: string, lastModified: number, game: { global: { version: number, highestLevelCleared: number, highestRadonLevelCleared: number, totalHeliumEarned: number, totalRadonEarned: number, totalPortals: number, totalRadPortals: number } }, user: string}} Save */
/** @typedef {import("./jsonify_saves").JSONSaves} JSONSaves} */
/** 
 * @typedef {object} Elems 
 * @property {HTMLDivElement} savesContainer
 * @property {HTMLTemplateElement} templateSave
 * @property {HTMLInputElement} checkboxFilterHighestZone
 * @property {HTMLInputElement} checkboxFilterHighestU2Zone
 * @property {HTMLInputElement} inputFilterHighestZone
 * @property {HTMLInputElement} inputFilterHighestU2Zone
 * @property {HTMLButtonElement} filterButton
*/

const elems = loadElements();
const saves = await loadSaves();
registerFilters();




function registerFilters() {
    const checkboxes = [elems.checkboxFilterHighestZone, elems.checkboxFilterHighestU2Zone];
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function(e) {
            if(this.checked) {
                for(let otherCheckbox of checkboxes) {
                    if(otherCheckbox != checkbox) otherCheckbox.checked = false;
                }
            }
            else {
                this.checked = true;
            }
        })
    });
    if(!checkboxes.find(v => v.checked)) elems.checkboxFilterHighestZone.checked = true;
    elems.inputFilterHighestZone.value = 60+'';
    elems.filterButton.addEventListener('click', () => {
        refreshList();
    });
    refreshList();
}

function refreshList() {
    /** @type {Save[]} */
    let filteredSaves = []
    /** @type {Save|null} */
    let chosenSave = null;
    if(elems.checkboxFilterHighestZone.checked) {
        const zone = +elems.inputFilterHighestZone.value;
        if(zone < 1 || zone > 999) return;
        filteredSaves = saves.slice();
        filteredSaves.sort((a, b) => a.game.global.highestLevelCleared - b.game.global.highestLevelCleared)
        for(let i = 0; i < filteredSaves.length; i++) {
            let filteredSave = filteredSaves[i];
            if(filteredSave.game.global.highestLevelCleared + 1 >= zone) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 10), i + 15);
                chosenSave = filteredSave;
                break;
            }
            if(i + 1 === filteredSaves.length) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 15));
                chosenSave = filteredSave;
                break;
            }
        }
    }
    else if(elems.checkboxFilterHighestU2Zone.checked)  {
        const zone = +elems.inputFilterHighestU2Zone.value;
        if(zone < 1 || zone > 999) return;
        filteredSaves = saves.slice();
        filteredSaves.sort((a, b) => a.game.global.highestRadonLevelCleared - b.game.global.highestRadonLevelCleared)
        for(let i = 0; i < filteredSaves.length; i++) {
            let filteredSave = filteredSaves[i];
            if(filteredSave.game.global.highestRadonLevelCleared + 1 >= zone) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 10), i + 15);
                chosenSave = filteredSave;
                break;
            }
            if(i + 1 === filteredSaves.length) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 15));
                chosenSave = filteredSave;
                break;
            }
        }
    }
    else {
        return;
    }

    elems.savesContainer.innerHTML = '';
    let chosenSaveFound = false;
    for(let save of filteredSaves) {
        const saveElem = /** @type {HTMLDivElement} */ (elems.templateSave.content.cloneNode(true));

        if(save === chosenSave) {
            chosenSaveFound = true;
            /** @type {HTMLDivElement} */ (saveElem.querySelector('div[data-id=root]')).classList.add('bg-green-200', 'hover:bg-green-300');
        }
        else if(!chosenSaveFound) {
            /** @type {HTMLDivElement} */ (saveElem.querySelector('div[data-id=root]')).classList.add('bg-red-200', 'hover:bg-red-300');
        }
        else {
            /** @type {HTMLDivElement} */ (saveElem.querySelector('div[data-id=root]')).classList.add('bg-blue-200', 'hover:bg-blue-300');
        }

        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=user]')).textContent = save.user;
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=name]')).textContent = save.name;
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=dateModified]')).textContent = getFormattedDate(save.lastModified);
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=version]')).textContent = save.game.global.version+'';

        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalHelium]')).textContent = prettify(save.game.global.totalHeliumEarned);
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=highestZone]')).textContent = (save.game.global.highestLevelCleared + 1)+'';
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalPortals]')).textContent = save.game.global.totalPortals+'';

        if(save.game.global.highestRadonLevelCleared <= 0) {
            /** @type {HTMLDivElement} */ (saveElem.querySelector('div[data-id=U2Container]')).style.visibility = 'hidden';
        }
        else {
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalRadon]')).textContent = prettify(save.game.global.totalRadonEarned);
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=highestZoneU2]')).textContent = (save.game.global.highestRadonLevelCleared + 1)+'';
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalPortalsU2]')).textContent = save.game.global.totalRadPortals+'';
        }

        /** @type {HTMLButtonElement} */ (saveElem.querySelector('button[data-id=copyToClipboard]')).addEventListener('click', () => {
            window.prompt("Copy to clipboard: Ctrl+C, Enter", save.base64);
        })
        
        elems.savesContainer.appendChild(saveElem);
    }
}

/**
 * @returns {Promise<Save[]>}
 */
async function loadSaves() {
    /** @type {Save[]} */
    const saves = []

    /** @type {JSONSaves} */
    const json = await (await fetch('output/saves.json')).json()
    for(const [name, arr] of Object.entries(json)) {
        for(const save of arr) {
            const decompressed = LZ.decompressFromBase64(save.raw);
            if(decompressed == null) {
                console.warn(`Failed to decompress save ${save.name} from ${name}`);
                continue;
            }
            try {
                const game = JSON.parse(decompressed);
                saves.push({
                    user: name,
                    base64: save.raw,
                    name: save.name,
                    lastModified: save.lastModified,
                    game: {
                        global: {
                            highestLevelCleared: game.global.highestLevelCleared,
                            highestRadonLevelCleared: game.global.highestRadonLevelCleared,
                            totalHeliumEarned: game.global.totalHeliumEarned,
                            totalPortals: game.global.totalPortals,
                            totalRadonEarned: game.global.totalRadonEarned,
                            totalRadPortals: game.global.totalRadPortals,
                            version: game.global.version,
                        }
                    }
                })
            }
            catch(e) {
                console.error(`Failed to parse save ${save.name} from ${name}`);
                throw e;
            }
        }
    }

    return saves;
}

/**
 * @returns {Elems}
 */
function loadElements() {
    const savesContainer = document.getElementById('savesContainer');
    const templateSave = document.getElementById('templateSave');
    //const checkboxFilterTotalHelium = document.getElementById('checkboxFilterTotalHelium');
    const checkboxFilterHighestZone = document.getElementById('checkboxFilterHighestZone');
    //const checkboxFilterTotalRadon = document.getElementById('checkboxFilterTotalRadon');
    const checkboxFilterHighestU2Zone = document.getElementById('checkboxFilterHighestU2Zone');
    const filterButton = document.getElementById('filterButton');
    const inputFilterHighestZone = document.getElementById('inputFilterHighestZone');
    const inputFilterHighestU2Zone = document.getElementById('inputFilterHighestU2Zone');

    if(!(savesContainer instanceof HTMLDivElement)) throw new Error('savesContainer is missing')
    if(!(templateSave instanceof HTMLTemplateElement)) throw new Error('templateSave is missing')
    //if(!(checkboxFilterTotalHelium instanceof HTMLInputElement)) throw new Error('checkboxFilterTotalHelium is missing')
    if(!(checkboxFilterHighestZone instanceof HTMLInputElement)) throw new Error('checkboxFilterHighestZone is missing')
    //if(!(checkboxFilterTotalRadon instanceof HTMLInputElement)) throw new Error('checkboxFilterTotalRadon is missing')
    if(!(checkboxFilterHighestU2Zone instanceof HTMLInputElement)) throw new Error('checkboxFilterHighestU2Zone is missing')
    if(!(filterButton instanceof HTMLButtonElement)) throw new Error('filterButton is not HTMLButtonElement')
    if(!(inputFilterHighestZone instanceof HTMLInputElement)) throw new Error('inputFilterHighestZone is missing')
    if(!(inputFilterHighestU2Zone instanceof HTMLInputElement)) throw new Error('inputFilterHighestU2Zone is missing')

    return {
        savesContainer,
        templateSave,
        checkboxFilterHighestZone,
        checkboxFilterHighestU2Zone,
        filterButton,
        inputFilterHighestZone,
        inputFilterHighestU2Zone
    }
}

/**
 * @param {number} milliseconds 
 * @returns {string}
 */
function getFormattedDate(milliseconds) {
    let d = (typeof milliseconds === "number" || typeof milliseconds === "string") ? new Date(milliseconds) : new Date();
    let tz = (d.getTimezoneOffset() / 60) * -1;
    let str = d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2);
    return str;
}

/**
 * @param {number} number 
 * @returns {string}
 */
function prettify(number) {
	var numberTmp = number;
	if (!isFinite(number)) return "∞";
	if (number >= 1000 && number < 10000) return Math.floor(number)+'';
	if (number == 0) return prettifySub(0);
	if (number < 0) return "-" + prettify(-number);
	if (number < 0.005) return (+number).toExponential(2);

	var base = Math.floor(Math.log(number)/Math.log(1000));
	if (base <= 0) return prettifySub(number);

	number /= Math.pow(1000, base);
	if (number >= 999.5) {
		// 999.5 rounds to 1000 and we don’t want to show “1000K” or such
		number /= 1000;
		++base;
	}

    var suffices = [
        'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud',
        'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Od', 'Nd', 'V', 'Uv', 'Dv',
        'Tv', 'Qav', 'Qiv', 'Sxv', 'Spv', 'Ov', 'Nv', 'Tg', 'Utg', 'Dtg', 'Ttg',
        'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Otg', 'Ntg', 'Qaa', 'Uqa', 'Dqa', 'Tqa',
        'Qaqa', 'Qiqa', 'Sxqa', 'Spqa', 'Oqa', 'Nqa', 'Qia', 'Uqi', 'Dqi',
        'Tqi', 'Qaqi', 'Qiqi', 'Sxqi', 'Spqi', 'Oqi', 'Nqi', 'Sxa', 'Usx',
        'Dsx', 'Tsx', 'Qasx', 'Qisx', 'Sxsx', 'Spsx', 'Osx', 'Nsx', 'Spa',
        'Usp', 'Dsp', 'Tsp', 'Qasp', 'Qisp', 'Sxsp', 'Spsp', 'Osp', 'Nsp',
        'Og', 'Uog', 'Dog', 'Tog', 'Qaog', 'Qiog', 'Sxog', 'Spog', 'Oog',
        'Nog', 'Na', 'Un', 'Dn', 'Tn', 'Qan', 'Qin', 'Sxn', 'Spn', 'On',
        'Nn', 'Ct', 'Uc'
    ];
    var suffix;
    if (base > suffices.length)
        suffix = "e" + ((base) * 3);
    else if (base <= suffices.length)
        suffix = suffices[base-1];
    else
    {
        var exponent = parseFloat(numberTmp+'').toExponential(2);
        exponent = exponent.replace('+', '');
        return exponent;
    }
	
	return prettifySub(number) + suffix;
}

/**
 * 
 * @param {number} number 
 * @returns {string}
 */
function prettifySub(number){
	number = parseFloat(number+'');
	var floor = Math.floor(number);
	if (number === floor) // number is an integer, just show it as-is
		return number+'';
	return number.toFixed(3 - floor.toString().length);
}