// Load env first — before any module that reads process.env (Fix #8)
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/db/db');

// Fix #7: use env PORT with fallback
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
