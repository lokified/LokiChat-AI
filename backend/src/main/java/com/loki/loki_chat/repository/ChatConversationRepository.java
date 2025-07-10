package com.loki.loki_chat.repository;

import com.loki.loki_chat.models.ChatConversation;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatConversationRepository extends JpaRepository<ChatConversation, UUID> {

    @Query("SELECT c FROM ChatConversation c ORDER BY c.updatedAt DESC")
    List<ChatConversation> findAllByOrderByUpdatedAtDesc();

    List<ChatConversation> findAllByOrderByUpdatedAtDesc(Pageable pageable);

    List<ChatConversation> findByTitleContainingIgnoreCase(String title);
}
