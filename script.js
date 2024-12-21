async function splitPDF(pdfFile, startPage, endPage) {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    const newPdfDoc = await PDFLib.PDFDocument.create();
    
    // 调整页码（用户输入从1开始，但索引从0开始）
    startPage = startPage - 1;
    endPage = Math.min(endPage, pdfDoc.getPageCount());
    
    // 复制选定的页面
    const pages = await newPdfDoc.copyPages(pdfDoc, Array.from(
        {length: endPage - startPage}, (_, i) => i + startPage
    ));
    
    // 添加页面到新文档
    pages.forEach(page => newPdfDoc.addPage(page));
    
    // 保存新PDF
    const pdfBytes = await newPdfDoc.save();
    return pdfBytes;
}

document.getElementById('splitForm').onsubmit = async (e) => {
    e.preventDefault();
    const messageDiv = document.getElementById('message');
    
    try {
        const file = document.getElementById('file').files[0];
        const startPage = parseInt(document.getElementById('start_page').value);
        const endPage = parseInt(document.getElementById('end_page').value);
        
        if (!file) {
            throw new Error('请选择PDF文件');
        }
        
        messageDiv.textContent = '正在处理...';
        
        const pdfBytes = await splitPDF(file, startPage, endPage);
        
        // 下载文件
        download(
            new Blob([pdfBytes], { type: 'application/pdf' }), 
            `split_${file.name}`, 
            'application/pdf'
        );
        
        messageDiv.textContent = '拆分成功！';
    } catch (error) {
        messageDiv.textContent = `错误：${error.message}`;
    }
}; 