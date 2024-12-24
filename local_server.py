from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from pdf2docx import Converter
import os
from werkzeug.utils import secure_filename
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# 配置 CORS，允许所有来源
CORS(app, resources={
    r"/*": {
        "origins": ["https://easecode369.github.io", "http://localhost:8000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/convert/pdf2word', methods=['POST', 'OPTIONS'])
def pdf_to_word():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        logger.info('收到PDF转换请求')
        if 'file' not in request.files:
            logger.error('没有文件在请求中')
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error('文件名为空')
            return jsonify({'error': '没有选择文件'}), 400

        if not file.filename.endswith('.pdf'):
            logger.error('不是PDF文件')
            return jsonify({'error': '请上传PDF文件'}), 400

        pdf_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
        file.save(pdf_path)
        logger.info(f'PDF文件已保存: {pdf_path}')

        docx_path = pdf_path.replace('.pdf', '.docx')

        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
        logger.info(f'转换完成: {docx_path}')

        os.remove(pdf_path)

        response = send_file(
            docx_path,
            as_attachment=True,
            download_name=os.path.basename(docx_path)
        )

        # 添加必要的跨域头
        response.headers.add('Access-Control-Allow-Origin', 'https://easecode369.github.io')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response

    except Exception as e:
        logger.error(f'转换错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

    finally:
        if 'docx_path' in locals() and os.path.exists(docx_path):
            try:
                os.remove(docx_path)
                logger.info(f'清理文件: {docx_path}')
            except:
                pass

@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'https://easecode369.github.io')
    return response

if __name__ == '__main__':
    logger.info('PDF转换服务启动在端口5000...')
    app.run(host='0.0.0.0', port=5000, debug=True) 
