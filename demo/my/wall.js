// demo/my/wall.js
// Bridge module: FileList -> instance('files') contents, then refresh repeat.
// Uses official fx-instance.setInstanceData so lens always shows the current data.

const fore = document.querySelector('fx-fore#wall');
const dirPicker = document.getElementById('dirPicker');
const filePicker = document.getElementById('filePicker');
const grid = document.getElementById('grid');

if (!fore || !dirPicker || !filePicker) {
    console.warn('[wall] missing fore or pickers');
}

/** @type {string[]} */
let objectUrls = [];

function revokeAllObjectUrls(){
    for (const u of objectUrls){
        try { URL.revokeObjectURL(u); } catch(e){}
    }
    objectUrls = [];
}

function toSafeId(str){
    return String(str)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 80);
}

function escapeXml(s){
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function guessKindAndType(file){
    const imageExt = new Set(['png','jpg','jpeg','gif','webp','bmp','svg','avif','tif','tiff','heic','heif']);
    const videoExt = new Set(['mp4','m4v','mov','webm','ogv','ogg','mkv','avi']);

    let type = file.type || '';
    if (type.startsWith('image/')) return { kind: 'image', type };
    if (type.startsWith('video/')) return { kind: 'video', type };

    const name = (file.webkitRelativePath || file.name || '');
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';

    if (imageExt.has(ext)){
        type = type || (ext === 'jpg' ? 'image/jpeg' : `image/${ext}`);
        return { kind: 'image', type };
    }
    if (videoExt.has(ext)){
        type = type || (ext === 'mov' ? 'video/quicktime' : `video/${ext}`);
        return { kind: 'video', type };
    }
    return { kind: null, type: type || '' };
}

function buildFilesXmlFromFileList(fileList){
    const files = Array.from(fileList || []);
    const kept = [];

    for (const f of files){
        if (!f) continue;
        const { kind, type } = guessKindAndType(f);
        if (!kind) continue;
        kept.push({ file: f, kind, type });
    }

    kept.sort((a,b) =>
        ((a.file.webkitRelativePath || a.file.name) || '')
            .localeCompare((b.file.webkitRelativePath || b.file.name) || '')
    );

    const items = [];
    for (const entry of kept){
        const f = entry.file;
        const url = URL.createObjectURL(f);
        objectUrls.push(url);

        const id = toSafeId((f.webkitRelativePath || f.name) + '-' + f.size + '-' + f.lastModified);

        items.push(
            `<file id="${escapeXml(id)}">` +
            `<name>${escapeXml(f.webkitRelativePath || f.name)}</name>` +
            `<type>${escapeXml(entry.type)}</type>` +
            `<kind>${escapeXml(entry.kind)}</kind>` +
            `<size>${f.size}</size>` +
            `<url>${escapeXml(url)}</url>` +
            `</file>`
        );
    }

    return { xml: `<files>${items.join('')}</files>`, count: kept.length, picked: files.length };
}

function openPicker(input){
    try{
        if (typeof input.showPicker === 'function'){ input.showPicker(); return; }
    }catch(e){}
    input.click();
}

async function setInstanceXml(xmlString){
    const instanceEl = fore?.querySelector('fx-instance#files');
    if (!instanceEl) throw new Error('[wall] fx-instance#files not found');

    const doc = new DOMParser().parseFromString(xmlString, 'application/xml');

    const r = instanceEl.setInstanceData?.(doc);
    if (r && typeof r.then === 'function') await r;

    // Ask Fore to refresh globally
    try { fore.refresh?.(); } catch(e){}
}

async function refreshRepeat(){
    const repeatEl = fore?.querySelector('fx-repeat#media');
    if (!repeatEl) return;

    if (typeof repeatEl.refresh === 'function') {
        const r = repeatEl.refresh();
        if (r && typeof r.then === 'function') await r;
        console.info('[wall] repeat hook called: refresh');
    } else {
        console.warn('[wall] fx-repeat has no refresh() in this build');
    }
}

async function loadFromFileList(fileList){
    revokeAllObjectUrls();

    const { xml, count, picked } = buildFilesXmlFromFileList(fileList);

    await setInstanceXml(xml);

    // give Fore a frame, then refresh repeat (you saw this hook working)
    await Promise.resolve();
    await new Promise(r => requestAnimationFrame(r));
    await refreshRepeat();

    console.info('[wall] picked=', picked, 'kept=', count);
}

async function clearWall(){
    revokeAllObjectUrls();
    await setInstanceXml('<files/>');
    await Promise.resolve();
    await new Promise(r => requestAnimationFrame(r));
    await refreshRepeat();
}

function onForeMessage(ev){
    const msg = ev.detail?.message ?? ev.detail;
    if (msg === 'pick-dir') openPicker(dirPicker);
    if (msg === 'pick-files') openPicker(filePicker);
    if (msg === 'clear') void clearWall();
}

function wireTileSelection(){
    if (!grid) return;

    grid.addEventListener('click', (e) => {
        const tile = e.target.closest('.tile');
        if (!tile) return;

        const already = tile.classList.contains('is-selected');
        for (const el of grid.querySelectorAll('.tile.is-selected')) el.classList.remove('is-selected');
        if (!already) tile.classList.add('is-selected');

        // autoplay video on select
        const vid = tile.querySelector('video');
        const kind = tile.getAttribute('data-kind');
        if (vid && kind === 'video') {
            try{
                if (!already){
                    vid.currentTime = 0;
                    vid.play().catch(()=>{});
                } else {
                    vid.pause();
                }
            }catch(e){}
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            for (const v of document.querySelectorAll('video')) {
                try { v.pause(); } catch(e){}
            }
        }
    });
}

function install(){
    fore.addEventListener('message', onForeMessage);

    dirPicker.addEventListener('change', (e) => void loadFromFileList(e.target.files));
    filePicker.addEventListener('change', (e) => void loadFromFileList(e.target.files));

    window.addEventListener('beforeunload', () => revokeAllObjectUrls());

    wireTileSelection();

    console.info('[wall] bridge installed');
}

if (fore) {
    fore.addEventListener('ready', install, { once: true });
    fore.addEventListener('fx-ready', install, { once: true });
    setTimeout(() => {
        if (fore.classList.contains('fx-ready') || fore.hasAttribute('fx-ready')) install();
    }, 0);
}