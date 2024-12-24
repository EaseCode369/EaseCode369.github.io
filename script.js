document.addEventListener('DOMContentLoaded', () => {
    const toolsGrid = document.querySelector('.tools-grid');
    const workspace = document.getElementById('workspace');
    const backBtn = document.getElementById('backBtn');
    const workspaceTitle = document.getElementById('workspaceTitle');
    const toolForm = document.getElementById('toolForm');
    const pdfSplitOptions = document.getElementById('pdfSplitOptions');
    const messageDiv = document.getElementById('message');
    
    // 文件上传相关元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('file');
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
        resetForm();
        
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

    // 文件上传相关事件处理
    function initFileUpload() {
        // 阻止默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        // 拖放状态处理
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        // 处理文件拖放
        dropZone.addEventListener('drop', handleDrop, false);

        // 处理文件选择
        fileInput.addEventListener('change', handleFileSelect, false);

        // 点击上传区域
        const uploadTrigger = dropZone.querySelector('.drop-zone-text');
        uploadTrigger.addEventListener('click', () => fileInput.click(), false);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('active');
    }

    function unhighlight(e) {
        dropZone.classList.remove('active');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            handleFiles(files);
        }
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            handleFiles(files);
        }
    }

    function handleFiles(files) {
        const file = files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            showError('请选择 PDF 文件');
            resetForm();
            return;
        }
        
        // 立即更新显示的文件名
        const dropText = document.querySelector('.drop-zone-text p');
        if (dropText) {
            dropText.textContent = `已选择: ${file.name}`;
            // 添加一个选中状态的类
            dropZone.classList.add('has-file');
        }
    }

    // 表单提交处理
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

    // 初始化文件上传
    initFileUpload();
}); 
