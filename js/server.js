const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), (req, res) => {
    const filePath = req.file.path;
    console.log("This works upto now")
    exec(`python3 process_maze.py ${filePath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${stderr}`);
            return res.status(500).json({ error: stderr });
        }
        console.log(`Python output: ${stdout}`);
        res.json({ message: 'Image processed', output: stdout });
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));