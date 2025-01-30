const form = document.getElementById('upload-form');
         const imageInput = document.getElementById('image-upload');
         const resultDiv = document.getElementById('result-area');
         const resultLinkInput = document.getElementById('result-link-input');
         const progressContainer = document.getElementById('upload-progress'); 
         const progressBar = progressContainer.querySelector('.progress-bar');
         const copyButton = document.getElementById('copy-button');
         const skeletonContainer = document.getElementById('skeleton-container');
         const mainContainer = document.querySelector('.container:not(#skeleton-container)');
         const imagePreview = document.getElementById('image-preview');
         const progressBarTween = gsap.to(progressBar, {
             duration: 1,
             width: '100%',
             ease: 'power2.out',
             paused: true,
             onUpdate: function () {
                 progressBar.textContent = `${Math.round(this.progress() * 100)}%`
             },
             onComplete: function () {
                 progressBar.textContent = "100%"
             }
         });
         form.addEventListener('submit', async (e) => {
             e.preventDefault();
             const formData = new FormData(form);
             skeletonContainer.style.display = 'block';
             mainContainer.style.display = 'none';
             progressContainer.style.display = 'block';
             resultDiv.style.display = 'none';
              progressBar.style.width = '0%';
             progressBarTween.play(0);
             try {
                 const response = await fetch('/upload', {
                     method: 'POST',
                     body: formData,
                 });
                 if (!response.ok) {
                     throw new Error(`Upload Gagal: ${response.status} `)
                 }
                 const data = await response.json();
                 if (data && data.links && data.links.length > 0) {
                     resultLinkInput.value = data.links[0];
                     resultDiv.style.display = 'flex';
                     Swal.fire({
                         icon: 'success',
                         title: i18next.t('upload_success'),
                     });
                 } else {
                     Swal.fire({
                         icon: 'error',
                         title: i18next.t('upload_fail')
                     })
                     resultDiv.style.display = 'none';
                 }
             } catch (error) {
                 Swal.fire({
                     icon: 'error',
                     title: 'Error!',
                     text: i18next.t('upload_error') + error.message,
                 })
                 resultDiv.style.display = 'none';
             } finally {
                 progressBarTween.pause(0);
                 progressContainer.style.display = 'none';
                 skeletonContainer.style.display = 'none';
                 mainContainer.style.display = 'flex';
             }
         });
         copyButton.addEventListener('click', () => {
             resultLinkInput.select();
             document.execCommand('copy');
             Swal.fire({
                 icon: 'success',
                 title: 'Link Copied!'
             })
         });

        imageInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const filesize = file.size / 1024;
                if (filesize > 200480) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Error!',
                         text: 'Ukuran file terlalu besar, Max 200 MB!',
                    });
                    imageInput.value = "";
                     imagePreview.style.display = "none"
                     imagePreview.dataSrc = "";
                } else {
                    const reader = new FileReader();
                    reader.onload = function(e){
                      imagePreview.src = e.target.result;
                      imagePreview.style.display = 'block'
                    }
                    reader.readAsDataURL(file);
                }
            } else {
                imagePreview.style.display = "none"
                 imagePreview.dataSrc = "";
            }
        });

         AOS.init();
         i18next.init({
             lng: 'id',
             resources: {
                 en: {
                     translation: {
                         upload_success: 'UPLOAD SUCCESSFUL',
                         upload_fail: 'Upload Failed, No Link Returned!',
                         upload_error: 'Error during upload:'
                     }
                 }
             }
         });
          const enLangBtn = document.getElementById('en-lang-btn');
            const idLangBtn = document.getElementById('id-lang-btn');

        enLangBtn.addEventListener('click', () => {
            i18next.changeLanguage('en');
            Swal.fire({
                icon: 'success',
                title: 'Language changed to english'
            })
        });

        idLangBtn.addEventListener('click', () => {
            i18next.changeLanguage('id');
             Swal.fire({
                icon: 'success',
                title: 'Bahasa diubah ke indonesia'
            })
        });

          ScrollReveal().reveal('.container', {
             delay: 200,
             distance: '50px',
             easing: 'ease-in-out',
             origin: 'bottom',
             reset: true
         });

         const typed = new Typed('.upload-card h2', {
             strings: ['telegraph by wanzofc'],
             typeSpeed: 50,
             backSpeed: 25,
             loop: false,
         });
        
         if (window.Worker) {
            const myWorker = new Worker('worker.js')
            myWorker.onmessage = function (event) {
                console.log('Message received from worker', event.data)
            }
            myWorker.postMessage({
                message: 'hello world!'
            })
        }
