'use client';

import { useChat } from 'ai/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Send } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
export default function Chat() {
  const [model, setModel] = useState('gpt-3.5-turbo');
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  // Log messages to debug
  console.log(messages, "in Chat UI ");

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">RAG Chatbot</h1>
        <div className="max-w-4xl mx-auto space-y-8">
          <FileUploader />
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="groq-mixtral-8x7b">Groq Mixtral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="h-[500px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No messages yet. Start a conversation!
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground'
                        }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}