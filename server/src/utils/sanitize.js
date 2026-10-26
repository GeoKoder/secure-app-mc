const createDOMPurify = require("dompurify");
const { JSDOM   } = require("jsdom");

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

function sanitizeInput(dirty) {
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
    // Strips ALL HTML tags, leaving only plain text
}

module.exports = { sanitizeInput };