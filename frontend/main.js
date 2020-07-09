var express = require('express');
var app = express();

app.listen(3000, () => console.log('listening at 3000'));
app.use(express.static('./public'));
app.get('/admintools', function (req, res) {
    res.sendFile('./public/admintools/index.html')
});