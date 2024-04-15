const express = require('express');
const multer = require('multer');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });
const docker = new Docker();

// Enable CORS for all routes
app.use(cors());

// Global variable to store processing status
let isProcessing = false;

// Handle file uploads and Docker processing
app.post('/api/uploadAndGenerateSubtitles', upload.single('video'), async (req, res) => {
  try {
    if (isProcessing) {
      return res.status(400).json({ error: 'Another processing is in progress' });
    }

    const { path: videoPath } = req.file;
    // Set processing flag
    isProcessing = true;
    // Run Docker container to process video
    const container = await docker.createContainer({
      Image: 'your_docker', // Specify your Docker image for video processing
      Volumes: { '/input': {} }, // Mount the input directory into the container
      HostConfig: {
        Binds: [`${__dirname}/uploads:/input`, `${__dirname}/output:/output`],
      },
    });
    await container.start();

    // Wait for container to finish processing (simulated with a timeout)
    setTimeout(async () => {
      // Simulate processing completion
      isProcessing = false;

      // Generate download URL for the processed video
      const downloadUrl = `/api/download/processed_video.mp4`;
      res.json({ downloadUrl });

      // Clean up: Delete the temporary uploaded file
      fs.unlinkSync(videoPath);
    }, 60000); // Simulated processing time (60 seconds)
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file' });

    // Reset processing flag on error
    isProcessing = false;
  }
});

// Route to handle file downloads
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'output', filename);

  // Send the processed video file as an attachment
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(404).send('File not found');
    }
  });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
