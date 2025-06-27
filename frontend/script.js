document.getElementById('submitForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('studentName').value;
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append('studentName', name);
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        alert(result.message);
    } catch (error) {
        console.error('Error submitting:', error);
        alert('Something went wrong.');
    }
});
