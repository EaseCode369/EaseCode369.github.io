from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from pdf2docx import Converter
import os
from werkzeug.utils import secure_filename
import logging
import tempfile
from pdf2docx.converter import Convert

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 使用系统临时目录
UPLOAD_FOLDER = tempfile.gettempdir()

@app.route('/convert/pdf2word', methods=['POST'])
def pdf_to_word():
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
        
        # 使用临时目录中的完整路径
        pdf_path = os.path.join(UPLOAD_FOLDER, pdf_filename)
        docx_path = os.path.join(UPLOAD_FOLDER, docx_filename)

        logger.info(f'保存PDF文件到: {pdf_path}')
        file.save(pdf_path)

        try:
            # 使用更详细的转换设置
            cv = Converter(pdf_path)
            cv.convert(docx_path, start=0, end=None, 
                      pages=None,
                      multi_processing=True,
                      cpu_count=4,
                      conversion_timeout=180,  # 设置超时时间为180秒
                      kwargs={
                          'debug': False,
                          'min_section_height': 20,  # 最小段落高度
                          'connected_border_tolerance': 3,  # 连接边界容差
                          'ignore_page_margin': False,  # 不忽略页面边距
                          'line_overlap_threshold': 0.9,  # 行重叠阈值
                          'line_break_width_ratio': 0.1,  # 换行宽度比率
                          'line_break_free_space_ratio': 0.1,  # 换行空白比率
                          'line_separate_threshold': 5,  # 行分隔阈值
                          'line_space_threshold': 0.1,  # 行间距阈值
                          'line_space_free_space_ratio': 0.5,  # 行间距空白比率
                          'line_space_vertical_threshold': 0.1,  # 垂直行间距阈值
                          'line_merging_threshold': 2,  # 行合并阈值
                          'parse_lattice_table': True,  # 解析格子表格
                          'parse_stream_table': True,  # 解析流式表格
                          'parse_vertical_text': True,  # 解析垂直文本
                          'parse_table_border': True,  # 解析表格边框
                          'parse_table_stream': True,  # 解析表格流
                          'parse_table_lattice': True,  # 解析表格格子
                          'parse_table_line': True,  # 解析表格线
                          'parse_table_fill': True,  # 解析表格填充
                          'parse_table_header': True,  # 解析表格头部
                          'parse_table_footer': True,  # 解析表格底部
                          'parse_table_caption': True,  # 解析表格标题
                      })
            cv.close()
            logger.info(f'转换完成: {docx_path}')

            # 发送转换后的文件
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
                    logger.info(f'清理PDF文件: {pdf_path}')
                if os.path.exists(docx_path):
                    # 在发送文件后删除
                    os.remove(docx_path)
                    logger.info(f'清理DOCX文件: {docx_path}')
            except Exception as e:
                logger.error(f'清理文件失败: {str(e)}')

    except Exception as e:
        logger.error(f'转换错误: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    logger.info(f'PDF转换服务启动在端口5000...')
    logger.info(f'使用临时目录: {UPLOAD_FOLDER}')
    app.run(port=5000, debug=True)
