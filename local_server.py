from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging

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

# 后端服务地址
PDF2WORD_SERVICE = 'http://localhost:5001'
PDF_SPLIT_SERVICE = 'http://localhost:5002'

@app.route('/convert/pdf2word', methods=['POST', 'OPTIONS'])
def pdf_to_word():
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        # 转发请求到PDF转Word服务
        response = requests.post(
            f'{PDF2WORD_SERVICE}/convert/pdf2word',
            files={'file': request.files['file']}
        )
        
        return response.content, response.status_code, {
            'Access-Control-Allow-Origin': 'https://easecode369.github.io',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': response.headers.get('Content-Type'),
            'Content-Disposition': response.headers.get('Content-Disposition')
        }

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
        
        # 转发请求到PDF拆分服务
        response = requests.post(
            f'{PDF_SPLIT_SERVICE}/split/pdf',
            files={'file': request.files['file']},
            data={
                'start_page': request.form.get('start_page'),
                'end_page': request.form.get('end_page')
            }
        )
        
        return response.content, response.status_code, {
            'Access-Control-Allow-Origin': 'https://easecode369.github.io',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': response.headers.get('Content-Type'),
            'Content-Disposition': response.headers.get('Content-Disposition')
        }

    except Exception as e:
        logger.error(f'拆分错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', 'https://easecode369.github.io')
    return response

if __name__ == '__main__':
    logger.info('主服务器启动在端口5000...')
    app.run(host='0.0.0.0', port=5000, debug=True) 
