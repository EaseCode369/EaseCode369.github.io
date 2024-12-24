document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.querySelector('.tools-grid');
    const workspace = document.getElementById('workspace');
    const backBtn = document.getElementById('backBtn');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const toolForm = document.getElementById('toolForm');
    const pdfSplitOptions = document.getElementById('pdfSplitOptions');
    const messageDiv = document.getElementById('message');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('file');

    let currentTool = '';

    // 处理PDF拆分
    async function handlePdfSplit(file) {
        try {
            const startPage = document.getElementById('startPage').value;
            const endPage = document.getElementById('endPage').value;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('start_page', startPage);
            formData.append('end_page', endPage);

            const response = await fetch('http://localhost:5000/split/pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '拆分失败');
            }

            const blob = await response.blob();
            const filename = file.name.replace('.pdf', `_p${startPage}-${endPage}.pdf`);
            download(blob, filename);
            showSuccess('拆分成功！');
        } catch (error) {
            console.error('拆分错误:', error);
            showError(error.message);
        }
    }

    // 处理PDF转Word
    async function handlePdfToWord(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/convert/pdf2word', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '转换失败');
            }

            const blob = await response.blob();
            download(blob, file.name.replace('.pdf', '.docx'));
            showSuccess('转换成功！');
        } catch (error) {
            console.error('转换错误:', error);
            showError(error.message);
        }
    }

    // 工具卡片点击事件
    toolsGrid.addEventListener('click', (e) => {
        const toolCard = e.target.closest('.tool-card');
        if (!toolCard) return;

        currentTool = toolCard.dataset.tool;
        toolsGrid.style.display = 'none';
        workspace.style.display = 'block';
        workspaceTitle.textContent = toolCard.querySelector('h3').textContent;

        // 根据工具显示相应的选项
        if (currentTool === 'pdf-split') {
            pdfSplitOptions.style.display = 'block';
        } else {
            pdfSplitOptions.style.display = 'none';
        }

        resetForm();
    });

    // 返回按钮点击事件
    backBtn.addEventListener('click', () => {
        workspace.style.display = 'none';
        toolsGrid.style.display = 'grid';
        resetForm();
    });

    // 文件拖放处理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 表单提交处理
    toolForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = fileInput.files[0];
        if (!file) {
            showError('请选择文件');
            return;
        }

        if (currentTool === 'pdf-split') {
            await handlePdfSplit(file);
        } else {
            await handlePdfToWord(file);
        }
    });

    // 处理文件选择
    function handleFiles(files) {
        const file = files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            showError('请选择 PDF 文件');
            resetForm();
            return;
        }
        
        const dropText = dropZone.querySelector('.drop-zone-text p');
        dropText.textContent = `已选择: ${file.name}`;
        fileInput.files = files;
    }

    // 显示错误信息
    function showError(message) {
        messageDiv.textContent = `错误：${message}`;
        messageDiv.style.display = 'block';
        messageDiv.className = 'message error';
    }

    // 显示成功信息
    function showSuccess(message) {
        messageDiv.textContent = message;
        messageDiv.style.display = 'block';
        messageDiv.className = 'message success';
    }

    // 重置表单
    function resetForm() {
        toolForm.reset();
        messageDiv.style.display = 'none';
        const dropText = dropZone.querySelector('.drop-zone-text p');
        dropText.textContent = '拖放文件到这里，或者点击选择文件';
    }

    // 下载文件
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
