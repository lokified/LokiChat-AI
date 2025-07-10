package com.loki.loki_chat.service;

import com.loki.loki_chat.dto.request.ChatRequest;
import com.loki.loki_chat.dto.response.ChatResponse;
import com.loki.loki_chat.dto.response.ConversationResponse;
import com.loki.loki_chat.dto.response.MessageResponse;
import com.loki.loki_chat.models.ChatConversation;
import com.loki.loki_chat.models.ChatMessage;
import com.loki.loki_chat.repository.ChatConversationRepository;
import com.loki.loki_chat.repository.ChatMessageRepository;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatService.class);

    @Autowired
    private ChatConversationRepository conversationRepository;

    @Autowired
    private ChatMessageRepository messageRepository;

    private final ChatClient chatClient;

    public ChatService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    @Transactional
    public ResponseEntity<?> processMessage(ChatRequest chatRequest) {

        try {

            ChatConversation chatConversation;

            boolean isNewConversation = false;

            if (chatRequest.conversationId() == null) {
                isNewConversation = true;
                String title = generateTitle(chatRequest.message());

                chatConversation = new ChatConversation(title);
                conversationRepository.save(chatConversation);

                logger.info("Created new conversation with ID: {} and title: {}",
                        chatConversation.getId(), chatConversation.getTitle());
            } else {
                chatConversation = conversationRepository.findById(UUID.fromString(chatRequest.conversationId()))
                        .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

                logger.info("Continuing conversation with ID: {} and title: {}",
                        chatConversation.getId(), chatConversation.getTitle());
            }

            // Generate response first before saving user message
            String assistantResponse;
            try {
                if (isNewConversation) {
                    assistantResponse = generateSimpleResponse(chatRequest.message());
                } else {
                    assistantResponse = generateContextualResponse(chatRequest.message(), chatConversation.getId());
                }
            } catch (Exception e) {
                logger.error("Error generating response from chat model: {}", e.getMessage(), e);
                // If it's a new conversation and chat model fails, delete the conversation
                if (isNewConversation) {
                    conversationRepository.delete(chatConversation);
                    logger.info("Deleted conversation due to chat model error: {}", chatConversation.getId());
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }

            // Only save user message if we got a successful response
            ChatMessage userMessage = new ChatMessage(chatRequest.message(), "user", chatConversation);
            messageRepository.save(userMessage);

            ChatMessage assistantMessage = new ChatMessage(assistantResponse, "assistant", chatConversation);
            messageRepository.save(assistantMessage);

            conversationRepository.save(chatConversation);

            return ResponseEntity.ok(new ChatResponse(
                    chatConversation.getId().toString(),
                    chatConversation.getTitle(),
                    chatRequest.message(),
                    assistantResponse,
                    assistantMessage.getCreatedAt())
            );
        } catch (IllegalArgumentException e) {
            logger.error("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error processing chat message: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String generateSimpleResponse(String message) {
        return chatClient.prompt()
                .user(message)
                .call()
                .content();
    }

    private String generateContextualResponse(String message, UUID conversationId) {

        List<ChatMessage> previousMessages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage("You are a helpful AI assistant. Use the conversation history to provide contextual responses."));

        int startIndex = Math.max(0, previousMessages.size() - 20);
        for (int i = startIndex; i < previousMessages.size(); i++) {
            ChatMessage msg = previousMessages.get(i);
            if ("user".equals(msg.getRole())) {
                messages.add(new UserMessage(msg.getContent()));
            } else {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        messages.add(new UserMessage(message));

        String response = chatClient.prompt()
                .system("Generate a response based on the conversation context.")
                .messages(messages)
                .call()
                .content();

        assert response != null;
        return response.trim();
    }


    private String generateTitle(String message) {
        try {
            String response = chatClient.prompt()
                    .system("Generate a short, concise title (maximum 6 words) for a conversation that starts with this message. Only respond with the title, nothing else.")
                    .user(message)
                    .call()
                    .content();

            assert response != null;
            return response.trim().replaceAll("\"", "");
        } catch (Exception e) {
            logger.error("Error generating title: {}", e.getMessage());
            return "New Chat";
        }
    }


    public ResponseEntity<List<ConversationResponse>> getAllConversations() {
        try {
            List<ConversationResponse> conversations = conversationRepository.findAllByOrderByUpdatedAtDesc().stream().map(ConversationResponse::fromChatConversation).collect(Collectors.toList());
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error fetching conversations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<List<MessageResponse>> getConversationMessages(String conversationId) {
        try {
            List<MessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(UUID.fromString(conversationId))
                    .stream().map(MessageResponse::fromChatMessage).toList();
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            logger.error("Error fetching conversation messages for {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<List<MessageResponse>> getConversationHistory(String conversationId, int page, int size) {

        try {
            if (page < 0 || size <= 0 || size > 100) {
                return ResponseEntity.badRequest().build();
            }

            Pageable pageable = PageRequest.of(page, size);
            List<MessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(UUID.fromString(conversationId), pageable)
                    .stream().map(MessageResponse::fromChatMessage).collect(Collectors.toList());

            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            logger.error("Error fetching conversation history for {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<ConversationResponse> getConversation(String conversationId) {
        try {
            ChatConversation conversation = conversationRepository.findById(UUID.fromString(conversationId)).orElseThrow(
                    () -> new IllegalArgumentException("Conversation not found")
            );

            return ResponseEntity.ok(ConversationResponse.fromChatConversation(conversation));
        } catch (Exception e) {
            logger.error("Error fetching conversation {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Transactional
    public ResponseEntity<?> deleteConversation(String conversationId) {
        try {
            ChatConversation conversation = conversationRepository.findById(UUID.fromString(conversationId)).orElseThrow(
                    () -> new IllegalArgumentException("Conversation not found")
            );

            conversationRepository.delete(conversation);

            return ResponseEntity.ok().body("Deleted successfully");
        } catch (Exception e) {
            logger.error("Error deleting conversation {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Transactional
    public ResponseEntity<ConversationResponse> updateConversationTitle(String conversationId, String newTitle) {
        try {

            if (newTitle == null || newTitle.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            ChatConversation conversation = conversationRepository.findById(UUID.fromString(conversationId)).orElseThrow(
                    () -> new IllegalArgumentException("Conversation not found")
            );

            conversation.setTitle(newTitle);

            conversationRepository.save(conversation);

            return ResponseEntity.ok(ConversationResponse.fromChatConversation(conversation));
        } catch (Exception e) {
            logger.error("Error updating conversation title for {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<List<ConversationResponse>> getRecentConversations(int limit) {
        try {

            Pageable pageable = PageRequest.of(0, limit);
            List<ConversationResponse> conversations = conversationRepository.findAllByOrderByUpdatedAtDesc(pageable).stream().map(
                    ConversationResponse::fromChatConversation
            ).collect(Collectors.toList());

            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error fetching recent conversations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<List<ConversationResponse>> searchConversations(String query) {
        try {
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            List<ConversationResponse> conversations = conversationRepository.findByTitleContainingIgnoreCase(query).stream().map(
                    ConversationResponse::fromChatConversation
            ).collect(Collectors.toList());
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            logger.error("Error searching conversations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
