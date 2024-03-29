/** @typedef {{user: string, name: string, version: string, highestLevelCleared: number, highestRadonLevelCleared: number, totalHeliumEarned: number, totalRadonEarned: number, totalPortals: number, totalRadPortals: number, lastOnline: number, spiresCompleted: number, fluffyExp: number, fluffyExp2: number, fluffyPrestige: number, totalBones: number, spentBones: number, steamBones: number }} Save */
/** @typedef {import("./jsonify_saves").JSONSaves} JSONSaves} */
/** 
 * @typedef {object} Elems 
 * @property {HTMLDivElement} savesContainer
 * @property {HTMLTemplateElement} templateSave
 * @property {HTMLInputElement} checkboxFilterTotalHelium
 * @property {HTMLInputElement} checkboxFilterHighestZone
 * @property {HTMLInputElement} checkboxFilterTotalRadon
 * @property {HTMLInputElement} checkboxFilterHighestU2Zone
 * @property {HTMLInputElement} inputFilterTotalHelium
 * @property {HTMLInputElement} inputFilterHighestZone
 * @property {HTMLInputElement} inputFilterTotalRadon
 * @property {HTMLInputElement} inputFilterHighestU2Zone
 * @property {HTMLButtonElement} filterButton
 * @property {HTMLDivElement} userFilterContainer
 * @property {HTMLDivElement} loadingText
 * @property {HTMLDivElement} loadingOverlay
*/

/** @type {Elems} */
let elems;
/** @type {Save[]} */
let saves;
/** @type {string[]} */
let names;
const config = {
    /** @type {{[name: string]: boolean}} */
    userFilter: {}
}
init();

async function init() {
    elems = loadElements();
    /** @type {Save[]} */
    saves = await loadSaves();
    /** @type {{[key: string]: true}} */
    let _names = {}
    for(let save of saves) _names[save.user] = true;
    names = Object.keys(_names);
    if(typeof saves === 'string') {
        throw new Error(saves);
    }
    registerFilters();
}

function registerFilters() {
    const checkboxes = [elems.checkboxFilterTotalHelium, elems.checkboxFilterHighestZone, elems.checkboxFilterTotalRadon, elems.checkboxFilterHighestU2Zone];
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
    if(!checkboxes.find(v => v.checked)) elems.checkboxFilterTotalHelium.checked = true;
    elems.inputFilterTotalHelium.value = '1.5M';

    (() => {
        /** @type {HTMLInputElement[]} */
        const checkboxes = []

        names.forEach(name => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            label.innerText = ` ${name}`;
            label.prepend(input);
            elems.userFilterContainer.appendChild(label);
            checkboxes.push(input);

            input.checked = true;
            config.userFilter[name] = true;

            input.addEventListener('change', function(e) {
                config.userFilter[name] = this.checked;
            });
        });
    })();


    elems.filterButton.addEventListener('click', () => {
        refreshList();
    });
    refreshList();
}

function refreshList() {
    /** @type {Save[]} */
    let filteredSaves = saves.slice();
    /** @type {Save|null} */
    let chosenSave = null;

    filteredSaves = filteredSaves.filter(v => config.userFilter[v.user]);

    /**
     * 
     * @param {number} zone 
     * @param {1|2} universe 
     * @returns 
     */
    function zoneFilter(zone, universe) {
        if(zone < 1 || zone > 999) return;
        
        if(universe === 1) filteredSaves.sort((a, b) => a.highestLevelCleared - b.highestLevelCleared)
        else if(universe === 2) filteredSaves.sort((a, b) => a.highestRadonLevelCleared - b.highestRadonLevelCleared)

        for(let i = 0; i < filteredSaves.length; i++) {
            let filteredSave = filteredSaves[i];
            let highestLevelCleared = 0;
            if(universe === 1) highestLevelCleared = filteredSave.highestLevelCleared;
            else if(universe === 2) highestLevelCleared = filteredSave.highestRadonLevelCleared;

            if(highestLevelCleared + 1 >= zone) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 20), i + 30);
                chosenSave = filteredSave;
                break;
            }
            if(i + 1 === filteredSaves.length) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 30));
                chosenSave = filteredSave;
                break;
            }
        }
    }

    /**
     * 
     * @param {number} helium 
     * @param {1|2} universe 
     * @returns 
     */
    function heliumFilter(helium, universe) {
        if(universe === 1) filteredSaves.sort((a, b) => a.totalHeliumEarned - b.totalHeliumEarned)
        else if(universe === 2) filteredSaves.sort((a, b) => a.totalRadonEarned - b.totalRadonEarned)

        for(let i = 0; i < filteredSaves.length; i++) {
            let filteredSave = filteredSaves[i];

            let totalHelium = 0;
            if(universe === 1) totalHelium = filteredSave.totalHeliumEarned;
            else if(universe === 2) totalHelium = filteredSave.totalRadonEarned;

            if(totalHelium >= helium) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 20), i + 30);
                chosenSave = filteredSave;
                break;
            }
            if(i + 1 === filteredSaves.length) {
                filteredSaves = filteredSaves.slice(Math.max(0, i - 30));
                chosenSave = filteredSave;
                break;
            }
        }
    }

    if(elems.checkboxFilterHighestZone.checked) {
        zoneFilter(+elems.inputFilterHighestZone.value, 1);
    }
    else if(elems.checkboxFilterHighestU2Zone.checked)  {
        zoneFilter(+elems.inputFilterHighestU2Zone.value, 2);
    }
    else if(elems.checkboxFilterTotalHelium.checked) {
        heliumFilter(convertNotationsToNumber(elems.inputFilterTotalHelium.value), 1);
    }
    else if(elems.checkboxFilterTotalRadon.checked) {
        heliumFilter(convertNotationsToNumber(elems.inputFilterTotalRadon.value), 2);
    }
    else {
        return;
    }

    elems.savesContainer.innerHTML = '';
    let chosenSaveFound = false;
    let chosenSaveIndex = -1;
    for(let save of filteredSaves) {
        const saveElem = /** @type {DocumentFragment} */ (elems.templateSave.content.cloneNode(true));

        if(save === chosenSave) {
            chosenSaveFound = true;
            chosenSaveIndex = elems.savesContainer.children.length;
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
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=dateModified]')).textContent = getFormattedDate(save.lastOnline);
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=version]')).textContent = save.version+'';

        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalHelium]')).textContent = prettify(save.totalHeliumEarned);
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=highestZone]')).textContent = (save.highestLevelCleared + 1)+'';
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalPortals]')).textContent = save.totalPortals+'';

        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalBones]')).textContent = save.totalBones+'';
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=spentBones]')).textContent = save.spentBones+'';
        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=steamBones]')).textContent = save.steamBones+'';

        if(save.fluffyExp > 0)
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=fluffy]')).textContent = `E${save.fluffyPrestige}L${calculateFluffyLevel(save.fluffyExp, save.fluffyPrestige)}`;
        else {
            /** @type {HTMLDivElement} */ (/** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=fluffy]')).parentElement).style.display = 'none';
            /** @type {HTMLDivElement} */ (/** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=scruffy]')).parentElement).style.display = 'none';
        }

        /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=spireClears]')).textContent = save.spiresCompleted+'';

        if(save.highestRadonLevelCleared <= 0) {
            /** @type {HTMLDivElement} */ (saveElem.querySelector('div[data-id=U2Container]')).style.visibility = 'hidden';
        }
        else {
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalRadon]')).textContent = prettify(save.totalRadonEarned);
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=highestZoneU2]')).textContent = (save.highestRadonLevelCleared + 1)+'';
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=totalPortalsU2]')).textContent = save.totalRadPortals+'';
            /** @type {HTMLSpanElement} */ (saveElem.querySelector('span[data-id=scruffy]')).textContent = `S${calculateFluffyLevel(save.fluffyExp2, 0)}`;
        }

        /** @type {HTMLButtonElement} */ (saveElem.querySelector('button[data-id=copyToClipboard]')).addEventListener('click', async function() {
            this.innerText = 'Downloading...';
            const saveTxt = await (await fetch(`saves/${save.user}/${save.name}`)).text();
            this.innerText = 'Copied!';
            navigator.clipboard.writeText(saveTxt);
        })
    
        elems.savesContainer.appendChild(saveElem);
    }

    if(chosenSaveIndex > -1) {
        elems.savesContainer.children[Math.max(0, chosenSaveIndex - 2)].scrollIntoView(true);
    }
}

/**
 * @returns {Promise<Save[]>}
 */
async function loadSaves() {
    /** @type {Save[]} */
    const saveArr = [];

    /** @type {JSONSaves|null} */
    const jsonArr = await (await (fetch(`output/output.json`))).json();
    if(jsonArr == null) {
        throw new Error(`Failed to fetch from output.json`);
    }

    for(const save of jsonArr) {
        saveArr.push({
            user: save[0],
            name: save[1],
            highestLevelCleared: save[2],
            highestRadonLevelCleared: save[3],
            totalHeliumEarned: save[4],
            totalPortals: save[5],
            totalRadonEarned: save[6],
            totalRadPortals: save[7],
            version: save[8],
            lastOnline: save[9],
            spiresCompleted: save[10],
            fluffyExp: save[11],
            fluffyExp2: save[12],
            fluffyPrestige: save[13],
            totalBones: save[14],
            spentBones: save[15],
            steamBones: save[16]
        })
    }

    elems.loadingOverlay.parentElement?.removeChild(elems.loadingOverlay);

    return saveArr;
}

/**
 * @returns {Elems}
 */
function loadElements() {
    const savesContainer = document.getElementById('savesContainer');
    const templateSave = document.getElementById('templateSave');
    const checkboxFilterTotalHelium = document.getElementById('checkboxFilterTotalHelium');
    const checkboxFilterHighestZone = document.getElementById('checkboxFilterHighestZone');
    const checkboxFilterTotalRadon = document.getElementById('checkboxFilterTotalRadon');
    const checkboxFilterHighestU2Zone = document.getElementById('checkboxFilterHighestU2Zone');
    const filterButton = document.getElementById('filterButton');
    const inputFilterTotalHelium = document.getElementById('inputFilterTotalHelium');
    const inputFilterHighestZone = document.getElementById('inputFilterHighestZone');
    const inputFilterTotalRadon = document.getElementById('inputFilterTotalRadon');
    const inputFilterHighestU2Zone = document.getElementById('inputFilterHighestU2Zone');
    const userFilterContainer = document.getElementById('userFilterContainer');
    const loadingText = document.getElementById('loadingText');
    const loadingOverlay = document.getElementById('loadingOverlay');

    if(!(savesContainer instanceof HTMLDivElement)) throw new Error('savesContainer is missing')
    if(!(templateSave instanceof HTMLTemplateElement)) throw new Error('templateSave is missing')
    if(!(checkboxFilterTotalHelium instanceof HTMLInputElement)) throw new Error('checkboxFilterTotalHelium is missing')
    if(!(checkboxFilterHighestZone instanceof HTMLInputElement)) throw new Error('checkboxFilterHighestZone is missing')
    if(!(checkboxFilterTotalRadon instanceof HTMLInputElement)) throw new Error('checkboxFilterTotalRadon is missing')
    if(!(checkboxFilterHighestU2Zone instanceof HTMLInputElement)) throw new Error('checkboxFilterHighestU2Zone is missing')
    if(!(filterButton instanceof HTMLButtonElement)) throw new Error('filterButton is not HTMLButtonElement')
    if(!(inputFilterTotalHelium instanceof HTMLInputElement)) throw new Error('inputFilterTotalHelium is missing')
    if(!(inputFilterHighestZone instanceof HTMLInputElement)) throw new Error('inputFilterHighestZone is missing')
    if(!(inputFilterTotalRadon instanceof HTMLInputElement)) throw new Error('inputFilterTotalRadon is missing')
    if(!(inputFilterHighestU2Zone instanceof HTMLInputElement)) throw new Error('inputFilterHighestU2Zone is missing')
    if(!(userFilterContainer instanceof HTMLDivElement)) throw new Error('userFilterContainer is missing')
    if(!(loadingText instanceof HTMLDivElement)) throw new Error('loadingText is missing')
    if(!(loadingOverlay instanceof HTMLDivElement)) throw new Error('loadingOverlay is missing')
    

    return {
        savesContainer,
        templateSave,
        checkboxFilterTotalHelium,
        checkboxFilterHighestZone,
        checkboxFilterTotalRadon,
        checkboxFilterHighestU2Zone,
        filterButton,
        inputFilterTotalHelium,
        inputFilterHighestZone,
        inputFilterTotalRadon,
        inputFilterHighestU2Zone,
        userFilterContainer,
        loadingText,
        loadingOverlay
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

/**
 * 
 * @param {string} num 
 * @returns {number}
 */
function convertNotationsToNumber(num){
	num = num.toLowerCase();
	if (num.split('e')[1]){
		return Math.floor(parseFloat(num));
	}
	var letters = num.replace(/[^a-z]/gi, "");
	var base = 0;
    let _num = +num;
	if (letters.length) {
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
        for (var x = 0; x < suffices.length; x++){
            if (suffices[x].toLowerCase() == letters){
                base = x + 1;
                break;
            }
        }
		
		if (base) _num = Math.round(parseFloat(num.split(letters)[0]) * Math.pow(1000, base));
	}
	if (!base) _num = parseInt(num, 10);
	return _num;
}

/**
 * 
 * @param {number} experience 
 * @param {number} prestige
 * @returns 
 */
function calculateFluffyLevel(experience, prestige) {
    var prestigeRequire = Math.pow(5, prestige);	
	var firstLevel =  1000 * prestigeRequire;
    var growth = 4;

    var level = Math.floor(log10(((experience / firstLevel) * (growth - 1)) + 1) / log10(growth));
    return level;
}

/**
 * 
 * @param {number} milliseconds 
 * @returns {Promise<void>}
 */
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * 
 * @param {number} val 
 * @returns {number}
 */
function log10(val) {
    return Math.log(val) / Math.LN10;
}