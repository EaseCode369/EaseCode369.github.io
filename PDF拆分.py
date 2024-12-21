from flask import Flask, render_template, request, send_file
from PyPDF2 import PdfReader, PdfWriter
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

# 确保上传文件夹存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/split', methods=['POST'])
def split_pdf():
    if 'file' not in request.files:
        return '没有选择文件', 400
    
    file = request.files['file']
    if file.filename == '':
        return '没有选择文件', 400

    if not file.filename.endswith('.pdf'):
        return '请上传PDF文件', 400

    # 获取页面范围
    start_page = int(request.form.get('start_page', 1))
    end_page = int(request.form.get('end_page', 1))

    # 保存上传的文件
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # 处理PDF
    pdf_reader = PdfReader(filepath)
    pdf_writer = PdfWriter()

    # 验证页面范围
    if start_page < 1 or end_page > len(pdf_reader.pages):
        os.remove(filepath)
        return '页面范围无效', 400

    # 添加选定的页面
    for page_num in range(start_page - 1, end_page):
        pdf_writer.add_page(pdf_reader.pages[page_num])

    # 保存新的PDF
    output_filename = f'split_{filename}'
    output_filepath = os.path.join(app.config['UPLOAD_FOLDER'], output_filename)
    
    with open(output_filepath, 'wb') as output_file:
        pdf_writer.write(output_file)

    # 删除原始文件
    os.remove(filepath)

    # 发送拆分后的文件
    return send_file(
        output_filepath,
        as_attachment=True,
        download_name=output_filename
    )

if __name__ == '__main__':
    app.run(debug=True)
