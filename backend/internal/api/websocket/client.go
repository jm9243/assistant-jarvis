package websocket

import (
	"time"

	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	// WriteWait 写超时时间
	writeWait = 10 * time.Second

	// PongWait Pong 超时时间
	pongWait = 60 * time.Second

	// PingPeriod Ping 周期（必须小于 pongWait）
	pingPeriod = (pongWait * 9) / 10

	// MaxMessageSize 最大消息大小
	maxMessageSize = 512 * 1024 // 512KB
)

// Client WebSocket 客户端
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan interface{}
	UserID string
}

// NewClient 创建新客户端
func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan interface{}, 256),
		UserID: userID,
	}
}

// ReadPump 读取消息泵
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		var message map[string]interface{}
		err := c.conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Logger.Error("WebSocket read error",
					zap.Error(err),
					zap.String("user_id", c.UserID),
				)
			}
			break
		}

		// 处理客户端消息
		c.handleMessage(message)
	}
}

// WritePump 写入消息泵
func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// Hub 关闭了 send 通道
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteJSON(message); err != nil {
				logger.Logger.Error("WebSocket write error",
					zap.Error(err),
					zap.String("user_id", c.UserID),
				)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage 处理客户端消息
func (c *Client) handleMessage(message map[string]interface{}) {
	msgType, ok := message["type"].(string)
	if !ok {
		logger.Logger.Warn("Invalid message type",
			zap.String("user_id", c.UserID),
			zap.Any("message", message),
		)
		return
	}

	switch msgType {
	case "heartbeat":
		// 心跳保活
		c.send <- map[string]interface{}{
			"type": "heartbeat_ack",
			"timestamp": time.Now().Unix(),
		}

	case "status_update":
		// 设备状态更新
		logger.Logger.Info("Device status update",
			zap.String("user_id", c.UserID),
			zap.Any("data", message["data"]),
		)

	case "task_progress":
		// 任务进度更新
		logger.Logger.Debug("Task progress update",
			zap.String("user_id", c.UserID),
			zap.Any("data", message["data"]),
		)

	default:
		logger.Logger.Warn("Unknown message type",
			zap.String("user_id", c.UserID),
			zap.String("type", msgType),
		)
	}
}

