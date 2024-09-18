const jsonToXml = json => {
  const convert = obj => {
    let xml = '';
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        xml += `<${key}`;
        if (typeof obj[key] === 'object') {
          if (Array.isArray(obj[key])) {
            xml += ' type="array">';
            obj[key].forEach(item => {
              xml += `<_>${convert(item)}</_>`;
            });
          } else {
            xml += ' type="object">';
            xml += convert(obj[key]);
          }
        } else {
          xml += ` type="${typeof obj[key]}">${obj[key]}</${key}>`;
        }
        xml += `</${key}>`;
      }
    }
    return xml;
  };

  return `<json>${convert(json)}</json>`;
};
