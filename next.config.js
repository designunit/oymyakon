const withCss = require('@zeit/next-css')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = withCss({
    env: {
        API_BASE_URL: isProduction
            ? 'https://oymyakon.unit4.io/api'
            : 'http://localhost:8000',
        MAPBOX_TOKEN: 'pk.eyJ1IjoidG1zaHYiLCJhIjoiM3BMLVc2MCJ9.PM9ukwAm-YUGlrBqt4V6vw',
        APP_ACCESS_MODE: 'readonly',
    },
    exportPathMap: async (defaultPathMap, { dev }) => {
        if (dev) {
            return null
        }

        return {
            '/': { page: '/' },
        }
    },
})
