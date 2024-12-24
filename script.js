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
    const dropText = dropZone.querySelector('.drop-zone-text p');

    let currentTool = '';

    // 工具卡片点击事件
    toolsGrid.addEventListener('click', (e) => {
        const toolCard = e.target.closest('.tool-card');
        if (!toolCard) return;

        currentTool = toolCard.dataset.tool;
        toolsGrid.style.display = 'none';
        workspace.style.display = 'block';
        
        // 重置文件上传区域
        dropText.textContent = '拖放文件到这里，或者点击选择文件';
        fileInput.value = '';
        
        // 根据工具类型设置界面
        switch (currentTool) {
            case 'pdf2word':
                workspaceTitle.textContent = 'PDF转Word';
                pdfSplitOptions.style.display = 'none';
                break;
            case 'pdfsplit':
                workspaceTitle.textContent = 'PDF拆分';
                pdfSplitOptions.style.display = 'block';
                break;
        }
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
        workspace.style.display = 'none';
        toolsGrid.style.display = 'grid';
        resetForm();
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
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
            handleFileSelect(files[0]);
        }
    });

    // 点击上传区域
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 表单提交
    toolForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showError('请选择文件');
            return;
        }

        try {
            messageDiv.textContent = '正在处理...';
            messageDiv.className = 'info';
            messageDiv.style.display = 'block';

            if (currentTool === 'pdf2word') {
                await handlePdfToWord(file);
            } else if (currentTool === 'pdfsplit') {
                await handlePdfSplit(file);
            }
        } catch (error) {
            showError(error.message);
        }
    });

    // 文件处理函数
    function handleFileSelect(file) {
        if (file.type !== 'application/pdf') {
            showError('请选择 PDF 文件');
            fileInput.value = '';
            dropText.textContent = '拖放文件到这里，或者点击选择文件';
            return;
        }
        dropText.textContent = `已选择: ${file.name}`;
    }

    async function handlePdfToWord(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:5000/convert/pdf2word', {
            method: 'POST',
            body: formData,
            mode: 'cors',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '转换失败');
        }

        const blob = await response.blob();
        download(blob, file.name.replace('.pdf', '.docx'));
        showSuccess('转换成功！');
    }

    // 辅助函数
    function showError(message) {
        messageDiv.textContent = `错误：${message}`;
        messageDiv.className = 'error';
        messageDiv.style.display = 'block';
    }

    function showSuccess(message) {
        messageDiv.textContent = message;
        messageDiv.className = 'success';
        messageDiv.style.display = 'block';
    }

    function resetForm() {
        toolForm.reset();
        messageDiv.style.display = 'none';
        dropText.textContent = '拖放文件到这里，或者点击选择文件';
    }

    // 下载函数
    function download(blob, filename) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
}); 
