// backend/services/graderService.js

const { spawn } = require("child_process");
const path       = require("path");

/**
 * Calls the Python grader CLI and returns the parsed JSON summary.
 *
 * @param {string} masterZipPath
 * @param {string} studentZipPath
 * @param {string} masterNeighZipPath
 * @param {string} studentNeighZipPath
 * @param {string} birthdayPrefix
 * @returns {Promise<Object>}
 */
function gradeZip(
  masterZipPath,
  studentZipPath,
  masterNeighZipPath,
  studentNeighZipPath,
  birthdayPrefix
) {
  return new Promise((resolve, reject) => {
    const graderScript = path.join(__dirname, "..", "grader", "grader.py");
    const py = spawn(
      "python3", // or "python" if that’s your command
      [
        graderScript,
        masterZipPath,
        studentZipPath,
        masterNeighZipPath,
        studentNeighZipPath,
        birthdayPrefix,
      ],
      { cwd: path.resolve(__dirname, "..") }
    );

    let out = "", err = "";
    py.stdout.on("data", chunk => (out += chunk));
    py.stderr.on("data", chunk => (err += chunk));

    py.on("close", code => {
      if (code !== 0) return reject(new Error(err || `Exit code ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { gradeZip };
