const fetch = require('node-fetch');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

fetch('https://localhost:4000', { method: 'POST', body: "{'a:111'}"})
    .then(res =>    res.text()).then(json => console.log(json)) // expecting a json response
    