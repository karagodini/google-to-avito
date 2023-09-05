const xmlDownloadLink = document.getElementById('xmlDownloadLink');

      document.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData();
        const fileInput = document.querySelector('input[type="file"]');
        formData.append('file', fileInput.files[0]);

        fetch('/convert', {
          method: 'POST',
          body: formData,
        })
          .then((response) => response.text())
          .then((xmlString) => {
            xmlDownloadLink.href = encodeURIComponent(xmlString);
            xmlDownloadLink.style.display = 'block';
            xmlDownloadLink.textContent = xmlDownloadLink.getAttribute('href');
          })
          .catch((error) => console.error(error));
        
      });