"""
文档解析器
"""
from pathlib import Path
from typing import Optional
import PyPDF2
import docx
import markdown

from logger import get_logger

logger = get_logger("document_parser")


class DocumentParser:
    """文档解析器"""
    
    async def parse(self, file_path: str) -> str:
        """
        解析文档
        
        Args:
            file_path: 文件路径
            
        Returns:
            文档内容
        """
        path = Path(file_path)
        
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_type = path.suffix.lower()
        
        try:
            if file_type == ".pdf":
                content = await self.parse_pdf(file_path)
            elif file_type in [".docx", ".doc"]:
                content = await self.parse_docx(file_path)
            elif file_type == ".txt":
                content = await self.parse_txt(file_path)
            elif file_type == ".md":
                content = await self.parse_markdown(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            logger.info(f"Parsed {file_type} file: {path.name}, length: {len(content)}")
            return content
            
        except Exception as e:
            logger.error(f"Failed to parse {file_path}: {e}")
            raise
    
    async def parse_pdf(self, file_path: str) -> str:
        """
        解析PDF文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            文档内容
        """
        content = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text.strip():
                    content.append(text)
        
        return "\n\n".join(content)
    
    async def parse_docx(self, file_path: str) -> str:
        """
        解析DOCX文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            文档内容
        """
        doc = docx.Document(file_path)
        content = []
        
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                content.append(text)
        
        return "\n\n".join(content)
    
    async def parse_txt(self, file_path: str) -> str:
        """
        解析TXT文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            文档内容
        """
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()
    
    async def parse_markdown(self, file_path: str) -> str:
        """
        解析Markdown文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            文档内容（纯文本）
        """
        with open(file_path, 'r', encoding='utf-8') as file:
            md_content = file.read()
        
        # 转换为HTML然后提取文本（简单处理）
        # 实际上我们直接返回markdown文本即可
        return md_content
