import { 
  GetChatMessageResponse,
  GetConversationResponse, 
  SendMessageRequest, 
  SendMessageResponse, 
} from '../types';
import axios from 'axios';


export const getConversations = async (): Promise<GetConversationResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/conversations`);
  return {"conversations": response.data};
};


export const sendMessage = async (request: SendMessageRequest): Promise<SendMessageResponse> => {
  const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/message`, {
    message: request.message,
    conversationId: request.conversationId
  });

  return {"message": response.data};
};


export const getChats = async(conversationId: string): Promise<GetChatMessageResponse> => {
  const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/conversations/${conversationId}/messages`);

  return {"messages" : response.data};
}


export const deleteConversation = async (conversationId: string): Promise<void> => {
  const response = await axios.delete(`${process.env.NEXT_PUBLIC_BASE_URL}/conversations/${conversationId}`);

  console.log("Response >>> ", response.data);
};

export const chatAPI = {
  getConversations,
  sendMessage,
  getChats,
  deleteConversation
};