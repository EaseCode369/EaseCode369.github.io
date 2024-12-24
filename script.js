async function handlePdfToWord(file) {
    try {
        messageDiv.textContent = '正在转换中...';
        messageDiv.className = 'info';
        messageDiv.style.display = 'block';

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
