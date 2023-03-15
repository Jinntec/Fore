module.exports = {
    source: "./src",
    includes: ["\\.js$"],
    destination: "./docs",
    plugins: [
        {
            "name": "esdoc-standard-plugin", "option": {
                "coverage": {
                    "enable": true
                }
            }
        }
    ],
};