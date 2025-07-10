package com.loki.loki_chat.dto.response;

import com.loki.loki_chat.models.ChatConversation;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private String id;
    private String title;
    private String createdAt;
    private String updatedAt;
    private List<MessageResponse> messages;


    public static ConversationResponse fromChatConversation(ChatConversation conversation) {
        return  new ConversationResponse(
                conversation.getId().toString(),
                conversation.getTitle(),
                conversation.getCreatedAt().toString(),
                conversation.getUpdatedAt().toString(),
                conversation.getMessages().stream().map(MessageResponse::fromChatMessage).collect(Collectors.toList())
        );
    }
}
