// backend/grader/index.js

const { spawn } = require('child_process');
const path       = require('path');

function gradeZip({
  masterZip,
  studentZip,
  masterNeighZip,
  studentNeighZip,
  birthdayPrefix,
  masterPrefix = null
}) {
  return new Promise((resolve, reject) => {
    // Full path to the Python script
    const script = path.join(__dirname, 'grader.py');

    // Build the five required positional args:
    // 1) master_zip, 2) student_zip, 3) master_neigh_zip,
    // 4) student_neigh_zip, 5) birthday_prefix
    const args = [
      masterZip,
      studentZip,
      masterNeighZip || '',
      studentNeighZip || '',
      birthdayPrefix
    ];

    // If you want to override master prefix, add --master_prefix flag
    if (masterPrefix) {
      args.push('--master_prefix', masterPrefix);
    }

    // Spawn the Python process
    const py = spawn('python', [ script, ...args ]);

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    py.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    py.on('close', code => {
      if (code !== 0) {
        console.error('Python grader error:', stderr);
        return reject(new Error(stderr || `grader.py exited with code ${code}`));
      }
      try {
        // Expecting ONLY JSON on stdout
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (err) {
        console.error('Failed to parse JSON from grader:', stdout);
        reject(err);
      }
    });
  });
}

module.exports = { gradeZip };
