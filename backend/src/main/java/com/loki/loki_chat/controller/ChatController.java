package com.loki.loki_chat.controller;

import com.loki.loki_chat.dto.request.ChatRequest;
import com.loki.loki_chat.dto.response.ConversationResponse;
import com.loki.loki_chat.dto.response.MessageResponse;
import com.loki.loki_chat.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    /**
     * Send a message to AI - creates new conversation if conversationId is null
     */
    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody ChatRequest request) {
        return chatService.processMessage(request);
    }

    /**
     * Get all conversations ordered by last updated
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getAllConversations() {
        return chatService.getAllConversations();
    }

    /**
     * Get a specific conversation by ID
     */
    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<ConversationResponse> getConversation(@PathVariable String conversationId) {
        return chatService.getConversation(conversationId);
    }

    /**
     * Get conversation with its messages
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getConversationMessages(@PathVariable String conversationId) {
        return chatService.getConversationMessages(conversationId);
    }

    /**
     * Get chat history with pagination
     */
    @GetMapping("/conversations/{conversationId}/history")
    public ResponseEntity<List<MessageResponse>> getConversationHistory(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return chatService.getConversationHistory(conversationId, page, size);
    }


    /**
     * Delete a conversation and all its messages
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<?> deleteConversation(@PathVariable String conversationId) {
        return chatService.deleteConversation(conversationId);
    }


    /**
     * Update conversation title
     */
    @PutMapping("/conversations/{conversationId}/title")
    public ResponseEntity<ConversationResponse> updateConversationTitle(
            @PathVariable String conversationId,
            @RequestBody String newTitle) {
        return chatService.updateConversationTitle(conversationId, newTitle.trim());
    }


    /**
     * Get recent conversations (last 10)
     */
    @GetMapping("/conversations/recent")
    public ResponseEntity<List<ConversationResponse>> getRecentConversations() {
        return chatService.getRecentConversations(10);
    }


    /**
     * Search conversations by title
     */
    @GetMapping("/conversations/search")
    public ResponseEntity<List<ConversationResponse>> searchConversations(
            @RequestParam("title") String query) {
        return chatService.searchConversations(query.trim());
    }


    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Chat service is running");
    }
}
