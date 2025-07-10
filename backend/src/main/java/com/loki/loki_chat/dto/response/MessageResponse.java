package com.loki.loki_chat.dto.response;

import com.loki.loki_chat.models.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Locale;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MessageResponse {
    private String id;
    private String role;
    private String content;
    private String createdAt;


    public static MessageResponse fromChatMessage(ChatMessage chatMessage) {
        return new MessageResponse(
                chatMessage.getId().toString(),
                chatMessage.getRole().name().toLowerCase(Locale.ROOT),
                chatMessage.getContent(),
                chatMessage.getCreatedAt().toString()
        );
    }
}
