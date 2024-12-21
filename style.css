document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.querySelector('.drop-zone');
    const fileInput = document.getElementById('file');
    const messageDiv = document.getElementById('message');

    // 拖放功能
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('active');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('active');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateFileName(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        updateFileName(e.target.files[0]);
    });

    function updateFileName(file) {
        const dropZoneText = dropZone.querySelector('.drop-zone-text p');
        if (file) {
            dropZoneText.textContent = file.name;
        }
    }

    // PDF拆分功能
    document.getElementById('splitForm').onsubmit = async (e) => {
        e.preventDefault();
        messageDiv.className = '';
        
        try {
            const file = fileInput.files[0];
            const startPage = parseInt(document.getElementById('start_page').value);
            const endPage = parseInt(document.getElementById('end_page').value);
            
            if (!file) {
                throw new Error('请选择PDF文件');
            }
            
            messageDiv.textContent = '正在处理...';
            
            const pdfBytes = await splitPDF(file, startPage, endPage);
            
            download(
                new Blob([pdfBytes], { type: 'application/pdf' }), 
                `split_${file.name}`, 
                'application/pdf'
            );
            
            messageDiv.textContent = '拆分成功！';
            messageDiv.className = 'success';
        } catch (error) {
            messageDiv.textContent = `错误：${error.message}`;
            messageDiv.className = 'error';
        }
    };
});

async function splitPDF(pdfFile, startPage, endPage) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const newPdfDoc = await PDFLib.PDFDocument.create();
    
    startPage = startPage - 1;
    endPage = Math.min(endPage, pdfDoc.getPageCount());
    
    const pages = await newPdfDoc.copyPages(pdfDoc, Array.from(
        {length: endPage - startPage}, (_, i) => i + startPage
    ));
    
    pages.forEach(page => newPdfDoc.addPage(page));
    
    return await newPdfDoc.save();
}
