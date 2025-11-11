"""
对话API路由
"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uuid
import json
import asyncio

from models.agent import ConversationCreateRequest, MessageSendRequest
from core.service.conversation import ConversationService
from api.routes.agent import get_agent_instance
from logger import get_logger

logger = get_logger("api.conversation")

router = APIRouter(prefix="/conversations", tags=["conversations"])

# 会话服务实例
_conversation_service = ConversationService()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_conversation(request: ConversationCreateRequest):
    """
    创建会话
    
    Args:
        request: 会话创建请求
        
    Returns:
        创建的会话信息
    """
    try:
        conversation_id = await _conversation_service.create(
            agent_id=request.agent_id,
            user_id="default_user",  # TODO: 从认证信息获取
            title=request.title
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": conversation_id,
                "agent_id": request.agent_id,
                "title": request.title
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("")
async def list_conversations(
    user_id: str = None,
    agent_id: str = None,
    limit: int = 50,
    offset: int = 0
):
    """
    获取会话列表
    
    Args:
        user_id: 用户ID（可选）
        agent_id: Agent ID（可选）
        limit: 返回数量
        offset: 偏移量
        
    Returns:
        会话列表
    """
    try:
        conversations = await _conversation_service.list(
            user_id=user_id,
            agent_id=agent_id,
            limit=limit,
            offset=offset
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": conversations
        }
        
    except Exception as e:
        logger.error(f"Failed to list conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    获取会话详情
    
    Args:
        conversation_id: 会话ID
        
    Returns:
        会话信息
    """
    try:
        conversation = await _conversation_service.get(conversation_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": conversation
        }
        
    except Exception as e:
        logger.error(f"Failed to get conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    limit: int = 100,
    before_id: str = None
):
    """
    获取会话消息
    
    Args:
        conversation_id: 会话ID
        limit: 返回数量
        before_id: 在此消息之前的消息
        
    Returns:
        消息列表
    """
    try:
        messages = await _conversation_service.get_messages(
            conversation_id=conversation_id,
            limit=limit,
            before_id=before_id
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": messages
        }
        
    except Exception as e:
        logger.error(f"Failed to get messages for conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: str, request: MessageSendRequest):
    """
    发送消息（支持流式输出）
    
    Args:
        conversation_id: 会话ID
        request: 消息发送请求
        
    Returns:
        如果stream=True，返回SSE流；否则返回完整响应
    """
    try:
        # 获取会话信息
        conversation = await _conversation_service.get(conversation_id)
        agent_id = conversation["agent_id"]
        
        # 获取Agent实例
        agent = get_agent_instance(agent_id)
        
        # 保存用户消息
        await _conversation_service.add_message(
            conversation_id=conversation_id,
            role="user",
            content=request.content,
            metadata={
                "attachments": request.attachments
            }
        )
        
        # 处理附件
        image_urls = []
        file_paths = []
        for attachment in request.attachments:
            if attachment.get("type") == "image":
                image_urls.append(attachment.get("url"))
            elif attachment.get("type") == "file":
                file_paths.append(attachment.get("path"))
        
        if request.stream:
            # 流式响应
            async def generate():
                try:
                    response_text = ""
                    
                    # 发送开始事件
                    yield f"data: {json.dumps({'type': 'start'})}\n\n"
                    
                    # 流式生成响应
                    async for token in agent.chat(
                        message=request.content,
                        conversation_id=conversation_id,
                        image_urls=image_urls if image_urls else None,
                        file_paths=file_paths if file_paths else None
                    ):
                        response_text += token
                        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                    
                    # 保存助手消息
                    await _conversation_service.add_message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=response_text
                    )
                    
                    # 发送完成事件
                    yield f"data: {json.dumps({'type': 'done', 'content': response_text})}\n\n"
                    
                except Exception as e:
                    logger.error(f"Error in streaming response: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            
            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        else:
            # 非流式响应
            response_text = ""
            async for token in agent.chat(
                message=request.content,
                conversation_id=conversation_id,
                image_urls=image_urls if image_urls else None,
                file_paths=file_paths if file_paths else None
            ):
                response_text += token
            
            # 保存助手消息
            await _conversation_service.add_message(
                conversation_id=conversation_id,
                role="assistant",
                content=response_text
            )
            
            return {
                "code": 0,
                "message": "success",
                "data": {
                    "role": "assistant",
                    "content": response_text
                }
            }
        
    except ValueError as e:
        logger.error(f"Agent not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to send message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    title: str = None,
    summary: str = None
):
    """
    更新会话
    
    Args:
        conversation_id: 会话ID
        title: 新标题
        summary: 摘要
        
    Returns:
        更新后的会话信息
    """
    try:
        conversation = await _conversation_service.update(
            conversation_id=conversation_id,
            title=title,
            summary=summary
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": conversation
        }
        
    except Exception as e:
        logger.error(f"Failed to update conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    删除会话
    
    Args:
        conversation_id: 会话ID
        
    Returns:
        删除结果
    """
    try:
        await _conversation_service.delete(conversation_id)
        
        return {
            "code": 0,
            "message": "success",
            "data": {"id": conversation_id}
        }
        
    except Exception as e:
        logger.error(f"Failed to delete conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    format: str = "json"
):
    """
    导出会话
    
    Args:
        conversation_id: 会话ID
        format: 导出格式（json/txt/md）
        
    Returns:
        导出数据
    """
    try:
        data = await _conversation_service.export(
            conversation_id=conversation_id,
            format=format
        )
        
        return {
            "code": 0,
            "message": "success",
            "data": data
        }
        
    except Exception as e:
        logger.error(f"Failed to export conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
