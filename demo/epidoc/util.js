function createUUID() {
    // http://www.ietf.org/rfc/rfc4122.txt
    const s = [];
    const hexDigits = '0123456789abcdef';
    for (let i = 0; i < 36; i += 1) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4'; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-';

    const uuid = s.join('');
    return 'F' + uuid;
}


function checkDate(string){
    if(string.length === 0 ) return true;// allow empty
    const val = new Date(string);
    if(val instanceof Date && !isNaN(val)) {
        return true;
    }
    return false;
}