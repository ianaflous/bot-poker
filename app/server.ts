import express from 'express';

import {WelcomeController} from './controllers';

const app = express();
const port = process.env.PORT || 3000;

app.use('/welcome', WelcomeController);

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/`);
});
