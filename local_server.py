from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging
import tempfile
from pdf2docx import Converter
from PyPDF2 import PdfReader, PdfWriter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 更新 CORS 配置，专门允许 easecode369.github.io
CORS(app, resources={
    r"/*": {
        "origins": ["https://easecode369.github.io"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Disposition"],
        "supports_credentials": True
    }
})

# 添加 OPTIONS 请求处理
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://easecode369.github.io')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# 使用临时目录
UPLOAD_FOLDER = tempfile.gettempdir()

@app.route('/convert/pdf2word', methods=['POST', 'OPTIONS'])
def pdf_to_word():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400

        if not file.filename.endswith('.pdf'):
            return jsonify({'error': '请上传PDF文件'}), 400

        # 生成安全的文件名
        pdf_filename = secure_filename(file.filename)
        docx_filename = os.path.splitext(pdf_filename)[0] + '.docx'
        
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        docx_path = os.path.join(UPLOAD_FOLDER, docx_filename)

        logger.info(f'保存PDF文件到: {pdf_path}')
        file.save(pdf_path)

        try:
            # 转换PDF到Word
            cv = Converter(pdf_path)
            cv.convert(docx_path)
            cv.close()
            logger.info(f'转换完成: {docx_path}')

            return send_file(
                docx_path,
                as_attachment=True,
                download_name=docx_filename,
                mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )

        finally:
            # 清理临时文件
            try:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
                if os.path.exists(docx_path):
                    os.remove(docx_path)
            except Exception as e:
                logger.error(f'清理文件失败: {str(e)}')

    except Exception as e:
        logger.error(f'转换错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/split/pdf', methods=['POST', 'OPTIONS'])
def split_pdf():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        start_page = int(request.form.get('start_page', 1))
        end_page = int(request.form.get('end_page', 1))

        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400

        if not file.filename.endswith('.pdf'):
            return jsonify({'error': '请上传PDF文件'}), 400

        # 生成安全的文件名
        pdf_filename = secure_filename(file.filename)
        output_filename = f"{os.path.splitext(pdf_filename)[0]}_p{start_page}-{end_page}.pdf"
        
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)

        try:
            file.save(pdf_path)
            logger.info(f'保存PDF文件到: {pdf_path}')

            reader = PdfReader(pdf_path)
            writer = PdfWriter()

            total_pages = len(reader.pages)
            if start_page < 1 or end_page > total_pages or start_page > end_page:
                raise ValueError(f'无效的页码范围。文档共有 {total_pages} 页')

            for page_num in range(start_page - 1, end_page):
                writer.add_page(reader.pages[page_num])

            with open(output_path, 'wb') as output_file:
                writer.write(output_file)

            logger.info(f'PDF拆分完成: {output_path}')

            return send_file(
                output_path,
                as_attachment=True,
                download_name=output_filename,
                mimetype='application/pdf'
            )

        finally:
            # 清理临时文件
            try:
                if os.path.exists(pdf_path):
                    os.remove(pdf_path)
                if os.path.exists(output_path):
                    os.remove(output_path)
            except Exception as e:
                logger.error(f'清理文件失败: {str(e)}')

    except Exception as e:
        logger.error(f'拆分错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'https://easecode369.github.io')
    return response

if __name__ == '__main__':
    logger.info('服务启动在端口5000...')
    app.run(host='0.0.0.0', port=5000, debug=True) 
