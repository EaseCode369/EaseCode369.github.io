from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import logging
import tempfile
from pdf2docx import Converter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 使用临时目录
UPLOAD_FOLDER = tempfile.gettempdir()

@app.route('/convert/pdf2word', methods=['POST'])
def convert_pdf_to_word():
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

if __name__ == '__main__':
    logger.info('PDF转Word服务启动在端口5001...')
    app.run(port=5001, debug=True)
