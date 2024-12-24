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

# 更新 CORS 配置
CORS(app, resources={
    r"/*": {
        "origins": "*",  # 允许所有来源，生产环境中应该设置具体的域名
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Disposition"],
        "supports_credentials": True
    }
})

# 添加 OPTIONS 请求处理
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
    # 允许外部访问
    app.run(host='0.0.0.0', port=5000, debug=True) 
