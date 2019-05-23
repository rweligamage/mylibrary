const existingConfig = require('./node_modules/@ionic/app-scripts/config/copy.config');
module.exports = Object.assign(existingConfig, {
    copyUbuntuIcomoonFonts: {
        src: ['{{ROOT}}/src/assets/custom/*'],
        dest: '{{WWW}}/assets/custom'
    }
});