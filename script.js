const SERVER_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.querySelector('.tools-grid');
    const workspace = document.getElementById('workspace');
    const backBtn = document.getElementById('backBtn');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const toolForm = document.getElementById('toolForm');
    const pdfSplitOptions = document.getElementById('pdfSplitOptions');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('file');
    const messageDiv = document.getElementById('message');

    let currentTool = '';

    // 工具卡片点击事件
    toolsGrid.addEventListener('click', (e) => {
        const toolCard = e.target.closest('.tool-card');
        if (!toolCard) return;

        currentTool = toolCard.dataset.tool;
        toolsGrid.style.display = 'none';
        workspace.style.display = 'block';
        
        // 重置文件上传区域
        const dropText = document.querySelector('.drop-zone-text p');
        dropText.textContent = '拖放文件到这里，或者点击选择文件';
        fileInput.value = '';
        
        // 根据工具类型设置界面
        switch (currentTool) {
            case 'pdf2word':
                workspaceTitle.textContent = 'PDF转Word';
                pdfSplitOptions.style.display = 'none';
                fileInput.accept = '.pdf';
                break;
            case 'pdfsplit':
                workspaceTitle.textContent = 'PDF拆分';
                pdfSplitOptions.style.display = 'block';
                fileInput.accept = '.pdf';
                break;
        }
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
        workspace.style.display = 'none';
        toolsGrid.style.display = 'grid';
        resetForm();
    });

    // 点击上传
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择变化
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            updateDropZone(e.target.files[0]);
        }
    });

    // 拖放处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            updateDropZone(files[0]);
        }
    });

    // 更新拖放区域显示
    function updateDropZone(file) {
        if (file.type !== 'application/pdf') {
            dropText.textContent = '请选择 PDF 文件';
            fileInput.value = '';
            return;
        }
        dropText.textContent = `已选择: ${file.name}`;
    }

    // 防止默认拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    // 表单提交处理
    toolForm.onsubmit = async (e) => {
        e.preventDefault();
        messageDiv.className = '';
        messageDiv.style.display = 'none';
        
        try {
            const file = fileInput.files[0];
            if (!file) {
                throw new Error('请选择文件');
            }

            messageDiv.textContent = '正在处理...';
            messageDiv.className = 'info';
            messageDiv.style.display = 'block';

            switch (currentTool) {
                case 'pdf2word':
                    await handlePdfToWord(file);
                    break;
                case 'pdfsplit':
                    await handlePdfSplit(file);
                    break;
            }
            
        } catch (error) {
            showError(error.message);
        }
    };

    async function handlePdfToWord(file) {
        try {
            messageDiv.textContent = '正在转换中...';
            messageDiv.className = 'info';
            messageDiv.style.display = 'block';

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${SERVER_URL}/convert/pdf2word`, {
                method: 'POST',
                body: formData,
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '转换失败');
            }

            const blob = await response.blob();
            download(
                blob,
                file.name.replace('.pdf', '.docx'),
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            
            showSuccess('转换成功！');
        } catch (error) {
            showError(error.message);
        }
    }

    async function handlePdfSplit(file) {
        const startPage = parseInt(document.getElementById('start_page').value);
        const endPage = parseInt(document.getElementById('end_page').value);
        
        const pdfBytes = await splitPDF(file, startPage, endPage);
        
        download(
            new Blob([pdfBytes], { type: 'application/pdf' }), 
            `split_${file.name}`, 
            'application/pdf'
        );
        
        showSuccess('拆分成功！');
    }

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

    function showSuccess(message) {
        messageDiv.textContent = message;
        messageDiv.className = 'success';
        messageDiv.style.display = 'block';
    }

    function showError(message) {
        messageDiv.textContent = `错误：${message}`;
        messageDiv.className = 'error';
        messageDiv.style.display = 'block';
    }

    function resetForm() {
        toolForm.reset();
        messageDiv.style.display = 'none';
        dropZone.querySelector('.drop-zone-text p').textContent = '拖放文件到这里，或者选择导入文件';
    }

    // 检查后端服务是否可用
    async function checkServerStatus() {
        try {
            const response = await fetch(`${SERVER_URL}/health`, {
                mode: 'cors',
                credentials: 'omit'
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // 在页面加载时检查服务器状态
    document.addEventListener('DOMContentLoaded', async () => {
        const serverAvailable = await checkServerStatus();
        if (!serverAvailable) {
            const pdf2wordCard = document.querySelector('[data-tool="pdf2word"]');
            if (pdf2wordCard) {
                pdf2wordCard.style.opacity = '0.5';
                pdf2wordCard.style.cursor = 'not-allowed';
                const p = pdf2wordCard.querySelector('p');
                if (p) p.textContent = '本地服务未启动';
            }
        }
    });
}); 
