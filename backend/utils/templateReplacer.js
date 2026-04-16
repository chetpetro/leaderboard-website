// Placeholders muessen als %KEY% geschrieben sein; KEY darf nur Buchstaben und Zahlen enthalten (A-Z, a-z, 0-9).
const replaceTemplateKeywords = (template, replacements = {}) => {
    if (typeof template !== 'string') {
        return template;
    }

    return template.replace(/%([A-Za-z0-9]+)%/g, (match, key) => {
        if (!Object.prototype.hasOwnProperty.call(replacements, key)) {
            return match;
        }

        const value = replacements[key];
        return value === undefined || value === null ? match : String(value);
    });
};

module.exports = {
    replaceTemplateKeywords
};

