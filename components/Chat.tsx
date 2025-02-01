"use client";

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Chat() {
  const [model, setModel] = useState('gpt-3.5-turbo');
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
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
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'
              }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${message.role === 'assistant'
                  ? 'bg-muted'
                  : 'bg-primary text-primary-foreground'
                }`}
            >
              {message.content}
            </div>
          </div>
        ))}
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
  );
}