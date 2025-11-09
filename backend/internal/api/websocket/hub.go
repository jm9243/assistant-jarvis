package websocket

import (
	"sync"

	"github.com/assistant-jarvis/backend/internal/pkg/logger"
	"go.uber.org/zap"
)

// Hub WebSocket 连接管理中心
type Hub struct {
	// 用户 ID -> 客户端连接映射
	clients map[string]map[*Client]bool

	// 广播消息通道
	broadcast chan *Message

	// 注册客户端通道
	register chan *Client

	// 注销客户端通道
	unregister chan *Client

	// 互斥锁
	mu sync.RWMutex
}

// Message WebSocket 消息
type Message struct {
	UserID  string      `json:"user_id"`
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// NewHub 创建 Hub
func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]map[*Client]bool),
		broadcast:  make(chan *Message, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

// Run 运行 Hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; !ok {
				h.clients[client.UserID] = make(map[*Client]bool)
			}
			h.clients[client.UserID][client] = true
			h.mu.Unlock()

			logger.Logger.Info("WebSocket client registered",
				zap.String("user_id", client.UserID),
				zap.Int("total_clients", h.GetUserClientCount(client.UserID)),
			)

		case client := <-h.unregister:
			h.mu.Lock()
			if clients, ok := h.clients[client.UserID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.send)

					if len(clients) == 0 {
						delete(h.clients, client.UserID)
					}

					logger.Logger.Info("WebSocket client unregistered",
						zap.String("user_id", client.UserID),
						zap.Int("remaining_clients", len(clients)),
					)
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			if clients, ok := h.clients[message.UserID]; ok {
				for client := range clients {
					select {
					case client.send <- message.Payload:
					default:
						// 发送失败，关闭并移除客户端
						close(client.send)
						delete(clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// BroadcastToUser 向指定用户广播消息
func (h *Hub) BroadcastToUser(userID string, payload interface{}) {
	h.broadcast <- &Message{
		UserID:  userID,
		Payload: payload,
	}
}

// BroadcastToUserWithType 向指定用户广播带类型的消息
func (h *Hub) BroadcastToUserWithType(userID, msgType string, payload interface{}) {
	h.broadcast <- &Message{
		UserID: userID,
		Payload: map[string]interface{}{
			"type": msgType,
			"data": payload,
		},
	}
}

// GetUserClientCount 获取用户的客户端连接数
func (h *Hub) GetUserClientCount(userID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if clients, ok := h.clients[userID]; ok {
		return len(clients)
	}
	return 0
}

// IsUserOnline 检查用户是否在线
func (h *Hub) IsUserOnline(userID string) bool {
	return h.GetUserClientCount(userID) > 0
}

// GetOnlineUsers 获取所有在线用户 ID
func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

// GetTotalConnections 获取总连接数
func (h *Hub) GetTotalConnections() int {
	h.mu.RLock()
	defer h.mu.RUnlock()

	total := 0
	for _, clients := range h.clients {
		total += len(clients)
	}
	return total
}

